import {
    VALID_LAYOUTS,
    parseMetricBullet,
    parseTimelineBullet,
    resolveEffectiveLayoutChange
} from '../constants/layouts.js';
import { makeId } from '../utils/ids.js';

const MIDDLE_ARCHETYPE_ROTATION = ['callout', 'metrics', 'two_column', 'timeline', 'content', 'section'];

function cleanTopicPhrase(topic = 'Strategic Initiative') {
    const trimmed = String(topic || '').trim().replace(/\s+/g, ' ');
    return trimmed || 'Strategic Initiative';
}

function extractNumbers(text = '') {
    const matches = String(text).match(/[+$<>~]?(?:\$)?\d[\d,.]*(?:\s*(?:%|x|MWh|GWh|M|K|ms|s|days|seats))?/gi);
    return matches ? [...new Set(matches.map((m) => m.trim()))] : [];
}

export function inferBestMiddleLayout(item = {}, index = 1) {
    const haystack = [
        item?.title || '',
        item?.summary || '',
        ...(Array.isArray(item?.content) ? item.content : [])
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
        ...MIDDLE_ARCHETYPE_ROTATION
    ].filter((layout) => VALID_LAYOUTS.has(layout) && layout !== 'title' && layout !== 'summary');

    const unusedNonAdjacent = candidates.find(
        (layout) => layout !== prevLayout && !usedSet.has(layout)
    );
    if (unusedNonAdjacent) return unusedNonAdjacent;

    const nonAdjacent = candidates.find((layout) => layout !== prevLayout);
    return nonAdjacent || 'content';
}

export function enforceOutlineDiversity(rawSections = []) {
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
            id: section.id || makeId(),
            order: index + 1,
            suggestedLayout: layout
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
                      `3.2x ROI | First-year payback modeled on active production adoption`
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
        const phases = ['Phase 1 (Days 1-30)', 'Phase 2 (Days 31-60)', 'Phase 3 (Days 61-90)', 'Phase 4 (Scale)'];
        const seeds =
            cleaned.length >= 3
                ? cleaned.slice(0, 4)
                : [
                      ...cleaned,
                      `Establish baseline telemetry, ownership roles, and pilot scope for ${topic}.`,
                      `Integrate automated guardrails and validate measurable workflow gains.`,
                      `Scale verified playbooks across core teams with executive KPI checkpoints.`
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
                      cleaned[3] || 'Governance Guardrail: Track unit-cost thresholds before broad expansion.'
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
            `Pair execution speed with transparent governance so stakeholders sign off with confidence.`
        ];
    }

    return cleaned.length > 0
        ? cleaned.slice(0, 5)
        : [
              `Anchor ${topic} on measurable business outcomes rather than disconnected experiments.`,
              `Align cross-functional owners around clear operational guardrails and milestones.`,
              `Track adoption, quality, and unit economics at every rollout checkpoint.`
          ];
}

export function enforceSlideDiversity(rawSlides = [], outlineSections = [], deckContext = {}) {
    const targetCount = Math.min(10, Math.max(outlineSections.length, rawSlides.length, 1));
    const aligned = Array.from({ length: targetCount }, (_, index) => {
        const section = outlineSections[index];
        const candidate = rawSlides[index];
        if (candidate) return candidate;
        return buildSmartSlideForSection(deckContext, section || { title: `Slide ${index + 1}`, summary: '' }, index, targetCount);
    });

    const usedMiddle = new Set();
    let prevLayout = null;

    return aligned.map((slide, index) => {
        const section = outlineSections[index];
        const pinnedLayout = VALID_LAYOUTS.has(section?.suggestedLayout) ? section.suggestedLayout : null;
        const rawLayout = VALID_LAYOUTS.has(slide?.layout) ? slide.layout : null;
        let finalLayout;

        if (pinnedLayout) {
            finalLayout = pinnedLayout;
            if (index > 0 && index < targetCount - 1) {
                usedMiddle.add(finalLayout);
            }
        } else if (index === 0) {
            finalLayout = 'title';
        } else if (targetCount >= 3 && index === targetCount - 1) {
            finalLayout = 'summary';
        } else {
            const inferred = inferBestMiddleLayout(
                { title: slide?.title || section?.title, summary: section?.summary, content: slide?.content },
                index
            );
            const rawIsGenericDuplicate =
                !rawLayout ||
                rawLayout === 'title' ||
                rawLayout === 'summary' ||
                (targetCount >= 4 && rawLayout === prevLayout) ||
                (rawLayout === 'content' && inferred !== 'content' && usedMiddle.has('content'));

            if (!rawIsGenericDuplicate) {
                finalLayout = rawLayout;
            } else {
                finalLayout = pickNonCollidingMiddleLayout(
                    inferred !== 'content' ? inferred : rawLayout || inferred,
                    prevLayout,
                    usedMiddle,
                    index
                );
            }
            usedMiddle.add(finalLayout);
        }

        prevLayout = finalLayout;
        const formattedContent = formatBulletsForLayout(
            slide?.content,
            finalLayout,
            slide?.title || section?.title,
            deckContext
        );

        return {
            slideNumber: index + 1,
            title: String(slide?.title || section?.title || `Slide ${index + 1}`),
            content: formattedContent,
            speakerNotes: String(
                slide?.speakerNotes ||
                    `Walk the audience through ${slide?.title || section?.title || 'this slide'} and connect its takeaway to ${deckContext.topic || 'the overall narrative'}.`
            ),
            layout: finalLayout
        };
    });
}

