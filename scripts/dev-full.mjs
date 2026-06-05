import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const children = [
  spawn(process.execPath, ['server/analyze-server.mjs'], {
    stdio: 'inherit',
    shell: false,
  }),
  spawn(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', process.env.VITE_PORT || '5174'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
]

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren()
    process.exit(0)
  })
}

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stopChildren()
      process.exit(code)
    }
  })
}
