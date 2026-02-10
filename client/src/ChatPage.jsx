// src/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MovieCard from './MovieCard';
import { COLORS } from './theme';
import { API_BASE_URL } from "./config";

export default function ChatPage({ watchlist, onToggleWatchlist }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { type: 'bot', content: "Hello! I'm FilmoBot. 🎬 Ask me for a movie recommendation!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [messages]);

  // Handle User Sending a Message
  const sendMessage = async (text, isHiddenCommand = false) => {
    if (!text.trim()) return;

    if (!isHiddenCommand) {
        setMessages(prev => [...prev, { type: 'user', content: text }]);
    }
    
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();

        if (data.bot_response) {
            setMessages(prev => [...prev, { type: 'bot', content: data.bot_response }]);
        }
        if (data.movies && data.movies.length > 0) {
            data.movies.forEach(movie => {
                setMessages(prev => [...prev, { type: 'bot', content: movie, isJson: true }]);
            });
        }
    } catch (error) {
        setMessages(prev => [...prev, { type: 'bot', content: "Sorry, I'm having trouble connecting to the server." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  // Handler for "More Like This" Button
  const handleMoreLikeThis = (movieId) => {
     // Send a hidden command to backend
     sendMessage(`recommend_id:${movieId}`, true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
              {msg.isJson ? (
                <MovieCard 
                  data={msg.content} 
                  isLiked={watchlist.some(m => m.title === msg.content.title)}
                  onToggle={onToggleWatchlist}
                  onMoreLikeThis={handleMoreLikeThis} // <--- Pass the new handler
                />
              ) : (
                <div style={{ maxWidth: '75%', padding: '16px 22px', borderRadius: '20px', backgroundColor: msg.type === 'user' ? '#6366F1' : '#2A2A2A', color: 'white', borderTopRightRadius: msg.type === 'user' ? '4px' : '20px', borderTopLeftRadius: msg.type === 'bot' ? '4px' : '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}
          {isLoading && <div style={{color: '#888', marginLeft: '20px'}}>FilmoBot is typing...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', backgroundColor: '#121212', borderTop: '1px solid #333', zIndex: 50 }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
            <input type="text" placeholder="Ask 'Action from 2024' or 'Show More'" value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1, backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '16px', padding: '18px', color: 'white', outline: 'none', fontSize: '18px' }} />
            <button type="submit" disabled={isLoading} style={{ backgroundColor: '#6366F1', border: 'none', borderRadius: '16px', width: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={28} color="white" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}