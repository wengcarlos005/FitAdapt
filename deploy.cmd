@echo off
REM Atalho de deploy do FitAdapt: envia as mudancas pro GitHub (Vercel redeploya sozinho).
REM Uso:  deploy Sua mensagem de commit
REM       (se nao passar mensagem, usa uma padrao com data/hora)

cd /d "%~dp0"

set "MSG=%*"
if "%MSG%"=="" set "MSG=update %date% %time%"

echo.
echo === Enviando alteracoes para o GitHub ===
git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo Nada para commitar ^(ou erro no commit^).
)
git push
echo.
echo === Pronto! O Vercel vai reimplantar automaticamente. ===
pause
