const fs = require('fs')
const path = require('path')
const { CLIError } = require('./errors')
const { EXIT_CODES, ERROR_CODES } = require('./constants')

async function ensureReadableFile(filePath) {
  let stat
  try {
    stat = await fs.promises.stat(filePath)
  } catch (error) {
    throw new CLIError(
      ERROR_CODES.USAGE,
      `File not found: ${filePath}`,
      EXIT_CODES.USAGE,
    )
  }

  if (!stat.isFile()) {
    throw new CLIError(
      ERROR_CODES.USAGE,
      `Not a file: ${filePath}`,
      EXIT_CODES.USAGE,
    )
  }
}

async function exists(targetPath) {
  try {
    await fs.promises.access(targetPath, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

async function ensureUniquePath(targetPath) {
  if (!(await exists(targetPath))) {
    return targetPath
  }

  const ext = path.extname(targetPath)
  const base = targetPath.slice(0, targetPath.length - ext.length)

  for (let index = 1; index < 10_000; index += 1) {
    const candidate = `${base} (${index})${ext}`
    if (!(await exists(candidate))) {
      return candidate
    }
  }

  throw new CLIError(
    ERROR_CODES.DOWNLOAD_FAILED,
    `Failed to find non-conflicting output path for ${targetPath}`,
    EXIT_CODES.DOWNLOAD,
  )
}

function looksLikeDirectoryPath(outputPath) {
  return outputPath.endsWith(path.sep) || outputPath.endsWith('/')
}

async function resolveOutputPath({
  output,
  suggestedFilename,
  cwd = process.cwd(),
}) {
  let basePath
  if (!output) {
    basePath = path.join(cwd, suggestedFilename)
    return ensureUniquePath(basePath)
  }

  const resolvedOutput = path.resolve(output)
  let stat = null
  try {
    stat = await fs.promises.stat(resolvedOutput)
  } catch (error) {
    stat = null
  }

  if (stat && stat.isDirectory()) {
    basePath = path.join(resolvedOutput, suggestedFilename)
    return ensureUniquePath(basePath)
  }

  if (!stat && looksLikeDirectoryPath(output)) {
    await fs.promises.mkdir(resolvedOutput, { recursive: true })
    basePath = path.join(resolvedOutput, suggestedFilename)
    return ensureUniquePath(basePath)
  }

  const directory = path.dirname(resolvedOutput)
  await fs.promises.mkdir(directory, { recursive: true })
  return ensureUniquePath(resolvedOutput)
}

module.exports = {
  ensureReadableFile,
  ensureUniquePath,
  resolveOutputPath,
}
