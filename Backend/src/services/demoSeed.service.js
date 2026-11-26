import bcrypt from 'bcryptjs';
import { Deck } from '../models/Deck.model.js';
import { Slide } from '../models/Slide.model.js';
import { SlideVersion } from '../models/SlideVersion.model.js';
import { User } from '../models/User.model.js';

const DEMO_EMAIL = 'demo@deckai.app';
const DEMO_FULL_NAME = 'Alex Rivera (Demo)';

const READY_DECK_TITLE = 'Enterprise AI Copilots: 2026 Rollout Blueprint';
const OUTLINE_DECK_TITLE = 'GridScale Storage: Series A Investor Overview';

const READY_DECK_OUTLINE = [
    {
        id: 'demo-ready-sec-1',
        title: 'Scaling Enterprise AI Copilots Without Compromising Governance',
        summary:
            'Frame the executive mandate: capture measurable knowledge-work velocity while enforcing strict data boundaries.',
        order: 1
    },
    {
        id: 'demo-ready-sec-2',
        title: 'Phase 1: High-Impact Workflows and Baseline Bottlenecks',
        summary:
            'Focus initial deployment on support triage, RFP drafting, and engineering runbooks where cycle times lag.',
        order: 2
    },
    {
        id: 'demo-ready-sec-3',
        title: 'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times',
        summary:
            'Highlight Q3 pilot telemetry across 240 seats showing faster turnaround and 91% citation accuracy.',
        order: 3
    },
    {
        id: 'demo-ready-sec-4',
        title: 'Balancing Rapid Experimentation Against Zero-Trust Security Controls',
        summary:
            'Contrast velocity enablers against role-based retrieval, PII redaction, and audit logging guardrails.',
        order: 4
    },
    {
        id: 'demo-ready-sec-5',
        title: '90-Day Execution Roadmap and Executive Sign-Off Milestones',
        summary:
            'Align leadership on phased seat expansion, unit-cost guardrails, and quarterly adoption reviews.',
        order: 5
    }
];

const READY_DECK_SLIDES = [
    {
        slideNumber: 1,
        title: 'Scaling Enterprise AI Copilots Without Compromising Governance',
        content: [
            'Transition from fragmented team experiments to one governed, auditable AI workspace.',
            'Anchor deployment on three measurable workflows before expanding organization-wide.',
            'Pair model routing controls with role-scoped retrieval from day one.'
        ],
        speakerNotes:
            'Open by aligning leadership on why governed AI adoption beats ad-hoc tool sprawl. Emphasize that speed and compliance reinforce each other when built into the platform layer.',
        layout: 'title'
    },
    {
        slideNumber: 2,
        title: 'Phase 1: High-Impact Workflows and Baseline Bottlenecks',
        content: [
            'Customer escalations spend 42% of resolution time searching historical runbooks.',
            'Enterprise security questionnaires require repetitive cross-team document synthesis.',
            'Onboarding engineers wait an average of four days for architecture context.'
        ],
        speakerNotes:
            'Use this section transition to ground the business case in real operational bottlenecks measured last quarter before introducing pilot outcomes.',
        layout: 'section'
    },
    {
        slideNumber: 3,
        title: 'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times',
        content: [
            'Support escalation drafting time dropped from 38 minutes to 25 minutes across 240 pilot seats.',
            'Grounded retrieval achieved 91% verified source citation accuracy on internal documentation.',
            'RFP response teams reclaimed 6.5 hours per rep each week for strategic deal reviews.',
            'Net internal promoter score reached +62 after introducing inline source verification.'
        ],
        speakerNotes:
            'Walk through the pilot metrics slowly and point out that citation visibility drove user trust far more than raw generation speed alone.',
        layout: 'content'
    },
    {
        slideNumber: 4,
        title: 'Balancing Rapid Experimentation Against Zero-Trust Security Controls',
        content: [
            'Velocity Enabler: Self-serve prompt templates curated by domain leads for repeatable tasks.',
            'Velocity Enabler: Multi-model fallback keeps p95 latency under 2.4 seconds during peak load.',
            'Security Guardrail: Document ACL inheritance ensures users only query authorized repositories.',
            'Security Guardrail: Automated PII redaction and zero-retention provider agreements protect customer data.'
        ],
        speakerNotes:
            'Contrast how enablement and security operate side-by-side: left column empowers teams to move fast while right column enforces non-negotiable enterprise controls.',
        layout: 'two_column'
    },
    {
        slideNumber: 5,
        title: '90-Day Execution Roadmap and Executive Sign-Off Milestones',
        content: [
            'Days 1-30: Finalize SSO role mappings and onboard 500 customer-facing specialists.',
            'Days 31-60: Integrate CRM and runbook connectors with automated weekly quality audits.',
            'Days 61-90: Review ROI scorecard against $18/seat target and approve global rollout.'
        ],
        speakerNotes:
            'Close by asking for sign-off on the Phase 2 seat allocation and confirming the 30-day governance checkpoint with Security and Finance.',
        layout: 'summary'
    }
];

