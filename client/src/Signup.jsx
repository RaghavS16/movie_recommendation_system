// src/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Edit2 } from "lucide-react";
import { COMMON_STYLES, COLORS } from "./theme";
import { API_BASE_URL } from "./config";

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [profileImage, setProfileImage] = useState(null); // Used for Preview
  const [imageFile, setImageFile] = useState(null);       // Used for Upload <--- NEW STATE

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // Save the file object
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // Save preview URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      if (imageFile) {
        formData.append("profileImage", imageFile); // Attach file
      }

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        // Do NOT set Content-Type header when using FormData; fetch sets it automatically
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
      
      {/* Back Button */}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Profile Picture Logic */}
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
                
                {/* File Input Label */}
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

            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={COMMON_STYLES.input} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={COMMON_STYLES.input} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={COMMON_STYLES.input} required />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={COMMON_STYLES.input} required />

            <button type="submit" style={COMMON_STYLES.buttonPrimary}>
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}