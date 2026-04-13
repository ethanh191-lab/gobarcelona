@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd webapp
echo Starting GoBarcelona website...
echo When the server starts, go to http://localhost:3000 in your browser.
npm run dev
pause
