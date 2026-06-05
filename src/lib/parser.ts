import type {
  Correlation,
  Digest,
  FieldBalanceItem,
  ImbalanceItem,
  Imbalances,
  Importance,
  LinkItem,
  Recommendation,
  ReportData,
  Team,
  TeamTopic,
  Topic,
  UnderrepresentedTeam,
  Visibility,
} from './types'
import { normalizeImportance, uniq } from './utils'

const supportedExtensions = ['json', 'md', 'markdown', 'txt', 'csv']

export function parseUploadedReport(fileName: string, text: string): ReportData {
  const extension = getExtension(fileName)

  if (!supportedExtensions.includes(extension)) {
    throw new Error('Формат не поддерживается. Загрузите JSON, Markdown, TXT или CSV.')
  }

  if (!text.trim()) {
    throw new Error('Файл пустой. Загрузите отчёт с данными для дашборда.')
  }

  if (extension === 'json') {
    return parseJsonReport(fileName, text)
  }

  if (extension === 'csv') {
    return parseCsvReport(fileName, text)
  }

  return parseMarkdownLikeReport(fileName, text)
}

function parseJsonReport(fileName: string, text: string): ReportData {
  try {
    return normalizeReport(JSON.parse(text), fileName)
  } catch {
    const extracted = extractJsonFromText(text)
    if (extracted) {
      return normalizeReport(extracted, fileName, ['JSON найден внутри текстового файла и распознан частично.'])
    }

    throw new Error('JSON невалидный. Проверьте структуру файла или загрузите отчёт по рекомендуемой схеме.')
  }
}

function parseMarkdownLikeReport(fileName: string, text: string): ReportData {
  const extracted = extractJsonFromText(text)

  if (extracted) {
    return normalizeReport(extracted, fileName, ['Найден блок dashboard_json, данные загружены из него.'])
  }

  const sections = splitMarkdownSections(text)
  const getSection = (...names: string[]) =>
    names.map((name) => sections[normalizeKey(name)]).find((value) => value?.trim())

  const summaryText = getSection('краткое резюме', 'summary')
  const mainConclusion =
    getSection('главный вывод', 'main conclusion') ??
    firstParagraph(summaryText) ??
    firstParagraph(text) ??
    'Отчёт распознан как текстовый документ. Метрики не найдены, поэтому часть блоков пустая.'

  const findings = bulletLines(summaryText ?? '')
  const topics = parseNamedList(getSection('темы', 'topics') ?? '').map((name, index) => ({
    id: slugify(name),
    name,
    count: 0,
    share: 0,
    engagement: 0,
    importance: index < 3 ? ('medium' as Importance) : undefined,
    strategicLink: /стратег/i.test(name),
    keyReasons: [],
    links: [],
  }))

  const correlations = parseNamedList(getSection('корреляции', 'correlations') ?? '').map((title) => ({
    title,
    description: '',
    relatedTopics: [],
    strength: 'medium' as const,
  }))

  const recommendations = parseNamedList(getSection('рекомендации', 'recommendations') ?? '').map((title) => ({
    title,
    action: title,
    priority: 'medium' as Importance,
  }))

  const digestSectionText = getSection('дайджест', 'digest')
  const digestItems = bulletLines(digestSectionText ?? '').map((title) => ({ title }))

  return normalizeReport(
    {
      meta: {
        companyName: fileName,
        generatedAt: new Date().toISOString().slice(0, 10),
        sourceDescription: 'Текстовый отчёт',
      },
      summary: {
        mainConclusion,
        shortFindings: findings.slice(0, 6),
      },
      topics,
      correlations,
      recommendations,
      digest: {
        title: findHeading(digestSectionText) ?? 'Дайджест по отчёту',
        intro: firstParagraph(digestSectionText),
        sections: digestItems.length ? [{ title: 'Главное', items: digestItems }] : [],
      },
    },
    fileName,
    ['Данные распознаны частично: для Markdown/TXT поддерживается упрощённое извлечение разделов.'],
  )
}

