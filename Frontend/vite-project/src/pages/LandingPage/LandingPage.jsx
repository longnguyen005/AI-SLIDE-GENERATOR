import React from 'react';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import FeatureCard from '../../components/FeatureCard/FeatureCard';
import Icon from '../../components/Icon/Icon';
import './LandingPage.css';

const features = [
  ['list', 'AI Outline Generation', 'Type your topic and get a comprehensive presentation structure in seconds.'],
  ['layers', 'Smart Slide Creation', 'Our intelligent engine picks layouts that fit your content and keep every slide clear.'],
  ['edit', 'Inline Editing', 'Edit text, images, and data directly on the slide with a familiar workflow.'],
  ['wand', 'AI Slide Regeneration', 'Regenerate any slide with a new direction without rebuilding your whole deck.'],
  ['eye', 'Presentation Preview', 'Review your work in high fidelity, share interactive links, and collect feedback.'],
  ['download', 'PowerPoint Export', 'Export clean PPTX files that are ready for meetings, classes, and clients.'],
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Logo compact />
        <nav>
          <a href="#features">Features</a>
          <a href="#workflow">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>
        <div className="landing-nav__actions">
          <Button to="/login" variant="ghost">Login</Button>
          <Button to="/register">Get Started</Button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <span className="landing-hero__glow" />
          <p className="landing-eyebrow">AI presentation workspace</p>
          <h1>Create Stunning Presentations<br />with AI</h1>
          <p className="landing-hero__copy">Transform your ideas into professional pitch decks in seconds. Academic rigor meets creative flow, powered by next-gen AI.</p>
          <div className="landing-hero__actions">
            <Button to="/register" iconRight="arrowRight">Get Started Free</Button>
            <Button to="/preview" variant="outline">See How It Works</Button>
          </div>
          <div className="monitor-demo" aria-label="Mô phỏng giao diện DeckAI">
            <div className="monitor-demo__screen">
              <div className="monitor-demo__sidebar">
                <span className="monitor-demo__mini-logo" />
                {[1,2,3,4,5].map((item) => <span key={item} />)}
              </div>
              <div className="monitor-demo__canvas">
                <div className="monitor-demo__title" />
                <div className="monitor-demo__chart">
                  {[60, 82, 50, 92, 68, 44].map((height, index) => <i key={index} style={{ height }} />)}
                </div>
              </div>
            </div>
            <div className="monitor-demo__stand" />
            <div className="monitor-demo__base" />
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading">
            <p>Supercharge Your Workflow</p>
            <span>Focus on the narrative while our AI handles the visual heavy lifting.</span>
          </div>
          <div className="landing-features__grid">
            {features.map(([icon, title, description]) => <FeatureCard key={title} icon={icon} title={title}>{description}</FeatureCard>)}
          </div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="section-heading">
            <p>From idea to presentation in 4 steps</p>
          </div>
          <div className="workflow-line">
            {['Prompt', 'Structure', 'Design', 'Present'].map((step, index) => (
              <article key={step}>
                <span>{index + 1}</span>
                <h3>{step}</h3>
                <p>{['Describe your core idea or upload a project brief.', 'AI generates a tailored outline for your approval.', 'Watch slides populate with data-driven visuals.', 'Export or present live with AI-guided notes.'][index]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-stats">
          <div><strong>1000+</strong><span>Templates generated</span></div>
          <div><strong>4</strong><span>Average clicks to finish</span></div>
          <div><strong>Seconds</strong><span>To generate drafts</span></div>
        </section>

        <section className="landing-cta" id="pricing">
          <div>
            <h2>Ready to create your next presentation?</h2>
            <p>Join thousands of professionals who save hours every week using DeckAI.</p>
            <Button to="/register" variant="outline">Get Started Free</Button>
          </div>
          <Icon name="sparkles" size={110} />
        </section>
      </main>

      <footer className="landing-footer" id="about">
        <div><Logo compact /><p>The future of storytelling, powered by artificial intelligence.</p></div>
        <div><strong>Product</strong><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
        <div><strong>Company</strong><a href="#about">About Us</a><a href="#about">Careers</a></div>
        <div><strong>Support</strong><a href="#about">Help Center</a><a href="#about">Contact</a></div>
        <p className="landing-footer__copyright">© 2026 DeckAI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