export function generateSmartOutline(input = {}) {
    const topic = cleanTopicPhrase(input.topic);
    const description = String(input.description || '').trim();
    const tone = String(input.tone || 'professional');
    const count = Math.min(10, Math.max(1, Number(input.slideCount) || 5));
    const detectedStats = extractNumbers(`${topic} ${description}`);
    const statCue = detectedStats[0] || '35%';

    const blueprintPool = [
        {
            title: `${topic}: Strategic Mandate & Executive Context`,
            summary: description
                ? `Frame why ${topic} matters now: ${description.slice(0, 180)}`
                : `Establish the executive context, urgency, and measurable value proposition behind ${topic}.`,
            suggestedLayout: 'title'
        },
        {
            title: `Core Thesis: Designing ${topic} for Compounding Advantage`,
            summary: `Articulate the central ${tone} thesis separating disciplined ${topic} execution from fragmented status-quo efforts.`,
            suggestedLayout: 'callout'
        },
        {
            title: `Target Impact Scorecard & ${statCue} Efficiency Benchmark`,
            summary: `Quantify expected cycle-time gains, unit-cost telemetry, and reliability benchmarks guiding investment decisions.`,
            suggestedLayout: 'metrics'
        },
        {
            title: `Execution Enablers vs. Risk & Governance Guardrails`,
            summary: `Balance high-velocity adoption drivers against security, quality, and operational control requirements.`,
            suggestedLayout: 'two_column'
        },
        {
            title: `Phased 90-Day Implementation & Milestone Roadmap`,
            summary: `Sequence pilot validation, cross-team integration, and scale readiness checkpoints with clear ownership.`,
            suggestedLayout: 'timeline'
        },
        {
            title: `Operational Architecture & High-Leverage Workflows`,
            summary: `Pinpoint the highest-impact workflows and technical foundations required to sustain adoption.`,
            suggestedLayout: 'content'
        },
        {
            title: `Change Management & Stakeholder Alignment Transition`,
            summary: `Bridge technical delivery with frontline enablement, training cadences, and executive reporting.`,
            suggestedLayout: 'section'
        },
        {
            title: `Resource Allocation & Unit-Cost Sensitivity Model`,
            summary: `Compare baseline operating overhead against projected ROI thresholds across conservative and upside scenarios.`,
            suggestedLayout: 'metrics'
        },
        {
            title: `Cross-Functional Operating Model vs. Escalation Controls`,
            summary: `Define team-level autonomy alongside centralized auditability and incident response protocols.`,
            suggestedLayout: 'two_column'
        },
        {
            title: `Executive Decisions, KPI Checkpoints & Next Actions`,
            summary: `Summarize immediate sign-off items, 30-day success criteria, and accountability for ${topic}.`,
            suggestedLayout: 'summary'
        }
    ];

    let chosen;
    if (count === 1) {
        chosen = [blueprintPool[0]];
    } else if (count === 2) {
        chosen = [blueprintPool[0], blueprintPool[9]];
    } else {
        chosen = [
            blueprintPool[0],
            ...blueprintPool.slice(1, 1 + (count - 2)),
            blueprintPool[9]
        ];
    }

    const sections = enforceOutlineDiversity(
        chosen.map((item, idx) => ({
            id: makeId(),
            title: item.title,
            summary: item.summary,
            order: idx + 1,
            suggestedLayout: item.suggestedLayout
        }))
    );

    return {
        title: topic,
        sections
    };
}

