import { expect } from 'chai'
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

    expect(fs.existsSync(pAA)).to.be.false
    expect(fs.existsSync(pBA)).to.be.false
    expect(fs.existsSync(pB)).to.be.true
    expect(fs.existsSync(pCA)).to.be.true
    expect(fs.existsSync(pD)).to.be.false
  })

  it('no error on non-exist directory', async () => {
    await purgeEmptyPath('/tmp/not-hello-123')
  })
})
