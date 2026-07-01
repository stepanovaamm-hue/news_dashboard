import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const syncRootPages = process.argv.includes('--sync-root-pages')
const viteArgs = ['build', ...process.argv.slice(2).filter((arg) => arg !== '--sync-root-pages')]
const viteBin = join('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')
const indexPath = 'index.html'
const originalIndex = readFileSync(indexPath, 'utf8')

const devIndex = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Локальный визуальный дашборд аналитики внутреннего информационного поля и новостей компании."
    />
    <title>Дашборд аналитики новостей</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

try {
  writeFileSync(indexPath, devIndex, 'utf8')
  const result = spawnSync(viteBin, viteArgs, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) {
    console.error(result.error)
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
  } else if (syncRootPages) {
    syncPagesBuildToRoot()
  } else {
    writeFileSync(indexPath, originalIndex, 'utf8')
  }
} finally {
  if (!syncRootPages) {
    writeFileSync(indexPath, originalIndex, 'utf8')
  }
}

function syncPagesBuildToRoot() {
  const distIndex = readFileSync(join('dist', 'index.html'), 'utf8')
  const jsMatch = distIndex.match(/\/news_dashboard\/assets\/([^"]+\.js)/)
  const cssMatch = distIndex.match(/\/news_dashboard\/assets\/([^"]+\.css)/)

  if (!jsMatch || !cssMatch) {
    throw new Error('Could not find built JS/CSS assets in dist/index.html')
  }

  rmSync('assets', { recursive: true, force: true })
  mkdirSync('assets', { recursive: true })

  for (const fileName of readdirSync(join('dist', 'assets'))) {
    copyFileSync(join('dist', 'assets', fileName), join('assets', fileName))
  }

  writeFileSync(indexPath, buildHybridPagesIndex({ jsFile: jsMatch[1], cssFile: cssMatch[1] }), 'utf8')
}

function buildHybridPagesIndex({ jsFile, cssFile }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Локальный визуальный дашборд аналитики внутреннего информационного поля и новостей компании."
    />
    <title>Дашборд аналитики новостей</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      const isGitHubPages = location.hostname.endsWith('github.io')

      if (isGitHubPages) {
        const stylesheet = document.createElement('link')
        stylesheet.rel = 'stylesheet'
        stylesheet.href = '/news_dashboard/assets/${cssFile}'
        document.head.appendChild(stylesheet)

        const pagesBundle = '/news_dashboard/assets/${jsFile}'
        import(/* @vite-ignore */ pagesBundle)
      } else {
        const devEntry = '/src/main.tsx'
        import(/* @vite-ignore */ devEntry)
      }
    </script>
  </body>
</html>
`
}
