/**
 * Capture Web UI screenshots for IP filing appendix.
 * Usage: node scripts/capture-filing-screens.mjs [baseUrl]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'docs', 'screenshots')
const chrome =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const base = process.argv[2] || 'http://127.0.0.1:5173'

const screens = [
  ['01_auth', 'auth'],
  ['02_home', 'home'],
  ['03_worlds', 'worlds'],
  ['04_world', 'world'],
  ['05_create_card', 'create'],
  ['06_create_world', 'createWorld'],
  ['07_ranked', 'ranked'],
  ['08_battle', 'battle'],
  ['09_collection', 'collection'],
  ['10_profile', 'profile'],
]

mkdirSync(outDir, { recursive: true })

function runChrome(url, outFile) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=430,900`,
      `--screenshot=${outFile}`,
      url,
    ]
    const child = spawn(chrome, args, { stdio: 'ignore' })
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`timeout capturing ${url}`))
    }, 45000)
    child.on('exit', (code) => {
      clearTimeout(timer)
      if (code === 0 && existsSync(outFile)) resolve()
      else reject(new Error(`chrome exit ${code} for ${url}`))
    })
  })
}

async function main() {
  if (!existsSync(chrome)) {
    throw new Error(`Chrome not found: ${chrome}`)
  }
  for (const [file, screen] of screens) {
    const url = `${base}/?filing=1&screen=${encodeURIComponent(screen)}`
    const out = join(outDir, `${file}.png`)
    process.stdout.write(`capture ${screen} -> ${out}\n`)
    await runChrome(url, out)
  }
  process.stdout.write(`done: ${screens.length} screens in ${outDir}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
