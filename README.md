# Webwizit Attendance

A full-stack attendance system with a React frontend and Node.js backend.

## 1. Setup project
```bash
mkdir webwizit-attendance
cd webwizit-attendance
```

## 2. Setup backend
```bash
mkdir server && cd server
# Copy all server files from your previous response
npm install
# Create .env with your MongoDB Atlas URI
npm run test-connection
npm run init-admin
npm run dev
```

## 3. Setup frontend (new terminal)
```bash
cd ../client
# Copy all client files from your previous response
npm install
npm run download-models
npm start
``` 