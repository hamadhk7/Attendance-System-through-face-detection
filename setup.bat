@echo off

echo Setting up WebWizit Attendance System...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is required but not installed. Please install Node.js first.
    exit /b 1
)

:: Backend setup
echo Setting up backend...
cd server
npm install
copy .env.example .env
if exist .env (
    echo Please edit server/.env with your configuration
) else (
    echo .env.example not found. Please create .env manually.
)
pause
npm run init-admin

:: Frontend setup
echo Setting up frontend...
cd ../client
npm install
npm run download-models

echo Setup complete!
echo To start the application:
echo 1. Backend: cd server ^&^& npm run dev
echo 2. Frontend: cd client ^&^& npm start
echo 3. Access: http://localhost:3000
echo 4. Login: admin / admin123
pause 