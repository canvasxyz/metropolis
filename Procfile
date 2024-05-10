release: touch .env
web: node --env-file=.env --gc_interval=100 server/dist/index.js
worker: timeout -s KILL 14400 lein poller
