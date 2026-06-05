export type Importance = 'high' | 'medium' | 'low'
export type Visibility = 'high' | 'medium' | 'low'
export type DataStatus = 'demo' | 'uploaded' | 'ai'

export interface ReportData {
  meta: ReportMeta
  summary: Summary
  kpis: Kpis
  fieldBalance: FieldBalanceItem[]
  weeklyDynamics: WeeklyDynamicsItem[]
  toneDistribution: ToneDistributionItem[]
  topics: Topic[]
  teams: Team[]
  underrepresentedTeams: UnderrepresentedTeam[]
  correlations: Correlation[]
  imbalances: Imbalances
  recommendations: Recommendation[]
  digest: Digest
  parserWarnings?: string[]
}

export interface ReportMeta {
  companyName?: string
  period?: string
  generatedAt?: string
  sourceDescription?: string
  totalPostsAnalyzed?: number
  totalChannelsAnalyzed?: number
  totalAuthors?: number
}

export interface Summary {
  mainConclusion?: string
  shortFindings?: string[]
  strategicIndex?: number
  usefulnessIndex?: number
  clarityIndex?: number
  engagementIndex?: number
  overallTone?: string
  mainRisk?: string
  mainOpportunity?: string
}

export interface Kpis {
  totalPosts?: number
  channels?: number
  authors?: number
  topics?: number
  avgEngagement?: number
  postsWithLinks?: number
  postsWithClearCallToAction?: number
  strategicPosts?: number
  employeeUsefulPosts?: number
}

export interface FieldBalanceItem {
  category: string
  label: string
  count: number
  share?: number
}

export interface WeeklyDynamicsItem {
  week: string
  posts: number
  engagement?: number
  strategicPosts?: number
}

export interface ToneDistributionItem {
  tone: string
  count: number
}

export interface Topic {
  id?: string
  name: string
  count: number
  share?: number
  engagement?: number
  importance?: Importance
  strategicLink?: boolean
  clarity?: string
  keyReasons?: string[]
  interpretation?: string
  links?: LinkItem[]
}

export interface LinkItem {
  title: string
  url: string
}

export interface Team {
  id?: string
  name: string
  postCount: number
  engagement?: number
  visibility?: Visibility
  mainTopics?: string[]
  topics?: TeamTopic[]
}

export interface TeamTopic {
  topic: string
  count: number
}

export interface UnderrepresentedTeam {
  team: string
  reason?: string
  recommendation?: string
}

export interface Correlation {
  title: string
  description?: string
  relatedTopics?: string[]
  strength?: 'high' | 'medium' | 'low'
}

export interface ImbalanceItem {
  title: string
  observation?: string
  whyItMatters?: string
  recommendation?: string
  links?: LinkItem[]
}

export interface Imbalances {
  tooLoud?: ImbalanceItem[]
  tooQuiet?: ImbalanceItem[]
  blindSpots?: ImbalanceItem[]
  gaps?: ImbalanceItem[]
}

export interface Recommendation {
  title: string
  problem?: string
  action?: string
  expectedEffect?: string
  priority?: Importance
  complexity?: Importance
  topic?: string
  owner?: string
}

export interface Digest {
  title?: string
  intro?: string
  sections?: DigestSection[]
}

export interface DigestSection {
  title: string
  items: DigestItem[]
}

export interface DigestItem {
  title: string
  description?: string
  whyImportant?: string
  link?: string
}

export interface UploadedFileInfo {
  name: string
  loadedAt: string
  size: number
}
