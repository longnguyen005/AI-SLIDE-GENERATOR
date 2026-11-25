import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [exportCount, setExportCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [decksResult, summaryResult] = await Promise.all([
          api.getDecks(),
          api.getSummary().catch(() => ({ totalExports: 0 })),
        ]);
        if (active) {
          setDecks(decksResult.decks || []);
          setExportCount(summaryResult.totalExports || 0);
        }
      } catch (error) {
        if (active) setNotice(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const readyCount = useMemo(
    () => decks.filter((deck) => deck.status === 'ready').length,
    [decks]
  );
  const inProgressCount = useMemo(
    () => decks.filter((deck) => deck.status !== 'ready').length,
    [decks]
  );
  const plannedSlides = useMemo(
    () => decks.reduce((total, deck) => total + Number(deck.slideCount || 0), 0),
    [decks]
  );

  const filterTabs = useMemo(
    () => [
      { id: 'all', label: 'All', count: decks.length },
      { id: 'ready', label: 'Ready', count: readyCount },
      { id: 'draft', label: 'In Progress', count: inProgressCount },
    ],
    [decks.length, readyCount, inProgressCount]
  );

  const filteredDecks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      if (statusFilter === 'ready' && deck.status !== 'ready') return false;
      if (statusFilter === 'draft' && deck.status === 'ready') return false;
      if (!query) return true;
      const haystack = [deck.title, deck.topic, deck.description, deck.tone, deck.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [decks, searchQuery, statusFilter]);

  const handleDeleteDeck = async (deck) => {
    const deckId = deck._id || deck.id;
    if (!deckId || deletingId) return;
    setDeletingId(deckId);
    setNotice('');
    try {
      await api.deleteDeck(deckId);
      setDecks((prev) => prev.filter((item) => (item._id || item.id) !== deckId));
    } catch (error) {
      setNotice(error.message || 'Failed to delete deck.');
    } finally {
      setDeletingId('');
    }
  };

  const hasActiveFilter = Boolean(searchQuery.trim()) || statusFilter !== 'all';

  return (
    <div className="page-shell dashboard-page">
      <Sidebar active="dashboard" />
      <main className="page-content dashboard-main">
        <Topbar
          title="Presentations"
          subtitle={
            loading ? 'Loading your workspace...' : `${decks.length} decks in your workspace`
          }
          searchPlaceholder="Search decks..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          action={
            <Button to="/create" icon="sparkles">
              New deck
            </Button>
          }
        />

        {notice && (
          <div className="dashboard-message" role="alert">
            {notice}
          </div>
        )}

        <section className="dashboard-stats" aria-label="Workspace stats">
          <StatCard icon="dashboard" label="Total decks" value={decks.length} />
          <StatCard icon="check" label="Ready decks" value={readyCount} tone="green" />
          <StatCard icon="layers" label="Planned slides" value={plannedSlides} tone="blue" />
          <StatCard icon="download" label="Exports" value={exportCount} />
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__heading">
            <div className="dashboard-section__title-row">
              <h2>Recent decks</h2>
              <span className="dashboard-section__count">
                {hasActiveFilter
                  ? `${filteredDecks.length} of ${decks.length} matching`
                  : `${decks.length} total`}
              </span>
            </div>

            <div
              className="dashboard-filters"
              role="group"
              aria-label="Filter presentations by status"
            >
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`dashboard-filter-pill ${isActive ? 'dashboard-filter-pill--active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => setStatusFilter(tab.id)}
                  >
                    <span>{tab.label}</span>{' '}
                    <span className="dashboard-filter-pill__count">{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dashboard-decks">
            {loading && <div className="dashboard-empty">Loading decks...</div>}

            {!loading &&
              filteredDecks.map((deck, index) => (
                <DeckCard
                  key={deck._id || deck.id}
                  deck={deck}
                  selected={index === 0 && !hasActiveFilter}
                  onDelete={handleDeleteDeck}
                  deleting={deletingId === (deck._id || deck.id)}
                />
              ))}

            {!loading && decks.length > 0 && filteredDecks.length === 0 && (
              <div className="dashboard-empty">
                <strong>No matching decks</strong>
                <small>
                  {searchQuery.trim()
                    ? `No presentations matched “${searchQuery.trim()}”.`
                    : `No ${statusFilter === 'ready' ? 'ready' : 'in-progress'} presentations found.`}
                </small>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  {searchQuery.trim() ? 'Clear search' : 'Show all decks'}
                </Button>
              </div>
            )}

            {!loading && !decks.length && (
              <div className="dashboard-empty">
                <strong>No decks yet</strong>
                <small>Create your first AI presentation to see it here.</small>
              </div>
            )}

            <Link to="/create" className="new-deck-card">
              <span>
                <Icon name="plus" size={26} />
              </span>
              <strong>Start from scratch</strong>
              <small>Create a structured deck from a topic</small>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
