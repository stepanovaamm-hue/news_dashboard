import { useMemo, useState } from 'react'
import { CheckCircle2, Filter, UserRound } from 'lucide-react'
import type { Importance, Recommendation, ReportData } from '../lib/types'
import { getPriorityBadgeClass, getPriorityLabel, uniq } from '../lib/utils'
import { Badge, Card, EmptyState, SectionHeading, Select } from './ui'

export function RecommendationsTab({ data }: { data: ReportData }) {
  const [priority, setPriority] = useState<'all' | Importance>('all')
  const [complexity, setComplexity] = useState<'all' | Importance>('all')
  const [topic, setTopic] = useState('all')

  const topics = useMemo(() => uniq(data.recommendations.map((item) => item.topic ?? '').filter(Boolean)), [data.recommendations])
  const topPriority = data.recommendations.filter((item) => item.priority === 'high').slice(0, 3)

  const filtered = useMemo(() => {
    return data.recommendations
      .filter((item) => priority === 'all' || item.priority === priority)
      .filter((item) => complexity === 'all' || item.complexity === complexity)
      .filter((item) => topic === 'all' || item.topic === topic)
  }, [complexity, data.recommendations, priority, topic])

  if (!data.recommendations.length) {
    return <EmptyState title="В отчёте нет рекомендаций" description="Добавьте массив recommendations в JSON." />
  }

  return (
    <div className="grid gap-5">
      <Card>
        <SectionHeading title="Что улучшить в первую очередь" eyebrow="Высокий приоритет" />
        {topPriority.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {topPriority.map((recommendation) => (
              <article className="rounded-3xl border border-rose-100 bg-rose-50 p-4" key={`top-${recommendation.title}`}>
                <Badge className="border-rose-200 bg-white text-rose-700">Высокий приоритет</Badge>
                <p className="mt-3 font-semibold leading-6 text-slate-950">{recommendation.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{recommendation.action || recommendation.problem || 'Действие не указано.'}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Нет рекомендаций с высоким приоритетом" />
        )}
      </Card>

      <Card>
        <SectionHeading title="Фильтры рекомендаций" eyebrow="Приоритет, сложность, тема">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" aria-hidden="true" />
            {filtered.length} из {data.recommendations.length}
          </div>
        </SectionHeading>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={priority} onChange={(event) => setPriority(event.target.value as 'all' | Importance)} aria-label="Фильтр по приоритету">
            <option value="all">Любой приоритет</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </Select>
          <Select value={complexity} onChange={(event) => setComplexity(event.target.value as 'all' | Importance)} aria-label="Фильтр по сложности">
            <option value="all">Любая сложность</option>
            <option value="high">Высокая</option>
            <option value="medium">Средняя</option>
            <option value="low">Низкая</option>
          </Select>
          <Select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Фильтр по теме">
            <option value="all">Любая тема</option>
            {topics.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((recommendation) => (
            <RecommendationCard recommendation={recommendation} key={recommendation.title} />
          ))}
        </div>
      ) : (
        <EmptyState title="Рекомендации не найдены" description="Измените фильтры." />
      )}
    </div>
  )
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <article className="panel-tight p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-7 text-slate-950">{recommendation.title}</h3>
          {recommendation.topic ? <p className="mt-1 text-sm text-slate-500">{recommendation.topic}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={getPriorityBadgeClass(recommendation.priority)}>
            Приоритет: {getPriorityLabel(recommendation.priority)}
          </Badge>
          <Badge className={getPriorityBadgeClass(recommendation.complexity)}>
            Сложность: {getPriorityLabel(recommendation.complexity)}
          </Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <RecommendationField label="Проблема" value={recommendation.problem} />
        <RecommendationField label="Что сделать" value={recommendation.action} icon />
        <RecommendationField label="Ожидаемый эффект" value={recommendation.expectedEffect} />
      </div>

      {recommendation.owner ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <UserRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {recommendation.owner}
        </div>
      ) : null}
    </article>
  )
}

function RecommendationField({ label, value, icon = false }: { label: string; value?: string; icon?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        {icon ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : null}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value || 'Нет данных'}</p>
    </div>
  )
}
