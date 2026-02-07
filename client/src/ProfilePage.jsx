// src/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Mail, User, Shield, Edit2, Check, X, Camera } from 'lucide-react';
import { COLORS, COMMON_STYLES } from './theme';

// --- ADAPTED FOCUS INPUT FOR PROFILE LAYOUT ---
const FocusInput = ({ value, onChange, type = "text" }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
      flex: 1, // Takes up available space
      background: isFocused ? 'linear-gradient(to right, #6366F1, #8b5cf6)' : '#333',
      padding: '2px',
      borderRadius: '10px',
      transition: 'background 0.3s ease'
    }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          backgroundColor: '#1E1E1E',
          color: 'white',
          padding: '20px 25px', // Adjusted padding for profile look
          borderRadius: '8px',
          outline: 'none',
          border: 'none',
          fontSize: '18px',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

export default function ProfilePage({ user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profileImage: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        profileImage: user.profileImage || null
      });
    }
  }, [user]);

  const handleSave = () => {
    setUser({ 
      ...user, 
      username: formData.username,
      email: formData.email,
      profileImage: formData.profileImage 
    });
    
    localStorage.setItem("username", formData.username);
    localStorage.setItem("email", formData.email);
    if (formData.profileImage) {
        localStorage.setItem("profileImage", formData.profileImage);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
        username: user.username || '',
        email: user.email || '',
        profileImage: user.profileImage || null
    });
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, profileImage: reader.result });
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', maxWidth: '800px' }}>
             <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 'bold', margin: 0 }}>My Profile</h1>
             {!isEditing && (
                 <button 
                    onClick={() => setIsEditing(true)}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#333', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                        fontSize: '16px', fontWeight: 'bold'
                    }}
                 >
                    <Edit2 size={18} /> Edit Profile
                 </button>
             )}
        </div>

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
            <div style={{ position: 'relative' }}>
                <div style={{ 
                    width: '140px', height: '140px', 
                    borderRadius: '50%', backgroundColor: '#333',
                    overflow: 'hidden', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#aaa',
                    border: isEditing ? '4px solid #6366F1' : '4px solid #333'
                }}>
                {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <User size={72} />
                )}
                </div>
                
                {isEditing && (
                    <label style={{
                        position: 'absolute', bottom: '0', right: '0',
                        backgroundColor: '#6366F1', padding: '10px', borderRadius: '50%',
                        cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                    }}>
                        <Camera size={20} color="white" />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </label>
                )}
            </div>
            
            <div>
              <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '36px' }}>
                  {formData.username || "User"}
              </h2>
              <span style={{ 
                backgroundColor: '#6366F1', color: 'white', 
                padding: '6px 16px', borderRadius: '30px', 
                fontSize: '16px', fontWeight: '500' 
              }}>
                {user.plan || "Free Plan"}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Username Field */}
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '24px' }}>
              <label style={{ color: '#aaa', fontSize: '18px', marginBottom: '12px', display: 'block' }}>Username</label>
              <div style={{ display: 'flex', alignItems: 'center', color: 'white', minHeight: '40px' }}>
                 {isEditing ? (
                     // WRAPPED IN FOCUS INPUT
                     <FocusInput 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                     />
                 ) : (
                    <span style={{ fontSize: '22px', fontWeight: '500' }}>{formData.username}</span>
                 )}
              </div>
            </div>

            {/* Email Field */}
            <div style={{ borderBottom: '1px solid #333', paddingBottom: '24px' }}>
              <label style={{ color: '#aaa', fontSize: '18px', marginBottom: '12px', display: 'block' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', width: '100%' }}>
                  <Mail size={24} color="#aaa" />
                  {isEditing ? (
                     // WRAPPED IN FOCUS INPUT
                     <FocusInput 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                     />
                 ) : (
                    <span style={{ fontSize: '20px' }}>{formData.email}</span>
                 )}
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

            {/* Buttons */}
            {isEditing && (
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                    <button 
                        onClick={handleSave}
                        style={{ ...COMMON_STYLES.buttonPrimary, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <Check size={20} /> Save Changes
                    </button>
                    <button 
                        onClick={handleCancel}
                        style={{ ...COMMON_STYLES.buttonPrimary, marginTop: 0, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <X size={20} /> Cancel
                    </button>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}