function buildSmartSlideForSection(deck = {}, section = {}, index = 0, total = 5) {
    const topic = cleanTopicPhrase(deck.topic || deck.title);
    const summary = String(section.summary || '').trim();
    const stats = extractNumbers(`${section.title} ${summary} ${deck.description || ''}`);
    const primaryStat = stats[0] || '34% Faster';
    const secondaryStat = stats[1] || '99.4% Target';

    const layout = VALID_LAYOUTS.has(section.suggestedLayout)
        ? section.suggestedLayout
        : index === 0
          ? 'title'
          : total >= 3 && index === total - 1
            ? 'summary'
            : inferBestMiddleLayout(section, index);

    let rawBullets;
    if (layout === 'metrics') {
        rawBullets = [
            `${primaryStat} | ${summary || `Primary operational lift targeted across ${topic} workflows`}`,
            `${secondaryStat} | Verified reliability and quality threshold maintained in production`,
            `3.2x ROI | Projected efficiency return within two quarters of governed rollout`
        ];
    } else if (layout === 'timeline') {
        rawBullets = [
            `Phase 1 (Days 1-30): ${summary || `Baseline current bottlenecks and finalize pilot scope for ${topic}`}`,
            `Phase 2 (Days 31-60): Deploy core workflows with automated telemetry and quality guardrails`,
            `Phase 3 (Days 61-90): Audit KPI outcomes and expand validated playbooks organization-wide`
        ];
    } else if (layout === 'two_column') {
        rawBullets = [
            `Velocity Driver: ${summary || `Focus ${topic} on repeatable high-frequency workflows`}`,
            `Velocity Driver: Empower teams with standardized templates and fast feedback loops`,
            `Control Guardrail: Enforce role-scoped permissions, audit trails, and cost ceilings`,
            `Control Guardrail: Require measurable quality benchmarks before scaling seat access`
        ];
    } else if (layout === 'callout') {
        rawBullets = [
            summary || `${section.title} anchors ${topic} on measurable execution rather than ad-hoc experimentation.`,
            `Prioritize high-impact workflows with clear baseline metrics and accountable owners.`,
            `Embed governance and observability directly into day-one delivery.`
        ];
    } else {
        rawBullets = [
            summary || `Establish clear strategic alignment around ${section.title}.`,
            `Focus execution on measurable outcomes supporting ${topic}.`,
            `Confirm owner accountability, timeline checkpoints, and success metrics.`
        ];
    }

    return {
        slideNumber: index + 1,
        // Preserve section.title verbatim per API & test contract
        title: String(section.title || `Slide ${index + 1}`),
        content: formatBulletsForLayout(rawBullets, layout, section.title, deck),
        speakerNotes: `Emphasize the core takeaway in "${section.title}" for ${topic}, highlight the concrete proof points on screen, and bridge smoothly into Slide ${Math.min(total, index + 2)}.`,
        layout
    };
}

export function generateSmartSlides(deck = {}, outline = []) {
    const rawSlides = outline.map((section, index) =>
        buildSmartSlideForSection(deck, section, index, outline.length)
    );
    return enforceSlideDiversity(rawSlides, outline, deck);
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

export function regenerateSmartSlide(input = {}) {
    const target = ['full', 'bullets', 'notes'].includes(input.target) ? input.target : 'full';
    const current = input.currentSlide || {};
    const preservedLayout = VALID_LAYOUTS.has(current.layout) ? current.layout : 'content';
    const instruction = String(input.instruction || 'Sharpen executive clarity and measurable impact').trim();
    const topic = cleanTopicPhrase(input.topic || current.title);

    const { canChangeLayout, requestedLayout } = resolveEffectiveLayoutChange({
        target,
        allowLayoutChange: input.allowLayoutChange,
        preferredLayout: input.preferredLayout,
        instruction
    });

    const finalLayout = canChangeLayout
        ? requestedLayout ||
          inferBestMiddleLayout(
              { title: `${current.title || ''} ${instruction}`, content: current.content },
              1
          )
        : preservedLayout;

    const prevCue = input.previousTitle
        ? `Bridge from "${input.previousTitle}" into this slide's core argument.`
        : `Open this slide by anchoring audience attention on ${topic}.`;
    const nextCue = input.nextTitle
        ? `Close by transitioning directly into "${input.nextTitle}".`
        : `Conclude with a clear decision checkpoint and owner sign-off.`;
    const synthesizedNotes = `${prevCue} Emphasize how ${current.title || topic} addresses "${instruction}" with concrete, defensible evidence. ${nextCue}`;

    if (target === 'notes') {
        return {
            title: String(current.title || 'Untitled slide'),
            content: Array.isArray(current.content) ? [...current.content] : [],
            speakerNotes: synthesizedNotes,
            layout: preservedLayout
        };
    }

    const existingLines = Array.isArray(current.content)
        ? current.content.map((line) => String(line).trim()).filter(Boolean)
        : [];

    const angleSeed = instruction.replace(/[.!?]+$/, '');
    const adaptedSeeds = [
        ...existingLines.slice(0, 2),
        `Prioritize measurable outcomes aligned to ${angleSeed.toLowerCase()} across ${topic}.`,
        `Verify execution readiness through explicit ownership, telemetry, and review cadence.`
    ];

    const refinedBullets = formatBulletsForLayout(
        canChangeLayout && finalLayout !== preservedLayout ? existingLines : adaptedSeeds,
        finalLayout,
        current.title,
        { topic, description: input.description }
    );

    if (target === 'bullets') {
        return {
            title: String(current.title || 'Untitled slide'),
            content: refinedBullets,
            speakerNotes: String(current.speakerNotes ?? ''),
            layout: finalLayout
        };
    }

    return {
        title: buildRefinedHeadline(current.title, instruction, finalLayout, topic),
        content: refinedBullets,
        speakerNotes: synthesizedNotes,
        layout: finalLayout
    };
}
