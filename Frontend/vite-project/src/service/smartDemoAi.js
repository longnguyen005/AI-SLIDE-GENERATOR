import {
  VALID_LAYOUTS,
  parseMetricBullet,
  parseTimelineBullet,
  resolveEffectiveLayoutChange,
} from '../constants/slideLayouts';

const MIDDLE_ARCHETYPE_ROTATION = ['callout', 'metrics', 'two_column', 'timeline', 'content', 'section'];

function cleanTopicPhrase(topic = 'Strategic Initiative') {
  const trimmed = String(topic || '').trim().replace(/\s+/g, ' ');
  return trimmed || 'Strategic Initiative';
}

function extractNumbers(text = '') {
  const matches = String(text).match(
    /[+$<>~]?(?:\$)?\d[\d,.]*(?:\s*(?:%|x|MWh|GWh|M|K|ms|s|days|seats))?/gi
  );
  return matches ? [...new Set(matches.map((m) => m.trim()))] : [];
}

export function inferBestMiddleLayout(item = {}, index = 1) {
  const haystack = [
    item?.title || '',
    item?.summary || '',
    ...(Array.isArray(item?.content) ? item.content : []),
  ]
    .join(' ')
    .toLowerCase();

  if (Array.isArray(item?.content) && item.content.some((line) => String(line).includes('|'))) {
    return 'metrics';
  }
  if (/\b(kpi|metrics?|telemetry|unit economics|margin|traction|roi|arr|savings|scorecard)\b/.test(haystack)) {
    return 'metrics';
  }
  if (/\b(phase\s*\d|roadmap|timeline|days\s*\d|milestones?|rollout|90-day|24-month|step\s*\d)\b/.test(haystack)) {
    return 'timeline';
  }
  if (/\b(vs\.?|versus|tradeoffs?|balancing|contrast|autonomy|guardrails?|split|comparison)\b/.test(haystack)) {
    return 'two_column';
  }
  if (/\b(thesis|mandate|architecture|core|spotlight|why\s+|modular|principle)\b/.test(haystack)) {
    return 'callout';
  }
  if (/\b(section|chapter|part\s+\d)\b/.test(haystack)) {
    return 'section';
  }

  return MIDDLE_ARCHETYPE_ROTATION[(index - 1) % MIDDLE_ARCHETYPE_ROTATION.length];
}

function pickNonCollidingMiddleLayout(preferred, prevLayout, usedSet, index) {
  const candidates = [
    preferred,
    ...MIDDLE_ARCHETYPE_ROTATION.slice(index % MIDDLE_ARCHETYPE_ROTATION.length),
    ...MIDDLE_ARCHETYPE_ROTATION,
  ].filter((layout) => VALID_LAYOUTS.has(layout) && layout !== 'title' && layout !== 'summary');

  const unusedNonAdjacent = candidates.find(
    (layout) => layout !== prevLayout && !usedSet.has(layout)
  );
  if (unusedNonAdjacent) return unusedNonAdjacent;

  const nonAdjacent = candidates.find((layout) => layout !== prevLayout);
  return nonAdjacent || 'content';
}

export function enforceOutlineDiversity(rawSections = [], createId = () => `sec-${Date.now()}`) {
  const total = rawSections.length;
  const usedMiddle = new Set();
  let prevLayout = null;

  return rawSections.map((section, index) => {
    const explicit = VALID_LAYOUTS.has(section.suggestedLayout) ? section.suggestedLayout : null;
    let layout;

    if (index === 0) {
      layout = explicit || 'title';
    } else if (total >= 3 && index === total - 1) {
      layout = explicit || 'summary';
    } else if (explicit && explicit !== 'title' && explicit !== 'summary' && explicit !== prevLayout) {
      layout = explicit;
      usedMiddle.add(layout);
    } else {
      const inferred = inferBestMiddleLayout(section, index);
      layout = pickNonCollidingMiddleLayout(inferred, prevLayout, usedMiddle, index);
      usedMiddle.add(layout);
    }

    prevLayout = layout;
    return {
      ...section,
      id: section.id || createId(),
      order: index + 1,
      suggestedLayout: layout,
    };
  });
}

