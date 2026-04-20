const path = require('path')
const { DEFAULT_BASE_URL } = require('./constants')
const { usageError } = require('./errors')

function usageText() {
  return [
    '用法:',
    '  fp upload <文件路径> [--password <密码>] [--ask-password] [--keep-alive] [--json]',
    '  fp download <分享链接> [--password <密码>] [--ask-password] [--output <路径>] [--json]',
    '',
    '说明:',
    '  - 该 CLI 仅支持 https://file.pizza',
    '  - upload 默认在首个下载完成后自动退出',
    '  - 使用 --keep-alive 可保持上传端运行，直到按 Ctrl+C',
  ].join('\n')
}

function parseFlag(args, index, command) {
  const current = args[index]

  if (current === '--json') {
    return { key: 'json', value: true, consumed: 1 }
  }
  if (current === '--ask-password') {
    return { key: 'askPassword', value: true, consumed: 1 }
  }
  if (current === '--keep-alive') {
    if (command !== 'upload') {
      throw usageError('--keep-alive is only valid for upload')
    }
    return { key: 'keepAlive', value: true, consumed: 1 }
  }
  if (current === '--password') {
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      throw usageError('Missing value for --password')
    }
    return { key: 'password', value, consumed: 2 }
  }
  if (current === '--output') {
    if (command !== 'download') {
      throw usageError('--output is only valid for download')
    }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      throw usageError('Missing value for --output')
    }
    return { key: 'output', value, consumed: 2 }
  }
  throw usageError(`Unknown option: ${current}`)
}

function normalizeShareURL(rawURL) {
  let parsed
  try {
    parsed = new URL(rawURL)
  } catch (error) {
    throw usageError('share_url must be a valid URL')
  }

  const normalizedHost = parsed.hostname.toLowerCase()
  if (parsed.protocol !== 'https:') {
    throw usageError('share_url must use https')
  }

  if (normalizedHost !== 'file.pizza' && normalizedHost !== 'www.file.pizza') {
    throw usageError('share_url must target file.pizza')
  }

  if (!parsed.pathname.startsWith('/download/')) {
    throw usageError('share_url must be a /download/... URL')
  }

  parsed.hash = ''
  return parsed.toString()
}

function parseArgs(argv) {
  const args = [...argv]
  if (!args.length || args[0] === '--help' || args[0] === '-h') {
    return { mode: 'help', usage: usageText() }
  }

  const command = args.shift()
  if (command !== 'upload' && command !== 'download') {
    throw usageError(`Unknown command: ${command}`, usageText())
  }

  const target = args.shift()
  if (!target) {
    throw usageError(
      command === 'upload'
        ? 'upload requires <file_path>'
        : 'download requires <share_url>',
      usageText(),
    )
  }

  const parsed = {
    mode: command,
    target,
    json: false,
    askPassword: false,
    password: '',
    keepAlive: false,
    output: '',
  }

  for (let i = 0; i < args.length; ) {
    const flag = parseFlag(args, i, command)
    parsed[flag.key] = flag.value
    i += flag.consumed
  }

  if (parsed.askPassword && parsed.password) {
    throw usageError('--password and --ask-password cannot be used together')
  }

  if (command === 'upload') {
    parsed.target = path.resolve(parsed.target)
  } else {
    parsed.target = normalizeShareURL(parsed.target)
  }

  parsed.baseURL = DEFAULT_BASE_URL
  return parsed
}

module.exports = {
  parseArgs,
  usageText,
  normalizeShareURL,
}
