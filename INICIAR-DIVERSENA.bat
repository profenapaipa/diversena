@echo off
setlocal
cd /d "%~dp0"
title DiverSena - servidor de desarrollo
set "SYS=%SystemRoot%\System32"

echo ==========================================
echo    DiverSena
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: no se encontro Node.js en este equipo.
  echo.
  echo Instala Node.js desde https://nodejs.org
  echo y vuelve a dar doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

"%SYS%\netstat.exe" -an | "%SYS%\findstr.exe" /C:":5173 " | "%SYS%\findstr.exe" "LISTENING" >nul
if not errorlevel 1 (
  echo El servidor ya estaba abierto.
  echo Abriendo el navegador...
  start "" "http://localhost:5173/diversena/"
  "%SYS%\ping.exe" -n 4 127.0.0.1 >nul
  exit /b 0
)

if not exist "node_modules" (
  echo Primera vez en este equipo: instalando dependencias.
  echo Esto puede tardar un par de minutos. Espera...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: fallo la instalacion de dependencias.
    echo.
    pause
    exit /b 1
  )
  echo.
)

echo Arrancando la app y abriendo el navegador...
echo.
echo   * DEJA ESTA VENTANA ABIERTA mientras uses la app.
echo   * Para cerrar el servidor: cierra esta ventana.
echo   * Si pide permiso de camara, acepta.
echo.
call npm run dev -- --open

echo.
echo El servidor se detuvo.
pause
