import { Lightbulb, ShieldAlert, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ReportData } from '../lib/types'
import { Card, EmptyState } from './ui'

export function SummaryPanel({ data }: { data: ReportData }) {
  const { summary } = data
  const hasSummary = Boolean(summary.mainConclusion || summary.mainRisk || summary.mainOpportunity || summary.shortFindings?.length)

  if (!hasSummary) {
    return <EmptyState title="Краткое резюме не найдено" description="Загрузите JSON с блоком summary, чтобы увидеть выводы." />
  }

  return (
    <Card className="p-6">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="muted-label">Главный вывод</p>
          <p className="mt-3 text-lg leading-8 text-slate-800">
            {summary.mainConclusion || 'Главный вывод не найден.'}
          </p>
        </div>

        <div className="grid gap-3">
          <InsightMiniCard
            icon={<ShieldAlert className="h-5 w-5" />}
            title="Риск"
            text={summary.mainRisk || 'Риск не указан.'}
            tone="risk"
          />
          <InsightMiniCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Возможность"
            text={summary.mainOpportunity || 'Возможность не указана.'}
            tone="opportunity"
          />
        </div>
      </div>

      {summary.shortFindings?.length ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-900">
            <Sparkles className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-semibold">Короткие наблюдения</h2>
          </div>
          <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            {summary.shortFindings.slice(0, 6).map((finding) => (
              <li className="rounded-2xl bg-white p-3 text-slate-700 shadow-soft" key={finding}>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

function InsightMiniCard({
  icon,
  title,
  text,
  tone,
}: {
  icon: ReactNode
  title: string
  text: string
  tone: 'risk' | 'opportunity'
}) {
  const toneClass =
    tone === 'risk'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  )
}
