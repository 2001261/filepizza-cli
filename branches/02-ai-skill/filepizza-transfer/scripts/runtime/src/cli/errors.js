const { EXIT_CODES, ERROR_CODES } = require('./constants')

class CLIError extends Error {
  constructor(errorCode, message, exitCode, details = undefined) {
    super(message)
    this.name = 'CLIError'
    this.errorCode = errorCode
    this.exitCode = exitCode
    this.details = details
  }
}

function usageError(message, details = undefined) {
  return new CLIError(ERROR_CODES.USAGE, message, EXIT_CODES.USAGE, details)
}

function isCLIError(value) {
  return value instanceof CLIError
}

module.exports = {
  CLIError,
  usageError,
  isCLIError,
}
