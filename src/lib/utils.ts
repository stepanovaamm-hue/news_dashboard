import type { Importance, Visibility } from './types'

export const chartColors = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#db2777',
  '#64748b',
  '#0891b2',
  '#65a30d',
  '#ea580c',
  '#475569',
]

export function formatPercent(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'Нет данных'
  }

  return `${Math.round(value)}%`
}

export function formatNumber(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'Нет данных'
  }

  return new Intl.NumberFormat('ru-RU').format(value)
}

export function getPriorityLabel(priority?: string): string {
  const labels: Record<string, string> = {
    high: 'Высокая',
    medium: 'Средняя',
    low: 'Низкая',
  }

  return priority ? labels[priority] ?? priority : 'Не указана'
}

export function getVisibilityLabel(visibility?: Visibility): string {
  const labels: Record<Visibility, string> = {
    high: 'Высокая',
    medium: 'Средняя',
    low: 'Низкая',
  }

  return visibility ? labels[visibility] : 'Не указана'
}

export function getClarityLabel(clarity?: string): string {
  const labels: Record<string, string> = {
    high: 'Высокая',
    medium: 'Средняя',
    low: 'Низкая',
  }

  return clarity ? labels[clarity] ?? clarity : 'Не указана'
}

export function getPriorityBadgeClass(priority?: string): string {
  const normalized = priority ?? 'low'

  if (normalized === 'high') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (normalized === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

export function getIndexLevel(value?: number): 'low' | 'medium' | 'high' {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'low'
  }

  if (value < 40) {
    return 'low'
  }

  if (value < 70) {
    return 'medium'
  }

  return 'high'
}

export function getIndexBarClass(value?: number): string {
  const level = getIndexLevel(value)

  if (level === 'high') {
    return 'bg-emerald-500'
  }

  if (level === 'medium') {
    return 'bg-sky-500'
  }

  return 'bg-amber-500'
}

export function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(' ')
}

export function clampPercent(value?: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

export function asArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : []
}

export function readableFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function normalizeImportance(value?: string): Importance | undefined {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  const lowered = value?.trim().toLowerCase()
  if (!lowered) {
    return undefined
  }

  if (['высокая', 'высокий', 'high'].includes(lowered)) {
    return 'high'
  }

  if (['средняя', 'средний', 'medium'].includes(lowered)) {
    return 'medium'
  }

  if (['низкая', 'низкий', 'low'].includes(lowered)) {
    return 'low'
  }

  return undefined
}
