import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { reportJsonSchema } from './report-schema.mjs'
import { collectMattermostPosts, getMattermostStatus } from './mattermost-client.mjs'

loadEnvFile('.env')
loadEnvFile('.env.local')

const port = Number(process.env.AI_SERVER_PORT ?? 8787)
const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
const maxBodyBytes = 2 * 1024 * 1024
const maxRawTextChars = 500_000

const server = createServer(async (request, response) => {
  setCorsHeaders(response)

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && request.url === '/api/ai-status') {
      sendJson(response, 200, {
        configured: hasUsableOpenAiKey(process.env.OPENAI_API_KEY),
        model,
        maxRawTextChars,
      })
      return
    }

    if (request.method === 'GET' && request.url === '/api/mattermost/status') {
      sendJson(response, 200, getMattermostStatus())
      return
    }

    if (request.method === 'POST' && request.url === '/api/analyze') {
      const body = await readJsonBody(request)
      const result = await analyzeRawPosts(body)
      sendJson(response, 200, result)
      return
    }

    if (request.method === 'POST' && request.url === '/api/mattermost/collect') {
      const body = await readJsonBody(request)
      const result = await collectMattermostPosts(body)
      sendJson(response, 200, result)
      return
    }

    if (request.method === 'POST' && request.url === '/api/mattermost/analyze') {
      const body = await readJsonBody(request)
      const collected = await collectMattermostPosts(body)
      const result = await analyzeRawPosts({
        rawText: collected.rawText,
        fileName: `mattermost-${collected.source.fromDate.slice(0, 10)}-${collected.source.toDate.slice(0, 10)}.csv`,
        companyName: body?.companyName,
        period: `${collected.source.fromDate.slice(0, 10)} - ${collected.source.toDate.slice(0, 10)}`,
        sourceDescription: `Mattermost / МЧат: ${collected.source.channels.map((channel) => channel.displayName).join(', ')}`,
      })
      sendJson(response, 200, {
        ...result,
        collected,
      })
      return
    }

    sendJson(response, 404, { error: 'Маршрут не найден.' })
  } catch (error) {
    console.error(error)
    const message = error instanceof AppError ? error.message : 'Не удалось выполнить AI-анализ.'
    const status = error instanceof AppError ? error.status : 500
    sendJson(response, status, { error: message })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`AI analysis server is running on http://127.0.0.1:${port}`)
  console.log(`Model: ${model}`)
})

async function analyzeRawPosts(body) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!hasUsableOpenAiKey(apiKey)) {
    throw new AppError(
      503,
      'AI-анализ не настроен: добавьте настоящий OPENAI_API_KEY в .env. Ключ должен начинаться с sk- и не содержать кириллицу.',
    )
  }

  const rawText = String(body?.rawText ?? '').trim()
  if (rawText.length < 20) {
    throw new AppError(400, 'Добавьте сырые посты: текст, CSV или JSON со строками сообщений.')
  }

  if (rawText.length > maxRawTextChars) {
    throw new AppError(
      413,
      `Слишком большой объём для одного AI-запроса: ${rawText.length} символов. Сократите до ${maxRawTextChars} символов или разделите период.`,
    )
  }

  const prompt = buildAnalysisPrompt({
    rawText,
    fileName: body?.fileName,
    companyName: body?.companyName,
    period: body?.period,
    sourceDescription: body?.sourceDescription,
  })

  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'Ты senior-аналитик внутреннего информационного поля компании. Анализируй только предоставленные пользователем данные. Возвращай валидный JSON для dashboard_json без markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'information_field_dashboard_report',
          description: 'Структурированный отчёт для визуального дашборда внутреннего информационного поля.',
          schema: reportJsonSchema,
          strict: false,
        },
      },
    }),
  })

  const payload = await openAiResponse.json().catch(() => null)

  if (!openAiResponse.ok) {
    const apiMessage = payload?.error?.message || 'OpenAI API вернул ошибку.'
    throw new AppError(openAiResponse.status, apiMessage)
  }

  const outputText = extractOutputText(payload)
  const parsed = parseReportJson(outputText)

  return {
    report: parsed,
    model,
    warnings: [
      'Отчёт создан AI-моделью на основе сырых постов. Проверьте чувствительные выводы перед распространением.',
    ],
  }
}

function buildAnalysisPrompt({ rawText, fileName, companyName, period, sourceDescription }) {
  return `Проанализируй сырые посты внутреннего информационного поля компании и сформируй dashboard_json.

Контекст:
- companyName: ${companyName || 'не указано'}
- period: ${period || 'не указано'}
- sourceDescription: ${sourceDescription || 'сырые посты из корпоративных каналов'}
- fileName: ${fileName || 'ручной ввод'}

Что считать входными данными:
- Это могут быть CSV, JSON, Markdown, TXT или смешанный текст.
- Если есть поля date, channel, author, team, text, reactions, comments, url, используй их.
- Если структура неявная, извлекай темы, команды, тональность и вовлечённость эвристически из текста.

Требования к анализу:
- Не выдумывай конкретные ссылки, авторов, каналы и цифры, если их нет во входных данных.
- Если метрики неизвестны, используй null или пустые массивы, но ключевые поля не удаляй.
- Сохраняй ссылки на исходные посты в links.
- Для importance, priority, complexity, visibility используй только high, medium, low.
- Индексы strategicIndex, usefulnessIndex, clarityIndex, engagementIndex оцени по шкале 0-100.
- Сформируй практичные рекомендации для internal comms / HR / brand / leadership-команды.
- Сформируй digest для сотрудников с секциями и объяснением "почему важно".
- Верни только JSON-объект, без markdown и без пояснений.

Сырые посты:
${rawText}`
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string') {
    return payload.output_text
  }

  const chunks = []
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') {
        chunks.push(content.text)
      }
      if (typeof content?.content === 'string') {
        chunks.push(content.content)
      }
    }
  }

  return chunks.join('\n').trim()
}

function parseReportJson(text) {
  if (!text) {
    throw new AppError(502, 'AI не вернул JSON. Попробуйте сократить входные данные и повторить анализ.')
  }

  const candidates = [text, text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1], sliceJsonObject(text)].filter(Boolean)

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }

  throw new AppError(502, 'AI вернул ответ, но его не удалось разобрать как dashboard_json.')
}

function sliceJsonObject(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return start >= 0 && end > start ? text.slice(start, end + 1) : ''
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0
    const chunks = []

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBodyBytes) {
        rejectBody(new AppError(413, 'Файл слишком большой для AI-анализа. Сократите входные данные.'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })

    request.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolveBody(text ? JSON.parse(text) : {})
      } catch {
        rejectBody(new AppError(400, 'Не удалось прочитать JSON-запрос для AI-анализа.'))
      }
    })

    request.on('error', rejectBody)
  })
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5174')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName)
  if (!existsSync(path)) {
    return
  }

  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^["']|["']$/g, '')
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

class AppError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function hasUsableOpenAiKey(value) {
  return typeof value === 'string' && value.startsWith('sk-') && /^[\x20-\x7E]+$/.test(value)
}
