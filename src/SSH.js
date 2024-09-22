import { NodeSSH } from 'node-ssh'
import retry from './utils/retry.js'
import logger from './utils/logger.js'

export default class SSH {
  constructor(config) {
    this.config = config
  }

  async connect() {
    if (!this.connection) {
      this.connection = new NodeSSH()
      await this.connection.connect(this.config)
    }
  }

  async disconnect() {
    if (this.connection) {
      this.connection.dispose()
      delete this.connection
    }
  }

  async exec(cmd, options) {
    await this.connect()
    options = options || {}
    options.cwd = options.cwd || '~'
    logger.code('SSH_CMD', { cmd, cwd: options.cwd })
    const result = await this.connection.execCommand(cmd, options)
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }
    return result.stdout
  }

  async _putFile(localFile, remoteFile) {
    await this.connect()
    await this.connection.putFile(localFile, remoteFile)
  }

  async _getFile(remoteFile, localFile) {
    await this.connect()
    await this.connection.getFile(localFile, remoteFile)
  }

  async isInstalled(software) {
    let installed = true
    try {
      await this.exec(`dpkg -s ${software}`)
    } catch (e) {
      installed = false
    }
    return installed
  }

  async install(software) {
    if (!(await this.isInstalled(software))) {
      const _install = async () => {
        await this.exec('apt-get update')
        await this.exec(`apt-get install ${software} -y`)
      }
      try {
        await retry(_install, 5, 5000)
      } catch (e) {
        throw new Error(`Server software installation failed: ${e.message}`)
      }
    }
  }

  async uninstall(software) {
    if (await this.isInstalled(software)) {
      const _uninstall = async () => {
        await this.exec(`apt-get --purge remove ${software} -y`)
      }
      try {
        await retry(_uninstall, 5, 5000)
      } catch (e) {
        throw new Error(`Server software uninstallation failed: ${e.message}`)
      }
    }
  }

  addTool(name, tool) {
    this[name] = tool(this)
  }
}
