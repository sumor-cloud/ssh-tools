import {
  describe, expect, it
} from '@jest/globals'

import SSHEntry from '../src/index.js'
import SSH from '../src/SSH.js'
import server from './server.js'
import lock from '../src/tools/lock.js'

describe('SSH', () => {
  it('connect failed', async () => {
    const wrongServer = {
      host: 'wrong',
      username: 'wrong',
      password: 'wrong',
      port: 22
    }
    const ssh = new SSH(wrongServer)
    let error = null
    try {
      await ssh.connect()
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()
  })
  it('connect', async () => {
    const ssh = new SSH(server)
    await ssh.disconnect() // only for test disconnect without connect
    await ssh.connect()

    try {
      // Test command execution
      const result = await ssh.exec('echo "OK"')
      expect(result).toStrictEqual('OK')

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
  it('entry', async () => {
    const ssh = new SSHEntry(server)
    expect(ssh).toBeInstanceOf(SSH)
    expect(ssh.file).not.toBeNull()
    expect(ssh.port).not.toBeNull()
    expect(ssh.lock).not.toBeNull()
    expect(ssh.monitor).not.toBeNull()

    try {
      // Test command execution
      const result = await ssh.exec('echo "OK"')
      expect(result).toStrictEqual('OK')

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
  it('install & uninstall', async () => {
    const ssh = new SSH(server)
    await ssh.connect()

    try {
      const lockTool = lock(ssh)
      const name = 'ssh-tools-test-ssh-install'
      const lockInstance = await lockTool.lock(name, 2 * 60 * 1000)

      // clean up the environment
      await ssh.uninstall('htop')

      let installed = await ssh.isInstalled('htop')
      expect(installed).toStrictEqual(false)

      // Test software installation
      await ssh.install('htop')
      await ssh.install('htop') // only for test software already installed
      installed = await ssh.isInstalled('htop')
      expect(installed).toStrictEqual(true)

      // Test software uninstallation
      await ssh.uninstall('htop')
      await ssh.uninstall('htop') // only for test software already uninstalled
      installed = await ssh.isInstalled('htop')
      expect(installed).toStrictEqual(false)

      await lockInstance.release()
      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)

  it('install & uninstall failed', async () => {
    const ssh = new SSH(server)
    await ssh.connect()

    try {
      const lockTool = lock(ssh)
      const name = 'ssh-tools-test-ssh-install-failed'
      const lockInstance = await lockTool.lock(name, 2 * 60 * 1000)

      // Test software installation failed
      let error1 = null
      try {
        await ssh.install('wrongwrongwrong123')
      } catch (e) {
        error1 = e
      }
      expect(error1).not.toBeNull()

      // let error2 = null
      // try {
      //   await ssh.uninstall('wrongwrongwrong123')
      // } catch (e) {
      //   error2 = e
      // }
      // expect(error2).not.toBeNull()

      await lockInstance.release()
      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 5 * 60 * 1000)
})
