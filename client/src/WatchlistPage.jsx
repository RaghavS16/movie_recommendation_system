// src/WatchlistPage.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MovieCard from './MovieCard';
import { BookMarked, Search, SortAsc, Film } from 'lucide-react';
import { COLORS, FONTS } from './theme';

export default function WatchlistPage({ watchlist, onToggleWatchlist }) {
  const [query, setQuery] = useState('');

  const filtered = watchlist.filter(m =>
    m.title?.toLowerCase().includes(query.toLowerCase()) ||
    m.director?.toLowerCase().includes(query.toLowerCase())
  );

  const avgRating = watchlist.length
    ? (watchlist.reduce((s, m) => s + (parseFloat(m.imdb_rating) || 0), 0) / watchlist.length).toFixed(1)
    : '—';

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, fontFamily: FONTS.body }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{
          padding: '32px 40px 24px',
          background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <BookMarked size={22} color="#f5c842" />
            <h1 style={{ fontFamily: FONTS.display, fontSize: '28px', fontWeight: '700', color: COLORS.textMain }}>
              My Watchlist
            </h1>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: 'Saved Films', value: watchlist.length, icon: '🎬' },
              { label: 'Avg Rating', value: avgRating, icon: '⭐' },
            ].map(s => (
              <div key={s.label} style={{
                background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                borderRadius: '12px', padding: '12px 20px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.textMain }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: COLORS.textSub }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          {watchlist.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
              borderRadius: '12px', padding: '0 16px', maxWidth: '400px',
            }}>
              <Search size={16} color={COLORS.textMuted} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search your watchlist…"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: COLORS.textMain, fontSize: '15px', padding: '12px 0',
                  flex: 1, fontFamily: FONTS.body,
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '32px 40px' }}>
          {watchlist.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
              <h2 style={{
                fontFamily: FONTS.display, fontSize: '28px', fontWeight: '700',
                color: COLORS.textMain, marginBottom: '12px',
              }}>
                Your watchlist is empty
              </h2>
              <p style={{ color: COLORS.textSub, fontSize: '16px' }}>
                Chat with FilmoBot and tap the ❤️ on any movie to save it here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '60px' }}>
              <p style={{ color: COLORS.textSub, fontSize: '16px' }}>No movies match "{query}"</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {filtered.map((movie, i) => (
                <MovieCard
                  key={i}
                  data={movie}
                  isLiked={true}
                  onToggle={onToggleWatchlist}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}