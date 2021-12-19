'use strict'
const { WebSocketServer } = require('ws')
const { spawn } = require('child_process')

const MC_COMMAND = '/opt/bedrock-entry.sh'
const WS_PORT = process.env.WS_PORT || 8182

const HISTORY_LEN = 20
const GRACEFUL_TIMEOUT = 10000

let socket
let history = []

const proc = spawn(MC_COMMAND, [], { shell: true, detached: true })
const wss = new WebSocketServer({ port: WS_PORT })

process.on('SIGINT', function() {
    console.log("Caught interrupt signal, trying to close gracefully");

    if(proc) {
        proc.stdin.write('stop\n')
    }

    setTimeout( () => {
        console.log('forcing shutdown')
        process.exit(1)
    }, GRACEFUL_TIMEOUT)

})

wss.on('connection', function connection(ws, req) {

    if(socket) {
        socket.terminate()
    }
    socket = ws

    ws.on('message', function message(data) {
        process.stdout.write(data)
        proc.stdin.write(data)
    })

    ws.on('close', function() {
        //console.log('closing socket')
    })

    if(req.url === '/console') {
        history.forEach( h => {
            ws.send(h)
        })
    }

})

function process_line(data) {
    if(socket) {
        socket.send(data)
    }
    history.push(data)
    if(history.length > HISTORY_LEN) {
        history.splice(0, history.length - HISTORY_LEN)
    }
}

proc.stdout.on('data', (data) => {
    process.stdout.write(data)
    process_line(data)

})
  
proc.stderr.on('data', (data) => {
    process.stderr.write(data)
    process_line(data)
})
  
proc.on('close', (code) => {
    console.log(`minecraft process exited with code ${code}`)
    process.exit(code)
})

console.log('mc-wrapper running!')