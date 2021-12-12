import Cache, { CacheOptions } from './'

export class Adapter {
  cache: Cache
  private interval?: NodeJS.Timeout

  /**
   * Init the hybrid-disk-cache adapter
   *
   * @param conf the cache's config, with defaults:
   *  - ttl=3600
   *  - tbd=3600
   *  - path=$TMPDIR/hdc
   * @returns the hdc cache instance
   */
  constructor(conf?: CacheOptions) {
    this.cache = new Cache(conf)
  }

  async init() {
    console.log(`  Cache located at ${this.cache.path}`)
    // purge timer
    this.initPurgeTimer()
    return this.cache
  }

  /**
   * Stop the purge timer
   */
  async shutdown() {
    if (this.interval) clearInterval(this.interval)
  }

  private initPurgeTimer() {
    if (this.interval) return
    const tbd = Math.min(this.cache.tbd, 3600)
    console.log('  Cache manager inited, will start to purge in %ds', tbd)
    this.interval = setInterval(() => {
      const start = process.hrtime()
      const rv = this.cache.purge()
      console.log(start, 'purge', `purged all ${rv} inactive record(s)`)
    }, tbd * 1000)
  }
}
