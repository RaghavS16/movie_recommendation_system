// src/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { COMMON_STYLES, COLORS } from "./theme";
import { API_BASE_URL } from "./config";

// --- NEW COMPONENT: FocusInput ---
// This handles the "Gradient only on Focus" logic
const FocusInput = ({ type, placeholder, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
      // If focused: Gradient. If not: Dark Grey Border (#333)
      background: isFocused ? 'linear-gradient(to right, #6366F1, #8b5cf6)' : '#333',
      padding: '2px', // Border width
      borderRadius: '10px',
      marginTop: '16px',
      transition: 'background 0.3s ease' // Smooth transition effect
    }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        
        // --- TOGGLE STATE HERE ---
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        
        style={{
          width: '100%',
          backgroundColor: '#1E1E1E', // Inner dark background
          color: 'white',
          padding: '20px 16px',
          borderRadius: '8px', // Slightly smaller than wrapper to fit inside
          outline: 'none',
          border: 'none',
          fontSize: '20px',
          boxSizing: 'border-box'
        }}
        required
      />
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple Validation
    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        
        if (data.profile_image) {
            localStorage.setItem("profileImage", data.profile_image);
        } else {
            localStorage.removeItem("profileImage");
        }
        
        window.location.href = "/chat";
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to server.");
    }
  };

  return (
    <div style={{...COMMON_STYLES.container, justifyContent: 'flex-start'}}>
      
      <button 
        onClick={() => navigate(-1)} 
        style={{...COMMON_STYLES.backBtn, color: 'white', marginBottom: '32px'}}
        aria-label="Go back"
      >
        <ChevronLeft size={30} />
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={COMMON_STYLES.wrapper}>
          
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '35px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
              Hello there!
            </h1>
            <p style={{ fontSize: '22px', color: COLORS.textSub }}>
              Please enter your email & password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* New Focus Inputs */}
            <FocusInput 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
            
            <FocusInput 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <span 
                onClick={() => navigate('/forgot-password')}
                style={{ 
                  color: '#6366F1', 
                  fontSize: '14px', 
                  cursor: 'pointer', 
                  fontWeight: '600'
                }}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" style={COMMON_STYLES.buttonPrimary}>
              Continue
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}