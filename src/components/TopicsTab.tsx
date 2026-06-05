import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ExternalLink, Filter, Search } from 'lucide-react'
import type { Importance, ReportData, Topic } from '../lib/types'
import {
  chartColors,
  formatNumber,
  formatPercent,
  getClarityLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
} from '../lib/utils'
import { Badge, Card, EmptyState, Input, SectionHeading, Select } from './ui'

type SortKey = 'count' | 'engagement' | 'share'

export function TopicsTab({ data }: { data: ReportData }) {
  const [search, setSearch] = useState('')
  const [importance, setImportance] = useState<'all' | Importance>('all')
  const [strategicOnly, setStrategicOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('count')

  const filteredTopics = useMemo(() => {
    return data.topics
      .filter((topic) => topic.name.toLowerCase().includes(search.trim().toLowerCase()))
      .filter((topic) => importance === 'all' || topic.importance === importance)
      .filter((topic) => !strategicOnly || topic.strategicLink)
      .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))
  }, [data.topics, importance, search, sortKey, strategicOnly])

  const topByCount = [...data.topics].sort((a, b) => b.count - a.count).slice(0, 10)
  const topByEngagement = [...data.topics].sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0)).slice(0, 10)

  if (!data.topics.length) {
    return <EmptyState title="Нет данных по темам" description="В отчёте не найден массив topics." />
  }

  return (
    <div className="grid gap-5">
      <Card>
        <SectionHeading title="Фильтры тем" eyebrow="Поиск и сортировка" />
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_230px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              className="w-full pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию темы"
              aria-label="Поиск по названию темы"
            />
          </label>
          <Select value={importance} onChange={(event) => setImportance(event.target.value as 'all' | Importance)} aria-label="Фильтр по значимости">
            <option value="all">Любая значимость</option>
            <option value="high">Высокая</option>
            <option value="medium">Средняя</option>
            <option value="low">Низкая</option>
          </Select>
          <Select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} aria-label="Сортировка тем">
            <option value="count">По количеству постов</option>
            <option value="engagement">По вовлечённости</option>
            <option value="share">По доле</option>
          </Select>
          <label className="focus-within:outline-blue-500 flex min-h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={strategicOnly}
              onChange={(event) => setStrategicOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Только со стратегической связью
          </label>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <TopicBarChart title="Top-10 тем по количеству постов" data={topByCount} dataKey="count" />
        <TopicBarChart title="Top-10 тем по вовлечённости" data={topByEngagement} dataKey="engagement" />
      </div>

      <Card>
        <SectionHeading title="Таблица тем" eyebrow={`${filteredTopics.length} из ${data.topics.length}`}>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Фильтры применяются локально
          </div>
        </SectionHeading>

        {filteredTopics.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">Тема</th>
                  <th className="border-b border-slate-200 px-3 py-3">Посты</th>
                  <th className="border-b border-slate-200 px-3 py-3">Доля</th>
                  <th className="border-b border-slate-200 px-3 py-3">Вовлечённость</th>
                  <th className="border-b border-slate-200 px-3 py-3">Значимость</th>
                  <th className="border-b border-slate-200 px-3 py-3">Стратегия</th>
                  <th className="border-b border-slate-200 px-3 py-3">Ясность</th>
                  <th className="border-b border-slate-200 px-3 py-3">Ключевые поводы</th>
                  <th className="border-b border-slate-200 px-3 py-3">Ссылки</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((topic) => (
                  <tr className="align-top text-slate-700 hover:bg-slate-50" key={topic.id ?? topic.name}>
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">{topic.name}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatNumber(topic.count)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatPercent(topic.share)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatNumber(topic.engagement)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <Badge className={getPriorityBadgeClass(topic.importance)}>{getPriorityLabel(topic.importance)}</Badge>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {topic.strategicLink === undefined ? 'Нет данных' : topic.strategicLink ? 'Есть' : 'Нет'}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">{getClarityLabel(topic.clarity)}</td>
                    <td className="max-w-xs border-b border-slate-100 px-3 py-3">
                      {topic.keyReasons?.length ? topic.keyReasons.join(', ') : 'Нет данных'}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <LinksCell topic={topic} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Темы не найдены" description="Измените фильтры или строку поиска." />
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredTopics.map((topic) => (
          <details className="panel-tight group p-4" key={`details-${topic.id ?? topic.name}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{topic.name}</p>
                <p className="mt-1 text-sm text-slate-500">{topic.interpretation || 'Интерпретация не указана.'}</p>
              </div>
              <Badge className={getPriorityBadgeClass(topic.importance)}>{getPriorityLabel(topic.importance)}</Badge>
            </summary>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800">Ключевые поводы</p>
              {topic.keyReasons?.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {topic.keyReasons.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Ключевые поводы не указаны.</p>
              )}
              <div className="mt-3">
                <LinksCell topic={topic} expanded />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function TopicBarChart({
  title,
  data,
  dataKey,
}: {
  title: string
  data: Topic[]
  dataKey: 'count' | 'engagement'
}) {
  return (
    <Card>
      <SectionHeading title={title} />
      {data.length ? (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 18, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={116} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatNumber(Number(value))} />
              <Bar dataKey={dataKey} name={dataKey === 'count' ? 'Посты' : 'Вовлечённость'} radius={[0, 10, 10, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.id ?? entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState title="Нет данных для графика" />
      )}
    </Card>
  )
}

function LinksCell({ topic, expanded = false }: { topic: Topic; expanded?: boolean }) {
  if (!topic.links?.length) {
    return <span className="text-slate-400">Ссылки на посты не указаны</span>
  }

  return (
    <div className={expanded ? 'flex flex-wrap gap-2' : 'space-y-1'}>
      {topic.links.map((link) => (
        <a
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
          href={link.url}
          key={`${link.title}-${link.url}`}
          target="_blank"
          rel="noreferrer"
        >
          {link.title}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
