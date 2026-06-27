#!/bin/bash

echo -e "\e[1;32mA log file is prepared and provided to dbuser\e[1;m"
rm -f ~/ts-express-prisma/log.log
rm -f /home/dbuser/logs/api/log
touch ~/ts-express-prisma/log.log
ln ~/ts-express-prisma/log.log /home/dbuser/logs/api/log

