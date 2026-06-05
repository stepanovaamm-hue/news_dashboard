import { Clipboard, Download, FileJson, FileSpreadsheet, TextQuote } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { ReportData } from '../lib/types'
import {
  buildDigestMarkdown,
  buildSummaryMarkdown,
  buildTopicsCsv,
  copyToClipboard,
  dashboardJsonPrompt,
  downloadFile,
  stripInternalFields,
} from '../lib/export'
import { Card, EmptyState, SectionHeading } from './ui'

export function ExportPanel({ data }: { data: ReportData }) {
  const [message, setMessage] = useState('')

  const exportJson = () => {
    downloadFile(
      'information-field-dashboard.json',
      JSON.stringify(stripInternalFields(data), null, 2),
      'application/json;charset=utf-8',
    )
    setMessage('JSON с текущими данными скачан.')
  }

  const exportDigest = () => {
    downloadFile('weekly-digest.md', buildDigestMarkdown(data.digest), 'text/markdown;charset=utf-8')
    setMessage('Дайджест скачан в Markdown.')
  }

  const copyDigest = async () => {
    await copyToClipboard(buildDigestMarkdown(data.digest))
    setMessage('Дайджест скопирован.')
  }

  const copySummary = async () => {
    await copyToClipboard(buildSummaryMarkdown(data))
    setMessage('Краткое резюме скопировано.')
  }

  const exportTopics = () => {
    downloadFile('topics.csv', buildTopicsCsv(data.topics), 'text/csv;charset=utf-8')
    setMessage('CSV по темам скачан.')
  }

  const copyPrompt = async () => {
    await copyToClipboard(dashboardJsonPrompt)
    setMessage('Промпт для агента аналитики скопирован.')
  }

  return (
    <div className="grid gap-5">
      <Card>
        <SectionHeading title="Экспорт" eyebrow="Локально, без отправки данных" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ExportAction
            title="Экспорт текущих данных в JSON"
            description="Скачать файл information-field-dashboard.json"
            icon={<FileJson className="h-5 w-5" />}
            onClick={exportJson}
          />
          <ExportAction
            title="Экспорт дайджеста в Markdown"
            description="Скачать файл weekly-digest.md"
            icon={<Download className="h-5 w-5" />}
            onClick={exportDigest}
          />
          <ExportAction
            title="Скопировать дайджест"
            description="Markdown-текст в буфер обмена"
            icon={<Clipboard className="h-5 w-5" />}
            onClick={copyDigest}
          />
          <ExportAction
            title="Скопировать краткое резюме"
            description="Главный вывод, риск, возможность и наблюдения"
            icon={<TextQuote className="h-5 w-5" />}
            onClick={copySummary}
          />
          <ExportAction
            title="Скачать CSV по темам"
            description="Тема, посты, доля, вовлечённость и связь со стратегией"
            icon={<FileSpreadsheet className="h-5 w-5" />}
            onClick={exportTopics}
          />
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </Card>

      <Card>
        <SectionHeading title="Предпросмотр краткого резюме" />
        {data.summary.mainConclusion ? (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
            {buildSummaryMarkdown(data)}
          </pre>
        ) : (
          <EmptyState title="Нет данных для резюме" />
        )}
      </Card>

      <Card>
        <SectionHeading title="Промпт для агента аналитики" eyebrow="dashboard_json">
          <ButtonLike onClick={copyPrompt} />
        </SectionHeading>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          {dashboardJsonPrompt}
        </pre>
      </Card>
    </div>
  )
}

function ButtonLike({ onClick }: { onClick: () => void | Promise<void> }) {
  return (
    <button
      className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      type="button"
      onClick={onClick}
    >
      <Clipboard className="h-4 w-4" aria-hidden="true" />
      Скопировать промпт
    </button>
  )
}

function ExportAction({
  title,
  description,
  icon,
  onClick,
}: {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void | Promise<void>
}) {
  return (
    <button
      className="focus-ring flex min-h-32 flex-col items-start justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
      type="button"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-soft">{icon}</span>
      <span>
        <span className="block font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
      </span>
    </button>
  )
}
