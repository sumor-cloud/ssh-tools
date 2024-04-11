const cmd = async (ssh, cmd) => {
  let result
  try {
    const output = await ssh.exec(cmd)
    result = parseFloat(output, 10)
  } catch (e) {
    console.log(e)
  }
  return result
}
export default (ssh) => ({
  async system () {
    // uptime for milliseconds
    let uptime = await cmd(ssh, 'cat /proc/uptime | awk \'{print $1}\'')
    uptime = Date.now() - parseInt(uptime * 1000, 10)
    return {
      disk: {
        total: await cmd(ssh, 'df -m --output=size / | awk \'NR==2{print $1}\''),
        used: await cmd(ssh, 'df -m --output=used / | awk \'NR==2{print $1}\''),
        free: await cmd(ssh, 'df -m --output=avail / | awk \'NR==2{print $1}\'')
      },
      memory: {
        total: await cmd(ssh, 'free -m | awk \'NR==2{print $2}\''),
        used: await cmd(ssh, 'free -m | awk \'NR==2{print $3}\''),
        free: await cmd(ssh, 'free -m | awk \'NR==2{print $4}\''),
        cache: await cmd(ssh, 'free -m | awk \'NR==2{print $6}\'')
      },
      cpu: {
        usage: await cmd(ssh, 'top -b -n 1 | grep "Cpu(s)" | awk \'{print $2 + $4}\''),
        cores: await cmd(ssh, 'cat /proc/cpuinfo | grep "processor" | wc -l')
      },
      uptime
    }
  }
})
