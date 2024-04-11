import SSHBasic from './SSH.js'
import port from './tools/port.js'
import file from './tools/file.js'
import lock from './tools/lock.js'
import monitor from './tools/monitor.js'

class SSH extends SSHBasic {
  constructor (config) {
    super(config)
    this.addTool('port', port)
    this.addTool('file', file)
    this.addTool('lock', lock)
    this.addTool('monitor', monitor)
  }
}

export default SSH
