import { useRef, useState } from 'react'
import { FileText, RotateCcw, ShieldCheck, UploadCloud, XCircle } from 'lucide-react'
import type { DataStatus, UploadedFileInfo } from '../lib/types'
import { readableFileSize } from '../lib/utils'
import { Button } from './ui'

const maxFileSize = 5 * 1024 * 1024
const supportedExtensions = ['json', 'md', 'markdown', 'txt', 'csv']

interface FileUploadProps {
  status: DataStatus
  fileInfo?: UploadedFileInfo
  error?: string
  warnings?: string[]
  onFileLoaded: (file: File, text: string) => void
  onError: (message: string) => void
  onReset: () => void
}

export function FileUpload({
  status,
  fileInfo,
  error,
  warnings = [],
  onFileLoaded,
  onError,
  onReset,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) {
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!supportedExtensions.includes(extension)) {
      onError('Формат не поддерживается. Загрузите JSON, Markdown, TXT или CSV.')
      return
    }

    if (file.size > maxFileSize) {
      onError('Файл слишком большой. Максимальный размер для локальной обработки - 5 МБ.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => onFileLoaded(file, String(reader.result ?? ''))
    reader.onerror = () => onError('Не удалось прочитать файл. Попробуйте выбрать его ещё раз.')
    reader.readAsText(file)
  }

  return (
    <section className="panel grid gap-5 p-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div
        className={[
          'flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed p-6 text-center transition',
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50/80',
        ].join(' ')}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        <UploadCloud className="h-10 w-10 text-blue-600" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-slate-950">Перетащите файл отчёта сюда</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-500">Поддерживаемые форматы: JSON, Markdown, TXT, CSV</p>
        <input
          ref={inputRef}
          id="report-file-input"
          type="file"
          className="sr-only"
          accept=".json,.md,.markdown,.txt,.csv,application/json,text/plain,text/markdown,text/csv"
          aria-label="Загрузить файл отчёта"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <Button className="mt-5" type="button" onClick={() => inputRef.current?.click()}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          Выбрать файл
        </Button>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Данные обрабатываются локально в браузере</p>
              <p className="mt-1 text-sm text-slate-500">Файл не отправляется на сервер, backend в приложении отсутствует.</p>
            </div>
          </div>

          {fileInfo ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="muted-label">Загруженный отчёт</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{fileInfo.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(fileInfo.loadedAt).toLocaleString('ru-RU')} · {readableFileSize(fileInfo.size)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="muted-label">Текущий режим</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {status === 'demo' ? 'Демо-данные' : 'Загруженный отчёт'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Можно изучить демо-дашборд или загрузить отчёт агента.</p>
            </div>
          )}

          {error ? (
            <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          ) : null}

          {warnings.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">Данные распознаны частично</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {warnings.map((warning) => (
                  <li key={warning}>- {warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Button type="button" variant="secondary" disabled={status === 'demo'} onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Сбросить и вернуться к demo data
        </Button>
      </div>
    </section>
  )
}
