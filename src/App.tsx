import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Compass,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  Home,
  Leaf,
  LibraryBig,
  MessagesSquare,
  Route,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from 'lucide-react'

interface IconItem {
  label: string
  icon: LucideIcon
}

interface RoadmapStage {
  number: string
  title: string
  period: string
  price: string
  work: string[]
  resultTitle: string
  result: string[]
}

interface ProjectTask {
  label: string
  price: string
}

const requestItems: IconItem[] = [
  { label: 'собрать обучения, материалы и практикумы в одном месте', icon: LibraryBig },
  { label: 'упростить путь новичка после регистрации', icon: Compass },
  { label: 'создать базовую платформу / личный кабинет / магазин практикумов', icon: Store },
  { label: 'выстроить онбординг для покупателей и партнёров', icon: Route },
  { label: 'сделать отдельную структуру для лидеров и наставников', icon: GitBranch },
  { label: 'снизить хаос в чатах и зависимость от Telegram', icon: MessagesSquare },
]

const strongElements: IconItem[] = [
  { label: 'продуктовые чаты', icon: MessagesSquare },
  { label: 'бизнес-чаты', icon: UsersRound },
  { label: 'школы и практикумы', icon: GraduationCap },
  { label: 'база материалов', icon: LibraryBig },
  { label: 'наставники и кураторы', icon: HeartHandshake },
  { label: 'локальные лидерские ветки', icon: GitBranch },
  { label: 'живая культура сообщества', icon: Leaf },
]

const fragmentedElements = [
  'часть материалов в Telegram',
  'часть в VK',
  'часть в облаках',
  'часть в чатах и у отдельных лидеров',
  'новичку сложно понять, куда идти и что делать сначала',
  'лидеры часто вручную объясняют одно и то же',
]

const systemAnswers = [
  'где хранится база',
  'куда попадает новичок после регистрации',
  'что он проходит в первые 7 / 14 / 30 дней',
  'какие практикумы ему доступны',
  'как устроен путь покупателя',
  'как устроен путь партнёра',
  'где находятся материалы для лидеров',
  'как команда дальше масштабирует обучение и запуски',
]

const cultureItems: IconItem[] = [
  { label: 'человеческие отношения', icon: HeartHandshake },
  { label: 'мягкость', icon: Leaf },
  { label: 'партнёрский подход', icon: UsersRound },
  { label: 'отсутствие давления', icon: ShieldCheck },
  { label: 'поддержка инициативы', icon: Sparkles },
  { label: 'благодарность', icon: BadgeCheck },
  { label: 'живое комьюнити', icon: Home },
]

