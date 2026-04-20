const { CLIError } = require('./errors')
const { EXIT_CODES, ERROR_CODES } = require('./constants')

function readHiddenPassword(promptText = 'Password: ') {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    const stdout = process.stdout

    if (!stdin.isTTY || !stdout.isTTY) {
      reject(
        new CLIError(
          ERROR_CODES.USAGE,
          'Interactive password input requires a TTY',
          EXIT_CODES.USAGE,
        ),
      )
      return
    }

    let value = ''
    stdout.write(promptText)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    const cleanup = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
    }

    const onData = (char) => {
      switch (char) {
        case '\u0003': // Ctrl+C
          cleanup()
          stdout.write('\n')
          reject(
            new CLIError(
              ERROR_CODES.USAGE,
              'Input cancelled by user',
              EXIT_CODES.USAGE,
            ),
          )
          return
        case '\r':
        case '\n':
        case '\u0004': // Ctrl+D
          cleanup()
          stdout.write('\n')
          resolve(value)
          return
        case '\u007f': // Backspace
          value = value.slice(0, -1)
          return
        default:
          value += char
      }
    }

    stdin.on('data', onData)
  })
}

module.exports = {
  readHiddenPassword,
}
