# Развёртывание полигона на чистом сервере

Инструкция для развёртывания проекта на «голой» VPS под Ubuntu/Debian.
Рассчитана на человека, который **не знает внутреннего устройства проекта** и имеет
только ссылку на git-репозиторий.

---

## Что это и как работает

- **Стек:** Node.js (Express) + PostgreSQL + Prisma (ORM).
- **API** слушает `http://<SERVER_IP>:3000`, защищён HTTP Basic Auth.
  Документация (Swagger UI) открыта без пароля на `/swagger`.
- **Два пользователя на сервере:**
  - `root` — администратор (вы): запускает скрипты, разворачивает и обновляет полигон.
  - `dbuser` — кандидат: получает SSH-доступ, доступ к своей базе PostgreSQL и к логу
    приложения (`/home/dbuser/logs/api/log`).
- **Скрипты** (`scripts/` в репозитории) автоматизируют установку, запуск и ротацию
  паролей между кандидатами. Запускаются **под root из каталога `/root`**.

Каталоги и связи, которые создаёт окружение:
- исходники приложения — `/root/ts-express-prisma` (клонируются скриптом);
- мастер-файл секретов — `/root/.env` (его правят скрипты);
- лог приложения — `/root/ts-express-prisma/log.log`, доступен кандидату как
  хардлинк `/home/dbuser/logs/api/log`.

---

## 0. Что понадобится заранее

- VPS с Ubuntu/Debian и доступом под `root`.
- Публичный IP сервера — далее `<SERVER_IP>`.
- Ссылка на git-репозиторий проекта — далее `<GIT_URL>`.
- Если репозиторий приватный — доступ к его настройкам (для добавления deploy-ключа).

---

## 1. Системные пакеты

```bash
apt update && apt upgrade -y
apt install -y git screen curl build-essential ufw fail2ban postgresql
```

---

## 2. Node.js через nvm (под root)