const roadmapStages: RoadmapStage[] = [
  {
    number: '01',
    title: 'Архитектура системы + MVP платформы / магазина',
    period: '1 месяц',
    price: '62 000 ₽',
    work: [
      'разбираем текущие материалы, чаты, практикумы и обучения',
      'описываем путь покупателя, партнёра и лидера',
      'определяем, что переносим в первую очередь',
      'создаём структуру платформы и базы знаний',
      'собираем MVP платформы на Tilda',
      'создаём основу личного кабинета',
      'создаём основу магазина практикумов',
      'настраиваем базовую навигацию и первые разделы',
    ],
    resultTitle: 'Что будет готово в конце этапа',
    result: [
      'понятная структура системы',
      'roadmap дальнейших работ',
      'MVP платформы',
      'стартовая точка входа для команды',
      'основа магазина / витрины практикумов',
      'базовая навигация',
    ],
  },
  {
    number: '02',
    title: 'Онбординг покупателя и новичка',
    period: '2 месяц',
    price: '62 000 ₽',
    work: [
      'создаём welcome-систему',
      'проектируем путь новичка на 7 / 14 / 30 дней',
      'структурируем школу новичка',
      'отделяем обязательный минимум от дополнительных материалов',
      'создаём логику первых шагов после регистрации',
      'продумываем напоминания и переходы к следующим активностям',
      'делаем навигацию понятной для нового человека',
    ],
    resultTitle: 'Что будет готово в конце этапа',
    result: [
      'понятный старт новичка',
      'маршрут первых дней',
      'адаптированная школа новичка',
      'базовые материалы в понятной последовательности',
      'меньше ручных объяснений от наставников',
    ],
  },
  {
    number: '03',
    title: 'Бизнес-путь и система роста партнёров',
    period: '3–4 месяц',
    price: '62 000 ₽ в месяц',
    work: [
      'описываем путь партнёра',
      'связываем клиентский путь и бизнес-путь',
      'структурируем бизнес-обучения',
      'собираем карту роста',
      'оформляем бизнес-раздел платформы',
      'систематизируем материалы “Делись от сердца”, “ПРОдавать красиво”, “Элитная школа” / “Бизнес с нуля”',
      'создаём логику перехода от новичка к активному партнёру',
    ],
    resultTitle: 'Что будет готово в конце этапа',
    result: [
      'понятный бизнес-путь',
      'карта роста партнёра',
      'бизнес-раздел платформы',
      'структурированные бизнес-обучения',
      'более понятная система развития внутри команды',
    ],
  },
  {
    number: '04',
    title: 'Лидерская система, поддержка и развитие',
    period: 'далее',
    price: '35 000 ₽ в месяц',
    work: [
      'создаём лидерский раздел',
      'собираем материалы для наставников',
      'оформляем “копилки” запусков',
      'готовим шаблоны практикумов',
      'обновляем и систематизируем материалы',
      'улучшаем UX и навигацию',
      'развиваем платформу по мере роста команды',
    ],
    resultTitle: 'Что получает команда',
    result: [
      'инструменты для лидеров',
      'готовые материалы для запусков',
      'более самостоятельных участников',
      'чистую и актуальную базу знаний',
      'систему, которая не превращается обратно в хаос',
    ],
  },
]

const projectTasks: ProjectTask[] = [
  { label: 'стратегия и архитектура системы', price: 'от 60 000 ₽' },
  { label: 'главная страница платформы / магазина', price: '35 000 ₽' },
  { label: 'личный кабинет и разделы', price: 'от 20 000–50 000 ₽' },
  { label: 'страница курса', price: '5 000 ₽ / страница' },
  { label: 'небольшие изменения', price: '1 000 ₽ / страница' },
  { label: 'welcome-система и онбординг', price: 'от 60 000 ₽' },
  { label: 'бизнес-путь и карта роста', price: 'от 40 000–60 000 ₽' },
  { label: 'лидерский раздел', price: 'от 35 000 ₽' },
  { label: 'поддержка платформы', price: 'от 20 000 ₽ / месяц' },
]

const monthlyFoundation = [
  'архитектура',
  'MVP платформы',
  'основа магазина',
  'онбординг',
  'первые разделы',
  'бизнес-путь',
  'структура базы знаний',
]

const monthlySupport = [
  'новые разделы',
  'обновление материалов',
  'улучшение навигации',
  'развитие лидерского блока',
  'поддержка базы знаний',
  'постепенное масштабирование системы',
]

function App() {
  return (
    <main className="min-h-screen bg-[#e9edf6] px-4 py-5 text-[#171717] md:px-6 md:py-8">
      <div className="mx-auto max-w-[1480px] rounded-[8px] bg-[#fbfbf7] p-4 shadow-[0_24px_80px_-48px_rgba(24,35,64,0.46)] md:p-7">
        <ProjectHeader />
        <Hero />
        <SituationSection />
        <RoadmapSection />
        <PaymentSection />
      </div>
    </main>
  )
}

