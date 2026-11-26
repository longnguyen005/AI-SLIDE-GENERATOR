import React, { useEffect, useRef, useState } from 'react';
import SlideCanvas from '../SlideCanvas/SlideCanvas';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import { useReducedMotion, useSlidingPill, useTilt3D } from '../../hooks/useMotion';
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
        'Ad-Hoc Pilot: Unstructured prompt templates with manual copy-paste verification.',
        'Ad-Hoc Pilot: Fragmented API credentials and inconsistent department cost visibility.',
        'Governed Rollout: Shared workspace playbooks with automated citation checks.',
        'Governed Rollout: Centralized model gateway with per-team spend attribution.',
      ],
    },
  },
  {
    label: 'KPI Metrics',
    layout: 'metrics',
    slide: {
      slideNumber: 5,
      layout: 'metrics',
      title: 'Verified Q3 Pilot Performance Scorecard',
      content: [
        '34% Faster | Support escalation drafting dropped from 38m to 25m',
        '91% Accuracy | Grounded source citations verified across internal docs',
        '+62 NPS | Internal specialist satisfaction after inline source links',
        '$18 / Seat | Predictable monthly unit cost under multi-model routing',
      ],
    },
  },
  {
    label: 'Roadmap Flow',
    layout: 'timeline',
    slide: {
      slideNumber: 6,
      layout: 'timeline',
      title: 'Phased 90-Day Enterprise Rollout Plan',
      content: [
        'Phase 1 (Days 1-30): Finalize SSO role mappings and onboard 240 pilot seats.',
        'Phase 2 (Days 31-60): Connect CRM and engineering runbooks with weekly audits.',
        'Phase 3 (Days 61-90): Review ROI scorecard and expand to global GTM pods.',
      ],
    },
  },
  {
    label: 'Thesis Callout',
    layout: 'callout',
    slide: {
      slideNumber: 7,
      layout: 'callout',
      title: 'Platform Governance Accelerates Adoption',
      content: [
        'Security guardrails built into the routing layer unlock faster seat expansion than post-hoc compliance reviews.',
        'Zero-retention enterprise model endpoints prevent training data leakage.',
        'Automatic RBAC inheritance keeps sensitive repositories strictly scoped.',
      ],
    },
  },
  {
    label: 'Executive Summary',
    layout: 'summary',
    slide: {
      slideNumber: 8,
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

const MAX_TOUR_STEPS = 10;
const TOUR_STEP_MS = 4200;

export default function HeroShowcase({ onLaunchDemo, demoLoading = false }) {
  const reducedMotion = useReducedMotion();
  const windowRef = useRef(null);
  const tablistRef = useRef(null);

  const [tourState, setTourState] = useState(() => ({
    activeIndex: 0,
    direction: 0,
    playing: !reducedMotion && typeof IntersectionObserver !== 'undefined',
    pausedByPointer: false,
    pausedByFocus: false,
    stepsTaken: 0,
  }));

  const activeIndex = tourState.activeIndex;
  const activeTab = SHOWCASE_TABS[activeIndex] || SHOWCASE_TABS[0];
  const isTourEnabled = tourState.playing && tourState.stepsTaken < MAX_TOUR_STEPS;
  const isTourTicking = isTourEnabled && !tourState.pausedByPointer && !tourState.pausedByFocus;

  useTilt3D(windowRef, { maxDeg: 3.2 });
  const pillRef = useSlidingPill(tablistRef, activeIndex);

  useEffect(() => {
    if (!isTourTicking) return undefined;
    const timerId = window.setTimeout(() => {
      setTourState((prev) => {
        const nextIndex = (prev.activeIndex + 1) % SHOWCASE_TABS.length;
        const nextSteps = prev.stepsTaken + 1;
        return {
          ...prev,
          activeIndex: nextIndex,
          direction: 1,
          stepsTaken: nextSteps,
          playing: nextSteps < MAX_TOUR_STEPS,
        };
      });
    }, TOUR_STEP_MS);
    return () => window.clearTimeout(timerId);
  }, [isTourTicking, activeIndex, tourState.stepsTaken]);

  const selectTab = (nextIndex) => {
    setTourState((prev) => {
      if (nextIndex === prev.activeIndex) {
        return { ...prev, playing: false };
      }
      return {
        ...prev,
        activeIndex: nextIndex,
        direction: nextIndex > prev.activeIndex ? 1 : -1,
        playing: false,
      };
    });
  };

  const toggleTour = () => {
    setTourState((prev) => {
      const currentlyRunning = prev.playing && prev.stepsTaken < MAX_TOUR_STEPS;
      return {
        ...prev,
        playing: !currentlyRunning,
        pausedByPointer: false,
        pausedByFocus: false,
        stepsTaken: currentlyRunning ? prev.stepsTaken : 0,
      };
    });
  };

  const handleTabKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % SHOWCASE_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + SHOWCASE_TABS.length) % SHOWCASE_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SHOWCASE_TABS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(nextIndex);
    const tabs = event.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };

  return (
    <section className="hero-showcase" aria-label="Interactive workspace preview">
      <div
        ref={windowRef}
        className="hero-showcase__window"
        onMouseEnter={() => setTourState((prev) => (prev.pausedByPointer ? prev : { ...prev, pausedByPointer: true }))}
        onMouseLeave={() => setTourState((prev) => (!prev.pausedByPointer ? prev : { ...prev, pausedByPointer: false }))}
        onFocusCapture={(event) => {
          if (event.target?.closest?.('.hero-showcase__tour-btn')) return;
          setTourState((prev) => (prev.pausedByFocus ? prev : { ...prev, pausedByFocus: true }));
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setTourState((prev) => (!prev.pausedByFocus ? prev : { ...prev, pausedByFocus: false }));
          }
        }}
      >
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
                {`${String(activeTab.slide.slideNumber).padStart(2, '0')} / ${String(SHOWCASE_TABS.length).padStart(2, '0')}`}
              </span>
            </div>
            <button
              type="button"
              className={`hero-showcase__tour-btn ${isTourEnabled ? 'hero-showcase__tour-btn--active' : ''}`}
              onClick={toggleTour}
              aria-label={isTourEnabled ? 'Pause layout tour' : 'Play layout tour'}
              aria-pressed={isTourEnabled}
            >
              <Icon name={isTourEnabled ? 'pause' : 'play'} size={13} />
              <span>{isTourEnabled ? 'Auto Tour' : 'Play Tour'}</span>
            </button>
          </div>

          <div
            ref={tablistRef}
            className="hero-showcase__tablist"
            role="tablist"
            aria-label="Slide layout switcher"
          >
            <span
              ref={pillRef}
              className="hero-showcase__pill sliding-pill-indicator"
              aria-hidden="true"
            />
            {SHOWCASE_TABS.map((tab, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={tab.layout}
                  id={`showcase-tab-${tab.layout}`}
                  type="button"
                  role="tab"
                  data-pill-item
                  aria-selected={isSelected}
                  aria-controls="showcase-slide-panel"
                  tabIndex={isSelected ? 0 : -1}
                  className={`hero-showcase__tab ${isSelected ? 'hero-showcase__tab--active' : ''}`}
                  onClick={() => selectTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className="hero-showcase__tab-num">{`0${index + 1}`}</span>
                  <span>{tab.label}</span>
                  {isSelected && isTourTicking && (
                    <span
                      key={`${activeIndex}-${tourState.stepsTaken}`}
                      className="hero-showcase__tab-progress"
                      aria-hidden="true"
                    />
                  )}
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
          <SlideCanvas
            key={activeTab.layout}
            slide={activeTab.slide}
            direction={tourState.direction}
          />
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
