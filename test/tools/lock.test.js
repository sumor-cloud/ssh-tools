import { describe, expect, it } from '@jest/globals'

import SSH from '../../src/SSH.js'
import lock from '../../src/tools/lock.js'
import file from '../../src/tools/file.js'
import server from '../server.js'
import delay from '../../src/utils/delay.js'

const randomId = () => {
  return Math.random().toString(36).substr(2)
}

describe('SSH lock tool', () => {
  const lockRoot = '/usr/sumor-cloud/lock'
  const name = `test-lock-${randomId()}`

  it(
    'lock',
    async () => {
      const lockPath = `${lockRoot}/${name}1.lock`
      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const lockTool = lock(ssh)
        const fileTool = file(ssh)

        const lockId = await lockTool.lock(name + '1')
        expect(await fileTool.exists(lockPath)).toBe(true)

        await lockTool.release(name + '1', lockId)
        expect(await fileTool.exists(lockPath)).toBe(false)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'wait lock',
    async () => {
      // thread 1: wait 2s -> print 1 -> release
      // thread 2: wait lock -> print 2 -> release

      let result = ''

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const lockTool = lock(ssh)
        let finishedThreadCount = 0

        const lockId1 = await lockTool.lock(name + '2')

        const thread1 = async () => {
          await delay(2000)
          result += '1'
          await lockTool.release(name + '2', lockId1)
          finishedThreadCount++
        }
        const thread2 = async () => {
          const lockId2 = await lockTool.lock(name + '2')
          result += '2'
          await lockTool.release(name + '2', lockId2)
          finishedThreadCount++
        }
        thread1()
        thread2()

        const lockStatus = await lockTool.check(name + '2')
        expect(lockStatus).toBe(true)

        await new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            if (finishedThreadCount === 2) {
              clearInterval(interval)
              resolve()
            }
          }, 100)
        })
        expect(result).toBe('12')

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )
})
