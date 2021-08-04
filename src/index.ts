import SQLite3, { Database } from 'better-sqlite3'
import fs from 'fs-extra'
import { join as pathJoin } from 'path'
import { md5name, purgeEmptyPath, read, write } from './utils'

const DDL = `
CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value BLOB, filename TEXT, ttl REAL NOT NULL);
CREATE INDEX IF NOT EXISTS cache_ttl ON cache (ttl);
`

type CacheStatus = 'hit' | 'stale' | 'miss'

export interface CacheOptions {
  path?: string
  ttl?: number
  tbd?: number
}

class Cache {
  db: Database
  ttl = 3600 // time to live
  tbd = 3600 // time before deletion
  path = pathJoin(process.env.TMPDIR || '/tmp', 'hdc')

  constructor({ path, ttl, tbd }: CacheOptions = {}) {
    if (path) this.path = path
    fs.mkdirpSync(this.path)
    if (ttl) this.ttl = ttl
    if (tbd) this.tbd = tbd

    const db = new SQLite3(pathJoin(this.path, 'cache.db'))
    db.exec('PRAGMA journal_mode = WAL')
    for (const s of DDL.trim().split('\n')) {
      db.prepare(s).run()
    }
    this.db = db
  }

  async set(key: string, value: Buffer, ttl?: number) {
    if (!ttl) ttl = this.ttl

    const insert = this.db.prepare(
      'INSERT INTO cache (key, value, filename, ttl) VALUES (@key, @value, @filename, @valid)' +
        ' ON CONFLICT(key)' +
        ' DO UPDATE SET value = @value, ttl = @valid, filename = @filename'
    )
    let filename = null
    // larger than 10KB
    if (value.length > 10 * 1024) {
      filename = md5name(key)
      write(this.path, filename, value)
    }

    insert.run({
      key,
      value: filename ? null : value,
      filename,
      valid: new Date().getTime() / 1000 + ttl,
    })
  }

  async get(key: string, defaultValue?: Buffer): Promise<Buffer | undefined> {
    const rv = this.db
      .prepare('SELECT value, filename FROM cache WHERE key = ?')
      .get(key)
    if (!rv) return defaultValue
    if (rv && rv.filename) rv.value = read(this.path, rv.filename)
    return rv.value
  }

  async has(key: string): Promise<CacheStatus> {
    const now = new Date().getTime() / 1000
    const rv = this.db.prepare('SELECT ttl FROM cache WHERE key = ?').get(key)
    return !rv ? 'miss' : rv.ttl > now ? 'hit' : 'stale'
  }

  async del(key: string) {
    const rv = this.db
      .prepare('SELECT filename FROM cache WHERE key = ?')
      .get(key)
    this.db.prepare('DELETE FROM cache WHERE key = ?').run(key)
    this._delFile(rv?.filename)
  }

  _delFile(filename: string) {
    if (!filename) return
    const f = pathJoin(this.path, filename)
    fs.unlink(f).catch()
  }

  async purge() {
    // ttl + tbd < now => ttl < now - tbd
    const now = new Date().getTime() / 1000 - this.tbd
    const rows = this.db
      .prepare('SELECT key, filename FROM cache WHERE ttl < ?')
      .all(now)
    this.db.prepare('DELETE FROM cache WHERE ttl < ?').run(now)
    for (const row of rows) this._delFile(row.filename)
    purgeEmptyPath(this.path)
    return rows.length
  }
}

export default Cache