function ProjectHeader() {
  const links = [
    { label: 'Запрос и ситуация', href: '#request' },
    { label: 'Roadmap', href: '#roadmap' },
    { label: 'Условия работы', href: '#conditions' },
  ]

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <a className="flex min-w-0 items-center gap-2" href="#top" aria-label="К началу страницы">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1d1d1d]">
          <Leaf className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold">dōTERRA project</span>
      </a>

      <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white px-1.5 py-1 shadow-[0_10px_25px_-22px_rgba(24,35,64,0.9)]" aria-label="Навигация по странице">
        {links.map((link, index) => (
          <a
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              index === 0 ? 'bg-[#3158d4] text-white' : 'text-[#252525] hover:bg-[#eef2ff]'
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a className="hidden rounded-full bg-[#3158d4] px-4 py-2 text-xs font-semibold text-white md:inline-flex" href="#conditions">
        Форматы работы <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </header>
  )
}

function Hero() {
  return (
    <div id="top" className="pt-8 md:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#5d6475]">Страница проекта</p>
          <h1 className="max-w-5xl text-[2.3rem] font-medium uppercase leading-[1.02] tracking-[-0.03em] text-[#171717] md:text-[3.8rem] lg:text-[4.45rem]">
            Образовательная <span className="inline-flex rounded-full bg-[#3158d4] px-4 text-white">платформа</span> и система онбординга для команды dōTERRA
          </h1>
        </div>

        <aside className="rounded-[8px] bg-white p-5 shadow-[0_18px_45px_-36px_rgba(24,35,64,0.72)]">
          <Sparkles className="h-5 w-5 text-[#3158d4]" aria-hidden="true" />
          <p className="mt-4 text-sm leading-6 text-[#3c4250]">
            Проект собирает обучения, магазин практикумов, путь новичка, бизнес-раздел и лидерские материалы в единую систему, которая снижает хаос и сохраняет живость команды.
          </p>
        </aside>
      </div>

      <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_70px_70px_minmax(240px,0.6fr)_70px_70px]">
        <VisualPanel />
        <NavigatorRail number="02" label="MVP" />
        <NavigatorRail number="03" label="Onboarding" muted />
        <FeaturePanel />
        <NavigatorRail number="05" label="Business" />
        <NavigatorRail number="06" label="Leaders" muted />
      </div>

    </div>
  )
}

