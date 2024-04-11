export default async (interval) => {
  interval = interval || 1000
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, interval)
  })
}
