import { ExternalLink, EyeOff, GitBranch, Volume2, VolumeX } from 'lucide-react'
import type { ImbalanceItem, ReportData } from '../lib/types'
import { Card, EmptyState, SectionHeading } from './ui'

export function ImbalancesTab({ data }: { data: ReportData }) {
  const sections = [
    {
      title: 'Слишком громко',
      icon: Volume2,
      items: data.imbalances.tooLoud ?? [],
      tone: 'blue',
    },
    {
      title: 'Слишком тихо',
      icon: VolumeX,
      items: data.imbalances.tooQuiet ?? [],
      tone: 'amber',
    },
    {
      title: 'Слепые зоны',
      icon: EyeOff,
      items: data.imbalances.blindSpots ?? [],
      tone: 'rose',
    },
    {
      title: 'Разрывы',
      icon: GitBranch,
      items: data.imbalances.gaps ?? [],
      tone: 'emerald',
    },
  ]

  const hasItems = sections.some((section) => section.items.length)

  if (!hasItems) {
    return <EmptyState title="Перекосы не найдены" description="В отчёте нет данных imbalances." />
  }

  return (
    <div className="grid gap-5 xl:grid-cols-4">
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <Card className="p-4" key={section.title}>
            <SectionHeading title={section.title}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${getIconClass(section.tone)}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </SectionHeading>

            {section.items.length ? (
              <div className="space-y-3">
                {section.items.map((item) => (
                  <ImbalanceCard item={item} key={item.title} />
                ))}
              </div>
            ) : (
              <EmptyState title="Нет данных в разделе" />
            )}
          </Card>
        )
      })}
    </div>
  )
}

function ImbalanceCard({ item }: { item: ImbalanceItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold leading-6 text-slate-950">{item.title}</h3>
      <Field label="Наблюдение" value={item.observation} />
      <Field label="Почему важно" value={item.whyItMatters} />
      <Field label="Рекомендация" value={item.recommendation} />
      <div className="mt-4">
        {item.links?.length ? (
          <div className="flex flex-wrap gap-2">
            {item.links.map((link) => (
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
        ) : (
          <p className="text-xs text-slate-400">Ссылки на примеры не указаны</p>
        )}
      </div>
    </article>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{value || 'Нет данных'}</p>
    </div>
  )
}

function getIconClass(tone: string): string {
  if (tone === 'blue') {
    return 'bg-blue-50 text-blue-700'
  }
  if (tone === 'amber') {
    return 'bg-amber-50 text-amber-700'
  }
  if (tone === 'rose') {
    return 'bg-rose-50 text-rose-700'
  }
  return 'bg-emerald-50 text-emerald-700'
}
