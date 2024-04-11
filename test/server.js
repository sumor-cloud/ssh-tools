import fs from 'fs'

let server = fs.readFileSync(`${process.cwd()}/test/config/server.json`, 'utf-8')
server = JSON.parse(server)

export default server
