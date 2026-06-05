import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={cn('panel min-w-0 p-5', className)}>{children}</section>
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900',
    secondary: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
  }

  return (
    <button
      className={cn(
        'focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        className ?? 'border-slate-200 bg-slate-50 text-slate-600',
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-slate-400" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="muted-label">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'focus-ring min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'focus-ring min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