function VisualPanel() {
  return (
    <div className="relative min-h-[270px] overflow-hidden rounded-[8px] bg-[#3158d4] p-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_36%,rgba(255,255,255,0.55),transparent_13rem),radial-gradient(circle_at_68%_56%,rgba(255,255,255,0.34),transparent_10rem),linear-gradient(135deg,#3158d4_0%,#5b78e8_50%,#1f318d_100%)]" />
      <div className="absolute -left-8 top-12 h-52 w-52 rounded-full border-[34px] border-white/18" />
      <div className="absolute right-16 top-12 h-28 w-28 rounded-full bg-white/50 shadow-[inset_18px_18px_35px_rgba(255,255,255,0.4),inset_-18px_-18px_35px_rgba(29,54,151,0.35)]" />
      <div className="absolute bottom-8 left-32 h-36 w-36 rounded-full bg-white/42 shadow-[inset_18px_18px_35px_rgba(255,255,255,0.45),inset_-20px_-20px_40px_rgba(29,54,151,0.32)]" />
      <div className="relative z-10 flex flex-wrap gap-1.5">
        {['Tilda', 'Личный кабинет', 'Магазин практикумов', 'База знаний', 'Онбординг'].map((item) => (
          <span className="rounded-full border border-white/50 bg-white/18 px-2.5 py-1 text-xs font-medium backdrop-blur" key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="relative z-10 mt-28 flex items-end justify-between gap-4">
        <p className="max-w-sm text-sm font-medium leading-5 text-white/90">структура, навигация, путь новичка, бизнес-путь, лидерская система</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#3158d4]">01</span>
      </div>
    </div>
  )
}

function NavigatorRail({ number, label, muted = false }: { number: string; label: string; muted?: boolean }) {
  return (
    <div className={`hidden min-h-[270px] rounded-[8px] p-3 text-white lg:flex lg:flex-col lg:items-center lg:justify-between ${muted ? 'bg-[#b7c4e7]' : 'bg-[#3158d4]'}`}>
      <span className="writing-vertical text-xs font-semibold">{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#3158d4]">{number}</span>
    </div>
  )
}

function FeaturePanel() {
  return (
    <div className="relative min-h-[270px] overflow-hidden rounded-[8px] bg-[#6f8af0] p-4 text-white">
      <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xs font-bold text-[#3158d4]">Explore</div>
      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-[#3158d4]">04</span>
      <h2 className="relative z-10 mt-16 max-w-[11rem] text-2xl font-semibold uppercase leading-none">Система без хаоса</h2>
      <p className="relative z-10 mt-3 text-sm leading-5 text-white/90">От разрозненных ссылок к понятному маршруту команды.</p>
      <a className="relative z-10 mt-5 inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#3158d4]" href="#roadmap">
        Смотреть roadmap
      </a>
    </div>
  )
}

function SituationSection() {
  return (
    <section id="request" className="mt-10 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[8px] bg-white p-5 md:p-6">
        <SectionKicker number="1" label="Запрос, ситуация и что мы делаем" />
        <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.02em] md:text-5xl">Нужно создать понятную систему для обучения, онбординга и роста команды</h2>
        <div className="mt-6 grid gap-2">
          {requestItems.map((item) => (
            <IconRow item={item} key={item.label} />
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <InfoCard
          eyebrow="Что происходит сейчас"
          title="Сильная живая система работает разрозненно"
          text="У команды уже есть много сильных элементов, но они распределены между чатами, облаками, VK, Telegram и отдельными лидерами."
        >
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {strongElements.map((item) => (
              <MiniChip item={item} key={item.label} />
            ))}
          </div>
          <div className="mt-5 rounded-[8px] bg-[#f1f4fb] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3158d4]">Сейчас разрозненно</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {fragmentedElements.map((item) => (
                <Bullet label={item} key={item} />
              ))}
            </div>
          </div>
        </InfoCard>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard eyebrow="Главная проблема" title="Контента много. Нет единой структуры." text="Проблема не в отсутствии материалов, а в отсутствии навигации и понятного маршрута." blue />
          <InfoCard eyebrow="Важно сохранить" title="Живость команды без жёсткости" text="Систематизация должна убрать хаос, но сохранить мягкость, партнёрский подход и живое комьюнити." />
        </div>
      </div>

      <div className="rounded-[8px] bg-[#f0f3fb] p-5 md:col-span-2 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#3158d4]">Что мы делаем</p>
            <h3 className="mt-3 text-2xl font-medium leading-tight md:text-4xl">Мы не просто “создаём сайт”. Мы собираем систему.</h3>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4c5364]">
              В этой системе становится понятно, где база, куда попадает новичок, какие материалы обязательны, какие практикумы доступны и как команда масштабирует обучение дальше.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {systemAnswers.map((item) => (
              <CheckRow label={item} key={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] bg-[#171717] p-5 text-white md:col-span-2 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#b7c4e7]">Культурная основа</p>
            <h3 className="mt-3 text-2xl font-medium leading-tight md:text-4xl">Задача проекта — не сделать систему жёсткой, а убрать хаос и сохранить живость команды.</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cultureItems.map((item) => (
              <div className="rounded-[8px] border border-white/12 bg-white/8 p-3" key={item.label}>
                <item.icon className="h-4 w-4 text-[#b7c4e7]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold leading-5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RoadmapSection() {
  return (
    <section id="roadmap" className="mt-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionKicker number="2" label="Roadmap работ" />
          <h2 className="mt-4 max-w-4xl text-3xl font-medium leading-tight tracking-[-0.02em] md:text-5xl">От архитектуры и MVP к онбордингу, бизнес-пути и лидерской системе</h2>
        </div>
        <div className="rounded-full bg-[#3158d4] px-4 py-2 text-sm font-semibold text-white">4 этапа развития</div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {roadmapStages.map((stage) => (
          <RoadmapCard stage={stage} key={stage.number} />
        ))}
      </div>
    </section>
  )
}

function RoadmapCard({ stage }: { stage: RoadmapStage }) {
  return (
    <article className="flex min-h-full flex-col rounded-[8px] bg-white p-5 shadow-[0_16px_45px_-38px_rgba(24,35,64,0.75)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3158d4] text-xs font-bold text-white">{stage.number}</span>
        <div className="text-right">
          <p className="text-sm font-bold text-[#171717]">{stage.period}</p>
          <p className="text-sm font-semibold text-[#3158d4]">{stage.price}</p>
        </div>
      </div>
      <h3 className="mt-5 min-h-[92px] text-xl font-medium leading-tight tracking-[-0.01em]">{stage.title}</h3>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">Что делаем</p>
        <div className="mt-3 space-y-2">
          {stage.work.map((item) => (
            <Bullet label={item} key={item} />
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-[8px] bg-[#eef2ff] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3158d4]">{stage.resultTitle}</p>
        <div className="mt-3 space-y-2">
          {stage.result.map((item) => (
            <CheckRow label={item} key={item} compact />
          ))}
        </div>
      </div>
    </article>
  )
}

function PaymentSection() {
  return (
    <section id="conditions" className="mt-10">
      <SectionKicker number="3" label="Условия работы" />
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <PaymentCard
          title="Вариант 1"
          subtitle="Проектная работа: оплата за отдельные задачи"
          description="Подходит, если хочется оплачивать каждый блок отдельно."
        >
          <div className="mt-5 grid gap-2">
            {projectTasks.map((task) => (
              <div className="grid gap-2 rounded-[8px] border border-[#e4e7f0] bg-[#fbfbf7] p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={task.label}>
                <p className="text-sm font-medium leading-5">{task.label}</p>
                <p className="text-sm font-bold text-[#3158d4]">{task.price}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[8px] bg-[#171717] p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b7c4e7]">Ориентировочная стоимость всего проекта</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">250 000–450 000 ₽+</p>
          </div>
          <ProsCons
            pros={['понятно, сколько стоит каждый блок', 'можно двигаться постепенно', 'удобно контролировать бюджет по задачам']}
            cons={['система собирается частями', 'каждую новую задачу нужно отдельно оценивать', 'выше риск потерять единую логику', 'больше времени уходит на согласования']}
          />
        </PaymentCard>

        <PaymentCard
          featured
          title="Вариант 2"
          subtitle="Ежемесячное сопровождение"
          description="Подходит, если хочется выстроить систему целостно, без постоянного пересчёта каждой задачи."
        >
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <PricePanel title="Первые 3–4 месяца" price="62 000 ₽ / месяц" items={monthlyFoundation} />
            <PricePanel title="Далее" price="35 000 ₽ / месяц" items={monthlySupport} />
          </div>
          <div className="mt-5 rounded-[8px] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3158d4]">Почему этот формат удобнее</p>
            <div className="mt-3 grid gap-2">
              {[
                'сохраняется единая логика проекта',
                'можно гибко менять приоритеты',
                'не нужно пересчитывать каждую мелкую доработку',
                'система развивается постепенно и без перегруза',
                'команда получает не набор разрозненных страниц, а полноценную образовательную систему',
              ].map((item) => (
                <CheckRow label={item} key={item} />
              ))}
            </div>
          </div>
        </PaymentCard>
      </div>
      <RecommendationSection />
    </section>
  )
}

function RecommendationSection() {
  return (
    <div className="mt-4 overflow-hidden rounded-[8px] bg-[#3158d4] p-5 text-white md:p-7">
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-white/70">Рекомендуемый формат</p>
          <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.02em] md:text-5xl">Ежемесячное сопровождение</h2>
        </div>
        <p className="max-w-4xl text-lg leading-8 text-white/86">
          Для этого проекта лучше подходит сопровождение, потому что задача большая, живая и будет развиваться по мере работы. Здесь важно не просто собрать страницы, а постепенно выстроить систему: от базы и магазина до онбординга, бизнес-пути и лидерских материалов.
        </p>
      </div>
    </div>
  )
}

function SectionKicker({ number, label }: { number: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#3158d4] shadow-[0_10px_24px_-22px_rgba(24,35,64,0.9)]">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3158d4] text-[10px] text-white">{number}</span>
      {label}
    </div>
  )
}

function InfoCard({ eyebrow, title, text, children, blue = false }: { eyebrow: string; title: string; text: string; children?: React.ReactNode; blue?: boolean }) {
  return (
    <article className={`rounded-[8px] p-5 ${blue ? 'bg-[#3158d4] text-white' : 'bg-white text-[#171717]'}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.08em] ${blue ? 'text-white/70' : 'text-[#3158d4]'}`}>{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-medium leading-tight">{title}</h3>
      <p className={`mt-3 text-sm leading-6 ${blue ? 'text-white/84' : 'text-[#4c5364]'}`}>{text}</p>
      {children}
    </article>
  )
}

function PaymentCard({ title, subtitle, description, children, featured = false }: { title: string; subtitle: string; description: string; children: React.ReactNode; featured?: boolean }) {
  return (
    <article className={`rounded-[8px] p-5 md:p-6 ${featured ? 'bg-[#eef2ff]' : 'bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3158d4]">{title}</p>
          <h3 className="mt-2 text-2xl font-medium leading-tight md:text-3xl">{subtitle}</h3>
          <p className="mt-3 text-sm leading-6 text-[#4c5364]">{description}</p>
        </div>
        {featured ? <span className="shrink-0 rounded-full bg-[#3158d4] px-3 py-1.5 text-xs font-bold text-white">рекомендуется</span> : null}
      </div>
      {children}
    </article>
  )
}

function PricePanel({ title, price, items }: { title: string; price: string; items: string[] }) {
  return (
    <div className="rounded-[8px] bg-white p-4">
      <p className="text-sm font-bold text-[#4c5364]">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#171717]">{price}</p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <CheckRow label={item} key={item} compact />
        ))}
      </div>
    </div>
  )
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <div className="rounded-[8px] bg-[#eef2ff] p-4">
        <p className="text-sm font-bold">Плюсы</p>
        <div className="mt-3 space-y-2">
          {pros.map((item) => (
            <CheckRow label={item} key={item} compact />
          ))}
        </div>
      </div>
      <div className="rounded-[8px] bg-[#fbf1ef] p-4">
        <p className="text-sm font-bold">Минусы</p>
        <div className="mt-3 space-y-2">
          {cons.map((item) => (
            <Bullet label={item} key={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function IconRow({ item }: { item: IconItem }) {
  const Icon = item.icon

  return (
    <div className="flex items-start gap-3 rounded-[8px] bg-[#f1f4fb] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#3158d4]">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <p className="pt-1 text-sm font-medium leading-5">{item.label}</p>
    </div>
  )
}

function MiniChip({ item }: { item: IconItem }) {
  const Icon = item.icon

  return (
    <div className="flex items-center gap-2 rounded-full bg-[#f1f4fb] px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-[#3158d4]" aria-hidden="true" />
      <span className="text-xs font-semibold text-[#333846]">{item.label}</span>
    </div>
  )
}

function CheckRow({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${compact ? 'text-sm' : 'text-sm leading-6'}`}>
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3158d4] text-white">
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
      <span className="text-[#333846]">{label}</span>
    </div>
  )
}

function Bullet({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm leading-6 text-[#4c5364]">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3158d4]" />
      <span>{label}</span>
    </div>
  )
}

export default App
