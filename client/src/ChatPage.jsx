// src/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MovieCard from './MovieCard';
import { COLORS } from './theme';
import { API_BASE_URL } from "./config";

export default function ChatPage({ watchlist, onToggleWatchlist }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const messagesEndRef = useRef(null);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default messages
  const defaultMsg = [{ type: 'bot', content: "Hello! I'm FilmoBot. 🎬 Ask me for a movie recommendation!" }];
  const [messages, setMessages] = useState(defaultMsg);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Load Sessions from LocalStorage initially for speed
  const [sessions, setSessions] = useState(() => {
     const saved = localStorage.getItem("chat_sessions");
     return saved ? JSON.parse(saved) : [];
  });

  const scrollToBottom = () => { 
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  };
  useEffect(scrollToBottom, [messages]);

  // --- NEW: FETCH SESSIONS FROM DATABASE ON LOAD ---
  useEffect(() => {
    const fetchCloudSessions = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/get-sessions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const cloudData = await res.json();
                setSessions(cloudData); // Override local storage with real DB data
                localStorage.setItem("chat_sessions", JSON.stringify(cloudData));
            }
        } catch (error) { console.error("Failed to load cloud sessions", error); }
    };
    fetchCloudSessions();
  }, []);

  // Save Sessions locally as backup
  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Check for incoming session from Profile/Watchlist
  useEffect(() => {
      if (location.state && location.state.sessionId) {
          const targetId = location.state.sessionId;
          const session = sessions.find(s => s.id === targetId);
          if (session) {
              setCurrentSessionId(targetId);
              setMessages(session.messages);
              window.history.replaceState({}, document.title);
          }
      }
  }, [location.state, sessions]);

  // --- NEW: HELPER TO SYNC TO DATABASE ---
  const syncSessionToDB = async (sessionData) => {
    const token = localStorage.getItem("token");
    try {
        await fetch(`${API_BASE_URL}/sync-session`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(sessionData)
        });
    } catch (error) { console.error("Sync failed", error); }
  };

  const handleNewChat = () => {
     setCurrentSessionId(null);
     setMessages(defaultMsg);
  };

  const handleSelectSession = (sessionId) => {
     const session = sessions.find(s => s.id === sessionId);
     if (session) {
        setCurrentSessionId(sessionId);
        setMessages(session.messages);
     }
  };

  // --- UPDATED: DELETE FROM DATABASE ---
  const handleDeleteSession = async (sessionId) => {
      if (window.confirm("Are you sure you want to delete this chat?")) {
          // Update UI instantly
          const updatedSessions = sessions.filter(s => s.id !== sessionId);
          setSessions(updatedSessions);
          if (currentSessionId === sessionId) handleNewChat();
          
          // Tell Database to delete it
          const token = localStorage.getItem("token");
          try {
              await fetch(`${API_BASE_URL}/delete-session/${sessionId}`, {
                  method: "DELETE",
                  headers: { "Authorization": `Bearer ${token}` }
              });
          } catch (error) { console.error("Failed to delete from cloud", error); }
      }
  };

  const sendMessage = async (text, isHiddenCommand = false) => {
    if (!text.trim()) return;

    let updatedMessages = [...messages];
    if (!isHiddenCommand) {
        updatedMessages.push({ type: 'user', content: text });
        setMessages(updatedMessages);
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
            updatedMessages.push({ type: 'bot', content: data.bot_response });
        }
        if (data.movies && data.movies.length > 0) {
            data.movies.forEach(movie => {
                updatedMessages.push({ type: 'bot', content: movie, isJson: true });
            });
        }
        setMessages([...updatedMessages]);

        // --- UPDATED: SAVE TO DATABASE ---
        if (!isHiddenCommand) { 
            if (currentSessionId) {
                // Update existing
                const existingTitle = sessions.find(s => s.id === currentSessionId)?.title || "Conversation";
                const updatedSession = { id: currentSessionId, title: existingTitle, messages: updatedMessages };
                
                setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
                syncSessionToDB(updatedSession); // Save to cloud
            } else {
                // Create new
                const newId = Date.now();
                const newTitle = text.length > 20 ? text.substring(0, 20) + "..." : text;
                const newSession = {
                    id: newId,
                    title: newTitle,
                    messages: updatedMessages
                };
                
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(newId);
                syncSessionToDB(newSession); // Save to cloud
            }
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

  const handleMoreLikeThis = (movieId) => {
     sendMessage(`recommend_id:${movieId}`, true);
  };

  const clearCurrentView = () => {
    if (window.confirm("Clear this screen? (History will be saved)")) {
        setMessages(defaultMsg);
        sendMessage("reset", true); 
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      
      <Sidebar 
         chatSessions={sessions}
         activeSessionId={currentSessionId}
         onSelectSession={handleSelectSession}
         onNewChat={handleNewChat}
         onDeleteSession={handleDeleteSession} 
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px', position: 'relative' }}>
          
          <button 
            onClick={clearCurrentView}
            style={{
                position: 'absolute', top: '20px', right: '30px',
                backgroundColor: '#333', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
            title="Clear Screen"
          >
            <Trash2 size={20} color="#EF4444" />
          </button>

          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
              {msg.isJson ? (
                <MovieCard 
                  data={msg.content} 
                  isLiked={watchlist.some(m => m.title === msg.content.title)}
                  onToggle={onToggleWatchlist}
                  onMoreLikeThis={handleMoreLikeThis}
                />
              ) : (
                <div style={{ 
                    maxWidth: '75%', padding: '16px 22px', borderRadius: '20px', 
                    backgroundColor: msg.type === 'user' ? '#6366F1' : '#2A2A2A', 
                    color: 'white', 
                    borderTopRightRadius: msg.type === 'user' ? '4px' : '20px', 
                    borderTopLeftRadius: msg.type === 'bot' ? '4px' : '20px', 
                    fontSize: '18px', lineHeight: '1.6' 
                }}>
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
            <input 
                type="text" 
                placeholder="Ask 'Action from 2024' or 'Show More'" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                style={{ flex: 1, backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '16px', padding: '18px', color: 'white', outline: 'none', fontSize: '18px' }} 
            />
            <button type="submit" disabled={isLoading} style={{ backgroundColor: '#6366F1', border: 'none', borderRadius: '16px', width: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={28} color="white" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}