# Генерируем пароль для BASIC AUTH
bax="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13)"
sed -i s/BASIC_AUTH_PASSWORD.*/BASIC_AUTH_PASSWORD=$bax/ .env

# Генерируем пароль для dbuser
x="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13)"
echo "dbuser:$x" | chpasswd
# Устанавилваем пароль для DB
sudo -u dbuser psql << EOF
ALTER USER dbuser WITH PASSWORD '$x';
EOF

sudo -u dbuser psql << EOF
SELECT pg_terminate_backend( pid ) FROM pg_stat_activity WHERE pid <>
pg_backend_pid( ) AND datname = 'dbuser';
EOF

sed -i s/DATABASE_URL.*/DATABASE_URL=postgresql:\\/\\/dbuser:$x@v2652438.hosted-by-vdsina.ru:5432\\/dbuser/ .env

# Чистим историю ввода команд dbuser
rm -f /home/dbuser/.bash_history
# Завершаем все сессии dbuser
pkill -U dbuser

echo "CONSOLE_PASSWORD = $x"
echo "BASIC_AUTH_PASSWORD = $bax"
