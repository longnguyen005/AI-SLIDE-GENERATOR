export const SLIDE_LAYOUTS = [
  'title',
  'section',
  'content',
  'two_column',
  'metrics',
  'timeline',
  'callout',
  'summary',
];

export const VALID_LAYOUTS = new Set(SLIDE_LAYOUTS);

export const LAYOUT_LABELS = {
  title: 'Cover',
  section: 'Section Break',
  content: 'Key Insights',
  two_column: 'Side-by-Side',
  metrics: 'KPI Metrics',
  timeline: 'Roadmap Flow',
  callout: 'Thesis Callout',
  summary: 'Executive Summary',
};

export const LAYOUT_OPTIONS = [
  { value: 'title', label: 'Title Cover', hint: 'Hero intro', icon: 'sparkles' },
  { value: 'section', label: 'Section Divider', hint: 'Chapter break', icon: 'layers' },
  { value: 'content', label: 'Standard Content', hint: 'Points + visual', icon: 'slide' },
  { value: 'two_column', label: 'Two Column', hint: 'Split comparison', icon: 'template' },
  { value: 'metrics', label: 'KPI Metrics', hint: 'Stat scorecard', icon: 'chart' },
  { value: 'timeline', label: 'Roadmap Flow', hint: 'Phased stepper', icon: 'clock' },
  { value: 'callout', label: 'Thesis Callout', hint: 'Spotlight + pillars', icon: 'globe' },
  { value: 'summary', label: 'Executive Summary', hint: 'Key takeaways', icon: 'check' },
];

export const OUTLINE_LAYOUT_OPTIONS = [
  { value: '', label: 'Auto (AI Adaptive)' },
  ...LAYOUT_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export function normalizeSlideLayout(value, fallback = 'content') {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return VALID_LAYOUTS.has(candidate) ? candidate : fallback;
}

const LEADING_METRIC_REGEX =
  /^([+$<>~]?(?:\$)?\d[\d,.]*(?:\s*(?:\/\s*seat|\/\s*mo|mins|min|mos|ms|hrs|hr|days|wks|yrs|bps|MWh|GWh|seats|TB|GB|%|x|X|K|k|M|B|s|m|h))?(?=\s|[:\-–—]|$)(?:\s+(?:Faster|Slower|Lower|Higher|Saved|ARR|MRR|Uptime|Accuracy|Growth|Margin|Reduction|ROI|NPS|Tagged|Availability|Contracted|SLA)(?=\s|[:\-–—]|$))?)\s*(?:[:\-–—]\s*|\s+)(.+)$/i;

export function parseMetricBullet(rawText, index = 0) {
  const raw = String(rawText ?? '').trim();
  const fallbackValue = `KPI ${String(index + 1).padStart(2, '0')}`;
  if (!raw) {
    return { value: fallbackValue, label: 'Operational benchmark indicator' };
  }

  if (raw.includes('|')) {
    const pipeIdx = raw.indexOf('|');
    const left = raw.slice(0, pipeIdx).trim();
    const right = raw.slice(pipeIdx + 1).trim();
    return {
      value: left || fallbackValue,
      label: right || left || 'Operational benchmark indicator',
    };
  }

  const match = raw.match(LEADING_METRIC_REGEX);
  if (match && match[1] && match[2]) {
    return {
      value: match[1].trim(),
      label: match[2].trim(),
    };
  }

  return {
    value: fallbackValue,
    label: raw,
  };
}

export function parseTimelineBullet(rawText, index = 0) {
  const raw = String(rawText ?? '').trim();
  const fallbackStage = `Step ${String(index + 1).padStart(2, '0')}`;
  if (!raw) {
    return { stage: fallbackStage, detail: 'Complete milestone checkpoint' };
  }

  if (raw.includes('|')) {
    const pipeIdx = raw.indexOf('|');
    const left = raw.slice(0, pipeIdx).trim();
    const right = raw.slice(pipeIdx + 1).trim();
    if (left && left.length <= 42 && right) {
      return { stage: left, detail: right };
    }
  }

  const colonIdx = raw.indexOf(':');
  if (colonIdx > 0 && colonIdx <= 42) {
    const stage = raw.slice(0, colonIdx).trim();
    const detail = raw.slice(colonIdx + 1).trim();
    if (stage && detail) {
      return { stage, detail };
    }
  }

  return {
    stage: fallbackStage,
    detail: raw,
  };
}

function parseSharedColumnGroup(items = [], fallbackHeader = 'Column') {
  const cleaned = items.map((item) => String(item ?? '').trim()).filter(Boolean);
  if (!cleaned.length) {
    return { header: fallbackHeader, items: [], sharedPrefix: null };
  }

  const parsedEntries = cleaned.map((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 1 && colonIdx <= 30) {
      const prefix = line.slice(0, colonIdx).trim();
      const rest = line.slice(colonIdx + 1).trim();
      if (prefix && rest) {
        return { prefix, rest, raw: line };
      }
    }
    return { prefix: null, rest: line, raw: line };
  });

  const withPrefix = parsedEntries.filter((entry) => entry.prefix);
  if (withPrefix.length === cleaned.length) {
    const canonical = withPrefix[0].prefix.toLowerCase();
    if (withPrefix.every((entry) => entry.prefix.toLowerCase() === canonical)) {
      return {
        header: withPrefix[0].prefix,
        items: parsedEntries.map((entry) => entry.rest),
        sharedPrefix: withPrefix[0].prefix,
      };
    }
  }

  return {
    header: fallbackHeader,
    items: cleaned,
    sharedPrefix: null,
  };
}

