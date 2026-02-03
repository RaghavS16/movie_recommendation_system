// src/Sidebar.jsx
import React, { useState } from 'react';
import { User, List, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png'; 

export default function Sidebar() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { icon: <MessageSquare size={24} />, label: "New Chat", action: () => navigate('/chat') },
    { icon: <User size={24} />, label: "Profile", action: () => navigate('/profile') },
    // UPDATE THIS LINE:
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
      {/* ... (Logo and rest of code is same as before) ... */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', paddingLeft: '8px', whiteSpace: 'nowrap' }}>
        <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', minWidth: '32px' }} />
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>FilmoBot</span>
      </div>

      <div style={{ flex: 1 }}>
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

      <div onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', marginTop: 'auto', color: '#EF4444', cursor: 'pointer', borderRadius: '12px', whiteSpace: 'nowrap' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ minWidth: '24px' }}><LogOut size={24} /></div>
        <span style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>Log out</span>
      </div>
      <style>{`@media (max-width: 768px) { .sidebar-container { display: none !important; } }`}</style>
    </div>
  );
}