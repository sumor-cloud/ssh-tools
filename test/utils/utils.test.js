import { describe, expect, it } from '@jest/globals'

import retry from '../../src/utils/retry.js'
import delay from '../../src/utils/delay.js'

describe('Utils', () => {
  it('retry', async () => {
    let count = 0

    const timer = setInterval(() => {
      count++
    }, 100)
    const retryAction = async () => {
      if (count < 2) {
        throw new Error('failed')
      }
    }

    let error1 = null
    try {
      await retry(retryAction, 1)
    } catch (e) {
      error1 = e
    }
    expect(error1).not.toBeNull()

    let error2 = null
    try {
      await retry(retryAction, 4, 100)
    } catch (e) {
      error2 = e
    }
    expect(error2).toBeNull()

    clearInterval(timer)
  })
  it('delay', async () => {
    const start = Date.now()
    await delay(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThan(95)
  })
})
