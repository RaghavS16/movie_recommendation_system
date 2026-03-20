// src/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  User, BookMarked, LogOut, PlusSquare,
  MessageCircle, MoreVertical, Trash2,
  Info, Settings, Mail,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from './theme';

export default function Sidebar({ chatSessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [localSessions, setLocalSessions] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!chatSessions) {
      const saved = localStorage.getItem('chat_sessions');
      if (saved) setLocalSessions(JSON.parse(saved));
    }
  }, [chatSessions]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sessions = chatSessions || localSessions;

  const handleNewChat = () => { if (onNewChat) onNewChat(); else navigate('/chat'); };

  const handleSessionClick = (id) => {
    if (onSelectSession) onSelectSession(id);
    else navigate('/chat', { state: { sessionId: id } });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    if (onDeleteSession) {
      onDeleteSession(id);
    } else {
      const updated = localSessions.filter(s => s.id !== id);
      setLocalSessions(updated);
      localStorage.setItem('chat_sessions', JSON.stringify(updated));
    }
    setOpenMenuId(null);
  };

  const handleLogout = () => {
    ['token','username','email','profileImage','chat_sessions'].forEach(k => localStorage.removeItem(k));
    navigate('/welcome');
  };

  const navItems = [
    { icon: PlusSquare,   label: 'New Chat',  action: handleNewChat },
    { icon: User,         label: 'Profile',   action: () => navigate('/profile') },
    { icon: BookMarked,   label: 'Watchlist', action: () => navigate('/watchlist') },
    { icon: Settings,     label: 'Settings',  action: () => navigate('/settings') },
    { icon: Info,         label: 'About',     action: () => navigate('/about') },
    { icon: Mail,         label: 'Contact',   action: () => navigate('/contact') },
  ];

  const W = expanded ? '260px' : '72px';

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setOpenMenuId(null); }}
      className="sidebar-root"
      style={{
        width: W, minWidth: W, height: '100vh',
        background: COLORS.bgCard,
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '20px 10px', boxSizing: 'border-box',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', position: 'relative', zIndex: 50, flexShrink: 0,
        fontFamily: FONTS.body,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '8px 8px 28px', whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #f5c842, #c9a227)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', boxShadow: '0 0 16px rgba(245,200,66,0.3)',
        }}>🎬</div>
        <span style={{
          fontFamily: FONTS.display, fontWeight: '700', fontSize: '18px',
          color: COLORS.textMain,
          opacity: expanded ? 1 : 0, transition: 'opacity 0.2s',
          whiteSpace: 'nowrap',
        }}>FilmoBot</span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 10px', borderRadius: '12px', cursor: 'pointer',
            background: 'transparent', border: 'none',
            color: COLORS.textSub, whiteSpace: 'nowrap',
            transition: 'all 0.2s', fontFamily: FONTS.body,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.bgElevated; e.currentTarget.style.color = '#f5c842'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textSub; }}
          >
            <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
              <Icon size={20} />
            </div>
            <span style={{
              fontSize: '14px', fontWeight: '500',
              opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
            }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: COLORS.border, margin: '12px 8px' }} />

      {/* Chat history */}
      {expanded && sessions && sessions.length > 0 && (
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
          <p style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
            textTransform: 'uppercase', color: COLORS.textMuted,
            padding: '0 10px 8px',
          }}>
            Recent
          </p>
          {sessions.map(session => (
            <div key={session.id} style={{ position: 'relative' }}>
              <div
                onClick={() => handleSessionClick(session.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 10px', borderRadius: '10px', cursor: 'pointer',
                  background: activeSessionId === session.id ? COLORS.bgElevated : 'transparent',
                  color: activeSessionId === session.id ? COLORS.textMain : COLORS.textSub,
                  marginBottom: '2px',
                  borderLeft: activeSessionId === session.id ? '2px solid #f5c842' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (activeSessionId !== session.id) e.currentTarget.style.background = COLORS.bgElevated; }}
                onMouseLeave={e => { if (activeSessionId !== session.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
                  <MessageCircle size={14} style={{ minWidth: 14 }} />
                  <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.title || 'Conversation'}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === session.id ? null : session.id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.textMuted, padding: '2px', borderRadius: '4px',
                    display: 'flex', minWidth: 20,
                  }}
                >
                  <MoreVertical size={14} />
                </button>
              </div>

              {openMenuId === session.id && (
                <div ref={menuRef} style={{
                  position: 'absolute', right: '8px', top: '36px',
                  background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                  borderRadius: '10px', padding: '4px', zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  <button
                    onClick={e => handleDelete(e, session.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'transparent', border: 'none', color: '#f87171',
                      padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                      borderRadius: '7px', whiteSpace: 'nowrap', fontFamily: FONTS.body,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: expanded ? 0 : 1 }} />

      {/* Logout */}
      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 10px', borderRadius: '12px', cursor: 'pointer',
        background: 'transparent', border: 'none',
        color: '#f87171', whiteSpace: 'nowrap',
        transition: 'all 0.2s', fontFamily: FONTS.body,
        marginTop: '8px',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
          <LogOut size={20} />
        </div>
        <span style={{
          fontSize: '14px', fontWeight: '500',
          opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Log out
        </span>
      </button>

      <style>{`
        @media (max-width: 640px) { .sidebar-root { display: none !important; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}