function parseCsvReport(fileName: string, text: string): ReportData {
  const rows = parseCsv(text)

  if (!rows.length) {
    throw new Error('CSV не содержит строк с данными.')
  }

  const headers = rows[0].map((header) => normalizeHeader(header))
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()))

  if (!dataRows.length) {
    throw new Error('CSV содержит только заголовки. Добавьте строки с темами или командами.')
  }

  const topicMap = new Map<string, Topic>()
  const teamMap = new Map<string, Team>()
  const fieldMap = new Map<string, FieldBalanceItem>()

  dataRows.forEach((row) => {
    const record = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = row[index]?.trim() ?? ''
      return acc
    }, {})

    const topicName = pick(record, ['topic', 'topics', 'тема', 'темы', 'category', 'категория'])
    const teamName = pick(record, ['team', 'команда', 'department', 'направление'])
    const rawCount = pick(record, ['count', 'posts', 'postcount', 'количество', 'посты', 'количество постов'])
    const rawEngagement = pick(record, ['engagement', 'вовлеченность', 'вовлечённость', 'reactions', 'реакции'])
    const url = pick(record, ['url', 'link', 'ссылка'])
    const title = pick(record, ['title', 'название', 'post', 'пост']) || topicName || teamName || 'Пост'
    const count = toNumber(rawCount) ?? 1
    const engagement = toNumber(rawEngagement) ?? 0
    const link = url ? [{ title, url }] : []

    if (topicName) {
      const current = topicMap.get(topicName) ?? {
        id: slugify(topicName),
        name: topicName,
        count: 0,
        engagement: 0,
        links: [],
      }

      current.count += count
      current.engagement = (current.engagement ?? 0) + engagement
      current.links = [...(current.links ?? []), ...link]
      current.importance = normalizeImportance(pick(record, ['importance', 'значимость'])) ?? current.importance
      current.strategicLink = parseBoolean(pick(record, ['strategiclink', 'strategy', 'стратегическая связь']))
      topicMap.set(topicName, current)

      const fieldCurrent = fieldMap.get(topicName) ?? {
        category: slugify(topicName),
        label: topicName,
        count: 0,
      }
      fieldCurrent.count += count
      fieldMap.set(topicName, fieldCurrent)
    }

    if (teamName) {
      const current = teamMap.get(teamName) ?? {
        id: slugify(teamName),
        name: teamName,
        postCount: 0,
        engagement: 0,
        visibility: 'medium',
        mainTopics: [],
        topics: [],
      }

      current.postCount += count
      current.engagement = (current.engagement ?? 0) + engagement
      if (topicName) {
        current.mainTopics = uniq([...(current.mainTopics ?? []), topicName])
        const existingTopic = current.topics?.find((item) => item.topic === topicName)
        if (existingTopic) {
          existingTopic.count += count
        } else {
          current.topics = [...(current.topics ?? []), { topic: topicName, count }]
        }
      }

      teamMap.set(teamName, current)
    }
  })

  const topics = Array.from(topicMap.values())
  const totalTopicPosts = topics.reduce((sum, topic) => sum + topic.count, 0)
  topics.forEach((topic) => {
    topic.share = totalTopicPosts ? Math.round((topic.count / totalTopicPosts) * 100) : 0
  })

  const teams = Array.from(teamMap.values()).map((team) => ({
    ...team,
    visibility: deriveVisibility(team.postCount, dataRows.length),
  }))

  return normalizeReport(
    {
      meta: {
        companyName: fileName,
        generatedAt: new Date().toISOString().slice(0, 10),
        sourceDescription: 'CSV-отчёт',
        totalPostsAnalyzed: totalTopicPosts || dataRows.length,
        totalAuthors: undefined,
        totalChannelsAnalyzed: undefined,
      },
      summary: {
        mainConclusion:
          'CSV-файл распознан по строкам с темами и командами. Детальные выводы и рекомендации появятся, если они есть в исходном отчёте JSON.',
        shortFindings: [
          topics.length ? `Распознано тем: ${topics.length}.` : 'Темы в CSV не найдены.',
          teams.length ? `Распознано команд: ${teams.length}.` : 'Команды в CSV не найдены.',
        ],
      },
      kpis: {
        totalPosts: totalTopicPosts || dataRows.length,
        topics: topics.length,
        avgEngagement: average(topics.map((topic) => topic.engagement ?? 0)),
      },
      fieldBalance: Array.from(fieldMap.values()),
      topics,
      teams,
    },
    fileName,
    ['CSV распознан базово: извлечены темы, команды, количество постов, вовлечённость и ссылки.'],
  )
}