export function formatBulletsForLayout(rawBullets = [], layout = 'content', title = '', deckContext = {}) {
  const topic = cleanTopicPhrase(deckContext.topic || title);
  const cleaned = (Array.isArray(rawBullets) ? rawBullets : [])
    .map((line) => String(line ?? '').trim())
    .filter(Boolean);

  if (layout === 'metrics') {
    const seeds =
      cleaned.length >= 3
        ? cleaned.slice(0, 4)
        : [
            ...cleaned,
            `34% Faster | Cycle-time improvement across prioritized ${topic} workflows`,
            `91% Accuracy | Verified quality benchmark with automated policy checks`,
            `3.2x ROI | First-year payback modeled on active production adoption`,
          ].slice(0, 3);

    const defaultStats = ['38% Impact', '99.4% Target', '3.1x Velocity', '45-Day Payback'];
    return seeds.map((line, idx) => {
      if (line.includes('|')) return line;
      const parsed = parseMetricBullet(line, idx);
      const stat = parsed.value.startsWith('KPI ') ? defaultStats[idx % defaultStats.length] : parsed.value;
      return `${stat} | ${parsed.label}`;
    });
  }

  if (layout === 'timeline') {
    const phases = [
      'Phase 1 (Days 1-30)',
      'Phase 2 (Days 31-60)',
      'Phase 3 (Days 61-90)',
      'Phase 4 (Scale)',
    ];
    const seeds =
      cleaned.length >= 3
        ? cleaned.slice(0, 4)
        : [
            ...cleaned,
            `Establish baseline telemetry, ownership roles, and pilot scope for ${topic}.`,
            `Integrate automated guardrails and validate measurable workflow gains.`,
            `Scale verified playbooks across core teams with executive KPI checkpoints.`,
          ].slice(0, 3);

    return seeds.map((line, idx) => {
      const parsed = parseTimelineBullet(line, idx);
      const stage = parsed.stage.startsWith('Step ') ? phases[idx % phases.length] : parsed.stage;
      return `${stage}: ${parsed.detail}`;
    });
  }

  if (layout === 'two_column') {
    const seeds =
      cleaned.length >= 4
        ? cleaned.slice(0, 6)
        : [
            cleaned[0] || `Strategic Driver: Accelerate high-value execution across ${topic}.`,
            cleaned[1] || 'Strategic Driver: Standardize repeatable playbooks for measurable velocity.',
            cleaned[2] || 'Governance Guardrail: Enforce role-scoped access and audit visibility.',
            cleaned[3] || 'Governance Guardrail: Track unit-cost thresholds before broad expansion.',
          ];
    const mid = Math.ceil(seeds.length / 2);
    return seeds.map((line, idx) => {
      if (line.indexOf(':') > 1 && line.indexOf(':') <= 28) return line;
      const prefix = idx < mid ? 'Strategic Driver' : 'Governance Guardrail';
      return `${prefix}: ${line}`;
    });
  }

  if (layout === 'callout') {
    if (cleaned.length >= 3) return cleaned.slice(0, 4);
    return [
      cleaned[0] || `${title || topic} succeeds when architectural clarity precedes broad operational rollout.`,
      cleaned[1] || `Focus initial investment on high-leverage bottlenecks with clear baseline telemetry.`,
      `Pair execution speed with transparent governance so stakeholders sign off with confidence.`,
    ];
  }

  return cleaned.length > 0
    ? cleaned.slice(0, 5)
    : [
        `Anchor ${topic} on measurable business outcomes rather than disconnected experiments.`,
        `Align cross-functional owners around clear operational guardrails and milestones.`,
        `Track adoption, quality, and unit economics at every rollout checkpoint.`,
      ];
}

export function buildSmartOutlineSections(topic, description, tone, slideCount, createId) {
  const cleanTopic = cleanTopicPhrase(topic);
  const count = Math.min(10, Math.max(1, Number(slideCount) || 5));
  const contextLine = description
    ? ` Ground the narrative in: ${String(description).trim().slice(0, 150)}.`
    : '';
  const stats = extractNumbers(`${cleanTopic} ${description || ''}`);
  const statCue = stats[0] || '35%';

  const blueprints = [
    {
      title: `Executive Mandate: Why ${cleanTopic} Matters Now`,
      summary: `Frame the strategic opportunity, urgency, and measurable outcomes expected from ${cleanTopic}.${contextLine}`,
      suggestedLayout: 'title',
    },
    {
      title: `Core Thesis: Designing ${cleanTopic} for Compounding Advantage`,
      summary: `Articulate the central ${tone || 'professional'} thesis separating disciplined execution from fragmented pilots.`,
      suggestedLayout: 'callout',
    },
    {
      title: `Target Impact Scorecard & ${statCue} Efficiency Benchmark`,
      summary: `Quantify leading KPIs, cycle-time gains, and unit-economics targets guiding stakeholder sign-off.`,
      suggestedLayout: 'metrics',
    },
    {
      title: `Execution Enablers vs. Governance Guardrails`,
      summary: `Compare velocity enablers against security, compliance, and operational reliability controls.`,
      suggestedLayout: 'two_column',
    },
    {
      title: `Phased 30-60-90 Day Rollout & Milestone Plan`,
      summary: `Sequence pilot validation, cross-team integration, and scale readiness gates with clear ownership.`,
      suggestedLayout: 'timeline',
    },
    {
      title: `High-Impact Workflows & Technical Capabilities`,
      summary: `Pinpoint the highest-leverage workflows and platform capabilities required to sustain adoption.`,
      suggestedLayout: 'content',
    },
    {
      title: `Stakeholder Enablement & Operating Transition`,
      summary: `Bridge technical rollout with frontline playbooks, training loops, and governance reviews.`,
      suggestedLayout: 'section',
    },
    {
      title: `Resource Allocation & Unit-Cost Sensitivity`,
      summary: `Align investment tiers with milestone gates so budget scales alongside verified ROI.`,
      suggestedLayout: 'metrics',
    },
    {
      title: `Autonomous Execution vs. Escalation Controls`,
      summary: `Balance team-level speed with centralized audit trails and incident response guardrails.`,
      suggestedLayout: 'two_column',
    },
    {
      title: `Executive Summary & Immediate Next Decisions`,
      summary: `Consolidate the core recommendation and confirm concrete decisions required this quarter.`,
      suggestedLayout: 'summary',
    },
  ];

  let chosen;
  if (count === 1) {
    chosen = [blueprints[0]];
  } else if (count === 2) {
    chosen = [blueprints[0], blueprints[9]];
  } else {
    chosen = [blueprints[0], ...blueprints.slice(1, 1 + (count - 2)), blueprints[9]];
  }

  return enforceOutlineDiversity(
    chosen.map((entry, idx) => ({
      id: createId('sec'),
      title: entry.title.trim(),
      summary: entry.summary,
      order: idx + 1,
      suggestedLayout: entry.suggestedLayout,
    })),
    () => createId('sec')
  );
}

