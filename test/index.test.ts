import { expect } from 'chai'
import fs from 'fs'
import Cache from '../src'

export const sleep = async (t: number) => {
  return new Promise((resolve) => setTimeout(resolve, t))
}

describe('disk cache with ttl', () => {
  it('init', () => {
    const cache = new Cache()
    expect(fs.existsSync(cache.path)).to.be.true
  })

  it('init with params', () => {
    let cache = new Cache({ path: '/tmp', ttl: 100, tbd: 300 })
    expect(cache.ttl).to.eq(100)
    expect(cache.tbd).to.eq(300)
    expect(cache.path).to.eq('/tmp')

    delete process.env.TMPDIR
    cache = new Cache({ ttl: 100, tbd: 300 })
    expect(cache.path).to.eq('/tmp/hdc')
  })

  it('set / get', () => {
    const cache = new Cache()
    const v = Buffer.from('B')
    cache.set('A', v)
    expect(cache.get('A')).to.deep.eq(v)

    const v2 = Buffer.from('AAA')
    cache.set('A', v2)
    expect(cache.get('A')).to.deep.eq(v2)

    const defaultValue = Buffer.from('AA')
    expect(cache.get('B', defaultValue)).to.eq(defaultValue)
  })

  it('set / get stale / hit / miss', async () => {
    const cache = new Cache()
    const key = 'key:1'
    cache.set(key, Buffer.from('1'), 0.8)
    let s = cache.has(key)
    expect(s).to.eq('hit')
    await sleep(1000)
    s = cache.has(key)
    expect(s).to.eq('stale')
    const v = cache.get(key)
    expect(v).to.deep.eq(Buffer.from('1'))
    s = cache.has('key:2')
    expect(s).to.eq('miss')
  })

  it('set / get large buffer', async () => {
    const cache = new Cache()
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    cache.set(key1, buf, 0.8)
    expect(cache.get(key1)).to.deep.eq(buf)
  })

  it('del / get miss', () => {
    const cache = new Cache()
    cache.set('A', Buffer.from('1'))
    expect(cache.get('A')).to.deep.eq(Buffer.from('1'))
    cache.del('A')
    expect(cache.get('A')).to.be.undefined
  })

  it('purge', async () => {
    const cache = new Cache({ ttl: 0.1, tbd: 0.1 })
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    cache.set(key1, buf)
    expect(cache.get(key1)).to.deep.eq(buf)
    await sleep(500)
    cache.purge()
    expect(cache.get(key1)).to.be.undefined
  })
})
