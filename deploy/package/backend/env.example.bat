@echo off

REM Copy this file to env.bat and edit values for the target machine.

REM env.bat is loaded automatically by start-backend.bat.



REM Database

set DB_HOST=localhost

set DB_PORT=3306

set DB_NAME=dismantling_platform

set DB_USERNAME=hcr

set DB_PASSWORD=123456



REM DingTalk Stream (optional overrides; defaults are in application-prod.yml)

REM set DINGTALK_CLIENT_ID=your-client-id

REM set DINGTALK_CLIENT_SECRET=your-client-secret

REM set DINGTALK_AUTO_START=true



REM Backend port

set SERVER_PORT=8086

