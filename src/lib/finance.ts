export type AccountName = 'Обязательные' | 'Жизнь' | 'Запас' | 'Свободно'
export type IncomeStatus = 'expected' | 'received'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'
export type PaymentCategory = 'credit' | 'utilities' | 'childcare' | 'debt' | 'other'
export type PaymentOwner = 'Маша' | 'Кирилл' | 'общий'
export type LogEntityType = 'payment' | 'income' | 'account' | 'settings'

export interface Account {
  id: string
  name: AccountName
  balance: number
  createdAt: string
  updatedAt: string
}

export interface Income {
  id: string
  date: string
  amount: number
  source: string
  status: IncomeStatus
  comment: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  dueDate: string
  title: string
  amount: number
  category: PaymentCategory
  owner: PaymentOwner
  status: PaymentStatus
  paidAt?: string
  comment: string
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}

export interface LogEntry {
  id: string
  timestamp: string
  action: string
  entityType: LogEntityType
  entityId: string
  details: string
}

export interface FinanceSettings {
  referenceDate: string
  selectedMonth: string
  lifeReservePerPeriod: number
  creditReservePerPeriod: number
}

export interface FinanceState {
  accounts: Account[]
  incomes: Income[]
  payments: Payment[]
  logs: LogEntry[]
  settings: FinanceSettings
}

export interface CalendarRow {
  id: string
  startDate: string
  endDate: string
  periodLabel: string
  income?: Income
  payments: Payment[]
  incomeAmount: number
  cashAfterIncome: number
  paymentsTotal: number
  afterPayments: number
  lifeReserve: number
  creditReserve: number
  free: number
  hasOverdue: boolean
  hasUpcomingSoon: boolean
  isRisk: boolean
}

export interface TodaySnapshot {
  currentBalance: number
  mandatoryBalance: number
  freeBalance: number
  nextPayment?: Payment
  nextIncome?: Income
  dueBeforeNextIncome: Payment[]
  dueBeforeNextIncomeTotal: number
  upcomingWeek: Payment[]
  shortage: number
  enoughUntilNextIncome: boolean
  realFree: number
}

export const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  credit: 'Кредиты',
  utilities: 'Коммунальные',
  childcare: 'Дети',
  debt: 'Долги',
  other: 'Другое',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Не оплачен',
  paid: 'Оплачен',
  overdue: 'Просрочен',
}

export const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  expected: 'Ожидается',
  received: 'Получено',
}

export const PAYMENT_CATEGORIES: PaymentCategory[] = ['credit', 'utilities', 'childcare', 'debt', 'other']
export const PAYMENT_OWNERS: PaymentOwner[] = ['общий', 'Маша', 'Кирилл']

const createdAt = '2026-04-01T08:00:00.000Z'

