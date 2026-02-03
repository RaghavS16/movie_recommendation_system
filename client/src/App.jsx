// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE_URL } from "./config";

// ... Import your pages ...
import Splash from './Splash';
import Welcome from './Welcome';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import ChatPage from './ChatPage';
import ProfilePage from './ProfilePage';
import WatchlistPage from './WatchlistPage';

const NotFound = () => <div style={{color:'white'}}>Page Not Found</div>;

export default function App() {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Check Auth & Fetch Watchlist on Load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const profileImage = localStorage.getItem("profileImage");

    if (token && username) {
      setUser({ username, email, plan: "Free Plan",profileImage: profileImage || null }); // Email/Plan logic needs API expansion to fetch user details
      fetchWatchlist(token);
    }
    setLoading(false);
  }, []);


  const fetchWatchlist = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error("Failed to fetch watchlist", err);
    }
  };

  // 2. Handle Add/Remove Movie
 // src/App.jsx

// ... inside App component ...

  const toggleWatchlist = async (movie) => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first");
        return;
    }

    const existingItem = watchlist.find((m) => m.title === movie.title);

    if (existingItem) {
      // DELETE
      try {
        const res = await fetch(`${API_BASE_URL}/watchlist/${existingItem.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            setWatchlist(prev => prev.filter(m => m.id !== existingItem.id));
            console.log("Removed:", movie.title);
        }
      } catch (err) { console.error(err); }
    } else {
      // ADD
      try {
        const payload = {
            movie_id: movie.id || "unknown",
            title: movie.title,
            poster_path: movie.poster_path,
            // --- ALL CONTEXT FIELDS ---
            overview: movie.overview,
            imdb_rating: movie.imdb_rating,
            director: movie.director,
            duration: movie.duration,
            cast: movie.cast,                     // <--- SENDING CAST
            where_to_watch: movie.where_to_watch  // <--- SENDING WATCH INFO
        };
        
        const res = await fetch(`${API_BASE_URL}/add-watchlist`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            console.log("Added:", movie.title);
            fetchWatchlist(token);
        } else if (res.status === 409) {
            alert("Movie already in watchlist");
        }
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return null; // Or a spinner

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route 
          path="/chat" 
          element={user ? <ChatPage watchlist={watchlist} onToggleWatchlist={toggleWatchlist} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/profile" 
          element={user ? <ProfilePage user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/watchlist" 
          element={user ? <WatchlistPage watchlist={watchlist} onToggleWatchlist={toggleWatchlist} /> : <Navigate to="/login" />} 
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}