import { expect } from 'chai'
import { existsSync, mkdirSync, rmSync, accessSync, constants } from 'fs'
import { tmpdir } from 'os'
import { DEFAULT_DB_NAME, DEFAULT_DIRECTORY_NAME } from '../src/consts'
import { join } from 'path'
import {
  cleanTestFs,
  getPathRelativeToCustomTmpDirectory,
  prepareTestFs,
  sleep,
} from './test-utils'
import Cache from '../src'

describe('disk cache with ttl', () => {
  before(() => prepareTestFs())
  after(() => cleanTestFs())

  it('init', () => {
    const cache = new Cache()
    expect(existsSync(cache.path)).to.be.true
    expect(existsSync(cache.dbPath)).to.be.true
    expect(cache.path).to.eq(join(tmpdir(), DEFAULT_DIRECTORY_NAME))
    expect(cache.dbPath).to.eq(
      join(tmpdir(), DEFAULT_DIRECTORY_NAME, DEFAULT_DB_NAME)
    )
  })

  it('init with params', () => {
    const cache = new Cache({
      path: getPathRelativeToCustomTmpDirectory('cache-files'),
      ttl: 100,
      tbd: 300,
      dbPath: getPathRelativeToCustomTmpDirectory('cache-db'),
    })
    expect(cache.ttl).to.eq(100)
    expect(cache.tbd).to.eq(300)
    expect(cache.path).to.eq(getPathRelativeToCustomTmpDirectory('cache-files'))
    expect(cache.dbPath).to.eq(
      getPathRelativeToCustomTmpDirectory('cache-db', DEFAULT_DB_NAME)
    )
  })

  it('create in-memory database', () => {
    const cache = new Cache({
      dbPath: ':memory:',
    })
    expect(cache.dbPath).to.eq(':memory:')
  })

  it('create temporary database', () => {
    const cache = new Cache({
      dbPath: '',
    })
    expect(cache.dbPath).to.eq('')
  })

  it('create database with custom both path and filename', () => {
    const cache = new Cache({
      dbPath: getPathRelativeToCustomTmpDirectory('dir/custom-name.db'),
    })
    expect(cache.dbPath).to.eq(
      getPathRelativeToCustomTmpDirectory('dir/custom-name.db')
    )
  })

  it('create database with custom path and default filename', () => {
    const cache = new Cache({
      dbPath: getPathRelativeToCustomTmpDirectory('custom-dir'),
    })
    expect(cache.dbPath).to.eq(
      getPathRelativeToCustomTmpDirectory('custom-dir/', DEFAULT_DB_NAME)
    )
  })

  it('set / get', async () => {
    const cache = new Cache()
    const v = Buffer.from('B')
    await cache.set('A', v)
    expect(await cache.get('A')).to.deep.eq(v)

    const v2 = Buffer.from('AAA')
    await cache.set('A', v2)
    expect(await cache.get('A')).to.deep.eq(v2)

    const defaultValue = Buffer.from('AA')
    expect(await cache.get('B', defaultValue)).to.eq(defaultValue)
  })

  it('set / get stale / hit / miss', async () => {
    const cache = new Cache()
    const key = 'key:1'
    await cache.set(key, Buffer.from('1'), 0.8)
    let s = await cache.has(key)
    expect(s).to.eq('hit')
    await sleep(1000)
    s = await cache.has(key)
    expect(s).to.eq('stale')
    const v = await cache.get(key)
    expect(v).to.deep.eq(Buffer.from('1'))
    s = await cache.has('key:2')
    expect(s).to.eq('miss')
  })

  it('set / get large buffer', async () => {
    const cache = new Cache()
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    await cache.set(key1, buf, 0.8)
    expect(await cache.get(key1)).to.deep.eq(buf)
  })

  it('del / get miss', async () => {
    const cache = new Cache()
    cache.set('A', Buffer.from('1'))
    expect(await cache.get('A')).to.deep.eq(Buffer.from('1'))
    await cache.del('A')
    expect(await cache.get('A')).to.be.undefined
    await cache.del('not-exist')
  })

  it('purge', async () => {
    const cache = new Cache({ ttl: 0.1, tbd: 0.1 })
    const key1 = 'key:l1'
    const d = new Array(20000).fill('A')
    const buf = Buffer.from(d)
    await cache.set(key1, buf)
    expect(await cache.get(key1)).to.deep.eq(buf)
    await sleep(500)
    await cache.purge()
    expect(await cache.get(key1)).to.be.undefined
  })

  it('should destroy database', async () => {
    const cache = new Cache({
      dbPath: getPathRelativeToCustomTmpDirectory('foo'),
    })

    expect(existsSync(cache.dbPath)).to.be.true

    await cache.destroyDatabase()

    expect(existsSync(cache.dbPath)).to.be.false
  })
})
