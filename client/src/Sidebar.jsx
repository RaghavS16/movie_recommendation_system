// src/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { User, List, LogOut, MessageSquare, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/logo.png'; 

export default function Sidebar({ 
  chatSessions, // Removing default [] to detect if it's passed or not
  activeSessionId,         
  onSelectSession,         
  onNewChat,
  onDeleteSession 
}) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State to hold sessions if we are on Profile/Watchlist pages
  const [localSessions, setLocalSessions] = useState([]);

  // Load sessions from LocalStorage if they aren't passed via props
  useEffect(() => {
    if (!chatSessions) {
        const saved = localStorage.getItem("chat_sessions");
        if (saved) {
            setLocalSessions(JSON.parse(saved));
        }
    }
  }, [chatSessions]);

  // Determine which sessions to show
  // If chatSessions prop exists (ChatPage), use it. Otherwise use local state (Profile/Watchlist).
  const displaySessions = chatSessions || localSessions;

  // State to track which chat's menu is open
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewChatClick = () => {
    if (onNewChat) onNewChat();
    else navigate('/chat');
  };

  // --- SMART CLICK HANDLER ---
  const handleSessionClick = (sessionId) => {
      if (onSelectSession) {
          // If on ChatPage, just switch session
          onSelectSession(sessionId);
      } else {
          // If on Profile/Watchlist, navigate to ChatPage and pass the ID
          navigate('/chat', { state: { sessionId } });
      }
  };

  // --- SMART DELETE HANDLER ---
  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation(); 
    
    if (window.confirm("Are you sure you want to delete this chat?")) {
        if (onDeleteSession) {
            // On ChatPage: Let parent handle it
            onDeleteSession(sessionId);
        } else {
            // On Profile/Watchlist: Delete from LocalStorage manually
            const updated = localSessions.filter(s => s.id !== sessionId);
            setLocalSessions(updated);
            localStorage.setItem("chat_sessions", JSON.stringify(updated));
        }
    }
    setOpenMenuId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate('/login');
  };

  const toggleMenu = (e, sessionId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const menuItems = [
    { icon: <MessageSquare size={24} />, label: "New Chat", action: handleNewChatClick },
    { icon: <User size={24} />, label: "Profile", action: () => navigate('/profile') },
    { icon: <List size={24} />, label: "Watchlist", action: () => navigate('/watchlist') },
  ];

  return (
    <div 
      className="sidebar-container"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        width: isExpanded ? '260px' : '80px',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        borderRight: '1px solid #333',
        display: 'flex', flexDirection: 'column', padding: '20px 10px',
        boxSizing: 'border-box', transition: 'width 0.3s ease', overflow: 'hidden', position: 'relative', zIndex: 50
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', paddingLeft: '8px', whiteSpace: 'nowrap' }}>
        <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', minWidth: '32px' }} />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>FilmoBot</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Menu Items */}
        <div>
            {menuItems.map((item, index) => (
            <div key={index} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', color: '#9CA3AF', cursor: 'pointer', borderRadius: '12px', marginBottom: '8px', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2A2A2A'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
                <div style={{ minWidth: '24px' }}>{item.icon}</div>
                <span style={{ fontSize: '16px', fontWeight: '500', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>{item.label}</span>
            </div>
            ))}
        </div>

        {/* Chat History Section - ALWAYS VISIBLE if expanded */}
        {isExpanded && displaySessions && displaySessions.length > 0 && (
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', marginTop: '15px', borderTop: '1px solid #333', paddingTop: '15px', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.3s' }}>
                <div style={{ fontSize: '16px', color: '#666', fontWeight: 'bold', marginBottom: '10px', paddingLeft: '12px', textTransform: 'uppercase' }}>
                    Recent Chats
                </div>
                
                {displaySessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)} // Updated handler
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: '8px',
                            backgroundColor: activeSessionId === session.id ? '#2A2A2A' : 'transparent',
                            color: activeSessionId === session.id ? 'white' : '#888',
                            cursor: 'pointer', fontSize: '16px',
                            marginBottom: '4px', whiteSpace: 'nowrap', position: 'relative'
                        }}
                        onMouseEnter={(e) => { if(activeSessionId !== session.id) e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
                        onMouseLeave={(e) => { if(activeSessionId !== session.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div style={{ minWidth: '16px' }}><MessageCircle size={20} /></div>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title || "Conversation"}</span>
                        </div>

                        {/* Three-Dot Menu Button */}
                        <div 
                            onClick={(e) => toggleMenu(e, session.id)}
                            style={{ padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <MoreVertical size={20} />
                        </div>

                        {/* Dropdown Menu */}
                        {openMenuId === session.id && (
                            <div 
                                ref={menuRef}
                                style={{
                                    position: 'absolute', right: '10px', top: '35px',
                                    backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px',
                                    padding: '5px', zIndex: 100, boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                                }}
                            >
                                <button
                                    onClick={(e) => handleDeleteClick(e, session.id)} // Updated handler
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: 'transparent', border: 'none', color: '#EF4444',
                                        padding: '8px 12px', width: '100%', cursor: 'pointer',
                                        fontSize: '16px', borderRadius: '4px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Logout */}
      <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', marginTop: 'auto', color: '#EF4444', cursor: 'pointer', borderRadius: '12px', whiteSpace: 'nowrap' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ minWidth: '24px' }}><LogOut size={24} /></div>
        <span style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>Log out</span>
      </div>
      
      <style>{`
        @media (max-width: 768px) { .sidebar-container { display: none !important; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}