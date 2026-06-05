import { CalendarDays, Database, RotateCcw, Upload, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DataStatus, ReportData, UploadedFileInfo } from '../lib/types'
import { Button, Badge } from './ui'

interface DashboardHeaderProps {
  data: ReportData
  status: DataStatus
  fileInfo?: UploadedFileInfo
  onUploadClick: () => void
  onReset: () => void
}

export function DashboardHeader({ data, status, fileInfo, onUploadClick, onReset }: DashboardHeaderProps) {
  const meta = data.meta

  return (
    <header className="panel p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className={getStatusBadgeClass(status)}>
              {status === 'uploaded' ? 'Uploaded report' : status === 'ai' ? 'AI analysis' : 'Demo data'}
            </Badge>
            {fileInfo ? (
              <span className="text-xs font-medium text-slate-500">
                Загружено {new Date(fileInfo.loadedAt).toLocaleString('ru-RU')}
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
            Дашборд информационного поля
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Загрузите отчёт агента или изучите демо-данные
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onUploadClick}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Загрузить отчёт
          </Button>
          <Button type="button" variant="secondary" disabled={status === 'demo'} onClick={onReset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Сбросить
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeaderFact icon={<Database className="h-4 w-4" />} label="Компания" value={meta.companyName || 'Демо-данные'} />
        <HeaderFact icon={<CalendarDays className="h-4 w-4" />} label="Период" value={meta.period || 'Период не указан'} />
        <HeaderFact icon={<Users className="h-4 w-4" />} label="Источник" value={meta.sourceDescription || 'Источник не указан'} />
        <HeaderFact
          icon={<Database className="h-4 w-4" />}
          label="Объём"
          value={`${meta.totalPostsAnalyzed ?? data.kpis.totalPosts ?? 0} постов · ${meta.totalChannelsAnalyzed ?? data.kpis.channels ?? 0} каналов`}
        />
      </div>
    </header>
  )
}

function getStatusBadgeClass(status: DataStatus): string {
  if (status === 'uploaded') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'ai') {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function HeaderFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
