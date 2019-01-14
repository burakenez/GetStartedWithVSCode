set DRIVELETTER=%~d0
:: uncomment the line below to specify the main drive letter manually
DRIVELETTER=C:

:: COPY the MinGW Make Executables
xcopy /s /y libgcc_s_dw2-1.dll %DRIVELETTER%\MinGW\bin\
xcopy /s /y libiconv-2.dll %DRIVELETTER%\MinGW\bin\
xcopy /s /y libintl-8.dll %DRIVELETTER%\MinGW\bin\
xcopy /s /y mingw32-make.exe %DRIVELETTER%\MinGW\bin\
xcopy /s /y mingw-get.exe %DRIVELETTER%\MinGW\bin\

:: Set the PATH Variable for the MinGW Executable
set MINGWPATH=%DRIVELETTER%\MinGW\bin

:: Set the PATH Variable for the GNU ARM Tools
set GNUPATH=%DRIVELETTER%\Program Files (x86)\GNU Tools ARM Embedded\8 2018-q4-major\bin

:: Get User Path
for /F "tokens=2* delims= " %%f IN ('reg query HKCU\Environment /v PATH ^| findstr /i path') do set USER_PATH=%%g

setx PATH "%USER_PATH%;%GNUPATH%;%MINGWPATH%"

ECHO Run this only once, this adds the entries to your system user path variable!!!