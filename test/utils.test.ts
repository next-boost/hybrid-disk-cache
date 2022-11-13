import { expect } from 'chai'
import fs from 'fs-extra'
import { join, join as pathJoin } from 'path'
import {
  createDirectoryIfDoesNotExists,
  extractPathAndFilename,
  getDatabasePath,
  getFileCachePath,
  hasPersistentDatabaseLocation,
  purgeEmptyPath,
} from '../src/utils'
import { tmpdir } from 'os'
import { DEFAULT_DB_NAME, DEFAULT_DIRECTORY_NAME } from '../src/consts'
import {
  cleanTestFs,
  getPathRelativeToCustomTmpDirectory,
  prepareTestFs,
} from './test-utils'
import { existsSync } from 'fs'

describe('utils', () => {
  before(() => prepareTestFs())
  after(() => cleanTestFs())

  it('remove empty directories', async () => {
    const pAA = getPathRelativeToCustomTmpDirectory('a', 'a')
    fs.mkdirpSync(pAA)
    const pBA = getPathRelativeToCustomTmpDirectory('b', 'a')
    fs.mkdirpSync(pBA)
    const pB = getPathRelativeToCustomTmpDirectory('b')
    fs.writeFileSync(pathJoin(pB, 'text.txt'), 'hello')
    const pCA = getPathRelativeToCustomTmpDirectory('c', 'a')
    fs.mkdirpSync(pCA)
    fs.writeFileSync(pathJoin(pCA, 'text.txt'), 'hello')
    const pD = getPathRelativeToCustomTmpDirectory('d')
    fs.mkdirpSync(pD)

    await purgeEmptyPath(getPathRelativeToCustomTmpDirectory())

    expect(fs.existsSync(pAA)).to.be.false
    expect(fs.existsSync(pBA)).to.be.false
    expect(fs.existsSync(pB)).to.be.true
    expect(fs.existsSync(pCA)).to.be.true
    expect(fs.existsSync(pD)).to.be.false
  })

  it('no error on non-exist directory', async () => {
    await purgeEmptyPath(getPathRelativeToCustomTmpDirectory('xyz/abc'))
  })

  describe('hasPersistentDatabaseLocation', () => {
    it('should return true for files paths', () => {
      expect(hasPersistentDatabaseLocation('/tmp/test/')).to.be.true
      expect(hasPersistentDatabaseLocation('/tmp/test/xyz.db')).to.be.true
    })

    it('should return false for magic values', () => {
      expect(hasPersistentDatabaseLocation('')).to.be.false
      expect(hasPersistentDatabaseLocation(':memory:')).to.be.false
    })
  })

  describe('extractPathAndFilename', () => {
    it('should extract only path', () => {
      expect(extractPathAndFilename('/tmp/test/')).to.include.members([
        '/tmp/test/',
      ])
    })

    it('should extract path and filename', () => {
      expect(
        extractPathAndFilename('/tmp/test/database.db')
      ).to.include.members(['/tmp/test/', 'database.db'])
    })

    it('should extract path and filename even if any directory/or directories between includes dot in name', () => {
      expect(
        extractPathAndFilename('.tmp/test/database.db')
      ).to.include.members(['.tmp/test/', 'database.db'])
      expect(
        extractPathAndFilename('.tmp/.test/database.db')
      ).to.include.members(['.tmp/.test/', 'database.db'])
    })
  })

  describe('getFileCachePath', () => {
    it('should return default path if none was passed', () => {
      expect(getFileCachePath()).to.eq(join(tmpdir(), DEFAULT_DIRECTORY_NAME))
    })

    it('should return passed path', () => {
      expect(getFileCachePath('.tmp/path')).to.eq('.tmp/path')
    })
  })

  describe('getDatabasePath', () => {
    it('should return default path when none was passed', () => {
      expect(getDatabasePath()).to.eq(
        join(tmpdir(), DEFAULT_DIRECTORY_NAME, DEFAULT_DB_NAME)
      )
    })

    it('should return passed path with default filename', () => {
      expect(getDatabasePath('/tmp/dir')).to.eq(
        join('/tmp/dir', DEFAULT_DB_NAME)
      )
    })

    it('should return passed full path with filename', () => {
      expect(getDatabasePath('/tmp/dir/dbname.db')).to.eq('/tmp/dir/dbname.db')
    })

    it('should return passed path if it is one of special in-memory or temporary database paths', () => {
      expect(getDatabasePath(':memory:')).to.eq(':memory:')
      expect(getDatabasePath('')).to.eq('')
    })
  })

  describe('createDirectoryIfDoesNotExists', () => {
    it('should create directory for passed path', () => {
      createDirectoryIfDoesNotExists(
        getPathRelativeToCustomTmpDirectory('abc/xyz')
      )
      expect(existsSync(getPathRelativeToCustomTmpDirectory('abc/xyz'))).to.be
        .true
    })

    it('should create directory for passed path which included filename, filename should be omitted', () => {
      createDirectoryIfDoesNotExists(
        getPathRelativeToCustomTmpDirectory('qwe/rty/database.db')
      )
      expect(existsSync(getPathRelativeToCustomTmpDirectory('qwe/rty'))).to.be
        .true
      expect(
        existsSync(getPathRelativeToCustomTmpDirectory('qwe/rty/database.db'))
      ).to.be.false
    })
  })
})
