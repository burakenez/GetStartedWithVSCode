# Windows Installation procedure

1. Install Modus Toolbox
    - install dir: **C:\ModusToolbox_1.0**
    - if you choose a different install directory, you need to alter:
      * CMakeList.txt
      * settings.json -> "cortex-debug.openocdPath" (see below)
1. Install VSCode
    - https://code.visualstudio.com/download
1. Install the GNU Arm Embedded Toolchain
    - https://developer.arm.com/open-source/gnu-toolchain/gnu-rm/downloads
    - You can use the unsigned 32bit option even if you have a 64bit system
    - note that the version is explicitly entered in the configurations below, make sure to alter those lines as necessary
1. Install MingW - Minimalist GNU for Windows
    - Either directly by going to
      * https://osdn.net/projects/mingw/releases/
      * download the _get
      * you only need to install the basic setup - generates the mingw32-make.exe file
      * make sure to add your install directory to the windows path
      * search for path in settings/system settings
      * add the path binary directory, e.g. C:\MinGW\bin
    - Or use the .bat file provided in the file 'VSCode_supply.zip'
1. Install CMake
    - https://cmake.org/download/ (use installer)
    - make sure to add cmake to the path variable
1. Install VS Code extensions
    - ARM Support For Visual Studio Code (dan-c-underwood)
    - C/C++ IntelliSense, debugging (microsoft)
    - CMake language support (twxs)
    - CMake Tools (vector-of-bool)
    - Cortex-Debug GDB support (marus25)
    - LinkerScript support for GNU (Zixuan Wang)
    - Open in Application (Fabio Spampinato)
    - Output Colorizer (IBM)
 1. Add VS Code User Settings
    - Command Palette (CTRL+SHIFT+P) > type: JSON > Click Preferences: Open Settings (JSON)
    - Add the following lines to the VS Code User settings:
    ```javascript
    "cmake.preferredGenerators": [
      "MinGW Makefiles",
      "Ninja",
      "Unix Makefiles"
    ],
    "cmake.cmakePath": "C:/Program Files/CMake/bin/cmake.exe",
    "git.ignoreMissingGitWarning": true,
    "terminal.integrated.rendererType": "dom",
    "cortex-debug.openocdPath": "C:/ModusToolbox_1.0/tools/openocd-1.0/bin/openocd.exe",
    "cmake.configureOnOpen": true,
    "cmake.sourceDirectory": "${workspaceRoot}"
    ```
1. Add the CMake kit
    - Command Palette (CTRL+SHIFT+P) > type: Edit> Click Edit user-local CMake kits
    - Add the following kit:
    ```javascript
    [
      {
      "name": "GCC for arm-none-eabi 7.3.1",
      "compilers": {
        "C": "C:\\Program Files (x86)\\GNU Tools Arm Embedded\\7 2018-q2-update\\bin\\arm-none-eabi-gcc.exe",
        "CXX": "C:\\Program Files (x86)\\GNU Tools Arm Embedded\\7 2018-q2-update\\bin\\arm-none-eabi-g++.exe"
        },
      "preferredGenerator": {
        "name": "MinGW Makefiles"
        }
      }
    ]
    ```
    - in the above code, be sure to change the version as necessary
1. Extract project zip to a folder
1. Open project folder
    - if you did al of the above in one go, you may need to restart your computer and/or VSCode
    - File: Open folder...
1. Build the project
    - Click Build at the bottom bar
1. Debug the project using the spider icon in the activity bar
    - Select CM4 Debug KitProg and click the green arrow
    - Do **not** use the debug function from the bottom bar!

# Optional, additional, stuff

1. Add a DeviceConfigurator button on the bar below.
    - Add the “Tasks 0.1.5” extention by actboy168.
    - Press “Install” and when it is installed press “Reload”.
    - Open Palette (Ctrl + Shift + P) and type “Taks” and press “Tasks: Configure Tasks”. 
    - Press “Create tasks.json file from template”, next press “Others”.
    - A tasks.json will open. Please copy the following (not a picture) and paste it inside this file. Save it (Ctrl + S).
    ```javascript
    {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "PSoC Config".
          "type": "shell",
          "args": ["${workspaceRoot}/design/design.PSoCconfig"],
          "options": { "cwd": "${workspaceRoot}/design"},
          "command": "C:\\ModusToolbox_1.0\\tools\\device-configurator-1.0\\device-configurator.exe"
        }
      ]
    }
    ```
    - Save it (CTRL-S)
    - Now to open Device configurator you can also use the button at the bottom left called PSoC Config
1. ? 

# Troubleshooting

1. Open DeviceConfigurator
    - To open Device Configurator go to design > (right click) design.PSoCconfig > Open in Application
    - Windows might not know with which application you would like to open in and it will ask you that.To open it, when windows asks you how, please press “look for another app on this PC” and find the “device-configurator.exe” in path:/ModusToolbox_1.0/tools/device-configurator-1.0
    - In case you do not have the option to “Open in Application”, please check if you have installed the “Open in Application” extention by Fabio Spampinato. To install the extention, go to Extention tab and search for “Open in Application” and install it.