export function createInitialState(): FinanceState {
  return {
    accounts: [
      createAccount('account_required', 'Обязательные', 120000),
      createAccount('account_life', 'Жизнь', 85000),
      createAccount('account_reserve', 'Запас', 40000),
      createAccount('account_free', 'Свободно', 22000),
    ],
    incomes: [
      createIncome('income_2026_04_05_kirill', '2026-04-05', 'Кирилл', 200000),
      createIncome('income_2026_04_10_masha', '2026-04-10', 'Маша', 83000),
      createIncome('income_2026_04_20_kirill', '2026-04-20', 'Кирилл', 186000),
      createIncome('income_2026_04_24_masha', '2026-04-24', 'Маша', 76000),
      createIncome('income_2026_05_05_kirill', '2026-05-05', 'Кирилл', 170000),
      createIncome('income_2026_05_10_masha', '2026-05-10', 'Маша', 70000),
      createIncome('income_2026_05_20_kirill', '2026-05-20', 'Кирилл', 168000),
      createIncome('income_2026_05_25_masha', '2026-05-25', 'Маша', 69000),
    ],
    payments: [
      createPayment('payment_2026_04_01_teatralka', '2026-04-01', 'Театралка Сава', 7000, 'other', 'общий'),
      createPayment('payment_2026_04_06_sber', '2026-04-06', 'Сбер', 17000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_06_split', '2026-04-06', 'Сплит', 6000, 'credit', 'общий'),
      createPayment('payment_2026_04_10_psb', '2026-04-10', 'ПСБ', 37000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_10_gazprom', '2026-04-10', 'Газпром', 2600, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_10_kindergarten', '2026-04-10', 'Детский сад', 14000, 'childcare', 'общий'),
      createPayment('payment_2026_04_10_sber_masha', '2026-04-10', 'Сбер Маша', 5000, 'credit', 'Маша'),
      createPayment('payment_2026_04_18_tinkoff', '2026-04-18', 'Тинькофф', 6800, 'credit', 'Маша'),
      createPayment('payment_2026_04_20_masha_father', '2026-04-20', 'Папа Маши', 21000, 'credit', 'Маша'),
      createPayment('payment_2026_04_20_kirill_father', '2026-04-20', 'Папа Кирилла', 10000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_20_loko', '2026-04-20', 'Локо', 64000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_20_psb', '2026-04-20', 'ПСБ', 13000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_20_pochtabank', '2026-04-20', 'Почтабанк', 3500, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_20_sber', '2026-04-20', 'Сбер', 30000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_23_alfa', '2026-04-23', 'Альфа', 19000, 'credit', 'Кирилл'),
      createPayment('payment_2026_04_24_sber_masha', '2026-04-24', 'Сбер Маша', 41000, 'credit', 'Маша'),
    ],
    logs: [
      {
        id: 'log_seed_data',
        timestamp: createdAt,
        action: 'seed',
        entityType: 'settings',
        entityId: 'initial',
        details: 'Загружены стартовые доходы, платежи и счета из пакета спецификаций.',
      },
    ],
    settings: {
      referenceDate: '2026-04-06',
      selectedMonth: '2026-04',
      lifeReservePerPeriod: 40000,
      creditReservePerPeriod: 25000,
    },
  }
}

function createAccount(id: string, name: AccountName, balance: number): Account {
  return { id, name, balance, createdAt, updatedAt: createdAt }
}

function createIncome(id: string, date: string, source: string, amount: number): Income {
  return { id, date, amount, source, status: 'expected', comment: '', createdAt, updatedAt: createdAt }
}

function createPayment(
  id: string,
  dueDate: string,
  title: string,
  amount: number,
  category: PaymentCategory,
  owner: PaymentOwner,
): Payment {
  return {
    id,
    dueDate,
    title,
    amount,
    category,
    owner,
    status: 'pending',
    comment: '',
    isRecurring: true,
    createdAt,
    updatedAt: createdAt,
  }
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value))
}

export function formatDate(isoDate?: string): string {
  if (!isoDate) {
    return 'нет даты'
  }

  return parseIsoDate(isoDate).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatShortDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function compareIso(left: string, right: string): number {
  return left.localeCompare(right)
}

export function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function getMonthBounds(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number)
  return {
    start: `${monthKey}-01`,
    end: toIsoDate(new Date(year, month, 0)),
  }
}

export function getPaymentStatus(payment: Payment, referenceDate: string): PaymentStatus {
  if (payment.status === 'paid') {
    return 'paid'
  }

  if (compareIso(payment.dueDate, referenceDate) < 0) {
    return 'overdue'
  }

  return 'pending'
}

export function getAccountBalance(state: FinanceState, name: AccountName): number {
  return state.accounts.find((account) => account.name === name)?.balance ?? 0
}

export function getTotalBalance(state: FinanceState): number {
  return state.accounts.reduce((sum, account) => sum + account.balance, 0)
}

export function getMonthOptions(state: FinanceState): string[] {
  const months = new Set<string>()

  for (const income of state.incomes) {
    months.add(getMonthKey(income.date))
  }

  for (const payment of state.payments) {
    months.add(getMonthKey(payment.dueDate))
  }

  months.add(state.settings.selectedMonth)
  return Array.from(months).sort()
}

export function buildCalendarRows(state: FinanceState, monthKey: string): CalendarRow[] {
  const bounds = getMonthBounds(monthKey)
  const incomes = state.incomes
    .filter((income) => getMonthKey(income.date) === monthKey)
    .sort((left, right) => compareIso(left.date, right.date))
  const rows: CalendarRow[] = []
  let rollingBalance = getTotalBalance(state)

  if (incomes.length === 0) {
    return [
      buildCalendarRow({
        state,
        id: `empty_${monthKey}`,
        startDate: bounds.start,
        endDate: bounds.end,
        rollingBalance,
      }),
    ]
  }

  const firstIncome = incomes[0]

  if (compareIso(bounds.start, firstIncome.date) < 0) {
    const openingEnd = addDays(firstIncome.date, -1)
    const openingRow = buildCalendarRow({
      state,
      id: `opening_${monthKey}`,
      startDate: bounds.start,
      endDate: openingEnd,
      rollingBalance,
    })
    rows.push(openingRow)
    rollingBalance = openingRow.afterPayments
  }

  incomes.forEach((income, index) => {
    const nextIncome = incomes[index + 1]
    const endDate = nextIncome ? addDays(nextIncome.date, -1) : bounds.end
    const row = buildCalendarRow({
      state,
      id: income.id,
      startDate: income.date,
      endDate,
      rollingBalance,
      income,
    })
    rows.push(row)
    rollingBalance = row.afterPayments
  })

  return rows
}

