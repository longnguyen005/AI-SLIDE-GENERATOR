import React from 'react';
import Sidebar from '../../components/SideBar/SideBar';
import Topbar from '../../components/Topbar/Topbar';
import Button from '../../components/Button/Button';
import StatCard from '../../components/StatCard/StatCard';
import DeckCard from '../../components/DeskCard/DeskCard';
import Icon from '../../components/Icon/Icon';
import { dashboardDecks } from '../../data/desks';
import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="page-shell dashboard-page">
      <Sidebar active="dashboard" />
      <main className="page-content dashboard-main">
        <Topbar
          title="Presentations"
          subtitle="12 decks in your workspace"
          action={<Button to="/create" icon="sparkles">New deck</Button>}
        />

        <section className="dashboard-stats" aria-label="Thống kê workspace">
          <StatCard icon="dashboard" label="Total decks" value="28" />
          <StatCard icon="check" label="Ready decks" value="8" />
          <StatCard icon="layers" label="Active slides" value="154" tone="blue" />
          <StatCard icon="download" label="Exports" value="42" />
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__heading">
            <h2>Recent decks</h2>
            <a href="/presentations">View all <Icon name="arrowRight" size={16} /></a>
          </div>
          <div className="dashboard-decks">
            {dashboardDecks.map((deck, index) => <DeckCard key={deck.id} deck={deck} selected={index === 0} />)}
            <a href="/create" className="new-deck-card">
              <span><Icon name="plus" size={34} /></span>
              <strong>Start from scratch</strong>
              <small>Create a blank canvas</small>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
