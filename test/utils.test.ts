import { expect, describe, it } from 'vitest'
import fs from 'fs-extra'
import { join as pathJoin } from 'path'
import { purgeEmptyPath } from '../src/utils'

describe('utils', () => {
  it('remove empty directories', async () => {
    const root = pathJoin(process.env.TMPDIR || '/tmp', 'root')

    const pAA = pathJoin(root, 'a', 'a')
    fs.mkdirpSync(pAA)
    const pBA = pathJoin(root, 'b', 'a')
    fs.mkdirpSync(pBA)
    const pB = pathJoin(root, 'b')
    fs.writeFileSync(pathJoin(pB, 'text.txt'), 'hello')
    const pCA = pathJoin(root, 'c', 'a')
    fs.mkdirpSync(pCA)
    fs.writeFileSync(pathJoin(pCA, 'text.txt'), 'hello')
    const pD = pathJoin(root, 'd')
    fs.mkdirpSync(pD)

    await purgeEmptyPath(root)

    expect(fs.existsSync(pAA)).toBe(false)
    expect(fs.existsSync(pBA)).toBe(false)
    expect(fs.existsSync(pB)).toBe(true)
    expect(fs.existsSync(pCA)).toBe(true)
    expect(fs.existsSync(pD)).toBe(false)
  })

  it('no error on non-exist directory', async () => {
    await expect(purgeEmptyPath('/tmp/not-hello-123')).resolves.not.toThrow()
  })
})
