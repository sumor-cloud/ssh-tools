import SSH from './SSH.js'
import port from './tools/port.js'
import file from './tools/file.js'
import lock from './tools/lock.js'
import monitor from './tools/monitor.js'

export default (config) => {
  const ssh = new SSH(config)

  ssh.addTool('port', port)
  ssh.addTool('file', file)
  ssh.addTool('lock', lock)
  ssh.addTool('monitor', monitor)

  return ssh
}
