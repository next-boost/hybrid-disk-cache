import SQLite3, { Database } from 'better-sqlite3'
import fs from 'fs-extra'
import { join as pathJoin } from 'path'
import { md5name, purgeEmptyPath, read, write } from './utils'

const DDL = `
CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value BLOB, filename TEXT, ttl REAL NOT NULL);
CREATE INDEX IF NOT EXISTS cache_ttl ON cache (ttl);
`

type CacheStatus = 'hit' | 'stale' | 'miss'

interface CacheOptions {
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
    db.pragma('journal_mode = WAL')
    for (const s of DDL.trim().split('\n')) {
      db.prepare(s).run()
    }
    this.db = db
  }

  set(key: string, value: Buffer, ttl?: number) {
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

  get(key: string, defaultValue?: Buffer): Buffer | undefined {
    const rv = this.db
      .prepare('SELECT value, filename FROM cache WHERE key = ?')
      .get(key)
    if (!rv) return defaultValue
    if (rv && rv.filename) rv.value = read(this.path, rv.filename)
    return rv.value
  }

  has(key: string): CacheStatus {
    const now = new Date().getTime() / 1000
    const rv = this.db.prepare('SELECT ttl FROM cache WHERE key = ?').get(key)
    return !rv ? 'miss' : rv.ttl > now ? 'hit' : 'stale'
  }

  del(key: string) {
    const rv = this.db
      .prepare('SELECT filename FROM cache WHERE key = ?')
      .get(key)
    this._delKeyAndFile(key, rv?.filename)
  }

  _delKeyAndFile(key: string, filename: string) {
    if (filename) {
      const f = pathJoin(this.path, filename)
      fs.unlink(f).catch()
    }
    this.db.prepare('DELETE FROM cache WHERE key = ?').run(key)
  }

  purge() {
    // ttl + tbd < now => ttl < now - tbd
    const now = new Date().getTime() / 1000 - this.tbd
    const rv = this.db
      .prepare('SELECT key, filename FROM cache WHERE ttl < ?')
      .all(now)
    for (const row of rv) {
      this._delKeyAndFile(row.key, row.filename)
    }
    purgeEmptyPath(this.path)
    return rv.length
  }
}

export default Cache
