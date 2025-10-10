export class RateLimiter {
  private queue: Array<() => void> = []
  private processing = false
  private readonly delay: number

  constructor(delay = 1000) {
    this.delay = delay
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        await task()
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay))
        }
      }
    }

    this.processing = false
  }
}
