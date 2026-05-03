#!/bin/bash

cd backend
nohup npm run dev > /tmp/backend.log 2>&1 &

cd ..
nohup npm run dev > /tmp/frontend.log 2>&1 &
