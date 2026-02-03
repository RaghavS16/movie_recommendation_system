import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { COMMON_STYLES, COLORS } from "./theme";
import { API_BASE_URL } from "./config";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
  
  // Save the image URL
  if (data.profile_image) {
    localStorage.setItem("profileImage", data.profile_image);
  } else {
    localStorage.removeItem("profileImage");
  }
  
  navigate("/chat");
  window.location.reload(); 
}
      else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to server.");
    }
  };

  return (
    <div style={{...COMMON_STYLES.container, justifyContent: 'flex-start'}}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{...COMMON_STYLES.backBtn, color: 'white', marginBottom: '32px'}}
        aria-label="Go back"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Form Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={COMMON_STYLES.wrapper}>
          
          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '35px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
              Hello there!
            </h1>
            <p style={{ fontSize: '22px', color: COLORS.textSub }}>
              Please enter your email & password to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <input
              type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={COMMON_STYLES.input} required
            />
            
            <input
              type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={COMMON_STYLES.input} required
            />

            {/* Forgot Password Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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