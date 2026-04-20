// @vitest-environment node
import { describe, it, expect } from 'vitest'

const { parseArgs, normalizeShareURL } = require('../../src/cli/args')
const { CLIError } = require('../../src/cli/errors')

describe('cli args', () => {
  it('parses upload command with absolute file path', () => {
    const parsed = parseArgs(['upload', './README.md'])
    expect(parsed.mode).toBe('upload')
    expect(parsed.target).toMatch(/[\\/]README\.md$/)
    expect(parsed.baseURL).toBe('https://file.pizza')
    expect(parsed.keepAlive).toBe(false)
  })

  it('parses upload keep-alive flag', () => {
    const parsed = parseArgs(['upload', './README.md', '--keep-alive'])
    expect(parsed.mode).toBe('upload')
    expect(parsed.keepAlive).toBe(true)
  })

  it('parses download with output path and json flag', () => {
    const parsed = parseArgs([
      'download',
      'https://file.pizza/download/abc123',
      '--output',
      './out.txt',
      '--json',
    ])
    expect(parsed.mode).toBe('download')
    expect(parsed.output).toBe('./out.txt')
    expect(parsed.json).toBe(true)
  })

  it('rejects password and ask-password together', () => {
    expect(() =>
      parseArgs([
        'download',
        'https://file.pizza/download/abc123',
        '--password',
        'x',
        '--ask-password',
      ]),
    ).toThrow(CLIError)
  })

  it('rejects non-file.pizza hosts', () => {
    expect(() => normalizeShareURL('https://example.com/download/abc')).toThrow(
      CLIError,
    )
  })

  it('rejects keep-alive flag for download', () => {
    expect(() =>
      parseArgs([
        'download',
        'https://file.pizza/download/abc123',
        '--keep-alive',
      ]),
    ).toThrow(CLIError)
  })
})
