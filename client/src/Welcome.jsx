// src/Welcome.jsx
import React from "react";
import { Link } from "react-router-dom";
import { COMMON_STYLES, COLORS } from "./theme";
// 1. Import the logo
import login from "./assets/login.png"; 

export default function Welcome() {
  const btnBase = {
    width: '100%',
    padding: '20px 24px',
    borderRadius: '9999px',
    fontWeight: '600',
    textAlign: 'center',
    display: 'block',
    textDecoration: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px',
    transition: 'all 0.2s' ,
    fontSize: '22px'
  };

  return (
    <div style={COMMON_STYLES.container}>
      <div style={COMMON_STYLES.wrapper}>
        
        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          
          {/* 2. Add the Logo Image Here */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <img 
              src={login} 
              alt="FilmoBot Logo" 
              style={{ width: '300px', height: '300px', objectFit: 'contain' }} 
            />
          </div>

          <h1 style={{ fontSize: '50px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
            FilmoBot
          </h1>
          <p style={{ fontSize: '25px', color: COLORS.textSub, lineHeight: '1.625' }}>
            Create your account in seconds and unlock the full potential of FilmoBot conversations.
          </p>
        </div>

        {/* Buttons */}
        <div>
          <Link to="/login" style={{ ...btnBase, background: COLORS.primaryGradient, color: 'white' }}>
            Log in
          </Link>
          <Link to="/signup" style={{ ...btnBase, background: '#2a2a2a', color: 'white' }}>
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
}