const OUTLINE_READY_SECTIONS = [
    {
        id: 'demo-outline-sec-1',
        title: 'Industrial Decarbonization Stalls Without Dispatchable 12-Hour Storage',
        summary:
            'Quantify peak-tariff exposure and intermittency losses facing manufacturing campuses relying on solar and wind.',
        order: 1
    },
    {
        id: 'demo-outline-sec-2',
        title: 'Modular Iron-Air Architecture Cuts Levelized Storage Cost by 58%',
        summary:
            'Explain how abundant earth-mineral chemistry eliminates thermal runaway risk and lithium supply volatility.',
        order: 2
    },
    {
        id: 'demo-outline-sec-3',
        title: 'Commercial Traction: 48 MWh Contracted Across Three Logistics Hubs',
        summary:
            'Present signed multi-year energy-storage service agreements and 99.4% field availability from initial deployments.',
        order: 3
    },
    {
        id: 'demo-outline-sec-4',
        title: 'Hardware-Enabled Recurring Revenue With 46% Gross Margin at Scale',
        summary:
            'Break down upfront installation recovery, 15-year dispatch optimization software fees, and domestic tax-credit tailwinds.',
        order: 4
    },
    {
        id: 'demo-outline-sec-5',
        title: '$18M Series A Allocation to Commission Automated Module Line',
        summary:
            'Detail 24-month milestones to reach 250 MWh annual capacity and unlock project-finance debt facilities.',
        order: 5
    }
];

export async function ensureDemoUserAndDecks() {
    let user = await User.findOne({ email: DEMO_EMAIL });
    if (!user) {
        const passwordHash = await bcrypt.hash('deckai-demo-workspace-non-interactive', 10);
        user = await User.findOneAndUpdate(
            { email: DEMO_EMAIL },
            {
                $setOnInsert: {
                    fullName: DEMO_FULL_NAME,
                    email: DEMO_EMAIL,
                    passwordHash
                }
            },
            { upsert: true, new: true }
        );
    }

    let readyDeck = await Deck.findOne({ userId: user._id, title: READY_DECK_TITLE });
    if (!readyDeck) {
        readyDeck = await Deck.create({
            userId: user._id,
            title: READY_DECK_TITLE,
            topic: 'Enterprise AI Copilot Adoption and Governance Strategy',
            description:
                'Executive rollout plan covering workflow selection, security guardrails, ROI metrics, and phased deployment.',
            language: 'English',
            tone: 'professional',
            theme: 'indigo',
            slideCount: 5,
            status: 'ready',
            outline: { sections: READY_DECK_OUTLINE }
        });
    }

    let slides = await Slide.find({ deckId: readyDeck._id }).sort({ slideNumber: 1 });
    if (slides.length === 0) {
        slides = await Slide.insertMany(
            READY_DECK_SLIDES.map((slide) => ({
                ...slide,
                deckId: readyDeck._id
            }))
        );
    }

    const slideIds = slides.map((slide) => slide._id);
    const existingVersionCount = await SlideVersion.countDocuments({ slideId: { $in: slideIds } });
    if (existingVersionCount === 0 && slides.length > 0) {
        const targetSlide = slides.find((slide) => slide.layout === 'content') || slides[0];
        await SlideVersion.create({
            slideId: targetSlide._id,
            title: 'Knowledge Workflows Show Promising Early Productivity Gains',
            content: [
                'Pilot participants reported faster ticket drafting across customer support queues.',
                'Internal documentation search accuracy improved with source citations.',
                'Response teams saved several hours per week on recurring questionnaires.'
            ],
            speakerNotes: 'Initial draft captured before Q3 pilot telemetry was finalized.',
            layout: 'content',
            versionNumber: 1,
            reason: 'Sharpen headline and bullets with verified Q3 pilot metrics'
        });
    }

    const outlineDeck = await Deck.findOne({ userId: user._id, title: OUTLINE_DECK_TITLE });
    if (!outlineDeck) {
        await Deck.create({
            userId: user._id,
            title: OUTLINE_DECK_TITLE,
            topic: 'Long-Duration Battery Storage for Industrial Microgrids',
            description:
                'Investor narrative framing grid reliability pain points, unit economics, commercial traction, and capital allocation.',
            language: 'English',
            tone: 'persuasive',
            theme: 'emerald',
            slideCount: 5,
            status: 'outline_ready',
            outline: { sections: OUTLINE_READY_SECTIONS }
        });
    }

    return user;
}
