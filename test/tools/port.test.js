// port number prefix is 112

import {
  describe, expect, it
} from '@jest/globals'

import SSH from '../../src/SSH.js'
import port from '../../src/tools/port.js'
import server from '../server.js'

describe('SSH port tool', () => {
  it('is occupied', async () => {
    const wrongPortTool = port()
    let error = null
    try {
      await wrongPortTool.isOccupied(22)
    } catch (e) {
      error = e
    }
    expect(error).not.toBeNull()

    const ssh = new SSH(server)
    await ssh.connect()

    try {
      const portTool = port(ssh)
      const isOccupied = await portTool.isOccupied(22)
      expect(isOccupied).toStrictEqual(true)

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
  it('is not occupied', async () => {
    const newPort = 11201
    const ssh = new SSH(server)
    await ssh.connect()

    try {
      const portTool = port(ssh)
      const isOccupied = await portTool.isOccupied(newPort)
      expect(isOccupied).toStrictEqual(false)

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
  it('get port failed', async () => {
    const ssh = new SSH(server)
    const portTool = port(ssh)
    await ssh.connect()

    try {
      let error = null
      try {
        await portTool.getPort(22, 1)
      } catch (e) {
        error = e
      }
      expect(error).not.toBeNull()

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
  it('get port', async () => {
    const ssh = new SSH(server)
    const portTool = port(ssh)
    await ssh.connect()

    try {
      // Test command execution
      const port1 = await portTool.getPort()
      const port2 = await portTool.getPort()

      expect(typeof port1).toStrictEqual('number')
      expect(typeof port2).toStrictEqual('number')
      expect(port1.toString().length).toStrictEqual(5)
      expect(port2.toString().length).toStrictEqual(5)

      const isOccupied1 = await portTool.isOccupied(port1)
      expect(isOccupied1).toStrictEqual(false)
      const isOccupied2 = await portTool.isOccupied(port2)
      expect(isOccupied2).toStrictEqual(false)

      await ssh.disconnect()
    } catch (e) {
      await ssh.disconnect()
      throw e
    }
  }, 2 * 60 * 1000)
})
