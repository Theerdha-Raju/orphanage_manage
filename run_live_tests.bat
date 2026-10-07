@echo off
title HopeNest Live Selenium Tests (Visible Browser)
echo Starting Live Browser Selenium Tests...
powershell -ExecutionPolicy Bypass -File "%~dp0run_tests.ps1" -Live
pause
