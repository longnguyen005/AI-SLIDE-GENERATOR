import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import FeatureCard from '../../components/FeatureCard/FeatureCard';
import HeroShowcase from '../../components/HeroShowcase/HeroShowcase';
import Icon from '../../components/Icon/Icon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useScrollReveal } from '../../hooks/useMotion';
import './LandingPage.css';

const features = [
  ['list', 'AI Outline Generation', 'Enter a topic and brief to generate a structured section-by-section narrative in seconds.'],
  ['layers', 'Smart Slide Creation', 'Map each section onto purpose-built cover, callout, KPI metrics, roadmap, split, and summary layouts.'],
  ['edit', 'Inline Editing', 'Refine titles, bullet points, layout types, and speaker notes directly beside the canvas.'],
  ['wand', 'Scoped AI Regeneration', 'Rewrite full slides, bullets only, or presenter scripts — or convert layouts in one click with version snapshots.'],
  ['eye', 'Presentation Preview', 'Step through full-deck filmstrips and keyboard-navigable presenter views before sharing.'],
  ['download', 'PowerPoint Export', 'Download standards-compliant 16:9 .pptx files ready for PowerPoint, Keynote, and Google Slides.'],
];

const workflowSteps = [
  ['Prompt', 'Describe your presentation topic, audience tone, and target slide count.'],
  ['Structure', 'Review, reorder, or assign target slide archetypes on every outline section before generating.'],
  ['Design', 'Switch across 8 adaptive slide layouts and fine-tune copy or speaker notes inline.'],
  ['Present', 'Preview full-screen in the browser or export native .pptx decks in one click.'],
];

const productSpecs = [
  ['8', 'Adaptive slide layouts'],
  ['< 3.5s', 'Instant browser sandbox'],
  ['.pptx', 'Native PowerPoint OOXML'],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { startInstantDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pageRef = useRef(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  useScrollReveal(pageRef);

  const handleInstantDemo = async () => {
    if (demoLoading) return;
    setDemoError('');
    setDemoLoading(true);
    try {
      await startInstantDemo();
      navigate('/dashboard');
    } catch (error) {
      setDemoError(error.message || 'Unable to launch demo workspace.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="landing-page">
      <header className="landing-nav">
        <Logo compact />
        <nav aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#specs">Specs</a>
          <a href="#about">About</a>
        </nav>
        <div className="landing-nav__actions">
          <button
            type="button"
            className="landing-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <Button to="/login" variant="ghost">Login</Button>
          <Button to="/register">Get Started</Button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <span className="landing-hero__glow" aria-hidden="true" />
          <p className="landing-eyebrow landing-hero__stagger" style={{ '--hero-step': 0 }}>
            AI presentation workspace
          </p>
          <h1 className="landing-hero__stagger" style={{ '--hero-step': 1 }}>
            Create Stunning Presentations<br />with AI
          </h1>
          <p className="landing-hero__copy landing-hero__stagger" style={{ '--hero-step': 2 }}>
            Turn rough briefs into structured outlines, editable 16:9 slide layouts, and clean PowerPoint exports with engineered clarity.
          </p>
          <div className="landing-hero__actions landing-hero__stagger" style={{ '--hero-step': 3 }}>
            <Button to="/register" iconRight="arrowRight">Get Started Free</Button>
            <Button
              type="button"
              variant="outline"
              icon="play"
              className="landing-demo-btn"
              onClick={handleInstantDemo}
              disabled={demoLoading}
            >
              {demoLoading ? 'Launching Demo...' : 'Try Instant Demo'}
            </Button>
          </div>
          <p className="landing-hero__subnote landing-hero__stagger" style={{ '--hero-step': 4 }}>
            No signup required — explore pre-built AI decks and export real .pptx slides immediately.
          </p>
          {demoError && <div className="landing-hero__error" role="alert">{demoError}</div>}

          <div className="landing-hero__showcase-wrap landing-hero__stagger" style={{ '--hero-step': 5 }}>
            <HeroShowcase onLaunchDemo={handleInstantDemo} demoLoading={demoLoading} />
          </div>
        </section>

        <section className="landing-stats" id="specs" aria-label="Product capabilities">
          {productSpecs.map(([metric, label], index) => (
            <div
              key={label}
              className="landing-stats__item"
              data-reveal
              style={{ '--stagger-index': index }}
            >
              <strong>{metric}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading" data-reveal>
            <p>Built for Structured Storytelling</p>
            <span>Focus on your narrative while DeckAI handles outline hierarchy, slide geometry, and export fidelity.</span>
          </div>
          <div className="landing-features__grid">
            {features.map(([icon, title, description], index) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                data-reveal
                style={{ '--stagger-index': index }}
              >
                {description}
              </FeatureCard>
            ))}
          </div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="section-heading" data-reveal>
            <p>From idea to presentation in 4 steps</p>
            <span>Every stage stays editable, inspectable, and version-safe.</span>
          </div>
          <div className="workflow-line" data-reveal>
            {workflowSteps.map(([step, copy], index) => (
              <article key={step} data-reveal style={{ '--stagger-index': index }}>
                <span>{`0${index + 1}`}</span>
                <h3>{step}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta" id="pricing" data-reveal>
          <div className="landing-cta__copy">
            <h2>Ready to create your next presentation?</h2>
            <p>
              Start free with your own account or launch the instant browser sandbox to test every slide layout right away.
            </p>
            <div className="landing-cta__actions">
              <Button to="/register" variant="outline" className="landing-cta__primary">
                Get Started Free
              </Button>
              <button
                type="button"
                className="landing-cta__demo"
                onClick={handleInstantDemo}
                disabled={demoLoading}
              >
                {demoLoading ? 'Launching...' : 'Launch Sandbox'}
              </button>
            </div>
          </div>
          <div className="landing-cta__mark" aria-hidden="true">
            <Icon name="sparkles" size={72} />
          </div>
        </section>
      </main>

      <footer className="landing-footer" id="about">
        <div>
          <Logo compact />
          <p>Precision AI workspace for structured outlines, adaptive slide layouts, and native PowerPoint export.</p>
        </div>
        <div>
          <strong>Product</strong>
          <a href="#features">Features</a>
          <a href="#specs">Capabilities</a>
        </div>
        <div>
          <strong>Workflow</strong>
          <a href="#workflow">How It Works</a>
          <Link to="/register">Create Account</Link>
        </div>
        <div>
          <strong>Access</strong>
          <Link to="/login">Sign In</Link>
          <a href="#pricing">Get Started</a>
        </div>
        <p className="landing-footer__copyright">© 2026 DeckAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
