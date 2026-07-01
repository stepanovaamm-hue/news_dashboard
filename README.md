# Дашборд информационного поля

Локальное React + TypeScript приложение для визуальной аналитики внутреннего информационного поля компании.

## Возможности

- demo dashboard на mock data;
- загрузка готового отчёта в JSON, Markdown, TXT или CSV;
- локальный парсинг отчёта без backend;
- AI-анализ сырых постов через локальный Node-прокси;
- KPI, графики, таблицы, heatmap команд, перекосы, рекомендации и дайджест;
- экспорт JSON, Markdown и CSV.

## Обычный запуск без AI

```bash
npm install
npm run dev
```

Откройте URL, который покажет Vite.

## Запуск с AI-анализом

1. Создайте `.env` рядом с `.env.example`.

```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5-mini
AI_SERVER_PORT=8787

MCHAT_API_URL=https://mattermost.example.com
MCHAT_TOKEN=your-bot-token
MCHAT_TEAM=team-name
MCHAT_CHANNELS=town-square,announcements
```

2. Запустите frontend и локальный AI-сервер одной командой.

```bash
npm.cmd run dev:full
```

На Windows лучше использовать `npm.cmd`, если PowerShell блокирует `npm.ps1`.

## Как устроен AI-анализ

Frontend не хранит API-ключ. Блок “AI-анализ сырых постов” отправляет данные на локальный endpoint:

```text
React dashboard -> /api/analyze -> local Node server -> OpenAI Responses API -> dashboard_json -> dashboard
```

Сырые посты могут быть в CSV, JSON, Markdown или TXT. Хороший CSV-формат:

```csv
date;channel;author;team;text;reactions;comments;url
2026-05-20;#news;Иван;Product;Запускаем новую функцию;34;7;https://example.com/post-1
```

AI возвращает JSON по схеме дашборда, после чего приложение обновляет все вкладки.

## Сбор постов из МЧата / Mattermost

Если у бота есть token и права чтения каналов, приложение может собрать посты за период само:

```text
Dashboard -> /api/mattermost/collect -> Mattermost API /api/v4 -> CSV постов
Dashboard -> /api/mattermost/analyze -> Mattermost API -> OpenAI -> dashboard_json
```

Используемые endpoints Mattermost:

- `GET /api/v4/users/me` для проверки токена;
- `GET /api/v4/teams/name/{team_name}/channels/name/{channel_name}` для поиска канала;
- `GET /api/v4/channels/{channel_id}/posts?since={timestamp}` для чтения постов.

В интерфейсе укажите период, team name и каналы через запятую. Можно передавать `channel_id` напрямую, тогда `team name` не нужен.

## Проверка

```bash
npm.cmd run build
npm.cmd run lint
```
