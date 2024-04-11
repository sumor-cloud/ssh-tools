import delay from './delay.js'
export default async (action, times, interval) => {
  times = times || 1
  for (let i = 0; i < times; i++) {
    try {
      return await action()
    } catch (e) {
      if (interval) {
        await delay(interval)
      }
      if (i === times - 1) {
        throw e
      }
    }
  }
}
