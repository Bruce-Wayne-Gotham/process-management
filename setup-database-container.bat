@echo off
echo 🐳 Tobacco Tracker - Containerized Database Setup
echo ================================================
echo.

echo Building setup container...
docker-compose -f docker-compose.setup.yml build tobacco-tracker-setup

echo.
echo Running database setup in container...
docker-compose -f docker-compose.setup.yml run --rm tobacco-tracker-setup

echo.
echo Verifying database setup...
docker-compose -f docker-compose.setup.yml --profile verify run --rm tobacco-tracker-verify

echo.
echo Cleaning up containers...
docker-compose -f docker-compose.setup.yml down

echo.
echo 🎉 Containerized setup complete!
echo 🚀 Your application is ready at: https://process-management-4t4o.onrender.com
echo.
pause
