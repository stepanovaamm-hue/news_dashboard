import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Home,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Search,
  Settings,
  Table,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'
import {
  CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
  PAYMENT_CATEGORIES,
  PAYMENT_OWNERS,
  PAYMENT_STATUS_LABELS,
  buildCalendarRows,
  buildTodaySnapshot,
  compareIso,
  createId,
  createInitialState,
  escapeHtml,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMonth,
  getAccountBalance,
  getMonthOptions,
  getPaymentStatus,
  getTotalBalance,
  nowIso,
  toCsv,
} from './lib/finance'
import type {
  Account,
  FinanceSettings,
  FinanceState,
  Income,
  IncomeStatus,
  LogEntityType,
  Payment,
  PaymentCategory,
  PaymentOwner,
  PaymentStatus,
} from './lib/finance'

const STORAGE_KEY = 'family-finance-calendar-state-v1'

type TabId = 'today' | 'calendar' | 'payments' | 'incomes' | 'logs' | 'settings' | 'export'
type StatusFilter = 'all' | PaymentStatus
type OwnerFilter = 'all' | PaymentOwner

interface TabItem {
  id: TabId
  label: string
  icon: LucideIcon
}

interface PaymentDraft {
  dueDate: string
  title: string
  amount: string
  category: PaymentCategory
  owner: PaymentOwner
  status: 'pending' | 'paid'
  comment: string
  isRecurring: boolean
}

interface IncomeDraft {
  date: string
  source: string
  amount: string
  status: IncomeStatus
  comment: string
}

const tabs: TabItem[] = [
  { id: 'today', label: 'Сегодня', icon: Home },
  { id: 'calendar', label: 'Календарь', icon: Table },
  { id: 'payments', label: 'Платежи', icon: CreditCard },
  { id: 'incomes', label: 'Доходы', icon: WalletCards },
  { id: 'logs', label: 'Логи', icon: ClipboardList },
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'export', label: 'Экспорт', icon: Download },
]

