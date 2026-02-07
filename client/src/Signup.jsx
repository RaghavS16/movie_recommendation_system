// src/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Edit2 } from "lucide-react";
import { COMMON_STYLES, COLORS } from "./theme";
import { API_BASE_URL } from "./config";

// --- REUSED COMPONENT: FocusInput ---
const FocusInput = ({ type, placeholder, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
      // Gradient only on focus
      background: isFocused ? 'linear-gradient(to right, #6366F1, #8b5cf6)' : '#333',
      padding: '2px',
      borderRadius: '10px',
      marginTop: '16px',
      transition: 'background 0.3s ease'
    }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          backgroundColor: '#1E1E1E',
          color: 'white',
          padding: '20px 16px',
          borderRadius: '8px',
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

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    
    if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
        return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      if (imageFile) {
        formData.append("profileImage", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
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
        <ChevronLeft size={24} />
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={COMMON_STYLES.wrapper}>
          
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '35px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              Finish up your profile!
            </h1>
            <p style={{ fontSize: '18px', color: COLORS.textSub }}>
              Complete your profile before to jump in!
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Profile Picture Upload */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  backgroundColor: '#2a2a2a', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg style={{ width: '48px', height: '48px', color: '#4b5563' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                
                <label
                  htmlFor="profile-image"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: COLORS.primaryGradient,
                    padding: '8px', borderRadius: '50%',
                    cursor: 'pointer', display: 'flex'
                  }}
                >
                  <Edit2 size={16} color="white" />
                  <input
                    id="profile-image" type="file" accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Inputs with Focus Effect */}
            <FocusInput 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
            />
            
            <FocusInput 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
            />
            
            <FocusInput 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
            />
            
            <FocusInput 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
            />

            <button type="submit" style={COMMON_STYLES.buttonPrimary}>
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}