Скрипты вызывают `nvm use`, поэтому nvm должен автоматически подгружаться в сессии root.
Версия Node берётся из файла `.nvmrc` в репозитории.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 21.1.0        # подставьте версию из .nvmrc репозитория
nvm alias default 21.1.0
corepack enable           # добавляет команду yarn для этой версии Node
```

> ВАЖНО: запускайте скрипты только из **живой интерактивной SSH-сессии root**
> (не через cron / `sh -c`), иначе `nvm` и `yarn` не окажутся в `PATH`.

Перезайдите в сессию 

---

## 3. Доступ к git (deploy-ключ)

```bash
ssh-keygen -t ed25519 -C "polygon-deploy" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub
```

Публичный ключ добавьте в настройках репозитория как **Deploy key** (read-only),
затем проверьте доступ:

```bash
ssh -T git@github.com   # или git@gitlab.com — в зависимости от хостинга
```

---

## 4. Получить скрипты и подставить свои параметры

Скрипты лежат внутри репозитория, поэтому сначала клонируем его во временное место,
копируем скрипты в `/root` и правим единственное «зашитое» значение — адрес git.

```bash
cd /tmp
git clone <GIT_URL> app
cp /tmp/app/scripts/*.sh /root/
chmod +x /root/*.sh
```

Откройте `/root/reload_source_code.sh` и замените строку клонирования на свою ссылку:

```bash
# было:  git clone git@github.com:gidabite/ts-express-prisma.git
git clone <GIT_URL>
```

> Имя каталога после клонирования должно быть `ts-express-prisma` — остальные скрипты
> ссылаются на `~/ts-express-prisma`. Если ваш репозиторий называется иначе, либо
> переименуйте его при клонировании (`git clone <GIT_URL> ts-express-prisma`), либо
> поправьте `rep_dir` в скриптах.

---

## 5. Пользователь-кандидат `dbuser`

```bash
adduser dbuser                 # пароль задаст refresh_credentials.sh, можно любой
# гарантированно без прав root:
deluser dbuser sudo 2>/dev/null || true
mkdir -p /home/dbuser/logs/api # сюда кладётся хардлинк лога приложения
chown -R dbuser:dbuser /home/dbuser/logs
```

---

## 6. PostgreSQL: роль и база `dbuser`

Приложение и кандидат используют роль/базу с именем `dbuser`.

```bash
sudo -u postgres createuser dbuser           # обычная роль, НЕ superuser
sudo -u postgres createdb -O dbuser dbuser   # база с именем dbuser
```

Чтобы кандидат мог подключаться к базе **со своей машины**, разрешите внешние подключения.

В `/etc/postgresql/*/main/postgresql.conf`:

```
listen_addresses = '*'
```

В `/etc/postgresql/*/main/pg_hba.conf` добавьте строку (дефолтную
`local all all peer` не удаляйте — она нужна скрипту `refresh_credentials.sh`):

```
hostssl   dbuser   dbuser   0.0.0.0/0   scram-sha-256
```

Ограничьте доступ к служебным базам и примените изменения:

```bash
sudo -u postgres psql -c "REVOKE CONNECT ON DATABASE postgres  FROM PUBLIC;"
sudo -u postgres psql -c "REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;"
systemctl restart postgresql
```

---

## 7. Мастер-файл `/root/.env`

Скрипты читают и правят `.env` в каталоге запуска (`/root`). Создайте его:

```
DATABASE_URL=postgresql://dbuser:CHANGEME@localhost:5432/dbuser
BASIC_AUTH_LOGIN=apilogin
BASIC_AUTH_PASSWORD=CHANGEME
```

- Строки `DATABASE_URL` и `BASIC_AUTH_PASSWORD` обязательно должны присутствовать —
  их перезапишет `refresh_credentials.sh`.
- `BASIC_AUTH_LOGIN` остаётся таким, каким вы его зададите (логин для API).

---

## 8. Базовая защита

```bash
chmod 700 /root                                  # кандидат не должен читать /root/.env
ufw allow 22/tcp && ufw allow 3000/tcp && ufw allow 5432/tcp && ufw enable
```

---

## 9. Первый запуск

Порядок важен: сначала создаём пароли (они попадут в `.env`), потом разворачиваем.

```bash
cd /root
./refresh_credentials.sh   # задаёт пароли dbuser (Linux+БД), пишет их в /root/.env,
                           # печатает CONSOLE_PASSWORD и BASIC_AUTH_PASSWORD
./reinstall_app.sh         # клонирует репозиторий, копирует .env, ставит зависимости,
                           # применяет миграции и запускает приложение в screen
```

Запомните напечатанные `CONSOLE_PASSWORD` (пароль SSH/БД кандидата) и
`BASIC_AUTH_PASSWORD` (пароль для API).

---

## 10. Проверка

### Приложение запущено (на сервере)
```bash
screen -ls                 # должна быть сессия с именем api
curl -i http://localhost:3000/swagger
```

### Доступ к API из браузера (с вашей машины)
- Swagger (без пароля): `http://<SERVER_IP>:3000/swagger` — страница должна открыться.
- Эндпоинт под авторизацией: `http://<SERVER_IP>:3000/object` — браузер спросит логин,
  введите `apilogin` / текущий `BASIC_AUTH_PASSWORD`, в ответ придёт JSON.

Через терминал:
```bash
curl -i http://<SERVER_IP>:3000/swagger
curl -i -u apilogin:<BASIC_AUTH_PASSWORD> http://<SERVER_IP>:3000/object
```

### Доступ к базе из вашей машины
```bash
psql "postgresql://dbuser:<CONSOLE_PASSWORD>@<SERVER_IP>:5432/dbuser?sslmode=require"
```
Или в GUI (DBeaver/pgAdmin/TablePlus): host `<SERVER_IP>`, port `5432`,
database `dbuser`, user `dbuser`.

Быстрая проверка, что порт открыт:
```bash
nc -zv <SERVER_IP> 5432
```

### SSH-доступ кандидата
```bash
ssh dbuser@<SERVER_IP>           # пароль = CONSOLE_PASSWORD
cat /home/dbuser/logs/api/log    # кандидат видит лог приложения
```

---

## 11. Подготовка к новому кандидату

Перед каждым кандидатом ротируйте доступы:

```bash
cd /root
./refresh_credentials.sh         # новые пароли Linux+БД, чистка истории, печать паролей
./set_env.sh                     # копирует обновлённый .env в каталог приложения
./stop_app.sh && ./start_app.sh  # рестарт, чтобы новый BASIC_AUTH/DATABASE_URL применились
```

Кандидату выдаются:
- SSH: `dbuser@<SERVER_IP>` + `CONSOLE_PASSWORD`;
- этот же `CONSOLE_PASSWORD` — пароль к базе `dbuser`;
- API: `apilogin` + `BASIC_AUTH_PASSWORD`.

---

## 12. Если что-то не работает

| Симптом | Причина / решение |
|---|---|
| `nvm: command not found` в скрипте | Запуск не из интерактивной root-сессии (см. §2). |
| `yarn: command not found` | Не выполнен `corepack enable` для нужной версии Node. |
| API: `Connection refused` сразу | Приложение не запущено: `cd /root && ./start_app.sh`, проверьте `screen -ls`. |
| API: таймаут из браузера | Закрыт порт 3000 (`ufw status`) или внешний firewall хостинга. |
| Prisma: ошибка про отсутствующий клиент | `cd ~/ts-express-prisma && npx prisma generate`. |
| БД: `no pg_hba.conf entry for host` | Не добавлена строка `hostssl …` или не сделан `systemctl restart postgresql`. |
| БД: SSL-ошибка | В pg_hba стоит `hostssl` → в клиенте обязателен `sslmode=require`. |
| БД: таймаут / refused | Закрыт 5432, либо `listen_addresses` не `*` (после правки нужен restart). |
| БД: `password authentication failed` | Возьмите свежий `CONSOLE_PASSWORD` после `./refresh_credentials.sh`. |
| Лог кандидата пустой/нет файла | Не создан каталог `/home/dbuser/logs/api`, либо приложение ещё не обрабатывало запросы. |

