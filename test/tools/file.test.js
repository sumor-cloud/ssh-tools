import { describe, expect, it, beforeAll, afterAll } from '@jest/globals'

import SSH from '../../src/SSH.js'
import file from '../../src/tools/file.js'
import server from '../server.js'
import fse from 'fs-extra'

describe('SSH file tool', () => {
  let tmpRemoteFolder
  const tmpLocalFolder = `${process.cwd()}/tmp/ssh-tools-test`

  beforeAll(async () => {
    const ssh = new SSH(server)
    await ssh.connect()
    tmpRemoteFolder = await file(ssh).tmp('ssh-tools-test')
    await ssh.disconnect()

    await fse.ensureDir(tmpLocalFolder)
  })

  afterAll(async () => {
    // clean up tmp working folder
    const ssh = new SSH(server)
    await ssh.connect()
    await ssh.exec(`rm -rf ${tmpRemoteFolder}`)
    await ssh.disconnect()

    await fse.remove(tmpLocalFolder)
  })

  it(
    'tmp folder & exists folder',
    async () => {
      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        const folder = await sshFileTool.tmp()
        expect(await sshFileTool.exists(folder)).toBe(true)
        await ssh.exec(`rm -rf ${tmpRemoteFolder}`)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'ensure folder & delete folder',
    async () => {
      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        const folder = `${tmpRemoteFolder}/ensureDir`
        await sshFileTool.ensureDir(folder)
        expect(await sshFileTool.exists(folder)).toBe(true)

        await sshFileTool.remove(folder)
        expect(await sshFileTool.exists(folder)).toBe(false)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'put file & get file',
    async () => {
      const fileLocalPath1 = `${tmpLocalFolder}/put.txt`
      const fileLocalPath2 = `${tmpLocalFolder}/get.txt`
      const fileRemotePath = `${tmpRemoteFolder}/put.txt`

      await fse.writeFile(fileLocalPath1, 'OK')

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.putFile(fileLocalPath1, fileRemotePath)
        expect(await sshFileTool.exists(fileRemotePath)).toBe(true)

        await sshFileTool.getFile(fileRemotePath, fileLocalPath2)
        const content = await fse.readFile(fileLocalPath2, 'utf8')
        expect(content).toStrictEqual('OK')

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'zip & unzip single file',
    async () => {
      const tmpLocalSourceFolder = `${tmpLocalFolder}/zipSource1`
      const tmpLocalTargetFolder = `${tmpLocalFolder}/zipTarget1`
      const tmpRemoteSourceFolder = `${tmpRemoteFolder}/zipSource1`
      const tmpRemoteTargetFolder = `${tmpRemoteFolder}/zipTarget1`

      const fileLocalPath11 = `${tmpLocalSourceFolder}/test.txt`
      const fileLocalPath12 = `${tmpLocalTargetFolder}/test.txt`

      await fse.ensureDir(tmpLocalSourceFolder)
      await fse.ensureDir(tmpLocalTargetFolder)
      await fse.writeFile(fileLocalPath11, 'OK')

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.ensureDir(tmpRemoteSourceFolder)
        await sshFileTool.ensureDir(tmpRemoteTargetFolder)

        await sshFileTool.putFile(fileLocalPath11, `${tmpRemoteSourceFolder}/test.txt`)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/test.txt`)).toBe(true)

        await sshFileTool.zip(tmpRemoteSourceFolder, `${tmpRemoteSourceFolder}/source.zip`)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/source.zip`)).toBe(true)

        await sshFileTool.unzip(`${tmpRemoteSourceFolder}/source.zip`, tmpRemoteTargetFolder)
        expect(await sshFileTool.exists(`${tmpRemoteTargetFolder}/test.txt`)).toBe(true)

        await sshFileTool.getFile(`${tmpRemoteTargetFolder}/test.txt`, fileLocalPath12)
        const content1 = await fse.readFile(fileLocalPath12, 'utf8')
        expect(content1).toStrictEqual('OK')

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'zip & unzip multiple files',
    async () => {
      const tmpLocalSourceFolder = `${tmpLocalFolder}/zipSource2`
      const tmpLocalTargetFolder = `${tmpLocalFolder}/zipTarget2`
      const tmpRemoteSourceFolder = `${tmpRemoteFolder}/zipSource2`
      const tmpRemoteTargetFolder = `${tmpRemoteFolder}/zipTarget2`

      const fileLocalPath11 = `${tmpLocalSourceFolder}/test.txt`
      const fileLocalPath12 = `${tmpLocalTargetFolder}/test.txt`
      const fileLocalPath21 = `${tmpLocalSourceFolder}/.npmrc`
      const fileLocalPath22 = `${tmpLocalTargetFolder}/.npmrc`

      await fse.ensureDir(tmpLocalSourceFolder)
      await fse.ensureDir(tmpLocalTargetFolder)
      await fse.writeFile(fileLocalPath11, 'OK')
      await fse.writeFile(fileLocalPath21, 'registry=https://registry.npmjs.org/')

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.ensureDir(tmpRemoteSourceFolder)
        await sshFileTool.ensureDir(tmpRemoteTargetFolder)

        await sshFileTool.putFile(fileLocalPath11, `${tmpRemoteSourceFolder}/test.txt`)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/test.txt`)).toBe(true)

        await sshFileTool.putFile(fileLocalPath21, `${tmpRemoteSourceFolder}/.npmrc`)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/.npmrc`)).toBe(true)

        await sshFileTool.zip(tmpRemoteSourceFolder, `${tmpRemoteSourceFolder}/source.zip`)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/source.zip`)).toBe(true)

        await sshFileTool.unzip(`${tmpRemoteSourceFolder}/source.zip`, tmpRemoteTargetFolder)
        expect(await sshFileTool.exists(`${tmpRemoteTargetFolder}/test.txt`)).toBe(true)
        expect(await sshFileTool.exists(`${tmpRemoteTargetFolder}/.npmrc`)).toBe(true)

        await sshFileTool.getFile(`${tmpRemoteTargetFolder}/test.txt`, fileLocalPath12)
        const content1 = await fse.readFile(fileLocalPath12, 'utf8')
        expect(content1).toStrictEqual('OK')

        await sshFileTool.getFile(`${tmpRemoteTargetFolder}/.npmrc`, fileLocalPath22)
        const content2 = await fse.readFile(fileLocalPath22, 'utf8')
        expect(content2).toStrictEqual('registry=https://registry.npmjs.org/')

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'put folder & get folder',
    async () => {
      const tmpLocalSourceFolder = `${tmpLocalFolder}/putFolder`
      const tmpLocalTargetFolder = `${tmpLocalFolder}/getFolder`
      const tmpRemoteSourceFolder = `${tmpRemoteFolder}/putFolder`

      const fileLocalPath11 = `${tmpLocalSourceFolder}/test.txt`
      const fileLocalPath12 = `${tmpLocalTargetFolder}/test.txt`
      const fileLocalPath21 = `${tmpLocalSourceFolder}/.npmrc`
      const fileLocalPath22 = `${tmpLocalTargetFolder}/.npmrc`

      await fse.ensureDir(tmpLocalSourceFolder)
      await fse.ensureDir(tmpLocalTargetFolder)
      await fse.writeFile(fileLocalPath11, 'OK')
      await fse.writeFile(fileLocalPath21, 'registry=https://registry.npmjs.org/')

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.ensureDir(tmpRemoteSourceFolder)

        await sshFileTool.putFolder(tmpLocalSourceFolder, tmpRemoteSourceFolder)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/test.txt`)).toBe(true)
        expect(await sshFileTool.exists(`${tmpRemoteSourceFolder}/.npmrc`)).toBe(true)

        await sshFileTool.getFolder(tmpRemoteSourceFolder, tmpLocalTargetFolder)
        expect(await fse.exists(fileLocalPath12)).toBe(true)
        expect(await fse.exists(fileLocalPath22)).toBe(true)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'write file & exists file & remove file',
    async () => {
      const fileRemotePath = `${tmpRemoteFolder}/write.txt`

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.writeFile(fileRemotePath, 'OK')
        expect(await sshFileTool.exists(fileRemotePath)).toBe(true)

        const content1 = await sshFileTool.readFile(fileRemotePath)
        const content2 = await sshFileTool.readFile(fileRemotePath, 'utf8')

        expect(content1).toStrictEqual('OK')
        expect(content2).toStrictEqual('OK')

        await sshFileTool.remove(fileRemotePath)
        expect(await sshFileTool.exists(fileRemotePath)).toBe(false)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )

  it(
    'get file info',
    async () => {
      const fileRemotePath = `${tmpRemoteFolder}/info.txt`

      const ssh = new SSH(server)
      await ssh.connect()

      try {
        const sshFileTool = file(ssh)
        await sshFileTool.writeFile(fileRemotePath, 'OK')
        expect(await sshFileTool.exists(fileRemotePath)).toBe(true)

        const info = await sshFileTool.info(fileRemotePath)
        expect(info.access).not.toBeNull()
        expect(info.modify).not.toBeNull()
        expect(info.change).not.toBeNull()

        await sshFileTool.remove(fileRemotePath)
        expect(await sshFileTool.exists(fileRemotePath)).toBe(false)

        await ssh.disconnect()
      } catch (e) {
        await ssh.disconnect()
        throw e
      }
    },
    2 * 60 * 1000
  )
})