export function normalizeReport(raw: Partial<ReportData> | Record<string, unknown>, fileName: string, warnings: string[] = []): ReportData {
  const source = (raw ?? {}) as Partial<ReportData>
  const topics = normalizeTopics(source.topics)
  const teams = normalizeTeams(source.teams)
  const fieldBalance = normalizeFieldBalance(source.fieldBalance, topics)
  const weeklyDynamics = Array.isArray(source.weeklyDynamics)
    ? source.weeklyDynamics.map((item, index) => ({
        week: String(item?.week ?? `Период ${index + 1}`),
        posts: toNumber(item?.posts) ?? 0,
        engagement: toNumber(item?.engagement),
        strategicPosts: toNumber(item?.strategicPosts),
      }))
    : []
  const toneDistribution = Array.isArray(source.toneDistribution)
    ? source.toneDistribution.map((item) => ({
        tone: String(item?.tone ?? 'Не указано'),
        count: toNumber(item?.count) ?? 0,
      }))
    : []

  const totalPosts =
    toNumber(source.kpis?.totalPosts) ??
    toNumber(source.meta?.totalPostsAnalyzed) ??
    topics.reduce((sum, topic) => sum + topic.count, 0) ??
    fieldBalance.reduce((sum, item) => sum + item.count, 0)

  return {
    meta: {
      companyName: source.meta?.companyName || 'Демо-данные',
      period: source.meta?.period || 'Период не указан',
      generatedAt: source.meta?.generatedAt || new Date().toISOString().slice(0, 10),
      sourceDescription: source.meta?.sourceDescription || `Файл ${fileName}`,
      totalPostsAnalyzed: toNumber(source.meta?.totalPostsAnalyzed) ?? totalPosts,
      totalChannelsAnalyzed: toNumber(source.meta?.totalChannelsAnalyzed),
      totalAuthors: toNumber(source.meta?.totalAuthors),
    },
    summary: {
      mainConclusion:
        source.summary?.mainConclusion ||
        'Отчёт загружен, но главный вывод не найден. Остальные блоки заполнены доступными данными.',
      shortFindings: normalizeStringArray(source.summary?.shortFindings),
      strategicIndex: toNumber(source.summary?.strategicIndex),
      usefulnessIndex: toNumber(source.summary?.usefulnessIndex),
      clarityIndex: toNumber(source.summary?.clarityIndex),
      engagementIndex: toNumber(source.summary?.engagementIndex),
      overallTone: source.summary?.overallTone,
      mainRisk: source.summary?.mainRisk,
      mainOpportunity: source.summary?.mainOpportunity,
    },
    kpis: {
      totalPosts,
      channels: toNumber(source.kpis?.channels) ?? toNumber(source.meta?.totalChannelsAnalyzed),
      authors: toNumber(source.kpis?.authors) ?? toNumber(source.meta?.totalAuthors),
      topics: toNumber(source.kpis?.topics) ?? topics.length,
      avgEngagement: toNumber(source.kpis?.avgEngagement),
      postsWithLinks: toNumber(source.kpis?.postsWithLinks),
      postsWithClearCallToAction: toNumber(source.kpis?.postsWithClearCallToAction),
      strategicPosts:
        toNumber(source.kpis?.strategicPosts) ??
        topics.filter((topic) => topic.strategicLink).reduce((sum, topic) => sum + topic.count, 0),
      employeeUsefulPosts: toNumber(source.kpis?.employeeUsefulPosts),
    },
    fieldBalance,
    weeklyDynamics,
    toneDistribution,
    topics,
    teams,
    underrepresentedTeams: normalizeUnderrepresented(source.underrepresentedTeams),
    correlations: normalizeCorrelations(source.correlations),
    imbalances: normalizeImbalances(source.imbalances),
    recommendations: normalizeRecommendations(source.recommendations),
    digest: normalizeDigest(source.digest),
    parserWarnings: [...(source.parserWarnings ?? []), ...warnings],
  }
}

function normalizeTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) {
    return []
  }

  const topics = value
    .map((item) => item as Record<string, unknown>)
    .map((item, index) => {
      const name = String(item.name ?? item.topic ?? item['тема'] ?? `Тема ${index + 1}`)
      return {
        id: item.id ? String(item.id) : slugify(name),
        name,
        count: toNumber(item.count ?? item.posts ?? item['количество']) ?? 0,
        share: toNumber(item.share ?? item['доля']),
        engagement: toNumber(item.engagement ?? item['вовлеченность'] ?? item['вовлечённость']),
        importance: normalizeImportance(String(item.importance ?? item['значимость'] ?? '')) as Importance | undefined,
        strategicLink:
          typeof item.strategicLink === 'boolean'
            ? item.strategicLink
            : parseBoolean(String(item.strategicLink ?? item.strategy ?? item['стратегическая связь'] ?? '')),
        clarity: item.clarity ? String(item.clarity) : item['ясность'] ? String(item['ясность']) : undefined,
        keyReasons: normalizeStringArray(item.keyReasons ?? item.reasons ?? item['поводы']),
        interpretation: item.interpretation ? String(item.interpretation) : undefined,
        links: normalizeLinks(item.links),
      }
    })

  const total = topics.reduce((sum, topic) => sum + topic.count, 0)
  return topics.map((topic) => ({
    ...topic,
    share: topic.share ?? (total ? Math.round((topic.count / total) * 100) : 0),
  }))
}

function normalizeTeams(value: unknown): Team[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const record = item as Record<string, unknown>
    const name = String(record.name ?? record.team ?? record['команда'] ?? `Команда ${index + 1}`)
    const topics = normalizeTeamTopics(record.topics)

    return {
      id: record.id ? String(record.id) : slugify(name),
      name,
      postCount: toNumber(record.postCount ?? record.count ?? record.posts ?? record['количество']) ?? 0,
      engagement: toNumber(record.engagement ?? record['вовлеченность'] ?? record['вовлечённость']),
      visibility: normalizeVisibility(record.visibility),
      mainTopics: normalizeStringArray(record.mainTopics ?? record['основные темы']),
      topics,
    }
  })
}

function normalizeFieldBalance(value: unknown, topics: Topic[]): FieldBalanceItem[] {
  const items = Array.isArray(value)
    ? value.map((item, index) => {
        const record = item as Record<string, unknown>
        const label = String(record.label ?? record.name ?? record.category ?? `Категория ${index + 1}`)

        return {
          category: String(record.category ?? slugify(label)),
          label,
          count: toNumber(record.count) ?? 0,
          share: toNumber(record.share),
        }
      })
    : topics.map((topic) => ({
        category: topic.id ?? slugify(topic.name),
        label: topic.name,
        count: topic.count,
        share: topic.share,
      }))

  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    share: item.share ?? (total ? Math.round((item.count / total) * 100) : 0),
  }))
}

function normalizeUnderrepresented(value: unknown): UnderrepresentedTeam[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      team: String(record.team ?? record.name ?? 'Команда'),
      reason: record.reason ? String(record.reason) : undefined,
      recommendation: record.recommendation ? String(record.recommendation) : undefined,
    }
  })
}

function normalizeCorrelations(value: unknown): Correlation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      title: String(record.title ?? 'Корреляция'),
      description: record.description ? String(record.description) : undefined,
      relatedTopics: normalizeStringArray(record.relatedTopics),
      strength: normalizeStrength(record.strength),
    }
  })
}

function normalizeImbalances(value: unknown): Imbalances {
  const record = (value ?? {}) as Record<string, unknown>

  return {
    tooLoud: normalizeImbalanceItems(record.tooLoud),
    tooQuiet: normalizeImbalanceItems(record.tooQuiet),
    blindSpots: normalizeImbalanceItems(record.blindSpots),
    gaps: normalizeImbalanceItems(record.gaps),
  }
}

function normalizeImbalanceItems(value: unknown): ImbalanceItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      title: String(record.title ?? 'Наблюдение'),
      observation: record.observation ? String(record.observation) : undefined,
      whyItMatters: record.whyItMatters ? String(record.whyItMatters) : undefined,
      recommendation: record.recommendation ? String(record.recommendation) : undefined,
      links: normalizeLinks(record.links),
    }
  })
}

function normalizeRecommendations(value: unknown): Recommendation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      title: String(record.title ?? 'Рекомендация'),
      problem: record.problem ? String(record.problem) : undefined,
      action: record.action ? String(record.action) : undefined,
      expectedEffect: record.expectedEffect ? String(record.expectedEffect) : undefined,
      priority: normalizeImportance(String(record.priority ?? '')) as Importance | undefined,
      complexity: normalizeImportance(String(record.complexity ?? '')) as Importance | undefined,
      topic: record.topic ? String(record.topic) : undefined,
      owner: record.owner ? String(record.owner) : undefined,
    }
  })
}

