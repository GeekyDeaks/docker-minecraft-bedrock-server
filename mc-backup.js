'use strict'

const WebSocket = require('ws')
const fs = require('fs')
const archiver = require('archiver')

const WS_PORT = process.env.WS_PORT || 8182
const ws = new WebSocket(`ws://127.0.0.1:${WS_PORT}/`)

const BACKUP_PATH = '/data/backup'

let state = 'hold'
let inProgress = false

function backup_files(world, files) {

    let date = new Date().toISOString().replace(/[-:]/g, '')
    fs.mkdirSync(BACKUP_PATH, { recursive: true })
    let zipname = `${BACKUP_PATH}/${world}-${date}.zip`
    console.log(`backing up to ${zipname}`)
    // figure out the world name
    // create a file to stream archive data to.
    const output = fs.createWriteStream(zipname)
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    })

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes')
        console.log('archiver has been finalized and the output file descriptor has closed')
        state = 'resume'
        ws.send('save resume\n')
    })

    // pipe archive data to the file
    archive.pipe(output)

    files.forEach(function(filespec) {

        let [ name, size ] = filespec.split(':')
        // append a file from stream
        const filepath = '/data/worlds/' + name
        console.log(`archiving ${filepath}, ${size} bytes`)
        let end = Math.max(0, size - 1)
        let fh = fs.createReadStream(filepath, { start: 0, end })
        archive.append(fh, { name })
    })

    archive.finalize()

}

ws.on('open', function open() {
    console.log('socket opened')

    // start the backup
    ws.send('save hold\n')
})

ws.on('close', function() {
    console.log('socket closed')
    process.exit(0)
})

ws.on('message', function message(data) {

    // split the data into newlines
    let lines = data.toString('utf8').split('\n').filter( l => l.length)
    lines.forEach(function(data) {
        process.stdout.write(`received: ${data}\n`)
        switch(state){
            case 'hold': {
                // we are expecting data to contain
                if(data.includes('Saving...')) {
                    console.log('starting save query')
                    state = 'query'
                    ws.send('save query\n')
                }
                break
            }
            case 'query': {
                if(data.includes('Data saved')) {
                    console.log('Data saved, waiting for file details')
                }
                if(data.includes('db/MANIFEST')  && !inProgress) {
                    console.log('file details found')
                    inProgress = true
                    let files = data.split(',').map(f => f.trim())
                    let world = files[0].split('/')[0]
                    console.log(`backing up world ${world}`)
                    console.log(files)
                    backup_files(world, files)
    
                }
                break
    
            }
            case 'resume': {
                if(data.includes('Changes to the world are resumed')) {
                    console.log('saving resumed')
                    state = ''
                    process.exit(0)
                }
                break
            }
            default: {
                console.log('unexpected data')
            }
        }
    })

})