#!/bin/bash

rep_dir=~/ts-express-prisma

cd $rep_dir

echo -e "\e[1;32mA project is being installed\e[1;m"
nvm use
yarn install
cd ~
