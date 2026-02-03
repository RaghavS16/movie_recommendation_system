// src/WatchlistPage.jsx
import React from 'react';
import Sidebar from './Sidebar';
import MovieCard from './MovieCard';
import { COLORS } from './theme';

export default function WatchlistPage({ watchlist, onToggleWatchlist }) {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <h1 style={{ color: 'white', marginBottom: '30px' }}>My Watchlist</h1>

        {watchlist.length === 0 ? (
          <p style={{ color: COLORS.textSub, fontSize: '18px' }}>Your watchlist is empty. Go chat with the bot to add movies!</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {watchlist.map((movie, index) => (
              <MovieCard 
                key={index} 
                data={movie} 
                isLiked={true} 
                onToggle={onToggleWatchlist} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}