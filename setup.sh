#!/bin/bash

echo "Setting up WebWizit Attendance System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "MongoDB is not running. Please start MongoDB first."
    exit 1
fi

# Setup backend
echo "Setting up backend..."
cd server
npm install
cp .env.example .env
echo "Please edit server/.env with your configuration"
read -p "Press enter to continue..."
npm run init-admin

# Setup frontend
echo "Setting up frontend..."
cd ../client
npm install
npm run download-models

echo "Setup complete!"
echo "To start the application:"
echo "1. Backend: cd server && npm run dev"
echo "2. Frontend: cd client && npm start"
echo "3. Access: http://localhost:3000"
echo "4. Login: admin / admin123" 