export function extractTwoColumnData(points = []) {
  const safePoints = Array.isArray(points)
    ? points.map((p) => String(p ?? '').trim()).filter(Boolean)
    : [];
  const midIndex = Math.max(1, Math.ceil(safePoints.length / 2));
  const rawLeft = safePoints.slice(0, midIndex);
  const rawRight = safePoints.slice(midIndex);

  const left = parseSharedColumnGroup(rawLeft, 'Primary Drivers');
  const right = parseSharedColumnGroup(rawRight, 'Counterpart & Guardrails');

  return {
    midIndex,
    leftHeader: left.header,
    rightHeader: right.header,
    leftItems: left.items,
    rightItems: right.items,
  };
}

export function extractSharedColumnHeaders(leftItems = [], rightItems = []) {
  const left = parseSharedColumnGroup(leftItems, 'COLUMN 01 • PRIMARY DRIVERS');
  const right = parseSharedColumnGroup(rightItems, 'COLUMN 02 • GUARDRAILS & TRADEOFFS');
  return {
    leftHeader: left.sharedPrefix ? left.sharedPrefix.toUpperCase() : left.header,
    rightHeader: right.sharedPrefix ? right.sharedPrefix.toUpperCase() : right.header,
  };
}

function mapKeywordToLayout(text = '') {
  const lower = String(text).toLowerCase();
  if (/\b(metrics?|kpi|scorecard|stats?)\b/.test(lower)) return 'metrics';
  if (/\b(timeline|roadmap|milestones?)\b/.test(lower)) return 'timeline';
  if (/\b(two[- ]column|side[- ]by[- ]side|comparison|tradeoff)\b/.test(lower)) return 'two_column';
  if (/\b(callout|spotlight|thesis)\b/.test(lower)) return 'callout';
  if (/\bsection\s+(break|divider)\b/.test(lower)) return 'section';
  if (/\b(executive\s+summary|summary|takeaways?)\b/.test(lower)) return 'summary';
  if (/\b(title\s+cover|cover\s+slide)\b/.test(lower)) return 'title';
  if (/\b(standard\s+content|bullet\s+list)\b/.test(lower)) return 'content';
  return null;
}

const EXPLICIT_LAYOUT_CONVERSION_REGEX =
  /\b(convert|switch|change|turn|reformat|transform|restructure)\b[\s\S]{0,48}\b(metrics?|kpi|scorecard|timeline|roadmap|two[- ]column|side[- ]by[- ]side|comparison|callout|spotlight|thesis|summary|section\s+break|section\s+divider)\b/i;

export function resolveEffectiveLayoutChange({
  target = 'full',
  allowLayoutChange,
  preferredLayout,
  instruction = '',
} = {}) {
  if (target === 'notes') {
    return { canChangeLayout: false, requestedLayout: null };
  }

  if (preferredLayout && VALID_LAYOUTS.has(preferredLayout)) {
    return { canChangeLayout: true, requestedLayout: preferredLayout };
  }

  if (allowLayoutChange === true) {
    return {
      canChangeLayout: true,
      requestedLayout: mapKeywordToLayout(instruction),
    };
  }

  if (allowLayoutChange === false) {
    return { canChangeLayout: false, requestedLayout: null };
  }

  const explicitMatch = String(instruction || '').match(EXPLICIT_LAYOUT_CONVERSION_REGEX);
  if (explicitMatch) {
    return {
      canChangeLayout: true,
      requestedLayout: mapKeywordToLayout(explicitMatch[0]),
    };
  }

  return { canChangeLayout: false, requestedLayout: null };
}
