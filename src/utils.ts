import { createHash } from 'crypto'
import fs from 'fs-extra'
import path from 'path'

export function write(dir: string, filename: string, data: Buffer) {
  const file = path.join(dir, filename)
  fs.mkdirpSync(file.slice(0, file.lastIndexOf('/')))
  return fs.writeFileSync(file, data)
}

export function read(dir: string, filename: string) {
  return fs.readFileSync(path.join(dir, filename))
}

export function md5name(buf: string) {
  const md5 = createHash('md5')
  const str = md5.update(buf).digest('hex')
  const p0 = str.slice(0, 2)
  const p1 = str.slice(2, 4)
  const pe = str.slice(4)
  return [p0, p1, pe].join('/') + '.v'
}

async function purge(dir: string): Promise<boolean> {
  let empty = true
  const files = await fs.readdir(dir)
  for (const f of files) {
    const sub = path.join(dir, f)
    const stat = await fs.stat(sub)
    empty = stat.isDirectory() ? (await purge(sub)) && empty : false
  }

  if (empty) await fs.rmdir(dir)
  return empty
}

export async function purgeEmptyPath(dir: string): Promise<boolean> {
  if (fs.pathExistsSync(dir)) {
    return await purge(dir)
  }
  return false
}
