const { parseArgs, usageText } = require('./args')
const { ensureReadableFile } = require('./paths')
const { readHiddenPassword } = require('./password')
const { startUploadSession, runDownload } = require('./headless')
const { CLIError, isCLIError } = require('./errors')
const { EXIT_CODES, ERROR_CODES } = require('./constants')

function printJSON(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}

function printHumanUpload(result, keepAlive, hasPassword) {
  process.stdout.write(`短链接: ${result.shortURL}\n`)
  process.stdout.write(`长链接: ${result.longURL}\n`)
  process.stdout.write('状态: 传输中\n')
  process.stdout.write('请把链接发给接收方。不同设备的下载方式如下:\n')
  process.stdout.write(
    `1) 手机/平板（不支持 Node/CLI）: 直接用浏览器打开短链接\n   ${result.shortURL}\n`,
  )
  process.stdout.write(
    `2) 电脑（仅浏览器）: 直接用浏览器打开短链接\n   ${result.shortURL}\n`,
  )
  if (hasPassword) {
    process.stdout.write(
      `3) 电脑/服务器（支持 Node + CLI）: 使用命令行下载（会提示输入密码）\n   fp download "${result.shortURL}" --ask-password\n`,
    )
  } else {
    process.stdout.write(
      `3) 电脑/服务器（支持 Node + CLI）: 使用命令行下载\n   fp download "${result.shortURL}"\n`,
    )
  }
  process.stdout.write('提示: 如果接收设备无法运行 Node 或 CLI，请统一使用浏览器下载。\n')
  if (keepAlive) {
    process.stdout.write('模式: keep-alive（按 Ctrl+C 停止）\n')
  } else {
    process.stdout.write(
      '模式: once（首个下载完成后上传端自动退出）\n',
    )
  }
}

function printHumanDownload(result) {
  process.stdout.write(`已保存到: ${result.savedPath}\n`)
  process.stdout.write(`文件大小: ${result.bytes} 字节\n`)
  process.stdout.write('状态: 完成\n')
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function createProgressPrinter(label) {
  let lastPercent = -1
  let hasTTYLine = false

  const printLine = (line) => {
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${line.padEnd(90, ' ')}`)
      hasTTYLine = true
    } else {
      process.stdout.write(`${line}\n`)
    }
  }

  return {
    onProgress(event) {
      const percent = Number(event?.percent)
      if (!Number.isFinite(percent)) return
      if (percent === lastPercent) return
      lastPercent = percent

      let line = `${label}: ${percent}%`
      if (
        Number.isFinite(event?.bytes) &&
        Number.isFinite(event?.totalBytes) &&
        event.totalBytes > 0
      ) {
        line += ` (${formatBytes(event.bytes)} / ${formatBytes(event.totalBytes)})`
      }

      printLine(line)
      if (process.stdout.isTTY && percent >= 100) {
        process.stdout.write('\n')
        hasTTYLine = false
      }
    },
    finish() {
      if (process.stdout.isTTY && hasTTYLine) {
        process.stdout.write('\n')
        hasTTYLine = false
      }
    },
  }
}

async function resolvePassword({ password, askPassword }) {
  if (password) return password
  if (askPassword) return readHiddenPassword('Password: ')
  return ''
}

function normalizeError(error) {
  if (isCLIError(error)) {
    return error
  }

  return new CLIError(
    ERROR_CODES.DOWNLOAD_FAILED,
    error instanceof Error ? error.message : String(error),
    EXIT_CODES.DOWNLOAD,
  )
}

async function runCLI(argv) {
  let parsed
  try {
    parsed = parseArgs(argv)
  } catch (error) {
    const cliError = normalizeError(error)
    if (cliError.errorCode === ERROR_CODES.USAGE && cliError.details) {
      process.stderr.write(`${cliError.details}\n`)
    }
    throw cliError
  }

  if (parsed.mode === 'help') {
    process.stdout.write(`${usageText()}\n`)
    return EXIT_CODES.OK
  }

  if (parsed.mode === 'upload') {
    await ensureReadableFile(parsed.target)
    const password = await resolvePassword(parsed)
    const progressPrinter = parsed.json
      ? null
      : createProgressPrinter('上传进度')

    const session = await startUploadSession({
      baseURL: parsed.baseURL,
      filePath: parsed.target,
      password,
      onProgress: progressPrinter ? progressPrinter.onProgress : undefined,
    })

    if (parsed.json) {
      printJSON({
        short_url: session.shortURL,
        long_url: session.longURL,
        status: 'serving',
      })
    } else {
      printHumanUpload(session, parsed.keepAlive, Boolean(password))
    }

    const reason = await session.waitUntilStopped({
      stopOnFirstDownload: !parsed.keepAlive,
    })
    if (progressPrinter) {
      progressPrinter.finish()
    }

    if (reason === 'completed') {
      if (parsed.json) {
        printJSON({
          status: 'completed',
          event: 'download_finished',
        })
      } else {
        process.stdout.write('状态: 已完成（首个下载已完成）\n')
      }
    }

    return EXIT_CODES.OK
  }

  const password = await resolvePassword(parsed)
  const progressPrinter = parsed.json
    ? null
    : createProgressPrinter('下载进度')
  const result = await runDownload({
    shareURL: parsed.target,
    password,
    output: parsed.output,
    onProgress: progressPrinter ? progressPrinter.onProgress : undefined,
  })
  if (progressPrinter) {
    progressPrinter.finish()
  }

  if (parsed.json) {
    printJSON({
      saved_path: result.savedPath,
      bytes: result.bytes,
      status: 'done',
    })
  } else {
    printHumanDownload(result)
  }

  return EXIT_CODES.OK
}

module.exports = {
  runCLI,
}
