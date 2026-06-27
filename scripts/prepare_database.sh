#!/bin/bash

rep_dir=~/ts-express-prisma

cd $rep_dir
echo -e "\e[1;32mA database is being prepared\e[1;m"
npx prisma migrate deploy
cd ~
echo -e "\e[1;32mA database is prepared\e[1;m"
