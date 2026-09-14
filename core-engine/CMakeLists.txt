cmake_minimum_required(VERSION 3.15)
project(VectorDB CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MSVC)
    add_compile_options(/W4 /O2)
else()
    add_compile_options(-Wall -Wextra -O3)
endif()

find_package(Threads REQUIRED)

add_executable(vectordb main.cpp)
target_link_libraries(vectordb PRIVATE Threads::Threads)
if(WIN32)
    target_link_libraries(vectordb PRIVATE ws2_32 wsock32 crypt32)
endif()
