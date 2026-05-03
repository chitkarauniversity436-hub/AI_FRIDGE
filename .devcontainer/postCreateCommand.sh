#!/bin/bash

cd backend

if [ ! -f .env ]; then
  cp .env.example .env
fi

npm install

cd ..

npm install
