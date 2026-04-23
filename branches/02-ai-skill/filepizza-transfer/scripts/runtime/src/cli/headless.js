const fs = require('fs')
const path = require('path')
const { CLIError } = require('./errors')
const { EXIT_CODES, ERROR_CODES, TIMEOUTS } = require('./constants')
const { resolveOutputPath } = require('./paths')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function gotoWithRetry(page, url, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoadMs,
      })
      return
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await sleep(750 * attempt)
      }
    }
  }
  throw new CLIError(
    ERROR_CODES.CONNECT_TIMEOUT,
    `Failed to load ${url}`,
    EXIT_CODES.NETWORK,
    String(lastError),
  )
}

function getChromeExecutableCandidates() {
  const candidates = []
  if (process.env.CHROME_PATH) {
    candidates.push(process.env.CHROME_PATH)
  }

  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(
        process.env.LOCALAPPDATA || '',
        'Google\\Chrome\\Application\\chrome.exe',
      ),
    )
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser')
  }

  return candidates.filter(Boolean)
}

async function launchBrowser() {
  const { chromium } = require('playwright')
  const launchAttempts = [{ headless: true }, { headless: true, channel: 'chrome' }, { headless: true, channel: 'msedge' }]

  for (const executablePath of getChromeExecutableCandidates()) {
    try {
      await fs.promises.access(executablePath, fs.constants.F_OK)
      launchAttempts.push({ headless: true, executablePath })
    } catch (error) {
      // Ignore missing executable candidates.
    }
  }

  const errors = []
  for (const launchOptions of launchAttempts) {
    try {
      return await chromium.launch(launchOptions)
    } catch (error) {
      errors.push(`${JSON.stringify(launchOptions)} => ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new CLIError(
    ERROR_CODES.BROWSER_UNAVAILABLE,
    'Unable to launch a browser via Playwright. Install Playwright browsers or set CHROME_PATH.',
    EXIT_CODES.USAGE,
    errors.join('\n'),
  )
}

async function findAlertText(page) {
  const alert = page.locator('[role="alert"]')
  if ((await alert.count()) < 1) {
    return ''
  }
  const firstAlert = alert.first()
  if (!(await firstAlert.isVisible({ timeout: 100 }).catch(() => false))) {
    return ''
  }
  return (await firstAlert.textContent()) || ''
}

function mapAlertToError(alertText) {
  const normalized = alertText.toLowerCase()
  if (!normalized) {
    return null
  }
  if (normalized.includes('invalid password')) {
    return new CLIError(
      ERROR_CODES.PASSWORD_INVALID,
      'Invalid password',
      EXIT_CODES.PASSWORD,
      alertText,
    )
  }
  if (normalized.includes('could not connect to the uploader')) {
    return new CLIError(
      ERROR_CODES.UPLOAD_OFFLINE,
      'Uploader appears offline or unreachable',
      EXIT_CODES.NETWORK,
      alertText,
    )
  }
  return new CLIError(
    ERROR_CODES.DOWNLOAD_FAILED,
    alertText,
    EXIT_CODES.DOWNLOAD,
    alertText,
  )
}

function parseUploadAckLog(text) {
  const match = text.match(/received chunk ack:\s+\S+\s+offset\s+(\d+)\s+bytes\s+(\d+)/)
  if (!match) return null
  return {
    offset: Number(match[1]),
    bytesReceived: Number(match[2]),
  }
}

function parseDownloadChunkLog(text) {
  const match = text.match(/\[Downloader\]\s+received chunk \d+ for .* \((\d+)-(\d+)\)\s+final=(true|false)/)
  if (!match) return null

  const start = Number(match[1])
  const end = Number(match[2])
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null

  return {
    start,
    end,
    bytes: end - start,
  }
}

function parsePercentageText(text) {
  const match = String(text || '').match(/(\d{1,3})%/)
  if (!match) return null
  const value = Number(match[1])
  if (Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, value))
}

function parseByteValue(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed)
}

async function startUploadSession({ baseURL, filePath, password, onProgress }) {
  const browser = await launchBrowser()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await gotoWithRetry(page, `${baseURL}/`)
    await page.waitForSelector('#drop-zone-button', {
      timeout: TIMEOUTS.stateReadyMs,
    })
    await page.waitForTimeout(1200)

    let isStartVisible = false
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.setInputFiles('input[type="file"]', filePath)
      isStartVisible = await page
        .locator('#start-button')
        .isVisible({ timeout: 3500 })
        .catch(() => false)
      if (isStartVisible) {
        break
      }
      await page.waitForTimeout(800)
    }
    if (!isStartVisible) {
      throw new CLIError(
        ERROR_CODES.DOWNLOAD_FAILED,
        'File selection did not open upload confirmation state',
        EXIT_CODES.DOWNLOAD,
      )
    }

    if (password) {
      await page.fill('input[type="password"]', password)
    }

    await page.click('#start-button')
    await page.waitForSelector('#copyable-input-short-url', {
      timeout: TIMEOUTS.shareLinkReadyMs,
    })
    await page.waitForSelector('#copyable-input-long-url', {
      timeout: TIMEOUTS.shareLinkReadyMs,
    })

    const shortURL = await page.inputValue('#copyable-input-short-url')
    const longURL = await page.inputValue('#copyable-input-long-url')

    if (!shortURL || !longURL) {
      throw new CLIError(
        ERROR_CODES.DOWNLOAD_FAILED,
        'Failed to read generated share URL',
        EXIT_CODES.DOWNLOAD,
      )
    }

    const fileSize = (await fs.promises.stat(filePath)).size

    return {
      shortURL,
      longURL,
      async close() {
        await context.close()
        await browser.close()
      },
      waitUntilStopped({ stopOnFirstDownload = false } = {}) {
        return new Promise((resolve) => {
          let done = false
          let domPollTimer = null
          let maxAckedBytes = 0
          let lastProgressPercent = -1

          const onConsole = (msg) => {
            const text = msg.text()
            const uploadAck = parseUploadAckLog(text)
            if (uploadAck && typeof onProgress === 'function' && fileSize > 0) {
              if (uploadAck.offset === 0 && maxAckedBytes >= fileSize) {
                maxAckedBytes = 0
                lastProgressPercent = -1
              }

              maxAckedBytes = Math.max(
                maxAckedBytes,
                uploadAck.offset + uploadAck.bytesReceived,
              )
              const progressPercent = Math.min(
                100,
                Math.round((maxAckedBytes / fileSize) * 100),
              )
              if (progressPercent !== lastProgressPercent) {
                lastProgressPercent = progressPercent
                onProgress({
                  phase: 'upload',
                  percent: progressPercent,
                  bytes: maxAckedBytes,
                  totalBytes: fileSize,
                })
              }
            }

            if (!stopOnFirstDownload) return
            if (text.includes('[UploaderConnections] transfer completed successfully')) {
              finish('completed')
            }
          }

          const onSigInt = () => finish('signal')
          const onSigTerm = () => finish('signal')
          const onPageClose = () => finish('page_closed')
          const onContextClose = () => finish('context_closed')
          const onDisconnected = () => finish('browser_closed')

          const cleanup = () => {
            process.off('SIGINT', onSigInt)
            process.off('SIGTERM', onSigTerm)
            page.off('close', onPageClose)
            context.off('close', onContextClose)
            browser.off('disconnected', onDisconnected)
            page.off('console', onConsole)
            if (domPollTimer) {
              clearInterval(domPollTimer)
              domPollTimer = null
            }
          }

          const finish = async (reason) => {
            if (done) return
            done = true
            cleanup()
            if (
              reason === 'completed' &&
              typeof onProgress === 'function' &&
              fileSize > 0 &&
              lastProgressPercent < 100
            ) {
              onProgress({
                phase: 'upload',
                percent: 100,
                bytes: fileSize,
                totalBytes: fileSize,
              })
            }
            await context.close().catch(() => {})
            await browser.close().catch(() => {})
            resolve(reason)
          }

          process.once('SIGINT', onSigInt)
          process.once('SIGTERM', onSigTerm)
          page.once('close', onPageClose)
          context.once('close', onContextClose)
          browser.once('disconnected', onDisconnected)

          if (stopOnFirstDownload) {
            page.on('console', onConsole)
            domPollTimer = setInterval(async () => {
              if (done) return
              const completedVisible = await page
                .locator('span:has-text("DONE")')
                .first()
                .isVisible({ timeout: 100 })
                .catch(() => false)
              if (completedVisible) {
                finish('completed')
              }
            }, 1000)
          }
        })
      },
    }
  } catch (error) {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    throw error
  }
}

async function waitForDownloaderReadyState(page, providedPassword) {
  const startedAt = Date.now()
  let passwordSubmitted = false

  while (Date.now() - startedAt < TIMEOUTS.stateReadyMs) {
    const notFound = await page
      .locator('text=404: Looks like this slice of FilePizza got eaten!')
      .isVisible({ timeout: 100 })
      .catch(() => false)

    if (notFound) {
      throw new CLIError(
        ERROR_CODES.CONNECT_TIMEOUT,
        'The provided link no longer exists',
        EXIT_CODES.NETWORK,
      )
    }

    const alertText = await findAlertText(page)
    if (alertText) {
      const mapped = mapAlertToError(alertText)
      if (mapped) {
        throw mapped
      }
    }

    const downloadReady = await page
      .locator('#download-button')
      .isVisible({ timeout: 100 })
      .catch(() => false)
    if (downloadReady) {
      return
    }

    const passwordRequired = await page
      .locator('text=This download requires a password.')
      .isVisible({ timeout: 100 })
      .catch(() => false)

    if (passwordRequired && !passwordSubmitted) {
      if (!providedPassword) {
        throw new CLIError(
          ERROR_CODES.PASSWORD_REQUIRED,
          'A password is required for this transfer',
          EXIT_CODES.PASSWORD,
        )
      }

      await page.fill('input[type="password"]', providedPassword)
      await page.click('button:has-text("Unlock")')
      passwordSubmitted = true
      await sleep(400)
      continue
    }

    await sleep(250)
  }

  throw new CLIError(
    ERROR_CODES.CONNECT_TIMEOUT,
    'Timed out waiting for downloader state',
    EXIT_CODES.NETWORK,
  )
}

async function runDownload({
  shareURL,
  password,
  output,
  onProgress,
  cwd = process.cwd(),
}) {
  const browser = await launchBrowser()
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()
  let progressTimer = null
  let lastProgressPercent = -1
  let lastProgressBytes = -1
  let lastProgressTotalBytes = -1
  let observedDownloadedBytes = 0

  const onConsole = (msg) => {
    const chunk = parseDownloadChunkLog(msg.text())
    if (!chunk) return
    observedDownloadedBytes += chunk.bytes
  }

  try {
    page.on('console', onConsole)
    await gotoWithRetry(page, shareURL)
    await waitForDownloaderReadyState(page, password)

    if (typeof onProgress === 'function') {
      progressTimer = setInterval(async () => {
        const snapshot = await page
          .evaluate(() => {
            const el = document.querySelector('#progress-percentage')
            if (!el) return null
            return {
              text: el.textContent || '',
              bytes: el.getAttribute('data-bytes') || '',
              totalBytes: el.getAttribute('data-total-bytes') || '',
            }
          })
          .catch(() => null)

        const percent = parsePercentageText(snapshot?.text || '')
        if (percent === null) return

        const attrBytes = parseByteValue(snapshot?.bytes || '')
        const bytes =
          Number.isFinite(attrBytes) && attrBytes >= 0
            ? attrBytes
            : observedDownloadedBytes > 0
              ? observedDownloadedBytes
              : null
        const totalBytes = parseByteValue(snapshot?.totalBytes || '')
        const hasByteProgress =
          Number.isFinite(bytes) &&
          bytes >= 0
        const hasTotalBytes =
          hasByteProgress &&
          Number.isFinite(totalBytes) &&
          totalBytes > 0

        const percentChanged = percent !== lastProgressPercent
        const bytesChanged = hasByteProgress && bytes !== lastProgressBytes
        if (!percentChanged && !bytesChanged) return

        lastProgressPercent = percent
        if (hasByteProgress) {
          lastProgressBytes = bytes
          if (hasTotalBytes) {
            lastProgressTotalBytes = totalBytes
          }
          onProgress({
            phase: 'download',
            percent,
            bytes,
            ...(hasTotalBytes ? { totalBytes } : {}),
          })
          return
        }

        onProgress({ phase: 'download', percent })
      }, 300)
    }

    const downloadEvent = page.waitForEvent('download', {
      timeout: TIMEOUTS.downloadStartMs,
    })

    await page.click('#download-button')
    const download = await downloadEvent
    const suggestedFilename = download.suggestedFilename()
    const savePath = await resolveOutputPath({
      output,
      suggestedFilename,
      cwd,
    })
    await fs.promises.mkdir(path.dirname(savePath), {
      recursive: true,
    })
    await download.saveAs(savePath)

    const failure = await download.failure()
    if (failure) {
      throw new CLIError(
        ERROR_CODES.DOWNLOAD_FAILED,
        `Download failed: ${failure}`,
        EXIT_CODES.DOWNLOAD,
      )
    }

    const stat = await fs.promises.stat(savePath)

    if (typeof onProgress === 'function' && lastProgressPercent < 100) {
      if (lastProgressTotalBytes > 0) {
        onProgress({
          phase: 'download',
          percent: 100,
          bytes: lastProgressTotalBytes,
          totalBytes: lastProgressTotalBytes,
        })
      } else if (lastProgressBytes >= 0) {
        onProgress({
          phase: 'download',
          percent: 100,
          bytes: lastProgressBytes,
        })
      } else {
        onProgress({ phase: 'download', percent: 100 })
      }
    }

    return {
      savedPath: savePath,
      bytes: stat.size,
    }
  } catch (error) {
    throw error
  } finally {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    page.off('console', onConsole)
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

module.exports = {
  startUploadSession,
  runDownload,
  mapAlertToError,
}
