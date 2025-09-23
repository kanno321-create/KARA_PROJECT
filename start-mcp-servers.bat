@echo off
echo Starting MCP Servers for KIS_CORE_V2...

REM Set environment variables
set PYTHONPATH=%CD%\mcp-servers

echo.
echo Available MCP Servers:
echo =====================
echo 1. CAD-MCP (Universal CAD)
echo 2. AutoCAD-MCP (AutoCAD LT)
echo 3. FreeCAD-MCP (FreeCAD)
echo 4. TextIn OCR
echo 5. General OCR
echo 6. PDF Reader
echo 7. E2B Sandbox
echo 8. Exa Search
echo 9. Browserbase
echo 0. Start All Servers
echo.

set /p choice="Enter your choice (0-9): "

if "%choice%"=="0" goto start_all
if "%choice%"=="1" goto cad_mcp
if "%choice%"=="2" goto autocad_mcp
if "%choice%"=="3" goto freecad_mcp
if "%choice%"=="4" goto textin_ocr
if "%choice%"=="5" goto general_ocr
if "%choice%"=="6" goto pdf_reader
if "%choice%"=="7" goto e2b_sandbox
if "%choice%"=="8" goto exa_search
if "%choice%"=="9" goto browserbase

echo Invalid choice. Exiting.
pause
exit /b

:cad_mcp
echo Starting CAD-MCP Server...
cd mcp-servers\cad-mcp
python src\server.py
goto end

:autocad_mcp
echo Starting AutoCAD-MCP Server...
cd mcp-servers\autocad-mcp
python server_lisp_fast.py
goto end

:freecad_mcp
echo Starting FreeCAD-MCP Server...
cd mcp-servers\freecad-mcp
python -m freecad_mcp.server
goto end

:textin_ocr
echo Starting TextIn OCR Server...
cd mcp-servers\textin-mcp
python server.py
goto end

:general_ocr
echo Starting General OCR Server...
cd mcp-servers\ocr-mcp
python server.py
goto end

:pdf_reader
echo Starting PDF Reader Server...
cd mcp-servers\pdf-reader-mcp
python main.py
goto end

:e2b_sandbox
echo Starting E2B Sandbox Server...
cd mcp-servers\e2b-mcp
python src\e2b_mcp\server.py
goto end

:exa_search
echo Starting Exa Search Server...
cd mcp-servers\exa-mcp
python src\exa_mcp\server.py
goto end

:browserbase
echo Starting Browserbase Server...
cd mcp-servers\browserbase-mcp
python src\mcp_server_browserbase\server.py
goto end

:start_all
echo Starting all MCP servers in background...
echo This will open multiple command windows.
echo.

start "CAD-MCP" cmd /k "cd mcp-servers\cad-mcp && python src\server.py"
start "AutoCAD-MCP" cmd /k "cd mcp-servers\autocad-mcp && python server_lisp_fast.py"
start "FreeCAD-MCP" cmd /k "cd mcp-servers\freecad-mcp && python -m freecad_mcp.server"
start "TextIn-OCR" cmd /k "cd mcp-servers\textin-mcp && python server.py"
start "General-OCR" cmd /k "cd mcp-servers\ocr-mcp && python server.py"
start "PDF-Reader" cmd /k "cd mcp-servers\pdf-reader-mcp && python main.py"
start "E2B-Sandbox" cmd /k "cd mcp-servers\e2b-mcp && python src\e2b_mcp\server.py"
start "Exa-Search" cmd /k "cd mcp-servers\exa-mcp && python src\exa_mcp\server.py"
start "Browserbase" cmd /k "cd mcp-servers\browserbase-mcp && python src\mcp_server_browserbase\server.py"

echo All MCP servers started in separate windows.
goto end

:end
echo.
echo MCP Server management complete.
pause