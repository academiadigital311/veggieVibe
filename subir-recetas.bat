@echo off
cd /d "C:\Users\Camila\Documents\AcademIA Digital\Veggie vibes\recetas-verdes"
echo Subiendo los cambios a GitHub...
echo.
git add -A
git commit -m "Actualizar recetas y banner"
git push
echo.
echo Listo. Si no ves ningun mensaje en rojo que diga "error" o "fatal", funciono.
echo Puedes cerrar esta ventana.
pause
