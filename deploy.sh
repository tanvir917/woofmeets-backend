#!/bin/bash
cd /var/www/woofmeets-backend
echo "pulling updated code"
sudo git pull origin dev
echo "package installation"
sudo yarn
echo "db migrating"
sudo yarn migrate
echo "Building..."
sudo yarn build
sudo pm2 restart 0
echo "complete"