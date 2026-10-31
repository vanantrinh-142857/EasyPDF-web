@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo EasyPDF web — dang khoi dong may chu cuc bo tai http://localhost:8080/
echo (Dong cua so nay de tat.)
set PY=
where py >nul 2>nul
if %errorlevel%==0 (set PY=py) else (where python >nul 2>nul && set PY=python)
if not defined PY (
  echo Khong thay Python tren may. Hay cai Python tai https://www.python.org roi chay lai tep nay.
  pause
  exit /b
)
start "" http://localhost:8080/
%PY% -m http.server 8080
