// src/ProfilePage.jsx
import React from 'react';
import Sidebar from './Sidebar';
import { Mail, User, Shield } from 'lucide-react';
import { COLORS } from './theme';

export default function ProfilePage({ user }) {
  return (
    
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        
        <h1 style={{ color: 'white', marginBottom: '40px', fontSize: '42px', fontWeight: 'bold' }}>My Profile</h1>

        {/* Profile Card */}
        <div style={{ 
          backgroundColor: '#1E1E1E', 
          borderRadius: '24px', 
          padding: '50px', 
          maxWidth: '800px',
          border: '1px solid #333',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
        }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '50px' }}>
            {/* Avatar */}
            <div style={{ 
  width: '140px', height: '140px', 
  borderRadius: '50%', backgroundColor: '#333',
  overflow: 'hidden', // Ensure image doesn't spill out
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#aaa',
  border: '4px solid #333' // Optional aesthetic border
}}>
  {user.profileImage ? (
    <img 
        src={user.profileImage} 
        alt="Profile" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
    />
  ) : (
    <User size={72} />
  )}
</div>
            
            <div>
              {/* Username */}
              <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '36px' }}>{user.username}</h2>
              <span style={{ 
                backgroundColor: '#6366F1', color: 'white', 
                padding: '6px 16px', borderRadius: '30px', 
                fontSize: '16px', fontWeight: '500' 
              }}>
                {user.plan}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Username Field (Static) */}
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '24px' }}>
              <label style={{ color: '#aaa', fontSize: '18px', marginBottom: '12px', display: 'block' }}>Username</label>
              <div style={{ display: 'flex', alignItems: 'center', color: 'white', minHeight: '40px' }}>
                 <span style={{ fontSize: '22px', fontWeight: '500' }}>{user.username}</span>
              </div>
            </div>

            {/* Email Field */}
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '24px' }}>
              <label style={{ color: '#aaa', fontSize: '18px', marginBottom: '12px', display: 'block' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                  <Mail size={24} color="#aaa" />
                  <span style={{ fontSize: '20px' }}>{user.email}</span>
              </div>
            </div>

            {/* Security Field */}
            <div>
               <label style={{ color: '#aaa', fontSize: '18px', marginBottom: '12px', display: 'block' }}>Security</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4ADE80' }}>
                  <Shield size={24} />
                  <span style={{ fontSize: '20px', fontWeight: '500' }}>Account Verified</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}