function buildCalendarRow({
  state,
  id,
  startDate,
  endDate,
  rollingBalance,
  income,
}: {
  state: FinanceState
  id: string
  startDate: string
  endDate: string
  rollingBalance: number
  income?: Income
}): CalendarRow {
  const payments = state.payments
    .filter((payment) => compareIso(payment.dueDate, startDate) >= 0 && compareIso(payment.dueDate, endDate) <= 0)
    .sort((left, right) => compareIso(left.dueDate, right.dueDate))
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const incomeAmount = income?.amount ?? 0
  const cashAfterIncome = rollingBalance + incomeAmount
  const afterPayments = cashAfterIncome - paymentsTotal
  const lifeReserve = Math.min(Math.max(afterPayments, 0), state.settings.lifeReservePerPeriod)
  const creditReserve = Math.min(Math.max(afterPayments - lifeReserve, 0), state.settings.creditReservePerPeriod)
  const free = afterPayments - lifeReserve - creditReserve
  const upcomingLimit = addDays(state.settings.referenceDate, 5)
  const hasOverdue = payments.some((payment) => getPaymentStatus(payment, state.settings.referenceDate) === 'overdue')
  const hasUpcomingSoon = payments.some((payment) => {
    const status = getPaymentStatus(payment, state.settings.referenceDate)
    return status !== 'paid' && compareIso(payment.dueDate, state.settings.referenceDate) >= 0 && compareIso(payment.dueDate, upcomingLimit) <= 0
  })

  return {
    id,
    startDate,
    endDate,
    periodLabel: `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`,
    income,
    payments,
    incomeAmount,
    cashAfterIncome,
    paymentsTotal,
    afterPayments,
    lifeReserve,
    creditReserve,
    free,
    hasOverdue,
    hasUpcomingSoon,
    isRisk: free < 0,
  }
}

export function buildTodaySnapshot(state: FinanceState): TodaySnapshot {
  const referenceDate = state.settings.referenceDate
  const mandatoryBalance = getAccountBalance(state, 'Обязательные')
  const freeBalance = getAccountBalance(state, 'Свободно')
  const currentBalance = getTotalBalance(state)
  const unpaid = state.payments
    .filter((payment) => getPaymentStatus(payment, referenceDate) !== 'paid')
    .sort((left, right) => compareIso(left.dueDate, right.dueDate))
  const nextPayment = unpaid.find((payment) => compareIso(payment.dueDate, referenceDate) >= 0)
  const nextIncome = state.incomes
    .filter((income) => compareIso(income.date, referenceDate) >= 0)
    .sort((left, right) => compareIso(left.date, right.date))[0]
  const nextIncomeDate = nextIncome?.date
  const dueBeforeNextIncome = unpaid.filter((payment) => {
    if (!nextIncomeDate) {
      return compareIso(payment.dueDate, referenceDate) <= 0
    }

    return compareIso(payment.dueDate, nextIncomeDate) < 0
  })
  const dueBeforeNextIncomeTotal = dueBeforeNextIncome.reduce((sum, payment) => sum + payment.amount, 0)
  const shortage = Math.max(0, dueBeforeNextIncomeTotal - mandatoryBalance)
  const weekLimit = addDays(referenceDate, 7)
  const upcomingWeek = unpaid.filter(
    (payment) => compareIso(payment.dueDate, referenceDate) >= 0 && compareIso(payment.dueDate, weekLimit) <= 0,
  )
  const realFree = currentBalance - dueBeforeNextIncomeTotal - state.settings.lifeReservePerPeriod - state.settings.creditReservePerPeriod

  return {
    currentBalance,
    mandatoryBalance,
    freeBalance,
    nextPayment,
    nextIncome,
    dueBeforeNextIncome,
    dueBeforeNextIncomeTotal,
    upcomingWeek,
    shortage,
    enoughUntilNextIncome: shortage === 0,
    realFree,
  }
}

export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | undefined>>): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(';'))
  return `\uFEFF${lines.join('\n')}`
}

function csvCell(value: string | number | boolean | undefined): string {
  const text = value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function escapeHtml(value: string | number | boolean | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
