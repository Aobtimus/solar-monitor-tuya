@echo off

cd /d %~dp0

start http://localhost:3000/dashboard.html

node server.js