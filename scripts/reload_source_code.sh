#!/bin/bash

rep_dir=~/ts-express-prisma

if [ -d $rep_dir ]; then
  echo -e "\e[1;32mA project source code removed\e[1;m"
  rm -r $rep_dir
fi

echo -e "\e[1;32mA project is being cloned\e[1;m"
git clone git@github.com:gidabite/ts-express-prisma.git
echo -e "\e[1;32mA project is cloned\e[1;m"
