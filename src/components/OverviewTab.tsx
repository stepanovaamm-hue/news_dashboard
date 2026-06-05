import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReportData } from '../lib/types'
import { chartColors, formatNumber, formatPercent } from '../lib/utils'
import { Card, EmptyState, SectionHeading } from './ui'

export function OverviewTab({ data }: { data: ReportData }) {
  const hasDynamics = data.weeklyDynamics.length > 0
  const hasTone = data.toneDistribution.length > 0
  const hasBalance = data.fieldBalance.length > 0
  const hasEngagement = data.weeklyDynamics.some((item) => item.engagement !== undefined)
  const hasStrategicPosts = data.weeklyDynamics.some((item) => item.strategicPosts !== undefined)

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <SectionHeading title="Баланс информационного поля" eyebrow="Обзор" />
          {hasBalance ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.fieldBalance}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={2}
                  >
                    {data.fieldBalance.map((entry, index) => (
                      <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${formatNumber(Number(value))} постов · ${formatPercent(item.payload.share)}`,
                      item.payload.label,
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Нет данных для графика" description="В отчёте не найден массив fieldBalance." />
          )}
        </Card>

        <Card>
          <SectionHeading title="Динамика по неделям" eyebrow="Активность" />
          {hasDynamics ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyDynamics} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={42} />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="posts" name="Посты" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                  {hasEngagement ? (
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      name="Вовлечённость"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  ) : null}
                  {hasStrategicPosts ? (
                    <Line
                      type="monotone"
                      dataKey="strategicPosts"
                      name="Стратегические посты"
                      stroke="#d97706"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Нет данных по динамике" description="Добавьте weeklyDynamics в отчёт." />
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <SectionHeading title="Тональность" eyebrow="Эмоциональный фон" />
          {hasTone ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.toneDistribution} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="tone" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} width={36} />
                  <Tooltip formatter={(value) => `${formatNumber(Number(value))} постов`} />
                  <Bar dataKey="count" name="Посты" radius={[10, 10, 0, 0]}>
                    {data.toneDistribution.map((entry, index) => (
                      <Cell key={entry.tone} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Нет данных по тональности" description="В отчёте не найден toneDistribution." />
          )}
        </Card>

        <Card>
          <SectionHeading title="Какая картина складывается" eyebrow="Интерпретация" />
          <p className="text-base leading-7 text-slate-700">
            {data.summary.mainConclusion || 'Главный вывод не найден в отчёте.'}
          </p>
          {data.summary.shortFindings?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {data.summary.shortFindings.slice(0, 5).map((finding) => (
                <li className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={finding}>
                  {finding}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState title="Короткие наблюдения не найдены" />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
