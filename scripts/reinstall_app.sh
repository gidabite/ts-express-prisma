#!/bin/bash

rm -rf node_modules/ log.log yarn.lock

. stop_app.sh

. reload_source_code.sh

. set_env.sh

. install_app.sh

. prepare_database.sh

. start_app.sh
