import { ArrowRight, Network } from 'lucide-react'
import type { Correlation, ReportData } from '../lib/types'
import { getPriorityBadgeClass, getPriorityLabel } from '../lib/utils'
import { Badge, Card, EmptyState, SectionHeading } from './ui'

export function CorrelationsTab({ data }: { data: ReportData }) {
  if (!data.correlations.length) {
    return <EmptyState title="Корреляции не найдены" description="Добавьте массив correlations в отчёт." />
  }

  return (
    <div className="grid gap-5">
      <Card>
        <SectionHeading title="Закономерности информационного поля" eyebrow="Корреляции" />
        <div className="grid gap-4 lg:grid-cols-2">
          {data.correlations.map((correlation) => (
            <CorrelationCard correlation={correlation} key={correlation.title} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading title="Связанные темы" eyebrow="Network-like view" />
        <div className="grid gap-3 md:grid-cols-2">
          {data.correlations.map((correlation) => (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4" key={`network-${correlation.title}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-soft">
                  <Network className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{correlation.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(correlation.relatedTopics ?? []).length ? (
                      correlation.relatedTopics?.map((topic, index) => (
                        <span className="inline-flex items-center gap-2" key={`${correlation.title}-${topic}`}>
                          <Badge className="border-blue-100 bg-blue-50 text-blue-700">{topic}</Badge>
                          {index < (correlation.relatedTopics?.length ?? 0) - 1 ? (
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          ) : null}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Связанные темы не указаны.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CorrelationCard({ correlation }: { correlation: Correlation }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-base font-semibold leading-6 text-slate-950">{correlation.title}</h3>
        <Badge className={getPriorityBadgeClass(correlation.strength)}>
          Сила: {getPriorityLabel(correlation.strength)}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{correlation.description || 'Описание не указано.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {correlation.relatedTopics?.length ? (
          correlation.relatedTopics.map((topic) => (
            <Badge className="border-slate-200 bg-slate-50 text-slate-600" key={`${correlation.title}-${topic}`}>
              {topic}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-400">Связанные темы не указаны</span>
        )}
      </div>
    </article>
  )
}
