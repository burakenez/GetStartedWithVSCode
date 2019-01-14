cmake_minimum_required(VERSION 3.7.2)

######################################################################
#
#	Toolchain
#
######################################################################

#set(CMAKE_VERBOSE_MAKEFILE ON)

set (CY_MODUS_DIR C:/ModusToolbox_1.0)
set (CONFIG_DIR ${CMAKE_CURRENT_SOURCE_DIR}/config)
set (CY_OCD_DIR ${CMAKE_CURRENT_SOURCE_DIR}/config/cypress_openocd)
set (CY_PDL_DIR ${CY_MODUS_DIR}/libraries/psoc6sw-1.0/components/psoc6pdl)
set (CY_MW_DIR ${CY_MODUS_DIR}/libraries/psoc6sw-1.0/components/psoc6mw)
set (LINKER_DIR ${CMAKE_CURRENT_SOURCE_DIR}/linker)
set (CYPRESS_ELF_TOOL_PATH ${CY_MODUS_DIR}/tools/cymcuelftool-1.0/bin)

if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/local.cmake)
    include (${CMAKE_CURRENT_SOURCE_DIR}/local.cmake)
endif()
set (CMAKE_TOOLCHAIN_FILE "${CONFIG_DIR}/cmake/arm-none-eabi-toolchain.cmake")
find_program(CYPRESS_ELF_TOOL cymcuelftool ${CYPRESS_ELF_TOOL_PATH} DOC "Cypress ELF tool executable")

######################################################################
#
#	Project
#
######################################################################

project(VStest4)
enable_language(ASM)

# Use Cypress PDL
include(${CONFIG_DIR}/cmake/cypress_peripheral_drivers_library.cmake)

# Define PSoC63 chip used in the project
# CY8C6347BZI_BLD53 - Used on the Onethinx LoRaWAN Core board
set(CHIP "CY8C6347BZI_BLD53" CACHE STRING "Chip variant used on a board")
set_property(CACHE CHIP PROPERTY STRINGS CY8C6347BZI_BLD54 CY8C6347BZI_BLD53)

message("Chip variant: ${CHIP}")
add_definitions(-D ${CHIP})

#Include common settings
include(${CONFIG_DIR}/cmake/common.cmake)

######################################################################
#
#	CPP Definitions
#
######################################################################

set(PROJECT_FLAGS_ARCH
    "-mthumb \
    -Og \
    -mcpu=cortex-m4 \
    -mfloat-abi=softfp \
    -mfpu=fpv4-sp-d16 \
    -DCYDEV_CLK_ALTHF__HZ=8000000UL"
)

set(PROJECT_LINKER_FLAGS
    "-Wl,-Map=${PROJECT_NAME}.map \
    -TOnethinxCore_18.ld"
)

set(PROJECT_C_FLAGS_WARNINGS   "${COMMON_FLAGS_WARNINGS} ${C_FLAGS_WARNINGS_EXTRA}")
set(PROJECT_CXX_FLAGS_WARNINGS "${COMMON_FLAGS_WARNINGS}")

######################################################################
#
#	Sources
#
######################################################################

include_directories (
    ${PROJECT_CONFIG_DIR}
    ${PDL_INCLUDE_DIRS}
    ${PROJECT_SOURCE_DIR}
)

set(PROJECT_SRCS
    ${PROJECT_SOURCE_DIR}/source/main.c
#Chip startup and core system
    ${CY_PDL_DIR}/devices/psoc6/startup/system_psoc6_cm4.c
    ${CY_PDL_DIR}/devices/psoc6/startup/gcc/startup_psoc6_02_cm4.S
)

######################################################################
#
#	TARGET
#
######################################################################

set (CMAKE_C_FLAGS   "${C_FLAGS}   ${C_FLAGS_WARNINGS}   ${FLAGS_OPTIMIZATION} ${PROJECT_FLAGS_ARCH}")
#TODO: Evaluate ASM FLAGS
set (CMAKE_ASM_FLAGS "${C_FLAGS}   ${C_FLAGS_WARNINGS}   ${FLAGS_OPTIMIZATION} ${PROJECT_FLAGS_ARCH}")
set (CMAKE_CXX_FLAGS "${CXX_FLAGS} ${CXX_FLAGS_WARNINGS} ${FLAGS_OPTIMIZATION} ${PROJECT_FLAGS_ARCH}")
set (CMAKE_EXE_LINKER_FLAGS "${LINKER_FLAGS} ${PROJECT_LINKER_FLAGS} ${FLAGS_OPTIMIZATION} ${PROJECT_FLAGS_ARCH}")

add_executable(${PROJECT_NAME}.elf ${PROJECT_SRCS} ${PDL_SRCS})

######################################################################
#
#	Build actions
#
######################################################################

add_custom_command(
    OUTPUT ${PROJECT_NAME}_signed.elf
    COMMAND "${CYPRESS_ELF_TOOL}" --sign "${PROJECT_NAME}.elf" --output "${PROJECT_NAME}_signed.elf" --hex "${PROJECT_NAME}.hex"
    DEPENDS "${PROJECT_NAME}.elf"
)

add_custom_target(
    ${PROJECT_NAME} ALL
    DEPENDS "${PROJECT_NAME}_signed.elf"
)

add_custom_command(
    TARGET ${PROJECT_NAME}
    POST_BUILD
    COMMAND echo "------- Memory usage -------"
    COMMAND "${CYPRESS_ELF_TOOL}" ARGS -A "${PROJECT_NAME}.elf"
)