function App() {
  const [state, setState] = useState<FinanceState>(() => loadState())
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<StatusFilter>('all')
  const [paymentOwnerFilter, setPaymentOwnerFilter] = useState<OwnerFilter>('all')
  const [paymentQuery, setPaymentQuery] = useState('')
  const [paymentEditor, setPaymentEditor] = useState<Payment | 'new' | null>(null)
  const [incomeEditor, setIncomeEditor] = useState<Income | 'new' | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const monthOptions = useMemo(() => getMonthOptions(state), [state])
  const calendarRows = useMemo(() => buildCalendarRows(state, state.settings.selectedMonth), [state])
  const today = useMemo(() => buildTodaySnapshot(state), [state])

  const filteredPayments = useMemo(() => {
    const query = paymentQuery.trim().toLowerCase()

    return state.payments
      .filter((payment) => payment.dueDate.startsWith(state.settings.selectedMonth))
      .filter((payment) => paymentOwnerFilter === 'all' || payment.owner === paymentOwnerFilter)
      .filter((payment) => {
        const status = getPaymentStatus(payment, state.settings.referenceDate)
        return paymentStatusFilter === 'all' || status === paymentStatusFilter
      })
      .filter((payment) => {
        if (!query) {
          return true
        }

        return [payment.title, payment.owner, CATEGORY_LABELS[payment.category], payment.comment].some((value) =>
          value.toLowerCase().includes(query),
        )
      })
      .sort((left, right) => compareIso(left.dueDate, right.dueDate))
  }, [paymentOwnerFilter, paymentQuery, paymentStatusFilter, state])

  const monthIncomes = useMemo(
    () =>
      state.incomes
        .filter((income) => income.date.startsWith(state.settings.selectedMonth))
        .sort((left, right) => compareIso(left.date, right.date)),
    [state.incomes, state.settings.selectedMonth],
  )

  function withLog(
    mutator: (previous: FinanceState) => FinanceState,
    action: string,
    entityType: LogEntityType,
    entityId: string,
    details: string,
  ) {
    setState((previous) => {
      const changed = mutator(previous)
      return {
        ...changed,
        logs: [
          {
            id: createId('log'),
            timestamp: nowIso(),
            action,
            entityType,
            entityId,
            details,
          },
          ...changed.logs,
        ].slice(0, 400),
      }
    })
  }

  function updateSettings(settings: FinanceSettings, accounts: Account[]) {
    withLog(
      (previous) => ({ ...previous, settings, accounts }),
      'update',
      'settings',
      'finance_settings',
      'Обновлены дата расчета, резервы и остатки по счетам.',
    )
  }

  function updateSelectedMonth(selectedMonth: string) {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, selectedMonth } }))
  }

  function updateReferenceDate(referenceDate: string) {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, referenceDate } }))
  }

  function savePayment(draft: PaymentDraft, editing?: Payment) {
    const amount = Number(draft.amount)

    if (!draft.title.trim() || !draft.dueDate || !Number.isFinite(amount) || amount <= 0) {
      return
    }

    const timestamp = nowIso()
    const paidAt = draft.status === 'paid' ? editing?.paidAt ?? timestamp : undefined

    if (editing) {
      withLog(
        (previous) => ({
          ...previous,
          accounts: adjustMandatoryForPayment(previous.accounts, editing, amount, draft.status),
          payments: previous.payments.map((payment) =>
            payment.id === editing.id
              ? {
                  ...payment,
                  dueDate: draft.dueDate,
                  title: draft.title.trim(),
                  amount,
                  category: draft.category,
                  owner: draft.owner,
                  status: draft.status,
                  paidAt,
                  comment: draft.comment.trim(),
                  isRecurring: draft.isRecurring,
                  updatedAt: timestamp,
                }
              : payment,
          ),
        }),
        'update',
        'payment',
        editing.id,
        `Изменен платеж "${draft.title.trim()}" на сумму ${formatMoney(amount)}.`,
      )
    } else {
      const payment: Payment = {
        id: createId('payment'),
        dueDate: draft.dueDate,
        title: draft.title.trim(),
        amount,
        category: draft.category,
        owner: draft.owner,
        status: draft.status,
        paidAt,
        comment: draft.comment.trim(),
        isRecurring: draft.isRecurring,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      withLog(
        (previous) => ({
          ...previous,
          accounts: payment.status === 'paid' ? adjustMandatory(previous.accounts, -payment.amount) : previous.accounts,
          payments: [...previous.payments, payment],
        }),
        'create',
        'payment',
        payment.id,
        `Добавлен платеж "${payment.title}" на сумму ${formatMoney(payment.amount)}.`,
      )
    }

    setPaymentEditor(null)
  }

  function markPaymentPaid(payment: Payment) {
    if (payment.status === 'paid') {
      return
    }

    const timestamp = nowIso()
    withLog(
      (previous) => ({
        ...previous,
        accounts: adjustMandatory(previous.accounts, -payment.amount),
        payments: previous.payments.map((item) =>
          item.id === payment.id ? { ...item, status: 'paid', paidAt: timestamp, updatedAt: timestamp } : item,
        ),
      }),
      'pay',
      'payment',
      payment.id,
      `Платеж "${payment.title}" отмечен оплаченным.`,
    )
  }

  function deletePayment(payment: Payment) {
    withLog(
      (previous) => ({
        ...previous,
        accounts: payment.status === 'paid' ? adjustMandatory(previous.accounts, payment.amount) : previous.accounts,
        payments: previous.payments.filter((item) => item.id !== payment.id),
      }),
      'delete',
      'payment',
      payment.id,
      `Удален платеж "${payment.title}" на сумму ${formatMoney(payment.amount)}.`,
    )
  }

  function saveIncome(draft: IncomeDraft, editing?: Income) {
    const amount = Number(draft.amount)

    if (!draft.source.trim() || !draft.date || !Number.isFinite(amount) || amount <= 0) {
      return
    }

    const timestamp = nowIso()

    if (editing) {
      withLog(
        (previous) => ({
          ...previous,
          accounts: adjustMandatoryForIncome(previous.accounts, editing, amount, draft.status),
          incomes: previous.incomes.map((income) =>
            income.id === editing.id
              ? {
                  ...income,
                  date: draft.date,
                  source: draft.source.trim(),
                  amount,
                  status: draft.status,
                  comment: draft.comment.trim(),
                  updatedAt: timestamp,
                }
              : income,
          ),
        }),
        'update',
        'income',
        editing.id,
        `Изменен доход "${draft.source.trim()}" на сумму ${formatMoney(amount)}.`,
      )
    } else {
      const income: Income = {
        id: createId('income'),
        date: draft.date,
        source: draft.source.trim(),
        amount,
        status: draft.status,
        comment: draft.comment.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      withLog(
        (previous) => ({
          ...previous,
          accounts: income.status === 'received' ? adjustMandatory(previous.accounts, income.amount) : previous.accounts,
          incomes: [...previous.incomes, income],
        }),
        'create',
        'income',
        income.id,
        `Добавлен доход "${income.source}" на сумму ${formatMoney(income.amount)}.`,
      )
    }

    setIncomeEditor(null)
  }

  function markIncomeReceived(income: Income) {
    if (income.status === 'received') {
      return
    }

    const timestamp = nowIso()
    withLog(
      (previous) => ({
        ...previous,
        accounts: adjustMandatory(previous.accounts, income.amount),
        incomes: previous.incomes.map((item) =>
          item.id === income.id ? { ...item, status: 'received', updatedAt: timestamp } : item,
        ),
      }),
      'receive',
      'income',
      income.id,
      `Доход "${income.source}" отмечен полученным.`,
    )
  }

  function deleteIncome(income: Income) {
    withLog(
      (previous) => ({
        ...previous,
        accounts: income.status === 'received' ? adjustMandatory(previous.accounts, -income.amount) : previous.accounts,
        incomes: previous.incomes.filter((item) => item.id !== income.id),
      }),
      'delete',
      'income',
      income.id,
      `Удален доход "${income.source}" на сумму ${formatMoney(income.amount)}.`,
    )
  }

  function resetState() {
    setState(createInitialState())
    setPaymentStatusFilter('all')
    setPaymentOwnerFilter('all')
    setPaymentQuery('')
    setActiveTab('today')
  }

  function exportPayments() {
    const rows = state.payments
      .sort((left, right) => compareIso(left.dueDate, right.dueDate))
      .map((payment) => [
        payment.dueDate,
        payment.title,
        payment.amount,
        CATEGORY_LABELS[payment.category],
        payment.owner,
        PAYMENT_STATUS_LABELS[getPaymentStatus(payment, state.settings.referenceDate)],
        payment.comment,
      ])
    downloadText('payments.csv', toCsv(['date', 'title', 'amount', 'category', 'owner', 'status', 'comment'], rows), 'text/csv')
  }

  function exportIncomes() {
    const rows = state.incomes
      .sort((left, right) => compareIso(left.date, right.date))
      .map((income) => [income.date, income.source, income.amount, INCOME_STATUS_LABELS[income.status], income.comment])
    downloadText('incomes.csv', toCsv(['date', 'source', 'amount', 'status', 'comment'], rows), 'text/csv')
  }

  function exportCalendar() {
    const rows = calendarRows.map((row) => [
      row.periodLabel,
      row.income?.source ?? '',
      row.incomeAmount,
      row.cashAfterIncome,
      row.payments.map((payment) => payment.title).join(', '),
      row.paymentsTotal,
      row.afterPayments,
      row.lifeReserve,
      row.creditReserve,
      row.free,
    ])
    downloadText(
      `calendar-${state.settings.selectedMonth}.csv`,
      toCsv(
        [
          'period',
          'income_source',
          'income_amount',
          'cash_after_income',
          'payments',
          'payments_total',
          'after_payments',
          'life_reserve',
          'credit_reserve',
          'free',
        ],
        rows,
      ),
      'text/csv',
    )
  }

  function exportLogs() {
    const rows = state.logs.map((log) => [log.timestamp, log.action, log.entityType, log.entityId, log.details])
    downloadText('logs.csv', toCsv(['timestamp', 'action', 'entity_type', 'entity_id', 'details'], rows), 'text/csv')
  }

  function exportExcel() {
    const html = buildExcelHtml(state, calendarRows)
    downloadText(`finance-calendar-${state.settings.selectedMonth}.xls`, html, 'application/vnd.ms-excel')
  }

  return (
    <main className="min-h-screen bg-[#eef1f5] text-[#141820]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar
            monthOptions={monthOptions}
            onMonthChange={updateSelectedMonth}
            onReferenceDateChange={updateReferenceDate}
            onReset={resetState}
            settings={state.settings}
          />

          <div className="space-y-5 px-4 pb-6 md:px-6 lg:px-8">
            <AccountStrip state={state} />

            {activeTab === 'today' ? (
              <TodayView onOpenPayments={() => setActiveTab('payments')} snapshot={today} state={state} />
            ) : null}

            {activeTab === 'calendar' ? <CalendarView rows={calendarRows} state={state} /> : null}

            {activeTab === 'payments' ? (
              <PaymentsView
                filteredPayments={filteredPayments}
                onAdd={() => setPaymentEditor('new')}
                onDelete={deletePayment}
                onEdit={setPaymentEditor}
                onMarkPaid={markPaymentPaid}
                ownerFilter={paymentOwnerFilter}
                query={paymentQuery}
                setOwnerFilter={setPaymentOwnerFilter}
                setQuery={setPaymentQuery}
                setStatusFilter={setPaymentStatusFilter}
                state={state}
                statusFilter={paymentStatusFilter}
              />
            ) : null}

            {activeTab === 'incomes' ? (
              <IncomesView
                incomes={monthIncomes}
                onAdd={() => setIncomeEditor('new')}
                onDelete={deleteIncome}
                onEdit={setIncomeEditor}
                onMarkReceived={markIncomeReceived}
              />
            ) : null}

            {activeTab === 'logs' ? <LogsView logs={state.logs} /> : null}

            {activeTab === 'settings' ? (
              <SettingsView
                accounts={state.accounts}
                key={`${state.settings.referenceDate}-${state.settings.selectedMonth}-${state.accounts.map((account) => account.balance).join(':')}`}
                onSave={updateSettings}
                settings={state.settings}
              />
            ) : null}

            {activeTab === 'export' ? (
              <ExportView
                onExportCalendar={exportCalendar}
                onExportExcel={exportExcel}
                onExportIncomes={exportIncomes}
                onExportLogs={exportLogs}
                onExportPayments={exportPayments}
              />
            ) : null}
          </div>
        </section>
      </div>

      {paymentEditor ? (
        <PaymentEditor
          editing={paymentEditor === 'new' ? undefined : paymentEditor}
          onClose={() => setPaymentEditor(null)}
          onSubmit={savePayment}
          referenceDate={state.settings.referenceDate}
        />
      ) : null}

      {incomeEditor ? (
        <IncomeEditor
          editing={incomeEditor === 'new' ? undefined : incomeEditor}
          onClose={() => setIncomeEditor(null)}
          onSubmit={saveIncome}
          referenceDate={state.settings.referenceDate}
        />
      ) : null}
    </main>
  )
}

function Sidebar({ activeTab, onSelect }: { activeTab: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <aside className="border-b border-[#d8dee8] bg-[#fbfcfd] px-3 py-3 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#0f766e] text-white">
          <PiggyBank className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#141820]">Финансовый календарь</p>
          <p className="text-xs text-[#667085]">семейный контур</p>
        </div>
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Разделы">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              className={cx(
                'flex min-h-10 shrink-0 items-center gap-2 rounded-[8px] px-3 text-sm font-medium transition',
                isActive
                  ? 'bg-[#0f766e] text-white shadow-[0_12px_28px_-20px_rgba(15,118,110,0.9)]'
                  : 'text-[#495466] hover:bg-[#e8edf3]',
              )}
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function TopBar({
  monthOptions,
  onMonthChange,
  onReferenceDateChange,
  onReset,
  settings,
}: {
  monthOptions: string[]
  onMonthChange: (month: string) => void
  onReferenceDateChange: (date: string) => void
  onReset: () => void
  settings: FinanceSettings
}) {
  return (
    <header className="px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-[#0f766e]">{formatMonth(settings.selectedMonth)}</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#141820] md:text-3xl">План платежей и доходов</h1>
        </div>

        <div className="grid gap-2 sm:grid-cols-[180px_180px_auto]">
          <label className="field-shell">
            <span>Месяц</span>
            <select value={settings.selectedMonth} onChange={(event) => onMonthChange(event.target.value)}>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </label>

          <label className="field-shell">
            <span>Дата расчета</span>
            <input type="date" value={settings.referenceDate} onChange={(event) => onReferenceDateChange(event.target.value)} />
          </label>

          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#cfd7e2] bg-white px-3 text-sm font-semibold text-[#344054] hover:bg-[#f5f7fa]"
            onClick={onReset}
            type="button"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Сбросить
          </button>
        </div>
      </div>
    </header>
  )
}

function AccountStrip({ state }: { state: FinanceState }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Счета">
      {state.accounts.map((account) => (
        <article className="rounded-[8px] border border-[#dfe5ec] bg-white p-4 shadow-[0_18px_45px_-36px_rgba(20,24,32,0.42)]" key={account.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#667085]">{account.name}</p>
              <p className="mt-2 text-2xl font-semibold text-[#141820]">{formatMoney(account.balance)}</p>
            </div>
            <WalletCards className="h-5 w-5 text-[#0f766e]" aria-hidden="true" />
          </div>
        </article>
      ))}
    </section>
  )
}

function TodayView({
  onOpenPayments,
  snapshot,
  state,
}: {
  onOpenPayments: () => void
  snapshot: ReturnType<typeof buildTodaySnapshot>
  state: FinanceState
}) {
  const warning = snapshot.enoughUntilNextIncome
    ? 'Денег на обязательном счете хватает до следующего дохода.'
    : `До следующего дохода нужно оплатить ${formatMoney(snapshot.dueBeforeNextIncomeTotal)}. На счете обязательных ${formatMoney(snapshot.mandatoryBalance)}. Не хватает ${formatMoney(snapshot.shortage)}.`

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard icon={WalletCards} label="Текущий остаток" value={formatMoney(snapshot.currentBalance)} />
          <MetricCard
            icon={Receipt}
            label="Следующий платеж"
            value={snapshot.nextPayment ? formatMoney(snapshot.nextPayment.amount) : 'нет'}
            detail={snapshot.nextPayment ? `${snapshot.nextPayment.title}, ${formatDate(snapshot.nextPayment.dueDate)}` : 'Платежей впереди нет'}
          />
          <MetricCard
            icon={CalendarDays}
            label="Следующий доход"
            value={snapshot.nextIncome ? formatDate(snapshot.nextIncome.date) : 'нет'}
            detail={snapshot.nextIncome ? `${snapshot.nextIncome.source}, ${formatMoney(snapshot.nextIncome.amount)}` : 'Доходы не запланированы'}
          />
          <MetricCard
            icon={PiggyBank}
            label="Реально свободно"
            tone={snapshot.realFree < 0 ? 'danger' : 'success'}
            value={formatMoney(snapshot.realFree)}
          />
        </div>

        <article
          className={cx(
            'rounded-[8px] border p-4',
            snapshot.enoughUntilNextIncome ? 'border-[#badbcc] bg-[#f0faf4]' : 'border-[#fecaca] bg-[#fff1f2]',
          )}
        >
          <div className="flex items-start gap-3">
            {snapshot.enoughUntilNextIncome ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#047857]" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#be123c]" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-base font-semibold text-[#141820]">Проверка до следующего дохода</h2>
              <p className="mt-1 text-sm leading-6 text-[#344054]">{warning}</p>
            </div>
          </div>
        </article>

        <Panel title="Ближайшие 7 дней" icon={CalendarDays}>
          {snapshot.upcomingWeek.length > 0 ? (
            <div className="grid gap-2">
              {snapshot.upcomingWeek.map((payment) => (
                <PaymentMiniRow key={payment.id} payment={payment} referenceDate={state.settings.referenceDate} />
              ))}
            </div>
          ) : (
            <EmptyState text="Нет платежей на ближайшие 7 дней." />
          )}
        </Panel>
      </div>

      <Panel title="К оплате до дохода" icon={Receipt}>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <MetricCard icon={CreditCard} label="Сумма платежей" value={formatMoney(snapshot.dueBeforeNextIncomeTotal)} compact />
          <MetricCard icon={WalletCards} label="Обязательные" value={formatMoney(snapshot.mandatoryBalance)} compact />
        </div>

        {snapshot.dueBeforeNextIncome.length > 0 ? (
          <div className="grid gap-2">
            {snapshot.dueBeforeNextIncome.map((payment) => (
              <PaymentMiniRow key={payment.id} payment={payment} referenceDate={state.settings.referenceDate} />
            ))}
          </div>
        ) : (
          <EmptyState text="До следующего дохода нет обязательных платежей." />
        )}

        <button className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#115e59]" onClick={onOpenPayments} type="button">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Открыть платежи
        </button>
      </Panel>
    </section>
  )
}

function CalendarView({ rows, state }: { rows: ReturnType<typeof buildCalendarRows>; state: FinanceState }) {
  const monthSummary = useMemo(() => {
    const monthPayments = state.payments.filter((payment) => payment.dueDate.startsWith(state.settings.selectedMonth))
    const overdueCount = monthPayments.filter((payment) => getPaymentStatus(payment, state.settings.referenceDate) === 'overdue').length
    const free = rows.length > 0 ? rows[rows.length - 1].free : getAccountBalance(state, 'Свободно')
    const endCash = rows.length > 0 ? rows[rows.length - 1].afterPayments : getTotalBalance(state)
    const life = rows.reduce((sum, row) => sum + row.lifeReserve, 0)

    return { overdueCount, free, endCash, life }
  }, [rows, state])

  return (
    <section className="grid gap-5 2xl:grid-cols-[1fr_320px]">
      <Panel title="Финансовый календарь месяца" icon={Table} flush>
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] text-left text-sm">
            <thead className="bg-[#dff3fb] text-[#164e63]">
              <tr>
                <Th>Дата</Th>
                <Th>Приход</Th>
                <Th>После прихода</Th>
                <Th>Что оплачиваем</Th>
                <Th>Сумма платежей</Th>
                <Th>Остаток</Th>
                <Th>На жизнь</Th>
                <Th>На кредиты</Th>
                <Th>Свободно</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className={calendarRowClass(row)} key={row.id}>
                  <Td>
                    <div className="font-semibold">{row.periodLabel}</div>
                    <div className="text-xs text-[#667085]">{row.income ? row.income.source : 'до первого дохода'}</div>
                  </Td>
                  <Td>{row.income ? formatMoney(row.incomeAmount) : '—'}</Td>
                  <Td>{formatMoney(row.cashAfterIncome)}</Td>
                  <Td>
                    <div className="flex max-w-[280px] flex-wrap gap-1.5">
                      {row.payments.length > 0 ? (
                        row.payments.map((payment) => (
                          <span className="rounded-[8px] border border-[#d9e0e8] bg-white px-2 py-1 text-xs text-[#344054]" key={payment.id}>
                            {payment.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#667085]">нет платежей</span>
                      )}
                    </div>
                  </Td>
                  <Td>{formatMoney(row.paymentsTotal)}</Td>
                  <Td>{formatMoney(row.afterPayments)}</Td>
                  <Td>{formatMoney(row.lifeReserve)}</Td>
                  <Td>{formatMoney(row.creditReserve)}</Td>
                  <Td>
                    <span className={cx('font-semibold', row.free < 0 ? 'text-[#be123c]' : 'text-[#047857]')}>{formatMoney(row.free)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Итоги месяца" icon={FileText}>
        <SummaryRow label="Все просрочки закрыты" value={monthSummary.overdueCount === 0 ? 'Да' : 'Нет'} danger={monthSummary.overdueCount > 0} />
        <SummaryRow label="Деньги на счетах к концу" value={formatMoney(monthSummary.endCash)} />
        <SummaryRow label="Из них на жизнь" value={formatMoney(monthSummary.life)} />
        <SummaryRow label="Реально свободно" value={formatMoney(monthSummary.free)} danger={monthSummary.free < 0} />
        <SummaryRow label="Просрочек в месяце" value={String(monthSummary.overdueCount)} danger={monthSummary.overdueCount > 0} />
      </Panel>
    </section>
  )
}

function PaymentsView({
  filteredPayments,
  onAdd,
  onDelete,
  onEdit,
  onMarkPaid,
  ownerFilter,
  query,
  setOwnerFilter,
  setQuery,
  setStatusFilter,
  state,
  statusFilter,
}: {
  filteredPayments: Payment[]
  onAdd: () => void
  onDelete: (payment: Payment) => void
  onEdit: (payment: Payment) => void
  onMarkPaid: (payment: Payment) => void
  ownerFilter: OwnerFilter
  query: string
  setOwnerFilter: (owner: OwnerFilter) => void
  setQuery: (query: string) => void
  setStatusFilter: (status: StatusFilter) => void
  state: FinanceState
  statusFilter: StatusFilter
}) {
  return (
    <Panel
      action={
        <button className="primary-button" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Добавить
        </button>
      }
      icon={CreditCard}
      title="Платежи"
    >
      <div className="mb-4 grid gap-2 lg:grid-cols-[1fr_180px_180px]">
        <label className="field-shell">
          <span>Поиск</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a95a5]" aria-hidden="true" />
            <input className="pl-9" placeholder="Название, владелец, категория" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </label>

        <label className="field-shell">
          <span>Статус</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">Все</option>
            <option value="pending">Не оплачены</option>
            <option value="paid">Оплачены</option>
            <option value="overdue">Просрочены</option>
          </select>
        </label>

        <label className="field-shell">
          <span>Владелец</span>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as OwnerFilter)}>
            <option value="all">Все</option>
            {PAYMENT_OWNERS.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] text-left text-sm">
          <thead className="bg-[#f4f7fa] text-[#495466]">
            <tr>
              <Th>Дата</Th>
              <Th>Платеж</Th>
              <Th>Категория</Th>
              <Th>Владелец</Th>
              <Th>Сумма</Th>
              <Th>Статус</Th>
              <Th>Действия</Th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const status = getPaymentStatus(payment, state.settings.referenceDate)

              return (
                <tr className="border-t border-[#e8edf3] bg-white" key={payment.id}>
                  <Td>{formatDate(payment.dueDate)}</Td>
                  <Td>
                    <div className="font-medium text-[#141820]">{payment.title}</div>
                    {payment.comment ? <div className="mt-1 text-xs text-[#667085]">{payment.comment}</div> : null}
                  </Td>
                  <Td>{CATEGORY_LABELS[payment.category]}</Td>
                  <Td>{payment.owner}</Td>
                  <Td>{formatMoney(payment.amount)}</Td>
                  <Td>
                    <PaymentStatusBadge status={status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <IconButton disabled={status === 'paid'} label="Оплатить" onClick={() => onMarkPaid(payment)}>
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Изменить" onClick={() => onEdit(payment)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton danger label="Удалить" onClick={() => onDelete(payment)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function IncomesView({
  incomes,
  onAdd,
  onDelete,
  onEdit,
  onMarkReceived,
}: {
  incomes: Income[]
  onAdd: () => void
  onDelete: (income: Income) => void
  onEdit: (income: Income) => void
  onMarkReceived: (income: Income) => void
}) {
  return (
    <Panel
      action={
        <button className="primary-button" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Добавить
        </button>
      }
      icon={WalletCards}
      title="Доходы"
    >
      <div className="overflow-x-auto">
        <table className="min-w-[760px] text-left text-sm">
          <thead className="bg-[#f4f7fa] text-[#495466]">
            <tr>
              <Th>Дата</Th>
              <Th>Источник</Th>
              <Th>Сумма</Th>
              <Th>Статус</Th>
              <Th>Действия</Th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((income) => (
              <tr className="border-t border-[#e8edf3] bg-white" key={income.id}>
                <Td>{formatDate(income.date)}</Td>
                <Td>
                  <div className="font-medium text-[#141820]">{income.source}</div>
                  {income.comment ? <div className="mt-1 text-xs text-[#667085]">{income.comment}</div> : null}
                </Td>
                <Td>{formatMoney(income.amount)}</Td>
                <Td>
                  <IncomeStatusBadge status={income.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <IconButton disabled={income.status === 'received'} label="Получено" onClick={() => onMarkReceived(income)}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton label="Изменить" onClick={() => onEdit(income)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton danger label="Удалить" onClick={() => onDelete(income)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function LogsView({ logs }: { logs: FinanceState['logs'] }) {
  return (
    <Panel icon={ClipboardList} title="Журнал действий">
      <div className="grid gap-2">
        {logs.map((log) => (
          <article className="rounded-[8px] border border-[#e0e7ef] bg-white p-3" key={log.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-[8px] bg-[#eefaf7] px-2 py-1 text-xs font-semibold text-[#0f766e]">{log.action}</span>
                <span className="text-xs text-[#667085]">{log.entityType}</span>
              </div>
              <time className="text-xs text-[#667085]">{formatDateTime(log.timestamp)}</time>
            </div>
            <p className="mt-2 text-sm text-[#344054]">{log.details}</p>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function SettingsView({
  accounts,
  onSave,
  settings,
}: {
  accounts: Account[]
  onSave: (settings: FinanceSettings, accounts: Account[]) => void
  settings: FinanceSettings
}) {
  const [draftSettings, setDraftSettings] = useState(settings)
  const [draftAccounts, setDraftAccounts] = useState(accounts.map((account) => ({ ...account, balance: String(account.balance) })))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(
      {
        ...draftSettings,
        lifeReservePerPeriod: Number(draftSettings.lifeReservePerPeriod) || 0,
        creditReservePerPeriod: Number(draftSettings.creditReservePerPeriod) || 0,
      },
      draftAccounts.map((account) => ({ ...account, balance: Number(account.balance) || 0 })),
    )
  }

  return (
    <Panel icon={Settings} title="Настройки">
      <form className="grid gap-5" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="field-shell">
            <span>Дата расчета</span>
            <input
              type="date"
              value={draftSettings.referenceDate}
              onChange={(event) => setDraftSettings((previous) => ({ ...previous, referenceDate: event.target.value }))}
            />
          </label>
          <label className="field-shell">
            <span>Месяц</span>
            <input
              type="month"
              value={draftSettings.selectedMonth}
              onChange={(event) => setDraftSettings((previous) => ({ ...previous, selectedMonth: event.target.value }))}
            />
          </label>
          <label className="field-shell">
            <span>Резерв на жизнь</span>
            <input
              min="0"
              type="number"
              value={draftSettings.lifeReservePerPeriod}
              onChange={(event) => setDraftSettings((previous) => ({ ...previous, lifeReservePerPeriod: Number(event.target.value) }))}
            />
          </label>
          <label className="field-shell">
            <span>Резерв на кредиты</span>
            <input
              min="0"
              type="number"
              value={draftSettings.creditReservePerPeriod}
              onChange={(event) => setDraftSettings((previous) => ({ ...previous, creditReservePerPeriod: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {draftAccounts.map((account) => (
            <label className="field-shell" key={account.id}>
              <span>{account.name}</span>
              <input
                min="0"
                type="number"
                value={account.balance}
                onChange={(event) =>
                  setDraftAccounts((previous) =>
                    previous.map((item) => (item.id === account.id ? { ...item, balance: event.target.value } : item)),
                  )
                }
              />
            </label>
          ))}
        </div>

        <div>
          <button className="primary-button" type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Сохранить
          </button>
        </div>
      </form>
    </Panel>
  )
}

function ExportView({
  onExportCalendar,
  onExportExcel,
  onExportIncomes,
  onExportLogs,
  onExportPayments,
}: {
  onExportCalendar: () => void
  onExportExcel: () => void
  onExportIncomes: () => void
  onExportLogs: () => void
  onExportPayments: () => void
}) {
  const items = [
    { title: 'Платежи', description: 'CSV', action: onExportPayments },
    { title: 'Доходы', description: 'CSV', action: onExportIncomes },
    { title: 'Финансовый календарь', description: 'CSV', action: onExportCalendar },
    { title: 'Логи', description: 'CSV', action: onExportLogs },
    { title: 'Excel-книга', description: 'XLS', action: onExportExcel },
  ]

  return (
    <Panel icon={Download} title="Экспорт">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article className="rounded-[8px] border border-[#e0e7ef] bg-white p-4" key={item.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#141820]">{item.title}</h2>
                <p className="mt-1 text-sm text-[#667085]">{item.description}</p>
              </div>
              <Download className="h-5 w-5 text-[#0f766e]" aria-hidden="true" />
            </div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-[#cfd7e2] bg-white px-3 py-2 text-sm font-semibold text-[#344054] hover:bg-[#f5f7fa]" onClick={item.action} type="button">
              <Download className="h-4 w-4" aria-hidden="true" />
              Скачать
            </button>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function PaymentEditor({
  editing,
  onClose,
  onSubmit,
  referenceDate,
}: {
  editing?: Payment
  onClose: () => void
  onSubmit: (draft: PaymentDraft, editing?: Payment) => void
  referenceDate: string
}) {
  const [draft, setDraft] = useState<PaymentDraft>(() => ({
    dueDate: editing?.dueDate ?? referenceDate,
    title: editing?.title ?? '',
    amount: editing ? String(editing.amount) : '',
    category: editing?.category ?? 'credit',
    owner: editing?.owner ?? 'общий',
    status: editing?.status === 'paid' ? 'paid' : 'pending',
    comment: editing?.comment ?? '',
    isRecurring: editing?.isRecurring ?? true,
  }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(draft, editing)
  }

  return (
    <Modal onClose={onClose} title={editing ? 'Изменить платеж' : 'Новый платеж'}>
      <form className="grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-shell">
            <span>Дата</span>
            <input type="date" value={draft.dueDate} onChange={(event) => setDraft((previous) => ({ ...previous, dueDate: event.target.value }))} />
          </label>
          <label className="field-shell">
            <span>Сумма</span>
            <input min="0" type="number" value={draft.amount} onChange={(event) => setDraft((previous) => ({ ...previous, amount: event.target.value }))} />
          </label>
        </div>
        <label className="field-shell">
          <span>Название</span>
          <input value={draft.title} onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field-shell">
            <span>Категория</span>
            <select value={draft.category} onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value as PaymentCategory }))}>
              {PAYMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
          <label className="field-shell">
            <span>Владелец</span>
            <select value={draft.owner} onChange={(event) => setDraft((previous) => ({ ...previous, owner: event.target.value as PaymentOwner }))}>
              {PAYMENT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>
          <label className="field-shell">
            <span>Статус</span>
            <select value={draft.status} onChange={(event) => setDraft((previous) => ({ ...previous, status: event.target.value as 'pending' | 'paid' }))}>
              <option value="pending">Не оплачен</option>
              <option value="paid">Оплачен</option>
            </select>
          </label>
        </div>
        <label className="field-shell">
          <span>Комментарий</span>
          <textarea rows={3} value={draft.comment} onChange={(event) => setDraft((previous) => ({ ...previous, comment: event.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#344054]">
          <input
            checked={draft.isRecurring}
            className="h-4 w-4 accent-[#0f766e]"
            type="checkbox"
            onChange={(event) => setDraft((previous) => ({ ...previous, isRecurring: event.target.checked }))}
          />
          Повторяется ежемесячно
        </label>
        <EditorActions onClose={onClose} />
      </form>
    </Modal>
  )
}

function IncomeEditor({
  editing,
  onClose,
  onSubmit,
  referenceDate,
}: {
  editing?: Income
  onClose: () => void
  onSubmit: (draft: IncomeDraft, editing?: Income) => void
  referenceDate: string
}) {
  const [draft, setDraft] = useState<IncomeDraft>(() => ({
    date: editing?.date ?? referenceDate,
    source: editing?.source ?? '',
    amount: editing ? String(editing.amount) : '',
    status: editing?.status ?? 'expected',
    comment: editing?.comment ?? '',
  }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(draft, editing)
  }

  return (
    <Modal onClose={onClose} title={editing ? 'Изменить доход' : 'Новый доход'}>
      <form className="grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-shell">
            <span>Дата</span>
            <input type="date" value={draft.date} onChange={(event) => setDraft((previous) => ({ ...previous, date: event.target.value }))} />
          </label>
          <label className="field-shell">
            <span>Сумма</span>
            <input min="0" type="number" value={draft.amount} onChange={(event) => setDraft((previous) => ({ ...previous, amount: event.target.value }))} />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field-shell">
            <span>Источник</span>
            <input value={draft.source} onChange={(event) => setDraft((previous) => ({ ...previous, source: event.target.value }))} />
          </label>
          <label className="field-shell">
            <span>Статус</span>
            <select value={draft.status} onChange={(event) => setDraft((previous) => ({ ...previous, status: event.target.value as IncomeStatus }))}>
              <option value="expected">Ожидается</option>
              <option value="received">Получено</option>
            </select>
          </label>
        </div>
        <label className="field-shell">
          <span>Комментарий</span>
          <textarea rows={3} value={draft.comment} onChange={(event) => setDraft((previous) => ({ ...previous, comment: event.target.value }))} />
        </label>
        <EditorActions onClose={onClose} />
      </form>
    </Modal>
  )
}

function EditorActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button className="secondary-button" onClick={onClose} type="button">
        Отмена
      </button>
      <button className="primary-button" type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        Сохранить
      </button>
    </div>
  )
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/40 p-3 sm:items-center" role="presentation">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[8px] bg-white p-4 shadow-[0_26px_80px_-30px_rgba(20,24,32,0.55)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#141820]">{title}</h2>
          <IconButton label="Закрыть" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
        {children}
      </section>
    </div>
  )
}

function Panel({
  action,
  children,
  flush = false,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  flush?: boolean
  icon: LucideIcon
  title: string
}) {
  return (
    <section className="rounded-[8px] border border-[#dfe5ec] bg-white shadow-[0_18px_45px_-38px_rgba(20,24,32,0.42)]">
      <div className="flex flex-col gap-3 border-b border-[#e8edf3] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#eefaf7] text-[#0f766e]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-[#141820]">{title}</h2>
        </div>
        {action}
      </div>
      <div className={flush ? 'p-0' : 'p-4'}>{children}</div>
    </section>
  )
}

function MetricCard({
  compact = false,
  detail,
  icon: Icon,
  label,
  tone = 'default',
  value,
}: {
  compact?: boolean
  detail?: string
  icon: LucideIcon
  label: string
  tone?: 'default' | 'success' | 'danger'
  value: string
}) {
  return (
    <article className={cx('rounded-[8px] border border-[#dfe5ec] bg-white', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#667085]">{label}</p>
          <p className={cx('mt-2 break-words font-semibold', compact ? 'text-xl' : 'text-2xl', toneClass(tone))}>{value}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-[#667085]">{detail}</p> : null}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#0f766e]" aria-hidden="true" />
      </div>
    </article>
  )
}

function PaymentMiniRow({ payment, referenceDate }: { payment: Payment; referenceDate: string }) {
  const status = getPaymentStatus(payment, referenceDate)

  return (
    <div className="grid gap-2 rounded-[8px] border border-[#e0e7ef] bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[#141820]">{payment.title}</p>
          <PaymentStatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-[#667085]">
          {formatDate(payment.dueDate)} · {CATEGORY_LABELS[payment.category]} · {payment.owner}
        </p>
      </div>
      <p className="font-semibold text-[#141820]">{formatMoney(payment.amount)}</p>
    </div>
  )
}

function SummaryRow({ danger = false, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e8edf3] py-3 last:border-b-0">
      <span className="text-sm text-[#667085]">{label}</span>
      <span className={cx('text-right text-sm font-semibold', danger ? 'text-[#be123c]' : 'text-[#141820]')}>{value}</span>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={cx('status-badge', statusBadgeClass(status))}>{PAYMENT_STATUS_LABELS[status]}</span>
}

function IncomeStatusBadge({ status }: { status: IncomeStatus }) {
  return <span className={cx('status-badge', status === 'received' ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#047857]' : 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]')}>{INCOME_STATUS_LABELS[status]}</span>
}

function IconButton({
  children,
  danger = false,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode
  danger?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-[8px] border transition',
        danger ? 'border-[#fecaca] text-[#be123c] hover:bg-[#fff1f2]' : 'border-[#d5dce6] text-[#344054] hover:bg-[#f5f7fa]',
        disabled && 'cursor-not-allowed opacity-45 hover:bg-white',
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[8px] border border-dashed border-[#cfd7e2] bg-[#f8fafc] p-4 text-sm text-[#667085]">{text}</div>
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold">{children}</th>
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}

function adjustMandatoryForPayment(accounts: Account[], editing: Payment, newAmount: number, newStatus: 'pending' | 'paid'): Account[] {
  const oldPaid = editing.status === 'paid'
  const newPaid = newStatus === 'paid'

  if (oldPaid && newPaid) {
    return adjustMandatory(accounts, editing.amount - newAmount)
  }

  if (!oldPaid && newPaid) {
    return adjustMandatory(accounts, -newAmount)
  }

  if (oldPaid && !newPaid) {
    return adjustMandatory(accounts, editing.amount)
  }

  return accounts
}

function adjustMandatoryForIncome(accounts: Account[], editing: Income, newAmount: number, newStatus: IncomeStatus): Account[] {
  const oldReceived = editing.status === 'received'
  const newReceived = newStatus === 'received'

  if (oldReceived && newReceived) {
    return adjustMandatory(accounts, newAmount - editing.amount)
  }

  if (!oldReceived && newReceived) {
    return adjustMandatory(accounts, newAmount)
  }

  if (oldReceived && !newReceived) {
    return adjustMandatory(accounts, -editing.amount)
  }

  return accounts
}

function adjustMandatory(accounts: Account[], delta: number): Account[] {
  const timestamp = nowIso()

  return accounts.map((account) =>
    account.name === 'Обязательные' ? { ...account, balance: account.balance + delta, updatedAt: timestamp } : account,
  )
}

function calendarRowClass(row: ReturnType<typeof buildCalendarRows>[number]): string {
  if (row.hasOverdue) {
    return 'border-t border-[#fecdd3] bg-[#fff1f2]'
  }

  if (row.isRisk) {
    return 'border-t border-[#fed7aa] bg-[#fff7ed]'
  }

  if (row.hasUpcomingSoon) {
    return 'border-t border-[#fde68a] bg-[#fffbeb]'
  }

  return 'border-t border-[#e8edf3] bg-white'
}

function statusBadgeClass(status: PaymentStatus): string {
  if (status === 'paid') {
    return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#047857]'
  }

  if (status === 'overdue') {
    return 'border-[#fecaca] bg-[#fff1f2] text-[#be123c]'
  }

  return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]'
}

function toneClass(tone: 'default' | 'success' | 'danger'): string {
  if (tone === 'success') {
    return 'text-[#047857]'
  }

  if (tone === 'danger') {
    return 'text-[#be123c]'
  }

  return 'text-[#141820]'
}

function loadState(): FinanceState {
  const fallback = createInitialState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as FinanceState

    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...parsed.settings },
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : fallback.accounts,
      incomes: Array.isArray(parsed.incomes) ? parsed.incomes : fallback.incomes,
      payments: Array.isArray(parsed.payments) ? parsed.payments : fallback.payments,
      logs: Array.isArray(parsed.logs) ? parsed.logs : fallback.logs,
    }
  } catch {
    return fallback
  }
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function buildExcelHtml(state: FinanceState, calendarRows: ReturnType<typeof buildCalendarRows>): string {
  const paymentRows = state.payments.map((payment) => [
    payment.dueDate,
    payment.title,
    payment.amount,
    CATEGORY_LABELS[payment.category],
    payment.owner,
    PAYMENT_STATUS_LABELS[getPaymentStatus(payment, state.settings.referenceDate)],
  ])
  const incomeRows = state.incomes.map((income) => [income.date, income.source, income.amount, INCOME_STATUS_LABELS[income.status]])
  const calendarTableRows = calendarRows.map((row) => [
    row.periodLabel,
    row.income?.source ?? '',
    row.incomeAmount,
    row.cashAfterIncome,
    row.payments.map((payment) => payment.title).join(', '),
    row.paymentsTotal,
    row.afterPayments,
    row.lifeReserve,
    row.creditReserve,
    row.free,
  ])
  const logRows = state.logs.map((log) => [formatDateTime(log.timestamp), log.action, log.entityType, log.details])

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #141820; }
    h1, h2 { color: #0f766e; }
    table { border-collapse: collapse; margin-bottom: 28px; width: 100%; }
    th { background: #dff3fb; color: #164e63; }
    th, td { border: 1px solid #cfd7e2; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>Финансовый календарь ${escapeHtml(formatMonth(state.settings.selectedMonth))}</h1>
  ${excelTable('Календарь', ['Период', 'Доход', 'Приход', 'После прихода', 'Платежи', 'Сумма платежей', 'Остаток', 'На жизнь', 'На кредиты', 'Свободно'], calendarTableRows)}
  ${excelTable('Платежи', ['Дата', 'Название', 'Сумма', 'Категория', 'Владелец', 'Статус'], paymentRows)}
  ${excelTable('Доходы', ['Дата', 'Источник', 'Сумма', 'Статус'], incomeRows)}
  ${excelTable('Логи', ['Дата', 'Действие', 'Сущность', 'Описание'], logRows)}
</body>
</html>`
}

function excelTable(title: string, headers: string[], rows: Array<Array<string | number | boolean | undefined>>): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')

  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export default App
