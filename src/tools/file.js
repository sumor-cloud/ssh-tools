// File tools for ssh

import os from 'os'
import fse from 'fs-extra'
import archiver from 'archiver'
import extract from 'extract-zip'
import path from 'path'

const randomFolderName = () => {
  const timestamp = new Date().getTime().toString(36)
  const randomString = Math.random().toString(36).substring(7)
  return `tmp-${timestamp}-${randomString}`
}

const fileUtils = {
  async tmp (namespace) {
    namespace = namespace || 'sumor-tmp'
    const tmpFolder = path.normalize(`${os.tmpdir()}/${namespace}/${randomFolderName()}`)
    await fse.ensureDir(tmpFolder)
    return tmpFolder
  },
  async zip (source, target, ignore) {
    return await new Promise((resolve, reject) => {
      const output = fse.createWriteStream(target)
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      })
      // listen for all archive data to be written
      output.on('close', () => {
        resolve()
      })
      archive.pipe(output)
      archive.glob('**', {
        cwd: source,
        dot: true,
        // root:sourceFolder
        ignore: ignore || [] // ["*.git*"]
      })
      archive.finalize()
    })
  },
  async unzip (source, target) {
    source = path.normalize(source)
    return await new Promise((resolve, reject) => {
      extract(source, { dir: target }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

export default (ssh) => {
  const ensureDir = async (folder) => {
    await ssh.exec(`mkdir -p ${folder}`)
  }

  const tmp = async (namespace) => {
    namespace = namespace || 'sumor-tmp'
    const tmpFolder = `/tmp/${namespace}/${randomFolderName()}`
    await ensureDir(tmpFolder)
    return tmpFolder
  }

  const remove = async (target) => {
    await ssh.exec(`rm -rf ${target}`)
  }

  const exists = async (path) => {
    try {
      await ssh.exec(`ls ${path}`)
      return true
    } catch (e) {
      return false
    }
  }

  const putFile = async (localFile, remoteFile) => {
    return await ssh._putFile(localFile, remoteFile)
  }

  const getFile = async (remoteFile, localFile) => {
    return await ssh._getFile(remoteFile, localFile)
  }

  const zip = async (sourceFolder, targetFile) => {
    await ssh.install('zip')
    await ssh.exec(`cd ${sourceFolder};zip -q -r ${targetFile} ./`)
  }

  const unzip = async (sourceFile, targetFolder) => {
    await ssh.install('unzip')
    await ssh.exec(`unzip -o ${sourceFile} -d ${targetFolder}`)
  }

  const putDir = async (localFolder, remoteFolder) => {
    const localTmp = await fileUtils.tmp()
    const localZip = `${localTmp}/tmp.zip`
    const remoteTmp = await tmp()
    const remoteZip = `${remoteTmp}/tmp.zip`

    await fse.ensureDir(localTmp)
    await fileUtils.zip(localFolder, localZip)
    await putFile(localZip, remoteZip)
    await ensureDir(remoteFolder)
    await unzip(remoteZip, remoteFolder)
    await remove(remoteTmp)
    await fse.remove(localTmp)
  }

  const getDir = async (remoteFolder, localFolder) => {
    const localTmp = await fileUtils.tmp()
    const localZip = `${localTmp}/tmp.zip`
    const remoteTmp = await tmp()
    const remoteZip = `${remoteTmp}/tmp.zip`

    await fse.ensureDir(localTmp)
    await zip(remoteFolder, remoteZip)
    await getFile(remoteZip, localZip)
    await fileUtils.unzip(localZip, localFolder)
    await remove(remoteTmp)
    await fse.remove(localTmp)
  }

  const writeFile = async (target, data) => {
    const tmpDir = await fileUtils.tmp()
    const tmpPath = `${tmpDir}/tmpfile`
    await fse.writeFile(tmpPath, data)
    await putFile(tmpPath, target)
    await remove(tmpDir)
  }

  const readFile = async (target, encode) => {
    encode = encode || 'utf8'
    const tmpDir = await fileUtils.tmp()
    const tmpPath = `${tmpDir}/tmpfile`
    await getFile(target, tmpPath)
    const result = await fse.readFile(tmpPath, encode)
    await remove(tmpDir)
    return result
  }

  const info = async (target) => {
    if (await exists(target)) {
      const text = await ssh.exec(`stat ${target} -c "%X|%Y|%Z"`)
      const items = text.split('|')
      const result = {}
      result.access = parseInt(items[0], 10)
      result.modify = parseInt(items[1], 10)
      result.change = parseInt(items[2], 10)
      return result
    }
  }

  return {
    tmp,
    ensureDir,
    remove,
    exists,
    putFile,
    getFile,
    zip,
    unzip,
    putDir,
    getDir,
    writeFile,
    readFile,
    info,

    // alias
    ensureFolder: ensureDir,
    delete: remove,
    putFolder: putDir,
    getFolder: getDir
  }
}
