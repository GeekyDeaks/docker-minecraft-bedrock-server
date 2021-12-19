const WebSocket = require('ws')
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const WS_PORT = process.env.WS_PORT || 8182
const ws = new WebSocket(`ws://127.0.0.1:${WS_PORT}/console`)

ws.on('open', function open() {
    console.log('socket opened')
})

ws.on('close', function() {
    console.log('socket closed')
    process.exit(0)
})

ws.on('message', function message(data) {
    process.stdout.write(data)
})

rl.on('line', (line) => {
    ws.send(line + '\n')
})