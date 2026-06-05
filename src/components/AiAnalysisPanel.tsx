import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Bot, FileText, Loader2, ShieldAlert, Sparkles, UploadCloud } from 'lucide-react'
import type { ReportData } from '../lib/types'
import { normalizeReport } from '../lib/parser'
import { readableFileSize } from '../lib/utils'
import { Button, Card, Input } from './ui'

interface AiAnalysisPanelProps {
  onAnalysisComplete: (data: ReportData, sourceName: string, sourceSize: number) => void
}

interface AiStatus {
  configured: boolean
  model: string
  maxRawTextChars: number
}

export function AiAnalysisPanel({ onAnalysisComplete }: AiAnalysisPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rawText, setRawText] = useState('')
  const [sourceName, setSourceName] = useState('ручной ввод')
  const [companyName, setCompanyName] = useState('')
  const [period, setPeriod] = useState('')
  const [sourceDescription, setSourceDescription] = useState('Посты из корпоративного мессенджера')
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [statusError, setStatusError] = useState('')
  const [analysisError, setAnalysisError] = useState('')
  const [message, setMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/api/ai-status')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Локальный AI-сервер не отвечает.')
        }
        return response.json()
      })
      .then((payload: AiStatus) => {
        if (!cancelled) {
          setAiStatus(payload)
          setStatusError(payload.configured ? '' : 'OPENAI_API_KEY не найден в .env.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatusError('AI-сервер не запущен. Запустите npm.cmd run dev:full или отдельно npm.cmd run dev:ai.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const rawSize = useMemo(() => new Blob([rawText]).size, [rawText])
  const isTooLarge = Boolean(aiStatus?.maxRawTextChars && rawText.length > aiStatus.maxRawTextChars)
  const canAnalyze = rawText.trim().length >= 20 && !isAnalyzing && !isTooLarge && Boolean(aiStatus?.configured)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAnalysisError('Файл слишком большой для одного AI-запроса. Сократите период или выгрузку.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setRawText(String(reader.result ?? ''))
      setSourceName(file.name)
      setAnalysisError('')
      setMessage(`Загружено: ${file.name} · ${readableFileSize(file.size)}`)
    }
    reader.onerror = () => setAnalysisError('Не удалось прочитать файл с сырыми постами.')
    reader.readAsText(file)
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisError('')
    setMessage('')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: sourceName,
          rawText,
          companyName,
          period,
          sourceDescription,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Не удалось выполнить AI-анализ.')
      }

      const warnings = Array.isArray(payload?.warnings) ? payload.warnings : []
      const normalized = normalizeReport(payload.report, sourceName, warnings)
      onAnalysisComplete(normalized, `AI-анализ: ${sourceName}`, rawSize)
      setMessage('AI-анализ готов. Дашборд обновлён полученным dashboard_json.')
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Не удалось выполнить AI-анализ.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="muted-label">AI-анализ сырых постов</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Превратить выгрузку постов в dashboard_json</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Вставьте CSV, JSON или текст с постами. Локальный сервер отправит данные в AI-модель и вернёт структуру,
                которую дашборд сразу отобразит.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <InfoLine
              title="Ключ не попадает в браузер"
              text="OPENAI_API_KEY хранится только в локальном Node-сервере."
            />
            <InfoLine
              title="Данные уходят в выбранный AI API"
              text="Если используете OpenAI, сырые посты отправляются в OpenAI для анализа."
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Статус AI</p>
              <p className="mt-1 text-sm text-slate-600">
                {aiStatus ? `Модель: ${aiStatus.model}` : 'Проверяю локальный сервер...'}
              </p>
              {statusError ? <p className="mt-2 text-sm font-medium text-amber-700">{statusError}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Компания"
              aria-label="Компания для AI-анализа"
            />
            <Input
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="Период анализа"
              aria-label="Период анализа"
            />
            <Input
              value={sourceDescription}
              onChange={(event) => setSourceDescription(event.target.value)}
              placeholder="Источник данных"
              aria-label="Источник данных"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <textarea
              className="focus-ring min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
              value={rawText}
              onChange={(event) => {
                setRawText(event.target.value)
                setSourceName('ручной ввод')
              }}
              placeholder="Вставьте сырые посты: CSV с колонками date, channel, author, team, text, reactions, comments, url; JSON-массив постов; или обычный текст/Markdown."
              aria-label="Сырые посты для AI-анализа"
            />

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-xs text-slate-500">
                Источник: <span className="font-semibold text-slate-700">{sourceName}</span> · {rawText.length} символов ·{' '}
                {readableFileSize(rawSize)}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept=".json,.csv,.txt,.md,.markdown,text/plain,text/csv,application/json"
                  onChange={handleFile}
                  aria-label="Загрузить сырые посты для AI-анализа"
                />
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  Загрузить сырые посты
                </Button>
                <Button type="button" disabled={!canAnalyze} onClick={runAnalysis}>
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  Запустить AI-анализ
                </Button>
              </div>
            </div>
          </div>

          {isTooLarge ? (
            <Notice
              tone="warning"
              text={`Слишком много текста для одного запроса: максимум ${aiStatus?.maxRawTextChars} символов.`}
            />
          ) : null}
          {analysisError ? <Notice tone="error" text={analysisError} /> : null}
          {message ? <Notice tone="success" text={message} /> : null}
        </div>
      </div>
    </Card>
  )
}

function InfoLine({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  )
}

function Notice({ tone, text }: { tone: 'success' | 'warning' | 'error'; text: string }) {
  const className =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-rose-200 bg-rose-50 text-rose-700'

  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${className}`}>
      <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}
