import { BarChart3, FileText, Gauge, Hash, Radio, Users } from 'lucide-react'
import type { ReportData } from '../lib/types'
import { clampPercent, formatNumber, formatPercent, getIndexBarClass, getIndexLevel } from '../lib/utils'

export function KpiCards({ data }: { data: ReportData }) {
  const kpis = data.kpis
  const summary = data.summary
  const cards = [
    { label: 'Всего постов', value: formatNumber(kpis.totalPosts), icon: FileText },
    { label: 'Каналов', value: formatNumber(kpis.channels), icon: Radio },
    { label: 'Авторов', value: formatNumber(kpis.authors), icon: Users },
    { label: 'Тем', value: formatNumber(kpis.topics), icon: Hash },
    { label: 'Средняя вовлечённость', value: formatNumber(kpis.avgEngagement), icon: BarChart3 },
  ]

  const indexes = [
    { label: 'Индекс стратегичности', value: summary.strategicIndex },
    { label: 'Индекс полезности', value: summary.usefulnessIndex },
    { label: 'Индекс ясности', value: summary.clarityIndex },
  ]

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article className="panel-tight p-5" key={card.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
          </article>
        )
      })}

      {indexes.map((index) => (
        <article className="panel-tight p-5" key={index.label}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{index.label}</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-semibold text-slate-950">{formatPercent(index.value)}</p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {getIndexLevel(index.value) === 'high'
                ? 'высокий'
                : getIndexLevel(index.value) === 'medium'
                  ? 'средний'
                  : 'низкий'}
            </span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${getIndexBarClass(index.value)}`}
              style={{ width: `${clampPercent(index.value)}%` }}
            />
          </div>
        </article>
      ))}
    </section>
  )
}