export function buildSmartSlidesFromOutline(deck, sections, createId) {
  const total = sections.length;
  const topic = cleanTopicPhrase(deck.topic || deck.title);
  const usedMiddle = new Set();
  let prevLayout = null;

  return sections.map((section, index) => {
    const summary = String(section.summary || '').trim();
    const stats = extractNumbers(`${section.title} ${summary} ${deck.description || ''}`);
    const primaryStat = stats[0] || '34% Faster';
    const secondaryStat = stats[1] || '99.4% Target';

    const pinned = VALID_LAYOUTS.has(section.suggestedLayout) ? section.suggestedLayout : null;
    let layout;
    if (pinned) {
      layout = pinned;
      if (index > 0 && index < total - 1) usedMiddle.add(layout);
    } else if (index === 0) {
      layout = 'title';
    } else if (total >= 3 && index === total - 1) {
      layout = 'summary';
    } else {
      const inferred = inferBestMiddleLayout(section, index);
      layout = pickNonCollidingMiddleLayout(inferred, prevLayout, usedMiddle, index);
      usedMiddle.add(layout);
    }
    prevLayout = layout;

    let rawBullets;
    if (layout === 'metrics') {
      rawBullets = [
        `${primaryStat} | ${summary || `Primary operational lift targeted across ${topic} workflows`}`,
        `${secondaryStat} | Verified reliability and quality benchmark maintained in production`,
        `3.2x ROI | Projected efficiency return within two quarters of governed rollout`,
      ];
    } else if (layout === 'timeline') {
      rawBullets = [
        `Phase 1 (Days 1-30): ${summary || `Baseline bottlenecks and finalize pilot scope for ${topic}`}`,
        `Phase 2 (Days 31-60): Deploy core workflows with automated telemetry and quality guardrails`,
        `Phase 3 (Days 61-90): Audit KPI outcomes and expand validated playbooks organization-wide`,
      ];
    } else if (layout === 'two_column') {
      rawBullets = [
        `Velocity Driver: ${summary || `Accelerate ${topic} workflows with standardized playbooks`}`,
        `Velocity Driver: Shorten feedback loops using real-time telemetry and benchmarks`,
        `Control Guardrail: Enforce role-scoped access, auditability, and cost thresholds`,
        `Control Guardrail: Gate broader rollout on verified milestone scorecards`,
      ];
    } else if (layout === 'callout') {
      rawBullets = [
        summary || `${section.title} anchors ${topic} on measurable execution rather than ad-hoc pilots.`,
        `Prioritize high-impact workflows with clear baseline metrics and accountable owners.`,
        `Embed governance and observability directly into day-one delivery.`,
      ];
    } else {
      rawBullets = [
        summary || `Establish clear strategic alignment around ${section.title}.`,
        `Align cross-functional owners on measurable targets supporting ${topic}.`,
        `Prioritize high-leverage milestones with clear accountability and review cadence.`,
      ];
    }

    return {
      _id: createId('slide'),
      deckId: deck._id,
      slideNumber: index + 1,
      title: String(section.title || `Slide ${index + 1}`),
      content: formatBulletsForLayout(rawBullets, layout, section.title, deck),
      speakerNotes: `Walk the audience through "${section.title}" using a ${deck.tone || 'professional'} tone, highlight the concrete evidence on screen, and bridge smoothly to Slide ${Math.min(total, index + 2)}.`,
      layout,
    };
  });
}

