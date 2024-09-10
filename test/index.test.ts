import { expect, describe, it, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import Cache from '../src'

const sleep = async (t: number) => {
  return new Promise((resolve) => setTimeout(resolve, t))
}

describe('disk cache with ttl', () => {
  let cache: Cache

  beforeEach(() => {
    cache = new Cache()
  })

  afterEach(async () => {
    // Clean up cache after each test
    await cache.purge()
  })

  it('init', () => {
    expect(fs.existsSync(cache.path)).toBe(true)
  })

  it('init with params', () => {
    let customCache = new Cache({ path: '/tmp', ttl: 100, tbd: 300 })
    expect(customCache.ttl).toBe(100)
    expect(customCache.tbd).toBe(300)
    expect(customCache.path).toBe('/tmp')

    delete process.env.TMPDIR
    customCache = new Cache({ ttl: 100, tbd: 300 })
    expect(customCache.path).toBe('/tmp/hdc')
  })

  it('set / get', async () => {
    const v = Buffer.from('B')
    await cache.set('A', v)
    expect(await cache.get('A')).toEqual(v)

    const v2 = Buffer.from('AAA')
    await cache.set('A', v2)
    expect(await cache.get('A')).toEqual(v2)

    const defaultValue = Buffer.from('AA')
    expect(await cache.get('B', defaultValue)).toBe(defaultValue)
  })

  it('set / get stale / hit / miss', async () => {
    const key = 'key:1'
    await cache.set(key, Buffer.from('1'), 0.8)
    let s = await cache.has(key)
    expect(s).toBe('hit')
    await sleep(1000)
    s = await cache.has(key)
    expect(s).toBe('stale')
    const v = await cache.get(key)
    expect(v).toEqual(Buffer.from('1'))
    s = await cache.has('key:2')
    expect(s).toBe('miss')
  })

  it('set / get large buffer', async () => {
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    await cache.set(key1, buf, 0.8)
    expect(await cache.get(key1)).toEqual(buf)
  })

  it('del / get miss', async () => {
    await cache.set('A', Buffer.from('1'))
    expect(await cache.get('A')).toEqual(Buffer.from('1'))
    await cache.del('A')
    expect(await cache.get('A')).toBeUndefined()
    await cache.del('not-exist')
  })

  it('purge', async () => {
    const purgeCache = new Cache({ ttl: 0.1, tbd: 0.1 })
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    await purgeCache.set(key1, buf)
    expect(await purgeCache.get(key1)).toEqual(buf)
    await sleep(500)
    await purgeCache.purge()
    expect(await purgeCache.get(key1)).toBeUndefined()
  })
})
