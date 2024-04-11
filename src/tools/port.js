export default (ssh) => {
  const isOccupied = async (port) => {
    try {
      const result = await ssh.exec(`lsof -i:${port}`, {
        cwd: '/'
      })
      return result !== ''
    } catch (e) {
      // console.log(e);
      if (e.message === '') {
        return false
      } else {
        throw e
      }
    }
  }
  const _getPort = async (retry, start, range) => {
    start = start || 30000
    range = range || 10000
    if (!retry) {
      retry = 1
    } else {
      retry++
    }
    if (retry > 10) {
      throw new Error('Server port acquisition failed')
    }
    const port = start + Math.floor(Math.random() * range)
    const flag = await isOccupied(port)
    if (!flag) {
      return port
    }
    return await _getPort(retry)
  }
  return {
    isOccupied,
    async getPort (start, range) {
      return await _getPort(start, range)
    }
  }
}
