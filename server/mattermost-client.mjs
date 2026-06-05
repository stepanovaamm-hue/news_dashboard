const maxChannelsPerRequest = 30
const maxPagesPerChannel = 50
const perPage = 100

export function getMattermostConfig() {
  return {
    baseUrl: process.env.MCHAT_API_URL || process.env.MATTERMOST_API_URL || '',
    token: process.env.MCHAT_TOKEN || process.env.MATTERMOST_TOKEN || '',
    defaultTeam: process.env.MCHAT_TEAM || process.env.MATTERMOST_TEAM || '',
    defaultChannels: splitList(process.env.MCHAT_CHANNELS || process.env.MATTERMOST_CHANNELS || ''),
  }
}

export function getMattermostStatus() {
  const config = getMattermostConfig()
  return {
    configured: Boolean(config.baseUrl && config.token),
    baseUrl: config.baseUrl ? maskUrl(config.baseUrl) : '',
    defaultTeam: config.defaultTeam,
    defaultChannels: config.defaultChannels,
    maxChannelsPerRequest,
  }
}

export async function collectMattermostPosts(options = {}) {
  const config = getMattermostConfig()

  if (!config.baseUrl || !config.token) {
    throw createMattermostError(
      503,
      'МЧат не настроен: добавьте MCHAT_API_URL и MCHAT_TOKEN в .env, затем перезапустите npm.cmd run dev:full.',
    )
  }

  const teamName = String(options.teamName || config.defaultTeam || '').trim()
  const channels = splitList(options.channels || '').length ? splitList(options.channels) : config.defaultChannels

  if (!channels.length) {
    throw createMattermostError(400, 'Укажите каналы МЧата через запятую или задайте MCHAT_CHANNELS в .env.')
  }

  if (channels.length > maxChannelsPerRequest) {
    throw createMattermostError(400, `Слишком много каналов за раз. Максимум: ${maxChannelsPerRequest}.`)
  }

  const fromMs = parseDateMs(options.fromDate, 'fromDate')
  const toMs = parseDateMs(options.toDate, 'toDate', true)

  if (fromMs > toMs) {
    throw createMattermostError(400, 'Дата начала периода не может быть позже даты окончания.')
  }

  const requester = createRequester(config)
  const me = await requester('/users/me')
  const normalizedChannels = []
  const posts = []

  for (const channelInput of channels) {
    const channel = await resolveChannel({ requester, teamName, channelInput })
    normalizedChannels.push({
      id: channel.id,
      name: channel.name,
      displayName: channel.display_name || channel.name,
    })

    const channelPosts = await fetchChannelPosts({
      requester,
      channel,
      fromMs,
      toMs,
      includeReplies: Boolean(options.includeReplies),
    })

    posts.push(...channelPosts)
  }

  posts.sort((a, b) => a.createAt - b.createAt)

  return {
    source: {
      user: me.username || me.email || me.id,
      teamName,
      channels: normalizedChannels,
      fromDate: new Date(fromMs).toISOString(),
      toDate: new Date(toMs).toISOString(),
      totalPosts: posts.length,
    },
    posts,
    rawText: postsToCsv(posts),
  }
}

async function resolveChannel({ requester, teamName, channelInput }) {
  const channel = String(channelInput).trim()
  if (!channel) {
    throw createMattermostError(400, 'Передано пустое название канала.')
  }

  if (looksLikeMattermostId(channel)) {
    return requester(`/channels/${encodeURIComponent(channel)}`)
  }

  if (!teamName) {
    throw createMattermostError(
      400,
      `Для канала "${channel}" нужно указать team name или передать channel_id напрямую.`,
    )
  }

  return requester(
    `/teams/name/${encodeURIComponent(teamName)}/channels/name/${encodeURIComponent(normalizeChannelName(channel))}`,
  )
}

