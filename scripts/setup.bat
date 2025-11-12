@echo off
echo 🚀 Tobacco Tracker Database Setup
echo ================================
echo.

echo Installing dependencies...
npm install

echo.
echo Running database setup...
node setup-database.js

echo.
echo Setup complete! Press any key to exit...
pause > nul
