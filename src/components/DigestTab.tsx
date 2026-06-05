import { useState } from 'react'
import { Clipboard, Download, ExternalLink } from 'lucide-react'
import type { Digest, ReportData } from '../lib/types'
import { buildDigestMarkdown, copyToClipboard, downloadFile } from '../lib/export'
import { Button, Card, EmptyState, SectionHeading } from './ui'

export function DigestTab({ data }: { data: ReportData }) {
  const [message, setMessage] = useState('')
  const digest = data.digest
  const hasDigest = Boolean(digest.title || digest.intro || digest.sections?.length)

  const handleCopy = async () => {
    await copyToClipboard(buildDigestMarkdown(digest))
    setMessage('Дайджест скопирован в буфер обмена.')
  }

  const handleDownload = () => {
    downloadFile('weekly-digest.md', buildDigestMarkdown(digest), 'text/markdown;charset=utf-8')
    setMessage('Markdown-файл сформирован.')
  }

  if (!hasDigest) {
    return <EmptyState title="Дайджест не найден" description="Добавьте блок digest в отчёт." />
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="muted-label">Готовый текст для сотрудников</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{digest.title || 'Дайджест компании'}</h2>
            {digest.intro ? <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">{digest.intro}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleCopy}>
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              Скопировать дайджест
            </Button>
            <Button type="button" onClick={handleDownload}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Экспортировать в Markdown
            </Button>
          </div>
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </Card>

      <DigestContent digest={digest} />
    </div>
  )
}

function DigestContent({ digest }: { digest: Digest }) {
  if (!digest.sections?.length) {
    return <EmptyState title="В дайджесте нет секций" />
  }

  return (
    <div className="grid gap-5">
      {digest.sections.map((section) => (
        <Card key={section.title}>
          <SectionHeading title={section.title} />
          {section.items.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {section.items.map((item) => (
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4" key={`${section.title}-${item.title}`}>
                  <h3 className="text-base font-semibold leading-6 text-slate-950">{item.title}</h3>
                  {item.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                  {item.whyImportant ? (
                    <div className="mt-3 rounded-2xl bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Почему важно</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{item.whyImportant}</p>
                    </div>
                  ) : null}
                  {item.link ? (
                    <a
                      className="mt-4 inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть пост
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">Ссылка на пост не указана</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Нет новостей в секции" />
          )}
        </Card>
      ))}
    </div>
  )
}
