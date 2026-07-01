import { useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Bot,
  GitBranch,
  Layers3,
  Lightbulb,
  Newspaper,
  RefreshCcw,
  Scale,
  Share2,
  Sparkles,
  Upload,
  UsersRound,
} from 'lucide-react'
import { AiAnalysisPanel } from './components/AiAnalysisPanel'
import { CorrelationsTab } from './components/CorrelationsTab'
import { DashboardHeader } from './components/DashboardHeader'
import { DigestTab } from './components/DigestTab'
import { ExportPanel } from './components/ExportPanel'
import { FileUpload } from './components/FileUpload'
import { ImbalancesTab } from './components/ImbalancesTab'
import { KpiCards } from './components/KpiCards'
import { MattermostPanel } from './components/MattermostPanel'
import { OverviewTab } from './components/OverviewTab'
import { RecommendationsTab } from './components/RecommendationsTab'
import { SummaryPanel } from './components/SummaryPanel'
import { TeamsTab } from './components/TeamsTab'
import { TopicsTab } from './components/TopicsTab'
import { Button, Card } from './components/ui'
import { mockData } from './lib/mockData'
import { parseUploadedReport } from './lib/parser'
import type { DataStatus, ReportData, UploadedFileInfo } from './lib/types'
import { cn } from './lib/utils'

type TabId =
  | 'overview'
  | 'topics'
  | 'teams'
  | 'correlations'
  | 'imbalances'
  | 'recommendations'
  | 'digest'
  | 'export'

const tabs: Array<{ id: TabId; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'topics', label: 'Темы', icon: Layers3 },
  { id: 'teams', label: 'Команды', icon: UsersRound },
  { id: 'correlations', label: 'Корреляции', icon: Share2 },
  { id: 'imbalances', label: 'Перекосы', icon: Scale },
  { id: 'recommendations', label: 'Рекомендации', icon: Lightbulb },
  { id: 'digest', label: 'Дайджест', icon: Newspaper },
  { id: 'export', label: 'Экспорт', icon: Upload },
]

function App() {
  const uploadSectionRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<ReportData>(mockData)
  const [status, setStatus] = useState<DataStatus>('demo')
  const [fileInfo, setFileInfo] = useState<UploadedFileInfo | undefined>()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [rawTextHint, setRawTextHint] = useState('')
  const [showLocalAiTools, setShowLocalAiTools] = useState(false)

  const visibleWarnings = useMemo(() => {
    const parserWarnings = data.parserWarnings ?? []
    return [...warnings, ...parserWarnings].filter(Boolean)
  }, [data.parserWarnings, warnings])

  const handleUploadClick = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetToDemo = () => {
    setData(mockData)
    setStatus('demo')
    setFileInfo(undefined)
    setError('')
    setWarnings([])
    setRawTextHint('')
    setActiveTab('overview')
  }

  const handleFileLoaded = (file: File, text: string) => {
    try {
      const parsed = parseUploadedReport(file.name, text)
      setData(parsed)
      setStatus('uploaded')
      setFileInfo({
        name: file.name,
        loadedAt: new Date().toISOString(),
        size: file.size,
      })
      setWarnings(parsed.parserWarnings ?? [])
      setError('')
      setActiveTab('overview')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось распознать структуру отчёта. Попробуйте загрузить JSON по рекомендуемой схеме.',
      )
    }
  }

  const handleAiAnalysisComplete = (report: ReportData, sourceName: string, sourceSize: number) => {
    setData(report)
    setStatus('ai')
    setFileInfo({
      name: sourceName,
      loadedAt: new Date().toISOString(),
      size: sourceSize,
    })
    setWarnings(report.parserWarnings ?? [])
    setError('')
    setActiveTab('overview')
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={data} />
      case 'topics':
        return <TopicsTab data={data} />
      case 'teams':
        return <TeamsTab data={data} />
      case 'correlations':
        return <CorrelationsTab data={data} />
      case 'imbalances':
        return <ImbalancesTab data={data} />
      case 'recommendations':
        return <RecommendationsTab data={data} />
      case 'digest':
        return <DigestTab data={data} />
      case 'export':
        return <ExportPanel data={data} />
      default:
        return <OverviewTab data={data} />
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_42%,#e9edf6_100%)] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1480px] gap-5">
        <DashboardHeader
          data={data}
          status={status}
          fileInfo={fileInfo}
          onUploadClick={handleUploadClick}
          onReset={resetToDemo}
        />

        <div ref={uploadSectionRef}>
          <FileUpload
            status={status}
            fileInfo={fileInfo}
            error={error}
            warnings={visibleWarnings}
            onFileLoaded={handleFileLoaded}
            onError={setError}
            onReset={resetToDemo}
          />
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Локальный AI и МЧат-коннектор</p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                  Для GitHub Pages это необязательный блок. Локально он работает через ваш Node-прокси и не отправляет
                  ключи в браузер.
                </p>
                {rawTextHint ? <p className="mt-2 text-xs font-medium text-blue-700">{rawTextHint}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowLocalAiTools((value) => !value)}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {showLocalAiTools ? 'Скрыть локальные инструменты' : 'Показать локальные инструменты'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetToDemo}>
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Demo data
              </Button>
            </div>
          </div>
        </Card>

        {showLocalAiTools ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <MattermostPanel
              onCollectedRawText={(rawText, sourceName) => {
                setRawTextHint(`Собраны сырые посты из ${sourceName}: ${rawText.length.toLocaleString('ru-RU')} знаков.`)
              }}
              onAnalysisComplete={handleAiAnalysisComplete}
            />
            <AiAnalysisPanel onAnalysisComplete={handleAiAnalysisComplete} />
          </div>
        ) : null}

        <SummaryPanel data={data} />
        <KpiCards data={data} />

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 bg-white/80 p-2">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn(
                      'focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition',
                      isActive ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100',
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="p-4 md:p-5">{renderActiveTab()}</div>
        </section>

        <footer className="flex flex-col gap-2 px-1 pb-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Данные обрабатываются локально в браузере. Файл отчёта не отправляется на сервер.</span>
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Information field dashboard
          </span>
        </footer>
      </div>
    </main>
  )
}

export default App
