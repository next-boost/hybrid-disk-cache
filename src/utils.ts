import { createHash } from 'crypto'
import fs from 'fs-extra'
import { join as pathJoin } from 'path'

export function write(dir: string, filename: string, data: Buffer) {
  const file = pathJoin(dir, filename)
  fs.mkdirpSync(file.slice(0, file.lastIndexOf('/')))
  return fs.writeFileSync(file, data)
}

export function read(dir: string, filename: string) {
  return fs.readFileSync(pathJoin(dir, filename))
}

export function md5name(buf: string) {
  const md5 = createHash('md5')
  const str = md5.update(buf).digest('hex')
  const p0 = str.slice(0, 2)
  const p1 = str.slice(2, 4)
  const pe = str.slice(4)
  return [p0, p1, pe].join('/') + '.v'
}

export async function purgeEmptyPath(path: string) {
  if (!(await fs.pathExists(path))) return false

  const dir = await fs.readdir(path)
  if (dir.length === 0) {
    await fs.rmdir(path)
    return true
  }

  let empty = true
  for (const f of dir) {
    const subPath = pathJoin(path, f)
    const stat = await fs.stat(subPath)
    empty = stat.isDirectory()
      ? (await purgeEmptyPath(subPath)) && empty
      : false
  }

  if (empty) await fs.rmdir(path)
  return empty
}
