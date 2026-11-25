import { exportDeckPptxClient } from './clientPptxExport';

export const DEMO_STORAGE_KEY = 'deckai_browser_demo_v1';
export const DEMO_TOKEN = 'deckai-browser-demo-token';

const VALID_LAYOUTS = new Set(['title', 'content', 'two_column', 'section', 'summary']);

function makeId(prefix = 'demo') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSeedWorkspace() {
  const baseTime = new Date('2026-03-01T10:00:00.000Z').toISOString();
  const recentTime = new Date('2026-03-02T14:30:00.000Z').toISOString();

  const user = {
    id: 'demo-browser-user',
    fullName: 'Alex Rivera (Demo)',
    email: 'demo@deckai.app',
    avatar: '',
    createdAt: baseTime,
    updatedAt: recentTime,
  };

  const readyDeckId = 'demo-deck-ready';
  const outlineDeckId = 'demo-deck-outline';

  const decks = [
    {
      _id: readyDeckId,
      userId: user.id,
      title: 'Enterprise AI Copilots: 2026 Rollout Blueprint',
      topic: 'Enterprise AI Copilot Adoption and Governance Strategy',
      description:
        'Executive rollout plan covering workflow selection, security guardrails, ROI metrics, and phased deployment.',
      language: 'English',
      tone: 'professional',
      slideCount: 5,
      status: 'ready',
      outline: {
        sections: [
          {
            id: 'demo-ready-sec-1',
            title: 'Scaling Enterprise AI Copilots Without Compromising Governance',
            summary:
              'Frame the executive mandate: capture measurable knowledge-work velocity while enforcing strict data boundaries.',
            order: 1,
          },
          {
            id: 'demo-ready-sec-2',
            title: 'Phase 1: High-Impact Workflows and Baseline Bottlenecks',
            summary:
              'Focus initial deployment on support triage, RFP drafting, and engineering runbooks where cycle times lag.',
            order: 2,
          },
          {
            id: 'demo-ready-sec-3',
            title: 'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times',
            summary:
              'Highlight Q3 pilot telemetry across 240 seats showing faster turnaround and 91% citation accuracy.',
            order: 3,
          },
          {
            id: 'demo-ready-sec-4',
            title: 'Balancing Rapid Experimentation Against Zero-Trust Security Controls',
            summary:
              'Contrast velocity enablers against role-based retrieval, PII redaction, and audit logging guardrails.',
            order: 4,
          },
          {
            id: 'demo-ready-sec-5',
            title: '90-Day Execution Roadmap and Executive Sign-Off Milestones',
            summary:
              'Align leadership on phased seat expansion, unit-cost guardrails, and quarterly adoption reviews.',
            order: 5,
          },
        ],
      },
      createdAt: baseTime,
      updatedAt: recentTime,
    },
    {
      _id: outlineDeckId,
      userId: user.id,
      title: 'GridScale Storage: Series A Investor Overview',
      topic: 'Long-Duration Battery Storage for Industrial Microgrids',
      description:
        'Investor narrative framing grid reliability pain points, unit economics, commercial traction, and capital allocation.',
      language: 'English',
      tone: 'persuasive',
      slideCount: 5,
      status: 'outline_ready',
      outline: {
        sections: [
          {
            id: 'demo-outline-sec-1',
            title: 'Industrial Decarbonization Stalls Without Dispatchable 12-Hour Storage',
            summary:
              'Quantify peak-tariff exposure and intermittency losses facing manufacturing campuses relying on solar and wind.',
            order: 1,
          },
          {
            id: 'demo-outline-sec-2',
            title: 'Modular Iron-Air Architecture Cuts Levelized Storage Cost by 58%',
            summary:
              'Explain how abundant earth-mineral chemistry eliminates thermal runaway risk and lithium supply volatility.',
            order: 2,
          },
          {
            id: 'demo-outline-sec-3',
            title: 'Commercial Traction: 48 MWh Contracted Across Three Logistics Hubs',
            summary:
              'Present signed multi-year energy-storage service agreements and 99.4% field availability from initial deployments.',
            order: 3,
          },
          {
            id: 'demo-outline-sec-4',
            title: 'Hardware-Enabled Recurring Revenue With 46% Gross Margin at Scale',
            summary:
              'Break down upfront installation recovery, 15-year dispatch optimization software fees, and domestic tax-credit tailwinds.',
            order: 4,
          },
          {
            id: 'demo-outline-sec-5',
            title: '$18M Series A Allocation to Commission Automated Module Line',
            summary:
              'Detail 24-month milestones to reach 250 MWh annual capacity and unlock project-finance debt facilities.',
            order: 5,
          },
        ],
      },
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];

  const slides = [
    {
      _id: 'demo-slide-1',
      deckId: readyDeckId,
      slideNumber: 1,
      title: 'Scaling Enterprise AI Copilots Without Compromising Governance',
      content: [
        'Transition from fragmented team experiments to one governed, auditable AI workspace.',
        'Anchor deployment on three measurable workflows before expanding organization-wide.',
        'Pair model routing controls with role-scoped retrieval from day one.',
      ],
      speakerNotes:
        'Open by aligning leadership on why governed AI adoption beats ad-hoc tool sprawl. Emphasize that speed and compliance reinforce each other when built into the platform layer.',
      layout: 'title',
      createdAt: baseTime,
      updatedAt: recentTime,
    },
    {
      _id: 'demo-slide-2',
      deckId: readyDeckId,
      slideNumber: 2,
      title: 'Phase 1: High-Impact Workflows and Baseline Bottlenecks',
      content: [
        'Customer escalations spend 42% of resolution time searching historical runbooks.',
        'Enterprise security questionnaires require repetitive cross-team document synthesis.',
        'Onboarding engineers wait an average of four days for architecture context.',
      ],
      speakerNotes:
        'Use this section transition to ground the business case in real operational bottlenecks measured last quarter before introducing pilot outcomes.',
      layout: 'section',
      createdAt: baseTime,
      updatedAt: recentTime,
    },
    {
      _id: 'demo-slide-3',
      deckId: readyDeckId,
      slideNumber: 3,
      title: 'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times',
      content: [
        'Support escalation drafting time dropped from 38 minutes to 25 minutes across 240 pilot seats.',
        'Grounded retrieval achieved 91% verified source citation accuracy on internal documentation.',
        'RFP response teams reclaimed 6.5 hours per rep each week for strategic deal reviews.',
        'Net internal promoter score reached +62 after introducing inline source verification.',
      ],
      speakerNotes:
        'Walk through the pilot metrics slowly and point out that citation visibility drove user trust far more than raw generation speed alone.',
      layout: 'content',
      createdAt: baseTime,
      updatedAt: recentTime,
    },
    {
      _id: 'demo-slide-4',
      deckId: readyDeckId,
      slideNumber: 4,
      title: 'Balancing Rapid Experimentation Against Zero-Trust Security Controls',
      content: [
        'Velocity Enabler: Self-serve prompt templates curated by domain leads for repeatable tasks.',
        'Velocity Enabler: Multi-model fallback keeps p95 latency under 2.4 seconds during peak load.',
        'Security Guardrail: Document ACL inheritance ensures users only query authorized repositories.',
        'Security Guardrail: Automated PII redaction and zero-retention provider agreements protect customer data.',
      ],
      speakerNotes:
        'Contrast how enablement and security operate side-by-side: left column empowers teams to move fast while right column enforces non-negotiable enterprise controls.',
      layout: 'two_column',
      createdAt: baseTime,
      updatedAt: recentTime,
    },
    {
      _id: 'demo-slide-5',
      deckId: readyDeckId,
      slideNumber: 5,
      title: '90-Day Execution Roadmap and Executive Sign-Off Milestones',
      content: [
        'Days 1-30: Finalize SSO role mappings and onboard 500 customer-facing specialists.',
        'Days 31-60: Integrate CRM and runbook connectors with automated weekly quality audits.',
        'Days 61-90: Review ROI scorecard against $18/seat target and approve global rollout.',
      ],
      speakerNotes:
        'Close by asking for sign-off on the Phase 2 seat allocation and confirming the 30-day governance checkpoint with Security and Finance.',
      layout: 'summary',
      createdAt: baseTime,
      updatedAt: recentTime,
    },
  ];

  const versions = [
    {
      _id: 'demo-version-1',
      slideId: 'demo-slide-3',
      title: 'Knowledge Workflows Show Promising Early Productivity Gains',
      content: [
        'Pilot participants reported faster ticket drafting across customer support queues.',
        'Internal documentation search accuracy improved with source citations.',
        'Response teams saved several hours per week on recurring questionnaires.',
      ],
      speakerNotes: 'Initial draft captured before Q3 pilot telemetry was finalized.',
      layout: 'content',
      versionNumber: 1,
      reason: 'Sharpen headline and bullets with verified Q3 pilot metrics',
      createdAt: baseTime,
    },
  ];

  return {
    version: 1,
    user,
    decks,
    slides,
    versions,
    exports: [],
  };
}

function readWorkspace() {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.decks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeWorkspace(state) {
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  return state;
}

function requireWorkspace() {
  const existing = readWorkspace();
  if (existing) return existing;
  return writeWorkspace(createSeedWorkspace());
}

export function isBrowserDemoActive() {
  return readWorkspace() !== null;
}

export function activateBrowserDemo() {
  const state = readWorkspace() || writeWorkspace(createSeedWorkspace());
  return {
    user: state.user,
    token: DEMO_TOKEN,
    demo: true,
    browserDemo: true,
  };
}

export function deactivateBrowserDemo() {
  try {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function getBrowserDemoUser() {
  return readWorkspace()?.user || null;
}

function findDeckOrThrow(state, deckId) {
  const deck = state.decks.find((item) => item._id === deckId);
  if (!deck) {
    throw new Error('Deck not found');
  }
  return deck;
}

function findSlideOrThrow(state, slideId) {
  const slide = state.slides.find((item) => item._id === slideId);
  if (!slide) {
    throw new Error('Slide not found');
  }
  return slide;
}

function buildOutlineSections(topic, description, tone, slideCount) {
  const count = Math.min(10, Math.max(1, Number(slideCount) || 5));
  const cleanTopic = String(topic || 'Strategic Initiative').trim();
  const contextLine = description
    ? ` Ground the narrative in: ${String(description).trim().slice(0, 120)}.`
    : '';

  const blueprints = [
    {
      title: `Executive Mandate: Why ${cleanTopic} Matters Now`,
      summary: `Frame the strategic opportunity, market urgency, and measurable outcomes expected from ${cleanTopic}.${contextLine}`,
    },
    {
      title: `Baseline Bottlenecks and Operational Friction`,
      summary: `Diagnose current workflow constraints, cost drivers, and risk exposure with a ${tone || 'professional'} lens.`,
    },
    {
      title: `Core Architecture and High-Impact Capabilities`,
      summary: `Detail how modern execution patterns unlock repeatable velocity and clearer decision-making across ${cleanTopic}.`,
    },
    {
      title: ` Execution Tradeoffs vs. Governance Guardrails`,
      summary: `Compare speed enablers against reliability, compliance, and quality controls required at scale.`,
    },
    {
      title: `Measured Impact Signals and Benchmark Targets`,
      summary: `Define leading KPIs, unit-economics improvements, and validation checkpoints for stakeholders.`,
    },
    {
      title: `Phased Rollout Plan and Ownership Model`,
      summary: `Outline 30-60-90 day milestones, cross-functional responsibilities, and dependency management.`,
    },
    {
      title: `Risk Mitigation and Contingency Playbook`,
      summary: `Identify top operational risks and establish proactive triggers before scaling adoption.`,
    },
    {
      title: `Resource Allocation and Budget Framework`,
      summary: `Align investment tiers with milestone gates so capital scales alongside proven ROI.`,
    },
    {
      title: `Stakeholder Alignment and Change Enablement`,
      summary: `Equip teams with clear playbooks, training loops, and feedback channels for sustained adoption.`,
    },
    {
      title: `Executive Summary and Immediate Next Actions`,
      summary: `Consolidate the core recommendation and confirm concrete decisions required this quarter.`,
    },
  ];

  if (count === 1) {
    return [
      {
        id: makeId('sec'),
        title: blueprints[0].title.trim(),
        summary: blueprints[0].summary,
        order: 1,
      },
    ];
  }

  const chosen = [blueprints[0], ...blueprints.slice(1, count - 1), blueprints[blueprints.length - 1]];
  return chosen.map((entry, idx) => ({
    id: makeId('sec'),
    title: entry.title.trim(),
    summary: entry.summary,
    order: idx + 1,
  }));
}

function chooseLayoutForIndex(index, total) {
  if (index === 0) return 'title';
  if (index === total - 1 && total > 1) return 'summary';
  const middleLayouts = ['section', 'content', 'two_column'];
  return middleLayouts[(index - 1) % middleLayouts.length];
}

function buildSlideFromSection(deck, section, index, total) {
  const layout = chooseLayoutForIndex(index, total);
  const topic = deck.topic || deck.title || 'this initiative';
  const summaryPoint = section.summary || `Establish the primary strategic takeaway for ${section.title}.`;

  const content =
    layout === 'two_column'
      ? [
          `Execution Driver: Accelerate ${topic} workflows with standardized playbooks.`,
          'Execution Driver: Shorten feedback loops using real-time telemetry and benchmarks.',
          'Control Guardrail: Enforce role-scoped access, auditability, and quality thresholds.',
          'Control Guardrail: Gate broader rollout on verified milestone scorecards.',
        ]
      : [
          summaryPoint,
          `Align cross-functional owners on measurable targets supporting ${topic}.`,
          'Prioritize high-leverage milestones with clear accountability and review cadence.',
        ];

  return {
    _id: makeId('slide'),
    deckId: deck._id,
    slideNumber: index + 1,
    title: String(section.title || `Slide ${index + 1}`),
    content,
    speakerNotes: `Walk the audience through "${section.title}" using a ${deck.tone || 'professional'} tone, then bridge smoothly to the next decision point.`,
    layout,
  };
}

export const demoStore = {
  async me() {
    const state = requireWorkspace();
    return { user: state.user };
  },

  async getDecks() {
    const state = requireWorkspace();
    const decks = [...state.decks].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return { decks };
  },

  async getSummary() {
    const state = requireWorkspace();
    const sorted = [...state.decks].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return {
      totalDecks: state.decks.length,
      totalExports: state.exports.length,
      recentDecks: sorted.slice(0, 5),
    };
  },

  async getDeck(deckId) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    return { deck };
  },

  async createDeck(data = {}) {
    const state = requireWorkspace();
    const now = new Date().toISOString();
    const topic = String(data.topic || data.title || 'Untitled Presentation').trim();
    const deck = {
      _id: makeId('deck'),
      userId: state.user.id,
      title: String(data.title || topic).trim(),
      topic,
      description: String(data.description || ''),
      language: data.language || 'English',
      tone: data.tone || 'professional',
      slideCount: Math.min(10, Math.max(1, Number(data.slideCount) || 5)),
      status: 'draft',
      outline: { sections: [] },
      createdAt: now,
      updatedAt: now,
    };
    state.decks.unshift(deck);
    writeWorkspace(state);
    return { deck };
  },

  async updateDeck(deckId, data = {}) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    ['title', 'topic', 'description', 'language', 'tone'].forEach((key) => {
      if (data[key] !== undefined) {
        deck[key] = data[key];
      }
    });
    if (data.slideCount !== undefined) {
      deck.slideCount = Math.min(10, Math.max(1, Number(data.slideCount) || deck.slideCount));
    }
    deck.status = 'draft';
    deck.updatedAt = new Date().toISOString();
    writeWorkspace(state);
    return { deck };
  },

  async deleteDeck(deckId) {
    const state = requireWorkspace();
    findDeckOrThrow(state, deckId);
    const removedSlideIds = new Set(
      state.slides.filter((slide) => slide.deckId === deckId).map((slide) => slide._id)
    );
    state.decks = state.decks.filter((deck) => deck._id !== deckId);
    state.slides = state.slides.filter((slide) => slide.deckId !== deckId);
    state.versions = state.versions.filter((ver) => !removedSlideIds.has(ver.slideId));
    state.exports = state.exports.filter((exp) => exp.deckId !== deckId);
    writeWorkspace(state);
  },

  async generateOutline(deckId) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const sections = buildOutlineSections(deck.topic, deck.description, deck.tone, deck.slideCount);
    deck.title = deck.topic || deck.title;
    deck.outline = { sections };
    deck.status = 'outline_ready';
    deck.updatedAt = new Date().toISOString();
    writeWorkspace(state);
    return { deck, outline: deck.outline };
  },

  async getOutline(deckId) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    return { outline: deck.outline || { sections: [] } };
  },

  async updateOutline(deckId, sections = []) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const normalized = sections.map((section, index) => ({
      id: section.id || makeId('sec'),
      title: String(section.title || `Section ${index + 1}`),
      summary: String(section.summary || ''),
      order: index + 1,
    }));
    deck.outline = { sections: normalized };
    deck.slideCount = normalized.length;
    deck.status = 'outline_ready';
    deck.updatedAt = new Date().toISOString();
    writeWorkspace(state);
    return { outline: deck.outline };
  },

  async generateSlides(deckId) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const sections = [...(deck.outline?.sections || [])]
      .sort((a, b) => a.order - b.order)
      .slice(0, 10);

    if (sections.length === 0) {
      throw new Error('Generate or save a deck outline before generating slides');
    }

    const oldSlideIds = new Set(
      state.slides.filter((slide) => slide.deckId === deckId).map((slide) => slide._id)
    );
    state.slides = state.slides.filter((slide) => slide.deckId !== deckId);
    state.versions = state.versions.filter((ver) => !oldSlideIds.has(ver.slideId));

    const now = new Date().toISOString();
    const generated = sections.map((section, index) => ({
      ...buildSlideFromSection(deck, section, index, sections.length),
      createdAt: now,
      updatedAt: now,
    }));

    state.slides.push(...generated);
    deck.slideCount = generated.length;
    deck.status = 'ready';
    deck.updatedAt = now;
    writeWorkspace(state);
    return { slides: generated };
  },

  async getSlides(deckId) {
    const state = requireWorkspace();
    findDeckOrThrow(state, deckId);
    const slides = state.slides
      .filter((slide) => slide.deckId === deckId)
      .sort((a, b) => a.slideNumber - b.slideNumber);
    return { slides };
  },

  async createSlide(deckId, data = {}) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const deckSlides = state.slides.filter((slide) => slide.deckId === deckId);
    if (deckSlides.length >= 10) {
      throw new Error('A deck can contain at most 10 slides');
    }

    const now = new Date().toISOString();
    const slide = {
      _id: makeId('slide'),
      deckId,
      slideNumber: deckSlides.length + 1,
      title: data.title?.trim() || 'Untitled slide',
      content: Array.isArray(data.content) ? data.content.map(String) : [],
      speakerNotes: String(data.speakerNotes || ''),
      layout: VALID_LAYOUTS.has(data.layout) ? data.layout : 'content',
      createdAt: now,
      updatedAt: now,
    };

    state.slides.push(slide);
    deck.slideCount = deckSlides.length + 1;
    deck.updatedAt = now;
    writeWorkspace(state);
    return { slide };
  },

  async updateSlide(slideId, data = {}) {
    const state = requireWorkspace();
    const slide = findSlideOrThrow(state, slideId);
    const deck = findDeckOrThrow(state, slide.deckId);

    if (data.title !== undefined) slide.title = String(data.title);
    if (data.content !== undefined && Array.isArray(data.content)) {
      slide.content = data.content.map(String);
    }
    if (data.speakerNotes !== undefined) slide.speakerNotes = String(data.speakerNotes);
    if (data.layout !== undefined && VALID_LAYOUTS.has(data.layout)) {
      slide.layout = data.layout;
    }

    const now = new Date().toISOString();
    slide.updatedAt = now;
    deck.updatedAt = now;
    writeWorkspace(state);
    return { slide };
  },

  async deleteSlide(slideId) {
    const state = requireWorkspace();
    const slide = findSlideOrThrow(state, slideId);
    const deck = findDeckOrThrow(state, slide.deckId);
    const deckSlides = state.slides
      .filter((item) => item.deckId === slide.deckId)
      .sort((a, b) => a.slideNumber - b.slideNumber);

    if (deckSlides.length <= 1) {
      throw new Error('Cannot delete the last remaining slide in a deck');
    }

    state.slides = state.slides.filter((item) => item._id !== slideId);
    state.versions = state.versions.filter((ver) => ver.slideId !== slideId);

    const remaining = state.slides
      .filter((item) => item.deckId === deck._id)
      .sort((a, b) => a.slideNumber - b.slideNumber);
    remaining.forEach((item, idx) => {
      item.slideNumber = idx + 1;
    });

    deck.slideCount = remaining.length;
    deck.updatedAt = new Date().toISOString();
    writeWorkspace(state);
  },

  async reorderSlides(deckId, slideIds = []) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const normalizedIds = slideIds.map((id) => String(id).trim());
    const uniqueIds = new Set(normalizedIds);

    if (uniqueIds.size !== normalizedIds.length) {
      throw new Error('slideIds must not contain duplicate IDs');
    }

    const deckSlides = state.slides.filter((slide) => slide.deckId === deckId);
    if (deckSlides.length !== normalizedIds.length) {
      throw new Error('slideIds must include every slide in the deck');
    }

    const slideById = new Map(deckSlides.map((slide) => [slide._id, slide]));
    if (!normalizedIds.every((id) => slideById.has(id))) {
      throw new Error('All slide IDs must belong to this deck');
    }

    const now = new Date().toISOString();
    normalizedIds.forEach((id, idx) => {
      const target = slideById.get(id);
      target.slideNumber = idx + 1;
      target.updatedAt = now;
    });

    deck.updatedAt = now;
    writeWorkspace(state);

    const updated = state.slides
      .filter((slide) => slide.deckId === deckId)
      .sort((a, b) => a.slideNumber - b.slideNumber);
    return { slides: updated };
  },

  async regenerateSlide(slideId, instruction = '') {
    const state = requireWorkspace();
    const slide = findSlideOrThrow(state, slideId);
    const deck = findDeckOrThrow(state, slide.deckId);
    const now = new Date().toISOString();

    const slideVersions = state.versions.filter((ver) => ver.slideId === slideId);
    const nextVersionNumber =
      slideVersions.reduce((max, ver) => Math.max(max, Number(ver.versionNumber) || 0), 0) + 1;

    state.versions.push({
      _id: makeId('ver'),
      slideId: slide._id,
      title: slide.title,
      content: [...slide.content],
      speakerNotes: slide.speakerNotes,
      layout: slide.layout,
      versionNumber: nextVersionNumber,
      reason: String(instruction || 'AI regeneration'),
      createdAt: now,
    });

    const cleanPrompt = String(instruction || 'Sharpen executive clarity').trim();
    const baseBullets = slide.content.length
      ? slide.content.slice(0, 3)
      : [`Deliver measurable impact across ${deck.topic || 'core workflows'}.`];

    slide.title = `${slide.title.replace(/\s*\(Refined\)$/i, '')} (Refined)`;
    slide.content = [
      ...baseBullets,
      `Focus angle: ${cleanPrompt}.`,
    ].slice(0, 5);
    slide.speakerNotes = `${slide.speakerNotes ? `${slide.speakerNotes} ` : ''}Refined for: ${cleanPrompt}.`.trim();
    slide.updatedAt = now;
    deck.updatedAt = now;

    writeWorkspace(state);
    return { slide };
  },

  async getSlideVersions(slideId) {
    const state = requireWorkspace();
    findSlideOrThrow(state, slideId);
    const versions = state.versions
      .filter((ver) => ver.slideId === slideId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return { versions };
  },

  async restoreSlideVersion(slideId, versionId) {
    const state = requireWorkspace();
    const slide = findSlideOrThrow(state, slideId);
    const deck = findDeckOrThrow(state, slide.deckId);
    const targetVersion = state.versions.find(
      (ver) => ver._id === versionId && ver.slideId === slideId
    );
    if (!targetVersion) {
      throw new Error('Slide version not found');
    }

    const now = new Date().toISOString();
    const slideVersions = state.versions.filter((ver) => ver.slideId === slideId);
    const nextVersionNumber =
      slideVersions.reduce((max, ver) => Math.max(max, Number(ver.versionNumber) || 0), 0) + 1;

    state.versions.push({
      _id: makeId('ver'),
      slideId: slide._id,
      title: slide.title,
      content: [...slide.content],
      speakerNotes: slide.speakerNotes,
      layout: slide.layout,
      versionNumber: nextVersionNumber,
      reason: `Before restoring version ${targetVersion.versionNumber}`,
      createdAt: now,
    });

    slide.title = targetVersion.title;
    slide.content = Array.isArray(targetVersion.content) ? [...targetVersion.content] : [];
    slide.speakerNotes = targetVersion.speakerNotes ?? '';
    if (targetVersion.layout && VALID_LAYOUTS.has(targetVersion.layout)) {
      slide.layout = targetVersion.layout;
    }
    slide.updatedAt = now;
    deck.updatedAt = now;

    writeWorkspace(state);
    return { slide };
  },

  async exportPptx(deckId) {
    const state = requireWorkspace();
    const deck = findDeckOrThrow(state, deckId);
    const slides = state.slides
      .filter((slide) => slide.deckId === deckId)
      .sort((a, b) => a.slideNumber - b.slideNumber);

    if (!slides.length) {
      throw new Error('Deck has no slides to export');
    }

    const result = await exportDeckPptxClient(
      { title: deck.title, topic: deck.topic },
      slides
    );

    state.exports.unshift({
      _id: makeId('exp'),
      deckId: deck._id,
      userId: state.user.id,
      format: 'pptx',
      fileName: result.fileName,
      createdAt: new Date().toISOString(),
    });
    writeWorkspace(state);

    return result;
  },

  async getExports(deckId) {
    const state = requireWorkspace();
    findDeckOrThrow(state, deckId);
    const exports = state.exports
      .filter((exp) => exp.deckId === deckId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { exports };
  },
};
