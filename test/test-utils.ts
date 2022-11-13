import { join } from 'path'
import { accessSync, constants, mkdirSync, rmSync } from 'fs'

const { W_OK, R_OK } = constants

export const sleep = async (t: number) => {
  return new Promise((resolve) => setTimeout(resolve, t))
}

export const getPathRelativeToCustomTmpDirectory = (
  ...pathArr: string[]
): string => join('.', '.tmp', ...pathArr)

export const prepareTestFs = () => {
  try {
    accessSync(getPathRelativeToCustomTmpDirectory(), W_OK | R_OK)
    rmSync(getPathRelativeToCustomTmpDirectory(), {
      recursive: true,
    })
  } catch {
    mkdirSync(getPathRelativeToCustomTmpDirectory(), {
      recursive: true,
    })
  }
}

export const cleanTestFs = () => {
  try {
    accessSync(getPathRelativeToCustomTmpDirectory(), W_OK | R_OK)
    rmSync(getPathRelativeToCustomTmpDirectory(), {
      recursive: true,
    })
    // eslint-disable-next-line no-empty
  } catch {}
}
