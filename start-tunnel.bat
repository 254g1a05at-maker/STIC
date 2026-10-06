@echo off
title CSE - STIC Live Tunnel
cls
echo =========================================================
echo   CSE - STIC Public Mobile & Desktop Live Tunnel
echo =========================================================
echo.
echo Step 1: Getting your tunnel verification IP...
for /f "delims=" %%i in ('curl -s https://loca.lt/mytunnelpassword') do set TUNNEL_IP=%%i
echo.
echo ---------------------------------------------------------
echo   YOUR TUNNEL PASSWORD IS: %TUNNEL_IP%
echo ---------------------------------------------------------
echo (Enter this IP when the link asks for "Tunnel Password")
echo.
echo Step 2: Launching live public URL on Port 5000...
echo Keep this window open while using the link.
echo.
npx --yes localtunnel --port 5000
pause
