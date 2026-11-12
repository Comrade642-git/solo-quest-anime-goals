@echo off
echo ========================================================
echo  SOLO QUEST - Anime Daily Goal Tracker
echo ========================================================
set "PATH=%~dp0..\tools\nodejs;%~dp0..\tools\git\cmd;%PATH%"
echo Starting server on http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
