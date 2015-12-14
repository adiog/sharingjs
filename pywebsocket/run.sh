#!/bin/bash

python /usr/share/pyshared/mod_pywebsocket/standalone.py -p 9999 -w . || echo "Maybe you need to install pywebsocket - e.g.: apt-get install python-websocket python-mod-pywebsocket"

