export const reportJsonSchema = {
  type: 'object',
  additionalProperties: true,
  required: [
    'meta',
    'summary',
    'kpis',
    'fieldBalance',
    'weeklyDynamics',
    'toneDistribution',
    'topics',
    'teams',
    'underrepresentedTeams',
    'correlations',
    'imbalances',
    'recommendations',
    'digest',
  ],
  properties: {
    meta: {
      type: 'object',
      additionalProperties: true,
      properties: {
        companyName: { type: ['string', 'null'] },
        period: { type: ['string', 'null'] },
        generatedAt: { type: ['string', 'null'] },
        sourceDescription: { type: ['string', 'null'] },
        totalPostsAnalyzed: { type: ['number', 'null'] },
        totalChannelsAnalyzed: { type: ['number', 'null'] },
        totalAuthors: { type: ['number', 'null'] },
      },
    },
    summary: {
      type: 'object',
      additionalProperties: true,
      properties: {
        mainConclusion: { type: ['string', 'null'] },
        shortFindings: { type: 'array', items: { type: 'string' } },
        strategicIndex: { type: ['number', 'null'] },
        usefulnessIndex: { type: ['number', 'null'] },
        clarityIndex: { type: ['number', 'null'] },
        engagementIndex: { type: ['number', 'null'] },
        overallTone: { type: ['string', 'null'] },
        mainRisk: { type: ['string', 'null'] },
        mainOpportunity: { type: ['string', 'null'] },
      },
    },
    kpis: {
      type: 'object',
      additionalProperties: true,
      properties: {
        totalPosts: { type: ['number', 'null'] },
        channels: { type: ['number', 'null'] },
        authors: { type: ['number', 'null'] },
        topics: { type: ['number', 'null'] },
        avgEngagement: { type: ['number', 'null'] },
        postsWithLinks: { type: ['number', 'null'] },
        postsWithClearCallToAction: { type: ['number', 'null'] },
        strategicPosts: { type: ['number', 'null'] },
        employeeUsefulPosts: { type: ['number', 'null'] },
      },
    },
    fieldBalance: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['category', 'label', 'count'],
        properties: {
          category: { type: 'string' },
          label: { type: 'string' },
          count: { type: 'number' },
          share: { type: ['number', 'null'] },
        },
      },
    },
    weeklyDynamics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['week', 'posts'],
        properties: {
          week: { type: 'string' },
          posts: { type: 'number' },
          engagement: { type: ['number', 'null'] },
          strategicPosts: { type: ['number', 'null'] },
        },
      },
    },
    toneDistribution: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['tone', 'count'],
        properties: {
          tone: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
    topics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name', 'count'],
        properties: {
          id: { type: ['string', 'null'] },
          name: { type: 'string' },
          count: { type: 'number' },
          share: { type: ['number', 'null'] },
          engagement: { type: ['number', 'null'] },
          importance: { enum: ['high', 'medium', 'low', null] },
          strategicLink: { type: ['boolean', 'null'] },
          clarity: { type: ['string', 'null'] },
          keyReasons: { type: 'array', items: { type: 'string' } },
          interpretation: { type: ['string', 'null'] },
          links: { type: 'array', items: { $ref: '#/$defs/link' } },
        },
      },
    },
    teams: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name', 'postCount'],
        properties: {
          id: { type: ['string', 'null'] },
          name: { type: 'string' },
          postCount: { type: 'number' },
          engagement: { type: ['number', 'null'] },
          visibility: { enum: ['high', 'medium', 'low', null] },
          mainTopics: { type: 'array', items: { type: 'string' } },
          topics: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              required: ['topic', 'count'],
              properties: {
                topic: { type: 'string' },
                count: { type: 'number' },
              },
            },
          },
        },
      },
    },
    underrepresentedTeams: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['team'],
        properties: {
          team: { type: 'string' },
          reason: { type: ['string', 'null'] },
          recommendation: { type: ['string', 'null'] },
        },
      },
    },
    correlations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['title'],
        properties: {
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          relatedTopics: { type: 'array', items: { type: 'string' } },
          strength: { enum: ['high', 'medium', 'low', null] },
        },
      },
    },
    imbalances: {
      type: 'object',
      additionalProperties: true,
      properties: {
        tooLoud: { type: 'array', items: { $ref: '#/$defs/imbalance' } },
        tooQuiet: { type: 'array', items: { $ref: '#/$defs/imbalance' } },
        blindSpots: { type: 'array', items: { $ref: '#/$defs/imbalance' } },
        gaps: { type: 'array', items: { $ref: '#/$defs/imbalance' } },
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['title'],
        properties: {
          title: { type: 'string' },
          problem: { type: ['string', 'null'] },
          action: { type: ['string', 'null'] },
          expectedEffect: { type: ['string', 'null'] },
          priority: { enum: ['high', 'medium', 'low', null] },
          complexity: { enum: ['high', 'medium', 'low', null] },
          topic: { type: ['string', 'null'] },
          owner: { type: ['string', 'null'] },
        },
      },
    },
    digest: {
      type: 'object',
      additionalProperties: true,
      properties: {
        title: { type: ['string', 'null'] },
        intro: { type: ['string', 'null'] },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
            required: ['title', 'items'],
            properties: {
              title: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    whyImportant: { type: ['string', 'null'] },
                    link: { type: ['string', 'null'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  $defs: {
    link: {
      type: 'object',
      additionalProperties: true,
      required: ['title', 'url'],
      properties: {
        title: { type: 'string' },
        url: { type: 'string' },
      },
    },
    imbalance: {
      type: 'object',
      additionalProperties: true,
      required: ['title'],
      properties: {
        title: { type: 'string' },
        observation: { type: ['string', 'null'] },
        whyItMatters: { type: ['string', 'null'] },
        recommendation: { type: ['string', 'null'] },
        links: { type: 'array', items: { $ref: '#/$defs/link' } },
      },
    },
  },
}
