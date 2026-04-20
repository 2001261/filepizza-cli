#!/usr/bin/env node
const { runCLI } = require('../src/cli/runner')
const { isCLIError } = require('../src/cli/errors')

async function main() {
  try {
    const exitCode = await runCLI(process.argv.slice(2))
    process.exit(exitCode)
  } catch (error) {
    if (isCLIError(error)) {
      process.stderr.write(`[${error.errorCode}] ${error.message}\n`)
      process.exit(error.exitCode)
      return
    }

    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`[E_DOWNLOAD_FAILED] ${message}\n`)
    process.exit(5)
  }
}

main()
