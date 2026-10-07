import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const userDataDir = join(tmpdir(), 'chrome_cdp_profile_' + Date.now())
mkdirSync(userDataDir, { recursive: true })

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:5173/'
], {
  detached: false,
  stdio: 'ignore'
})

await new Promise(r => setTimeout(r, 1500))

try {
  const listRes = await fetch('http://127.0.0.1:9222/json/list')
  const listData = await listRes.json()
  console.log('CDP Target List:', listData)
} catch (err) {
  console.error('Error:', err)
} finally {
  chromeProc.kill()
  try {
    rmSync(userDataDir, { recursive: true, force: true })
  } catch {}
}
