import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Bot, CalendarDays, Download, Loader2, MessageSquareMore, Radio, Sparkles } from 'lucide-react'
import type { ReportData } from '../lib/types'
import { normalizeReport } from '../lib/parser'
import { downloadFile } from '../lib/export'
import { Button, Card, Input } from './ui'

interface MattermostPanelProps {
  onCollectedRawText: (rawText: string, sourceName: string) => void
  onAnalysisComplete: (data: ReportData, sourceName: string, sourceSize: number) => void
}

interface MattermostStatus {
  configured: boolean
  baseUrl: string
  defaultTeam: string
  defaultChannels: string[]
  maxChannelsPerRequest: number
}

interface CollectionResult {
  rawText: string
  source: {
    totalPosts: number
    teamName?: string
    fromDate: string
    toDate: string
    channels: Array<{ displayName: string; name: string; id: string }>
  }
}

export function MattermostPanel({ onCollectedRawText, onAnalysisComplete }: MattermostPanelProps) {
  const [status, setStatus] = useState<MattermostStatus | null>(null)
  const [statusError, setStatusError] = useState('')
  const [teamName, setTeamName] = useState('')
  const [channels, setChannels] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [includeReplies, setIncludeReplies] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lastCollection, setLastCollection] = useState<CollectionResult | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/mattermost/status')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Локальный сервер МЧат-коннектора не отвечает.')
        }
        return response.json()
      })
      .then((payload: MattermostStatus) => {
        if (cancelled) {
          return
        }
        setStatus(payload)
        setTeamName(payload.defaultTeam || '')
        setChannels(payload.defaultChannels.join(', '))
        setStatusError(payload.configured ? '' : 'MCHAT_API_URL или MCHAT_TOKEN не найдены в .env.')
      })
      .catch(() => {
        if (!cancelled) {
          setStatusError('МЧат-коннектор не запущен. Запустите npm.cmd run dev:full.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const canRun = Boolean(fromDate && toDate && channels.trim() && status?.configured)

  const collectPosts = async () => {
    setIsCollecting(true)
    setError('')
    setMessage('')

    try {
      const payload = await requestMattermost('/api/mattermost/collect')
      setLastCollection(payload)
      onCollectedRawText(payload.rawText, buildSourceName(payload))
      setMessage(`Собрано постов: ${payload.source.totalPosts}. Сырые данные переданы в блок AI-анализа.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось собрать посты из МЧата.')
    } finally {
      setIsCollecting(false)
    }
  }

  const collectAndAnalyze = async () => {
    setIsAnalyzing(true)
    setError('')
    setMessage('')

    try {
      const payload = await requestMattermost('/api/mattermost/analyze')
      const collected = payload.collected as CollectionResult
      const warnings = Array.isArray(payload.warnings) ? payload.warnings : []
      const report = normalizeReport(payload.report, buildSourceName(collected), warnings)
      const size = new Blob([collected.rawText]).size
      setLastCollection(collected)
      onAnalysisComplete(report, `AI-анализ МЧат: ${buildSourceName(collected)}`, size)
      setMessage(`Собрано и проанализировано постов: ${collected.source.totalPosts}. Дашборд обновлён.`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось собрать и проанализировать МЧат.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadLastCollection = () => {
    if (!lastCollection) {
      return
    }
    downloadFile('mattermost-posts.csv', lastCollection.rawText, 'text/csv;charset=utf-8')
  }

  const requestMattermost = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName,
        channels,
        fromDate,
        toDate,
        includeReplies,
        companyName,
      }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.error || 'Mattermost API вернул ошибку.')
    }

    return payload
  }

  return (
    <Card className="p-6">
      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <MessageSquareMore className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="muted-label">МЧат / Mattermost API</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Собрать посты за период</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Бот с правами чтения каналов собирает сообщения через API, превращает их в CSV и может сразу отправить
                на AI-анализ.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <StatusLine
              icon={<Radio className="h-4 w-4" />}
              title="Статус подключения"
              text={
                status?.configured
                  ? `Подключение настроено: ${status.baseUrl || 'Mattermost'}`
                  : statusError || 'Проверяю настройки...'
              }
              warning={!status?.configured}
            />
            <StatusLine
              icon={<Bot className="h-4 w-4" />}
              title="Токен хранится локально"
              text="MCHAT_TOKEN читается только Node-сервером из .env и не передаётся в браузер."
            />
            <StatusLine
              icon={<CalendarDays className="h-4 w-4" />}
              title="Права доступа"
              text="Бот увидит только те команды и каналы, где у него есть read_channel."
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Компания" />
            <Input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name" />
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="Дата начала" />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="Дата окончания" />
          </div>

          <textarea
            className="focus-ring min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
            value={channels}
            onChange={(event) => setChannels(event.target.value)}
            placeholder="Каналы через запятую: town-square, announcements, random_coffee. Можно передавать channel_id."
            aria-label="Каналы Mattermost"
          />

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeReplies}
              onChange={(event) => setIncludeReplies(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Включать ответы в тредах
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={!canRun || isCollecting || isAnalyzing} onClick={collectPosts}>
              {isCollecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Собрать посты
            </Button>
            <Button type="button" disabled={!canRun || isCollecting || isAnalyzing} onClick={collectAndAnalyze}>
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              Собрать и AI-проанализировать
            </Button>
            <Button type="button" variant="ghost" disabled={!lastCollection} onClick={downloadLastCollection}>
              Скачать последнюю выгрузку
            </Button>
          </div>

          {error ? <Notice tone="error" text={error} /> : null}
          {message ? <Notice tone="success" text={message} /> : null}
        </div>
      </div>
    </Card>
  )
}

function StatusLine({
  icon,
  title,
  text,
  warning = false,
}: {
  icon: ReactNode
  title: string
  text: string
  warning?: boolean
}) {
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${warning ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <span className={warning ? 'mt-0.5 text-amber-700' : 'mt-0.5 text-slate-500'}>{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className={`mt-1 text-sm leading-5 ${warning ? 'text-amber-800' : 'text-slate-500'}`}>{text}</p>
      </div>
    </div>
  )
}

function Notice({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  const className =
    tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${className}`}>{text}</div>
}

function buildSourceName(collection: CollectionResult) {
  const from = collection.source.fromDate.slice(0, 10)
  const to = collection.source.toDate.slice(0, 10)
  return `mattermost-${from}-${to}.csv`
}
