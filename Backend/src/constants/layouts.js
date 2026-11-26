export const SLIDE_LAYOUTS = [
    'title',
    'section',
    'content',
    'two_column',
    'metrics',
    'timeline',
    'callout',
    'summary'
];

export const VALID_LAYOUTS = new Set(SLIDE_LAYOUTS);

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
            label: right || left || 'Operational benchmark indicator'
        };
    }

    const match = raw.match(LEADING_METRIC_REGEX);
    if (match && match[1] && match[2]) {
        return {
            value: match[1].trim(),
            label: match[2].trim()
        };
    }

    return {
        value: fallbackValue,
        label: raw
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
        detail: raw
    };
}

function detectSharedPrefix(items = []) {
    const nonEmpty = items.map((item) => String(item ?? '').trim()).filter(Boolean);
    if (!nonEmpty.length) return null;

    const prefixes = [];
    for (const line of nonEmpty) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 1 && colonIdx <= 30) {
            const prefix = line.slice(0, colonIdx).trim();
            const rest = line.slice(colonIdx + 1).trim();
            if (prefix && rest) {
                prefixes.push(prefix);
            }
        }
    }

    if (prefixes.length < Math.ceil(nonEmpty.length / 2)) {
        return null;
    }

    const canonical = prefixes[0].toLowerCase();
    if (!prefixes.every((p) => p.toLowerCase() === canonical)) {
        return null;
    }

    return prefixes[0].toUpperCase();
}

export function extractSharedColumnHeaders(leftItems = [], rightItems = []) {
    return {
        leftHeader: detectSharedPrefix(leftItems) || 'COLUMN 01 • PRIMARY DRIVERS',
        rightHeader: detectSharedPrefix(rightItems) || 'COLUMN 02 • GUARDRAILS & TRADEOFFS'
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
    instruction = ''
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
            requestedLayout: mapKeywordToLayout(instruction)
        };
    }

    if (allowLayoutChange === false) {
        return { canChangeLayout: false, requestedLayout: null };
    }

    const explicitMatch = String(instruction || '').match(EXPLICIT_LAYOUT_CONVERSION_REGEX);
    if (explicitMatch) {
        return {
            canChangeLayout: true,
            requestedLayout: mapKeywordToLayout(explicitMatch[0])
        };
    }

    return { canChangeLayout: false, requestedLayout: null };
}
