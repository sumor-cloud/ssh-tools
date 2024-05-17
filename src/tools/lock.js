// action lock, when the lock is not acquired, it will wait for the lock to be released
import file from './file.js'
import delay from '../utils/delay.js'

const randomId = () => {
  return Math.random().toString(36).substring(2, 15)
}

export default ssh => {
  const sshFileUtils = file(ssh)
  const lockRoot = '/usr/sumor-cloud/lock'

  const release = async (name, id) => {
    const lockPath = `${lockRoot}/${name}.lock`
    if (await sshFileUtils.exists(lockPath)) {
      let lockData = await sshFileUtils.readFile(lockPath)
      lockData = JSON.parse(lockData)
      if (lockData.id === id) {
        await sshFileUtils.delete(lockPath)
      }
    }
  }

  const check = async (name, ignoreCheck) => {
    const lockPath = `${lockRoot}/${name}.lock`
    if (!ignoreCheck) {
      await sshFileUtils.ensureDir(lockRoot)
    }
    if (await sshFileUtils.exists(lockPath)) {
      try {
        let lockData = await sshFileUtils.readFile(lockPath)
        lockData = JSON.parse(lockData)
        if (Date.now() - lockData.time < lockData.timeout) {
          return true
        } else {
          return false
        }
      } catch (e) {
        return false
      }
    } else {
      return false
    }
  }

  const lock = async (name, timeout) => {
    const lockPath = `${lockRoot}/${name}.lock`
    timeout = timeout || 60 * 1000
    await sshFileUtils.ensureDir(lockRoot)

    const checkValid = async () => {
      const valid = await check(name, true)
      if (valid) {
        await delay(100)
        await checkValid()
      }
    }
    await checkValid()
    const id = randomId()
    await sshFileUtils.writeFile(
      lockPath,
      JSON.stringify({
        id,
        time: Date.now(),
        timeout
      })
    )

    return id
  }

  return {
    lock,
    check,
    release
  }
}
