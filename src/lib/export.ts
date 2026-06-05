import type { Digest, ReportData, Topic } from './types'

export const dashboardJsonPrompt = `В конце отчёта обязательно сформируй блок \`dashboard_json\` — валидный JSON без комментариев, по схеме дашборда информационного поля.

JSON должен включать:
- meta;
- summary;
- kpis;
- fieldBalance;
- weeklyDynamics;
- toneDistribution;
- topics;
- teams;
- underrepresentedTeams;
- correlations;
- imbalances;
- recommendations;
- digest.

Если данных нет, используй пустые массивы или null, но не удаляй ключевые поля.
Ссылки на исходные посты сохраняй в массивах \`links\`.
Не добавляй в JSON markdown-разметку.`

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function buildDigestMarkdown(digest: Digest): string {
  if (!digest?.title && !digest?.intro && !digest?.sections?.length) {
    return '# Дайджест не найден\n'
  }

  const lines: string[] = [`# ${digest.title ?? 'Дайджест компании'}`, '']

  if (digest.intro) {
    lines.push(digest.intro, '')
  }

  digest.sections?.forEach((section) => {
    lines.push(`## ${section.title}`, '')

    if (!section.items.length) {
      lines.push('Нет новостей в разделе.', '')
      return
    }

    section.items.forEach((item) => {
      lines.push(`### ${item.title}`)

      if (item.description) {
        lines.push(`Коротко: ${item.description}`)
      }

      if (item.whyImportant) {
        lines.push(`Почему важно: ${item.whyImportant}`)
      }

      if (item.link) {
        lines.push(`Подробнее: ${item.link}`)
      }

      lines.push('')
    })
  })

  return lines.join('\n').trimEnd() + '\n'
}

export function buildSummaryMarkdown(data: ReportData): string {
  const lines = ['# Краткое резюме информационного поля', '']
  const { summary } = data

  if (summary.mainConclusion) {
    lines.push('## Главный вывод', summary.mainConclusion, '')
  }

  if (summary.mainRisk) {
    lines.push('## Риск', summary.mainRisk, '')
  }

  if (summary.mainOpportunity) {
    lines.push('## Возможность', summary.mainOpportunity, '')
  }

  if (summary.shortFindings?.length) {
    lines.push('## Ключевые наблюдения')
    summary.shortFindings.forEach((finding) => lines.push(`- ${finding}`))
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function buildTopicsCsv(topics: Topic[]): string {
  const rows = [
    ['тема', 'количество постов', 'доля', 'вовлеченность', 'значимость', 'стратегическая связь'],
    ...topics.map((topic) => [
      topic.name,
      String(topic.count ?? ''),
      topic.share === undefined ? '' : String(topic.share),
      topic.engagement === undefined ? '' : String(topic.engagement),
      topic.importance ?? '',
      topic.strategicLink === undefined ? '' : topic.strategicLink ? 'да' : 'нет',
    ]),
  ]

  return rows.map((row) => row.map(escapeCsvCell).join(';')).join('\n')
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
  return Promise.resolve()
}

export function stripInternalFields(data: ReportData): ReportData {
  const { parserWarnings, ...cleanData } = data
  void parserWarnings
  return cleanData
}

function escapeCsvCell(value: string): string {
  const normalized = value.replaceAll('"', '""')
  return `"${normalized}"`
}
