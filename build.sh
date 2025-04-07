#!/bin/bash

echo "Starting custom build process..."

# Change to backend directory
cd backend

# Install Composer
echo "Installing Composer..."
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"

# Install dependencies
echo "Installing PHP dependencies..."
php composer.phar install --no-interaction --prefer-dist --optimize-autoloader --no-dev

echo "Build completed successfully!" 