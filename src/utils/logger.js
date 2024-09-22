import Logger from '@sumor/logger'

// original code is en
const code = {
  trace: {
    SSH_CMD: 'Execute command {cmd} in {cwd}'
  },
  debug: {},
  info: {},
  warn: {},
  error: {}
}

// languages: zh, es, ar, fr, ru, de, pt, ja, ko
const i18n = {
  zh: {
    SSH_CMD: '执行命令 {cmd} 在 {cwd} 中'
  }
}
export default new Logger({
  scope: 'SSH',
  code,
  i18n
})
