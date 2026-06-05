import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportData, Team } from '../lib/types'
import { chartColors, formatNumber, getPriorityBadgeClass, getVisibilityLabel, uniq } from '../lib/utils'
import { Badge, Card, EmptyState, SectionHeading } from './ui'

export function TeamsTab({ data }: { data: ReportData }) {
  const teamsByPosts = [...data.teams].sort((a, b) => b.postCount - a.postCount)
  const matrixTopics = useMemo(
    () => uniq(data.teams.flatMap((team) => team.topics?.map((topic) => topic.topic) ?? [])).slice(0, 12),
    [data.teams],
  )

  if (!data.teams.length) {
    return <EmptyState title="Нет данных по командам" description="В отчёте не найден массив teams." />
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionHeading title="Видимость команд" eyebrow="Количество постов" />
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamsByPosts} layout="vertical" margin={{ top: 8, right: 16, left: 18, bottom: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={118} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${formatNumber(Number(value))} постов`} />
                <Bar dataKey="postCount" name="Посты" radius={[0, 10, 10, 0]}>
                  {teamsByPosts.map((team, index) => (
                    <Cell key={team.id ?? team.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeading title="Таблица команд" eyebrow="Вовлечённость и темы" />
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">Команда</th>
                  <th className="border-b border-slate-200 px-3 py-3">Посты</th>
                  <th className="border-b border-slate-200 px-3 py-3">Вовлечённость</th>
                  <th className="border-b border-slate-200 px-3 py-3">Видимость</th>
                  <th className="border-b border-slate-200 px-3 py-3">Основные темы</th>
                </tr>
              </thead>
              <tbody>
                {teamsByPosts.map((team) => (
                  <tr className="align-top text-slate-700 hover:bg-slate-50" key={team.id ?? team.name}>
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">{team.name}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatNumber(team.postCount)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">{formatNumber(team.engagement)}</td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <Badge className={getVisibilityBadgeClass(team.visibility)}>{getVisibilityLabel(team.visibility)}</Badge>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {team.mainTopics?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {team.mainTopics.map((topic) => (
                            <Badge className="border-slate-200 bg-slate-50 text-slate-600" key={`${team.name}-${topic}`}>
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Нет данных</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading title="Матрица команда × тема" eyebrow="Heatmap" />
        {matrixTopics.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-separate border-spacing-1 text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 rounded-xl bg-white px-3 py-2 text-slate-500">Команда</th>
                  {matrixTopics.map((topic) => (
                    <th className="max-w-28 px-2 py-2 text-slate-500" key={topic}>
                      {topic}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamsByPosts.map((team) => (
                  <tr key={`matrix-${team.id ?? team.name}`}>
                    <td className="sticky left-0 z-10 rounded-xl bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm">
                      {team.name}
                    </td>
                    {matrixTopics.map((topic) => {
                      const count = getTeamTopicCount(team, topic)
                      return (
                        <td className={`rounded-xl px-2 py-3 text-center font-semibold ${getHeatmapClass(count)}`} key={`${team.name}-${topic}`}>
                          {count || ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Нет данных для матрицы" description="Добавьте teams[].topics в отчёт." />
        )}
      </Card>

      <Card>
        <SectionHeading title="Недопредставленные команды" eyebrow="Зоны для усиления" />
        {data.underrepresentedTeams.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.underrepresentedTeams.map((team) => (
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4" key={team.team}>
                <p className="text-base font-semibold text-slate-950">{team.team}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{team.reason || 'Причина не указана.'}</p>
                <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700">
                  {team.recommendation || 'Рекомендация не указана.'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="В отчёте нет недопредставленных команд" />
        )}
      </Card>
    </div>
  )
}

function getTeamTopicCount(team: Team, topic: string): number {
  return team.topics?.find((item) => item.topic === topic)?.count ?? 0
}

function getHeatmapClass(count: number): string {
  if (count >= 6) {
    return 'bg-blue-600 text-white'
  }
  if (count >= 3) {
    return 'bg-blue-200 text-blue-950'
  }
  if (count >= 1) {
    return 'bg-blue-50 text-blue-700'
  }
  return 'bg-slate-50 text-slate-300'
}

function getVisibilityBadgeClass(visibility?: string): string {
  if (visibility === 'high') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (visibility === 'medium') {
    return getPriorityBadgeClass('medium')
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}
