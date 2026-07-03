import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/SideBar/SideBar';
import Topbar from '../../components/Topbar/Topbar';
import Button from '../../components/Button/Button';
import StatCard from '../../components/StatCard/StatCard';
import DeckCard from '../../components/DeskCard/DeskCard';
import Icon from '../../components/Icon/Icon';
import { api } from '../../service/apiClient';
import './DashboardPage.css';

export default function DashboardPage() {
  const [decks, setDecks] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDecks() {
      try {
        const result = await api.getDecks();
        if (active) setDecks(result.decks || []);
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDecks();
    return () => {
      active = false;
    };
  }, []);

  const readyCount = useMemo(() => decks.filter((deck) => deck.status === 'ready').length, [decks]);
  const plannedSlides = useMemo(() => decks.reduce((total, deck) => total + Number(deck.slideCount || 0), 0), [decks]);

  return (
    <div className="page-shell dashboard-page">
      <Sidebar active="dashboard" />
      <main className="page-content dashboard-main">
        <Topbar
          title="Presentations"
          subtitle={loading ? 'Loading your workspace...' : `${decks.length} decks in your workspace`}
          searchPlaceholder="Search decks..."
          action={<Button to="/create" icon="sparkles">New deck</Button>}
        />

        {notice && <div className="dashboard-message">{notice}</div>}

        <section className="dashboard-stats" aria-label="Workspace stats">
          <StatCard icon="dashboard" label="Total decks" value={decks.length} />
          <StatCard icon="check" label="Ready decks" value={readyCount} />
          <StatCard icon="layers" label="Planned slides" value={plannedSlides} tone="blue" />
          <StatCard icon="download" label="Exports" value="0" />
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__heading">
            <h2>Recent decks</h2>
            <a href="/dashboard">View all <Icon name="arrowRight" size={16} /></a>
          </div>
          <div className="dashboard-decks">
            {loading && <div className="dashboard-empty">Loading decks...</div>}
            {!loading && decks.map((deck, index) => <DeckCard key={deck._id} deck={deck} selected={index === 0} />)}
            {!loading && !decks.length && (
              <div className="dashboard-empty">
                <strong>No decks yet</strong>
                <small>Create your first AI presentation to see it here.</small>
              </div>
            )}
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
