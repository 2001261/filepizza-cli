// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const { ensureUniquePath, resolveOutputPath } = require('../../src/cli/paths')

describe('cli paths', () => {
  it('creates a non-conflicting filename when target exists', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fp-cli-'))
    const original = path.join(tempDir, 'file.txt')
    await fs.promises.writeFile(original, 'hello')

    const unique = await ensureUniquePath(original)
    expect(unique).toMatch(/file \(1\)\.txt$/)
  })

  it('uses current working directory by default', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fp-cli-'))
    const output = await resolveOutputPath({
      output: '',
      suggestedFilename: 'download.txt',
      cwd: tempDir,
    })
    expect(output).toBe(path.join(tempDir, 'download.txt'))
  })

  it('treats existing directory output as destination folder', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fp-cli-'))
    const destination = path.join(tempDir, 'files')
    await fs.promises.mkdir(destination)

    const output = await resolveOutputPath({
      output: destination,
      suggestedFilename: 'a.txt',
      cwd: tempDir,
    })
    expect(output).toBe(path.join(destination, 'a.txt'))
  })
})
