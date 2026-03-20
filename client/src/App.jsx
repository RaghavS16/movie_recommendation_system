// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

import Splash         from './Splash';
import Welcome        from './Welcome';
import Login          from './Login';
import Signup         from './Signup';
import ForgotPassword from './ForgotPassword';
import ChatPage       from './ChatPage';
import ProfilePage    from './ProfilePage';
import WatchlistPage  from './WatchlistPage';
import SettingsPage   from './SettingsPage';
import AboutPage      from './AboutPage';
import ContactPage    from './ContactPage';

const NotFound = () => (
  <div style={{
    minHeight: '100vh', background: '#080810',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: '#f0eee8', fontFamily: "'DM Sans', sans-serif",
  }}>
    <div style={{ fontSize: '72px', marginBottom: '16px' }}>🎬</div>
    <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Page Not Found</h1>
    <a href="/welcome" style={{ color: '#f5c842', fontSize: '16px', marginTop: '8px' }}>← Go Home</a>
  </div>
);

export default function App() {
  const [user, setUser]         = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token        = localStorage.getItem('token');
    const username     = localStorage.getItem('username');
    const email        = localStorage.getItem('email');
    const profileImage = localStorage.getItem('profileImage');
    if (token && username) {
      setUser({ username, email, plan: 'Free Plan', profileImage: profileImage || null });
      fetchWatchlist(token);
    }
    setLoading(false);
  }, []);

  const fetchWatchlist = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setWatchlist(await res.json());
    } catch (err) { console.error('Watchlist fetch failed', err); }
  };

  const toggleWatchlist = async (movie) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login first'); return; }
    const existing = watchlist.find(m => m.title === movie.title);
    if (existing) {
      try {
        const res = await fetch(`${API_BASE_URL}/watchlist/${existing.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setWatchlist(prev => prev.filter(m => m.id !== existing.id));
      } catch (err) { console.error(err); }
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/add-watchlist`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movie_id: movie.id || 'unknown',
            title: movie.title, poster_path: movie.poster_path,
            overview: movie.overview, imdb_rating: movie.imdb_rating,
            director: movie.director, duration: movie.duration,
            cast: movie.cast, where_to_watch: movie.where_to_watch,
            trailer_key: movie.trailer_key,
          }),
        });
        if (res.ok) fetchWatchlist(token);
        else if (res.status === 409) alert('Already in watchlist');
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return null;

  const auth = (el) => user ? el : <Navigate to="/login" />;

  return (
    <Router>
      <Routes>
        <Route path="/"               element={<Splash />} />
        <Route path="/welcome"        element={<Welcome />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about"          element={<AboutPage />} />
        <Route path="/contact"        element={<ContactPage />} />

        <Route path="/chat"      element={auth(<ChatPage watchlist={watchlist} onToggleWatchlist={toggleWatchlist} />)} />
        <Route path="/profile"   element={auth(<ProfilePage user={user} setUser={setUser} />)} />
        <Route path="/watchlist" element={auth(<WatchlistPage watchlist={watchlist} onToggleWatchlist={toggleWatchlist} />)} />
        <Route path="/settings"  element={auth(<SettingsPage />)} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}