function normalizeDigest(value: unknown): Digest {
  const record = (value ?? {}) as Record<string, unknown>
  const sectionsValue = record.sections
  const sections = Array.isArray(sectionsValue)
    ? sectionsValue.map((section) => {
        const sectionRecord = section as Record<string, unknown>
        const itemsValue = sectionRecord.items
        const items = Array.isArray(itemsValue)
          ? itemsValue.map((item) => {
              const itemRecord = item as Record<string, unknown>
              return {
                title: String(itemRecord.title ?? 'Новость'),
                description: itemRecord.description ? String(itemRecord.description) : undefined,
                whyImportant: itemRecord.whyImportant ? String(itemRecord.whyImportant) : undefined,
                link: itemRecord.link ? String(itemRecord.link) : undefined,
              }
            })
          : []

        return {
          title: String(sectionRecord.title ?? 'Раздел'),
          items,
        }
      })
    : []

  return {
    title: record.title ? String(record.title) : undefined,
    intro: record.intro ? String(record.intro) : undefined,
    sections,
  }
}

function normalizeLinks(value: unknown): LinkItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item.url)
    .map((item) => ({
      title: String(item.title ?? item.url),
      url: String(item.url),
    }))
}

function normalizeTeamTopics(value: unknown): TeamTopic[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      topic: String(record.topic ?? record.name ?? 'Тема'),
      count: toNumber(record.count) ?? 0,
    }
  })
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;|\|/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

function normalizeVisibility(value: unknown): Visibility | undefined {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  const lowered = String(value ?? '').toLowerCase()
  if (['высокая', 'высокий'].includes(lowered)) {
    return 'high'
  }
  if (['средняя', 'средний'].includes(lowered)) {
    return 'medium'
  }
  if (['низкая', 'низкий'].includes(lowered)) {
    return 'low'
  }

  return undefined
}

function normalizeStrength(value: unknown): 'high' | 'medium' | 'low' | undefined {
  const normalized = normalizeImportance(String(value ?? ''))
  return normalized
}

function extractJsonFromText(text: string): unknown | null {
  const dashboardBlock = text.match(/dashboard_json[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i)
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i)
  const candidates = [dashboardBlock?.[1], fencedJson?.[1], sliceJsonObject(text)].filter(Boolean)

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate as string)
    } catch {
      continue
    }
  }

  return null
}

function sliceJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return text.slice(start, end + 1)
}

function splitMarkdownSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  let current = 'root'
  sections[current] = ''

  text.split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^#{1,4}\s+(.+)$/)
    if (heading) {
      current = normalizeKey(heading[1])
      sections[current] = ''
      return
    }

    sections[current] += `${line}\n`
  })

  return sections
}

function parseNamedList(text: string): string[] {
  return bulletLines(text)
    .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)
}

function bulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim())
}

function firstParagraph(text?: string): string | undefined {
  return text
    ?.split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/^#{1,4}\s+/, '').trim())
    .find(Boolean)
}

function findHeading(text?: string): string | undefined {
  return text?.match(/^#{1,4}\s+(.+)$/m)?.[1]?.trim()
}

function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell)
  rows.push(row)

  return rows.filter((item) => item.some((cellValue) => cellValue.trim()))
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const variants = [';', ',', '\t']
  return variants.sort((a, b) => countChar(firstLine, b) - countChar(firstLine, a))[0]
}

function countChar(text: string, char: string): number {
  return text.split(char).length - 1
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ')
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replaceAll('ё', 'е')
}

function pick(record: Record<string, string>, keys: string[]): string {
  const normalizedKeys = keys.map(normalizeHeader)
  for (const key of normalizedKeys) {
    if (record[key]) {
      return record[key]
    }
  }
  return ''
}

function parseBoolean(value?: string): boolean | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (['true', 'yes', 'да', 'есть', '1'].includes(normalized)) {
    return true
  }

  if (['false', 'no', 'нет', '0'].includes(normalized)) {
    return false
  }

  return undefined
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^\d.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function average(values: number[]): number | undefined {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) {
    return undefined
  }

  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

function deriveVisibility(count: number, totalRows: number): Visibility {
  const share = totalRows ? count / totalRows : 0
  if (share >= 0.18) {
    return 'high'
  }
  if (share >= 0.08) {
    return 'medium'
  }
  return 'low'
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}