1. Device does not debug, it gives the error: "Failed to launch OpenOCD GDB Sercer: TimeOut."
    - Select the output tab of VSC and from the drop down menu select adapter output.
    - If you can see an Error at the bottom saying: “Error: unable to find CMSIS-DAP device”. Firstly make sure that you have your programmer connected to the USB port and make sure that your device is not locked in some other program that might be using it like PSoC Creator/PSoC Programmer/ModusToolbox.
    - If that does not work/apply, do the following: Replug the device. 
    - If that does not work/apply, do the following: Make sure that the LED3 on your programmer is flashing in and out slowly, if not than please press the button on the programmer and try to debug again. 
    - If that does not work/apply, do the following: Install/Open PSoC Programmer (please update the PSoC programmer if you do not have the lastest version, you can do that by downloading the lastest version from cypress.com and installing it, the old version will be deleted and the new one will be installed). 
      * Next, press the button on the programmer so the LED3 is ON constantly and not flashing. 
      * In PSoCProgrammmer it should say “KitProg3 (CMSIS-DAP/BULK/....), select that and go to “Utilities” and “Upgrade Firmware” 
      * After doing that, please press the button again on the programmer, so the LED3 starts flashing in and out slowly. 
      * Close the PSoC ProgrammerGo to launch.json (double click)
    - Copy the following code and paste it over everything in that file: 
    
    "configurations": [

        {
            "name": "CM4 Debug Kitprog",
            "type": "cortex-debug",
            "request": "launch",
            "device": "PSoC6",
            "servertype": "openocd",
            "executable": "${workspaceRoot}/build/MyApp.elf",
            "svdFile": "${workspaceFolder}/config/svd/psoc6_01.svd",
            "windows": {
                "searchDir": [ "C:/ModusToolbox_1.1/tools/openocd-2.1/scripts" ],
            },
            "linux": {  // Assuming modustoolbox is installed in /opt
                "command": "/opt/ModusToolbox_1.1/tools/openocd-2.1/scripts"
            },
            "osx": {
                "searchDir": [ "/Applications/ModusToolbox_1.1/tools/openocd-2.1/scripts" ],
            },
            "configFiles": [
                "${workspaceRoot}/config/debug/CM4_kitprog.cfg"
            ],
            "cwd": "${workspaceRoot}/build",
            "preLaunchTask": "Build All: Debug",
            "preLaunchCommands": [
                "set mem inaccessible-by-default off",
                "mon targets psoc6.cpu.cm4",
                "mon arm semihosting enable"
            ],
            "postLaunchCommands": [
                "set output-radix 16",         // uncomment if you want decimal output instead of hexadecimal
                "tbreak main",
                "mon reset run",
                "mon psoc6 reset_halt",
                "continue",                    // uncomment for breaking at main, comment for breaking at first instruction
                "mon reg"
            ],
            "postRestartCommands": [
                "tbreak main",
                "mon reset run",
                "mon psoc6 reset_halt",
                "continue"                    // uncomment for breaking at main, comment for breaking at first instruction
            ]
        },
        {
            "name": "CM4 Debug J-Link (OCD)",
            "type": "cortex-debug",
            "request": "launch",
            "device": "PSoC6",
            "servertype": "openocd",
            "executable": "${workspaceRoot}/build/MyApp.elf",
            "svdFile": "${workspaceFolder}/config/svd/psoc6_01.svd",
            "windows": {
                "searchDir": [ "C:/ModusToolbox_1.1/tools/openocd-2.1/scripts" ],
            },
            "linux": {  // Assuming modustoolbox is installed in /opt
                "command": "/opt/ModusToolbox_1.1/tools/openocd-2.1/scripts"
            },
            "osx": {
                "searchDir": [ "/Applications/ModusToolbox_1.1/tools/openocd-2.1/scripts" ],
            },
            "configFiles": [
                "${workspaceRoot}/config/debug/CM4_JLink.cfg"
            ],
            "cwd": "${workspaceRoot}/build",
            "preLaunchTask": "Build All: Debug",
            "preLaunchCommands": [
                "set mem inaccessible-by-default off",
                "mon targets psoc6.cpu.cm4",
                "mon arm semihosting enable"
            ],
            "postLaunchCommands": [
                "set output-radix 16",         // uncomment if you want decimal output instead of hexadecimal
                "tbreak main",
                "mon reset run",
                "mon psoc6 reset_halt",
                "continue",                   // uncomment for breaking at main, comment for breaking at first instruction
                "mon reg"
            ],
            "postRestartCommands": [
                "tbreak main",
                "mon reset run",
                "mon psoc6 reset_halt",
                "continue"                    // uncomment for breaking at main, comment for breaking at first instruction
            ]
        },
        {
            "name": "CM4 Debug J-Link",
            "type": "cortex-debug",
            "request": "launch",
            "device": "CY8C6xx7_CM4_sect256KB",
            "servertype": "jlink",
            "cwd": "${workspaceRoot}/build",
            "executable": "MyApp.elf",
            //"debuggerArgs": ["-singlerun -strict -timeout 0 -nogui"],
            "svdFile": "${workspaceFolder}/config/svd/psoc6_01.svd",
            "interface": "swd",
            "preLaunchTask": "Build All: Debug",
            "preLaunchCommands": [
                "set mem inaccessible-by-default off",
                "monitor speed 1000",
                "monitor clrbp",
                "monitor reset 0",
                "monitor halt",
                "monitor regs",
                "monitor speed auto",
                "monitor flash breakpoints 1",
                "monitor semihosting enable"
            ],
            "postLaunchCommands": [
                "monitor clrbp",
                "monitor reset 2",
                "monitor halt",
                "monitor reset 0",
                "tbreak main",
                "monitor regs",
                "continue",             // uncomment for breaking at main, comment for breaking at first instruction
                "monitor halt"          // uncomment for breaking at main, comment for breaking at first instruction
            ],
            "postRestartCommands": [
                "monitor clrbp",
                "monitor reset 2",
                "monitor halt",
                "monitor reset 0",
                "tbreak main",
                "monitor regs",
                "continue",
                "monitor halt",
            ],
        }
    ]
    
    - SAVE (Ctrl + S)
    - Press “Build” at the bottom and press debug (green triangle)
    - If it is debugging but the LED is not flashing please check if in the PINs drive mode for the LED you have selected Strong drive input buffer off
