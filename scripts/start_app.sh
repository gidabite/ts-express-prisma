
if screen -list | grep "api"; then
	echo -e "\e[1;32mA project is already started\e[1;m"
else
	. clear_log.sh
	cd ~/ts-express-prisma
	nvm use
	rm -f screenlog.0
	screen -d -m -L -S api yarn start
	echo -e "\e[1;32mA project is started\e[1;m"
	cd ~
fi