async function fetchChannelPosts({ requester, channel, fromMs, toMs, includeReplies }) {
  const collected = []
  const seen = new Set()

  for (let page = 0; page < maxPagesPerChannel; page += 1) {
    const payload = await requester(
      `/channels/${encodeURIComponent(channel.id)}/posts?since=${fromMs}&page=${page}&per_page=${perPage}`,
    )

    const order = Array.isArray(payload.order) ? payload.order : []
    const postsMap = payload.posts || {}

    if (!order.length) {
      break
    }

    let foundOlderPageOnly = true

    for (const postId of order) {
      const post = postsMap[postId]
      if (!post || seen.has(post.id)) {
        continue
      }
      seen.add(post.id)

      const createAt = Number(post.create_at || 0)
      if (createAt >= fromMs && createAt <= toMs) {
        foundOlderPageOnly = false
      }

      if (createAt < fromMs || createAt > toMs) {
        continue
      }

      if (post.delete_at || (!includeReplies && post.root_id)) {
        continue
      }

      if (!String(post.message || '').trim()) {
        continue
      }

      collected.push(normalizePost(post, channel))
    }

    if (order.length < perPage || foundOlderPageOnly) {
      break
    }
  }

  return collected
}

function normalizePost(post, channel) {
  const reactions =
    Array.isArray(post.metadata?.reactions) && post.metadata.reactions.length
      ? post.metadata.reactions.length
      : Number(post.props?.reactions_count || 0)

  return {
    id: post.id,
    date: new Date(Number(post.create_at)).toISOString(),
    createAt: Number(post.create_at),
    channelId: channel.id,
    channel: channel.display_name || channel.name,
    channelName: channel.name,
    authorId: post.user_id,
    text: String(post.message || '').replace(/\s+/g, ' ').trim(),
    reactions,
    comments: Number(post.reply_count || 0),
    url: buildPostUrl(channel, post.id),
  }
}

function buildPostUrl(channel, postId) {
  const config = getMattermostConfig()
  const baseUrl = String(config.baseUrl).replace(/\/api\/v4\/?$/, '').replace(/\/$/, '')
  return `${baseUrl}/_redirect/pl/${postId}`
}

function createRequester(config) {
  const apiBase = normalizeApiBase(config.baseUrl)

  return async function requestJson(path) {
    const response = await fetch(`${apiBase}${path}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
    })

    const text = await response.text()
    const payload = text ? tryParseJson(text) : null

    if (!response.ok) {
      const message = payload?.message || payload?.error || `Mattermost API вернул HTTP ${response.status}.`
      throw createMattermostError(response.status, message)
    }

    return payload
  }
}

function postsToCsv(posts) {
  const rows = [
    ['date', 'channel', 'author_id', 'text', 'reactions', 'comments', 'url'],
    ...posts.map((post) => [
      post.date,
      post.channel,
      post.authorId,
      post.text,
      String(post.reactions),
      String(post.comments),
      post.url,
    ]),
  ]

  return rows.map((row) => row.map(escapeCsvCell).join(';')).join('\n')
}

function escapeCsvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function normalizeApiBase(baseUrl) {
  const cleaned = String(baseUrl).trim().replace(/\/$/, '')
  return cleaned.endsWith('/api/v4') ? cleaned : `${cleaned}/api/v4`
}

function normalizeChannelName(channel) {
  return channel.replace(/^~/, '').replace(/^#/, '').trim()
}

function looksLikeMattermostId(value) {
  return /^[a-z0-9]{20,32}$/i.test(value)
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  return String(value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseDateMs(value, fieldName, endOfDay = false) {
  if (!value) {
    throw createMattermostError(400, `Укажите ${fieldName}.`)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw createMattermostError(400, `Некорректная дата ${fieldName}.`)
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(23, 59, 59, 999)
  }

  return date.getTime()
}

function tryParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function maskUrl(value) {
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname.replace(/\/api\/v4\/?$/, '')}`
  } catch {
    return value
  }
}

function createMattermostError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
