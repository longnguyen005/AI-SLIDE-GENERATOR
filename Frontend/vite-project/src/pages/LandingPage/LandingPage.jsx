import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import FeatureCard from '../../components/FeatureCard/FeatureCard';
import HeroShowcase from '../../components/HeroShowcase/HeroShowcase';
import Icon from '../../components/Icon/Icon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './LandingPage.css';

const features = [
  ['list', 'AI Outline Generation', 'Enter a topic and brief to generate a structured section-by-section narrative in seconds.'],
  ['layers', 'Smart Slide Creation', 'Map each section onto purpose-built cover, divider, insight, split, and summary layouts.'],
  ['edit', 'Inline Editing', 'Refine titles, bullet points, layout types, and speaker notes directly beside the canvas.'],
  ['wand', 'AI Slide Regeneration', 'Rewrite individual slides with targeted prompts while snapshotting version history automatically.'],
  ['eye', 'Presentation Preview', 'Step through full-deck filmstrips and keyboard-navigable presenter views before sharing.'],
  ['download', 'PowerPoint Export', 'Download standards-compliant 16:9 .pptx files ready for PowerPoint, Keynote, and Google Slides.'],
];

const workflowSteps = [
  ['Prompt', 'Describe your presentation topic, audience tone, and target slide count.'],
  ['Structure', 'Review, reorder, or customize every outline section before generating slides.'],
  ['Design', 'Switch across 5 adaptive slide layouts and fine-tune copy or speaker notes inline.'],
  ['Present', 'Preview full-screen in the browser or export native .pptx decks in one click.'],
];

const productSpecs = [
  ['5', 'Adaptive slide layouts'],
  ['< 3.5s', 'Instant browser sandbox'],
  ['.pptx', 'Native PowerPoint OOXML'],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { startInstantDemo } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

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
    <div className="landing-page">
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
          <p className="landing-eyebrow">AI presentation workspace</p>
          <h1>Create Stunning Presentations<br />with AI</h1>
          <p className="landing-hero__copy">
            Turn rough briefs into structured outlines, editable 16:9 slide layouts, and clean PowerPoint exports with engineered clarity.
          </p>
          <div className="landing-hero__actions">
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
          <p className="landing-hero__subnote">
            No signup required — explore pre-built AI decks and export real .pptx slides immediately.
          </p>
          {demoError && <div className="landing-hero__error" role="alert">{demoError}</div>}

          <HeroShowcase onLaunchDemo={handleInstantDemo} demoLoading={demoLoading} />
        </section>

        <section className="landing-stats" id="specs" aria-label="Product capabilities">
          {productSpecs.map(([metric, label]) => (
            <div key={label} className="landing-stats__item">
              <strong>{metric}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading">
            <p>Built for Structured Storytelling</p>
            <span>Focus on your narrative while DeckAI handles outline hierarchy, slide geometry, and export fidelity.</span>
          </div>
          <div className="landing-features__grid">
            {features.map(([icon, title, description]) => (
              <FeatureCard key={title} icon={icon} title={title}>
                {description}
              </FeatureCard>
            ))}
          </div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="section-heading">
            <p>From idea to presentation in 4 steps</p>
            <span>Every stage stays editable, inspectable, and version-safe.</span>
          </div>
          <div className="workflow-line">
            {workflowSteps.map(([step, copy], index) => (
              <article key={step}>
                <span>{`0${index + 1}`}</span>
                <h3>{step}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta" id="pricing">
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
