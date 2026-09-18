#!/bin/bash
set -e

cp Caddyfile /etc/caddy/sites/chess-animals.caddy
sudo systemctl reload caddy
