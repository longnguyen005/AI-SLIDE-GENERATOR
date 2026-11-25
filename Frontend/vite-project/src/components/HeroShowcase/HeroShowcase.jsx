import React, { useState } from 'react';
import SlideCanvas from '../SlideCanvas/SlideCanvas';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import './HeroShowcase.css';

const SHOWCASE_TABS = [
  {
    label: 'Cover',
    layout: 'title',
    slide: {
      slideNumber: 1,
      layout: 'title',
      title: 'Scaling Enterprise AI Copilots Without Compromising Governance',
      content: [
        'Unify model routing, role-scoped retrieval, and audit telemetry across engineering and GTM workflows.',
        'Anchor deployment on measurable high-frequency workflows before broad seat expansion.',
        'Enforce zero unreviewed external data egress through policy-verified prompt gateways.',
      ],
    },
  },
  {
    label: 'Section Break',
    layout: 'section',
    slide: {
      slideNumber: 2,
      layout: 'section',
      title: 'Architecture & Governance Guardrails',
      content: [
        'Scope retrieval indexes to existing RBAC permissions prior to context assembly.',
        'Route regulated workloads to isolated regional endpoints with deterministic fallbacks.',
        'Capture immutable prompt-and-citation traces for quarterly compliance review.',
      ],
    },
  },
  {
    label: 'Key Insights',
    layout: 'content',
    slide: {
      slideNumber: 3,
      layout: 'content',
      title: 'Targeted Knowledge Workflows Deliver 34% Faster Cycle Times',
      content: [
        'Incident triage summaries cut mean time-to-context from 42 minutes to 19 minutes.',
        'Security questionnaire drafting accelerated first-pass review turnaround by 2.4x.',
        'Citation-backed responses reduced reviewer escalation volume across support pods.',
      ],
    },
  },
  {
    label: 'Side-by-Side',
    layout: 'two_column',
    slide: {
      slideNumber: 4,
      layout: 'two_column',
      title: 'Ad-Hoc Pilot vs. Governed Production Rollout',
      content: [
        'Unstructured prompt templates with manual copy-paste verification across teams.',
        'Fragmented API credentials and inconsistent department-level cost visibility.',
        'Shared workspace playbooks with automated citation checks and version history.',
        'Centralized model gateway with policy enforcement and per-team spend attribution.',
      ],
    },
  },
  {
    label: 'Executive Summary',
    layout: 'summary',
    slide: {
      slideNumber: 5,
      layout: 'summary',
      title: 'Q4 Board Recommendations & Next Milestones',
      content: [
        'Expand governed access from pilot cohort to core engineering and revenue operations.',
        'Standardize retrieval connectors on policy-verified internal documentation repositories.',
        'Review 90-day productivity, quality, and audit telemetry at the Q1 governance committee.',
      ],
    },
  },
];

export default function HeroShowcase({ onLaunchDemo, demoLoading = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = SHOWCASE_TABS[activeIndex] || SHOWCASE_TABS[0];

  const handleTabKeyDown = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + SHOWCASE_TABS.length) % SHOWCASE_TABS.length;
    setActiveIndex(nextIndex);
  };

  return (
    <section className="hero-showcase" aria-label="Interactive workspace preview">
      <div className="hero-showcase__window">
        <div className="hero-showcase__chrome">
          <div className="hero-showcase__titlebar">
            <div className="hero-showcase__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="hero-showcase__doc">
              <Icon name="layers" size={14} />
              <span className="hero-showcase__doc-title">
                Enterprise AI Copilots — Q4 Board Briefing
              </span>
              <span className="hero-showcase__doc-badge">
                {`0${activeTab.slide.slideNumber} / 05`}
              </span>
            </div>
          </div>

          <div
            className="hero-showcase__tablist"
            role="tablist"
            aria-label="Slide layout switcher"
          >
            {SHOWCASE_TABS.map((tab, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={tab.layout}
                  id={`showcase-tab-${tab.layout}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="showcase-slide-panel"
                  tabIndex={isSelected ? 0 : -1}
                  className={`hero-showcase__tab ${isSelected ? 'hero-showcase__tab--active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className="hero-showcase__tab-num">{`0${index + 1}`}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="showcase-slide-panel"
          role="tabpanel"
          aria-labelledby={`showcase-tab-${activeTab.layout}`}
          className="hero-showcase__stage"
        >
          <SlideCanvas slide={activeTab.slide} />
        </div>

        <div className="hero-showcase__footer">
          <div className="hero-showcase__meta">
            <span className="hero-showcase__meta-pill">16:9 OOXML-ready</span>
            <span className="hero-showcase__meta-code">{`layout: ${activeTab.layout}`}</span>
            <span className="hero-showcase__meta-note">
              Click any layout tab above to inspect live slide structure
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon="play"
            onClick={onLaunchDemo}
            disabled={demoLoading}
          >
            {demoLoading ? 'Launching Demo...' : 'Open in Instant Demo'}
          </Button>
        </div>
      </div>
    </section>
  );
}