function buildRefinedHeadline(currentTitle = '', instruction = '', targetLayout = 'content', topic = '') {
  const base = String(currentTitle || topic || 'Executive Insight')
    .replace(/\s*\(Refined\)\s*$/i, '')
    .trim();
  const cleanInst = String(instruction || '').trim();

  if (targetLayout === 'metrics' && !/\b(kpi|scorecard|metrics|impact|benchmark)\b/i.test(base)) {
    return `${base}: KPI Impact Scorecard`.slice(0, 190);
  }
  if (targetLayout === 'timeline' && !/\b(roadmap|timeline|phased|milestones?)\b/i.test(base)) {
    return `${base}: Phased Execution Roadmap`.slice(0, 190);
  }
  if (targetLayout === 'two_column' && !/\b(vs\.?|versus|tradeoff|guardrail|balance|split)\b/i.test(base)) {
    return `${base}: Strategic Drivers vs. Guardrails`.slice(0, 190);
  }
  if (targetLayout === 'callout' && !/\b(thesis|mandate|spotlight|imperative)\b/i.test(base)) {
    return `Executive Mandate: ${base}`.slice(0, 190);
  }
  if (/brevity|concise|simplify|shorter|clearer/i.test(cleanInst)) {
    const shortened = base.split(/[:—–-]/)[0].trim();
    return shortened.length >= 12 && shortened !== base
      ? shortened
      : `Key Imperative: ${shortened}`.slice(0, 190);
  }

  return `${base} — Strategic Priority`.slice(0, 190);
}

export function regenerateSmartDemoSlide({
  deck = {},
  currentSlide = {},
  previousTitle = '',
  nextTitle = '',
  instruction = '',
  target = 'full',
  allowLayoutChange,
  preferredLayout,
} = {}) {
  const safeTarget = ['full', 'bullets', 'notes'].includes(target) ? target : 'full';
  const preservedLayout = VALID_LAYOUTS.has(currentSlide.layout) ? currentSlide.layout : 'content';
  const cleanInst = String(instruction || 'Sharpen executive clarity and measurable impact').trim();
  const topic = cleanTopicPhrase(deck.topic || currentSlide.title);

  const { canChangeLayout, requestedLayout } = resolveEffectiveLayoutChange({
    target: safeTarget,
    allowLayoutChange,
    preferredLayout,
    instruction: cleanInst,
  });

  const finalLayout = canChangeLayout
    ? requestedLayout ||
      inferBestMiddleLayout(
        { title: `${currentSlide.title || ''} ${cleanInst}`, content: currentSlide.content },
        1
      )
    : preservedLayout;

  const prevCue = previousTitle
    ? `Bridge from "${previousTitle}" into this slide's core takeaway.`
    : `Open this slide by grounding the audience in ${topic}.`;
  const nextCue = nextTitle
    ? `Close by transitioning smoothly into "${nextTitle}".`
    : `Conclude with an explicit owner sign-off and next milestone checkpoint.`;
  const synthesizedNotes = `${prevCue} Emphasize how ${currentSlide.title || topic} addresses "${cleanInst}" with concrete operational proof. ${nextCue}`;

  if (safeTarget === 'notes') {
    return {
      title: String(currentSlide.title || 'Untitled slide'),
      content: Array.isArray(currentSlide.content) ? [...currentSlide.content] : [],
      speakerNotes: synthesizedNotes,
      layout: preservedLayout,
    };
  }

  const existingLines = Array.isArray(currentSlide.content)
    ? currentSlide.content.map((line) => String(line).trim()).filter(Boolean)
    : [];

  const angleSeed = cleanInst.replace(/[.!?]+$/, '');
  const adaptedSeeds = [
    ...existingLines.slice(0, 2),
    `Prioritize measurable outcomes aligned to ${angleSeed.toLowerCase()} across ${topic}.`,
    `Verify execution readiness through explicit ownership, telemetry, and review cadence.`,
  ];

  const refinedBullets = formatBulletsForLayout(
    canChangeLayout && finalLayout !== preservedLayout ? existingLines : adaptedSeeds,
    finalLayout,
    currentSlide.title,
    deck
  );

  if (safeTarget === 'bullets') {
    return {
      title: String(currentSlide.title || 'Untitled slide'),
      content: refinedBullets,
      speakerNotes: String(currentSlide.speakerNotes ?? ''),
      layout: finalLayout,
    };
  }

  return {
    title: buildRefinedHeadline(currentSlide.title, cleanInst, finalLayout, topic),
    content: refinedBullets,
    speakerNotes: synthesizedNotes,
    layout: finalLayout,
  };
}
