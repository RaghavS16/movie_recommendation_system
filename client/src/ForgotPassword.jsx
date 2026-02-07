// src/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { COMMON_STYLES, COLORS } from "./theme";
import { API_BASE_URL } from "./config";

// --- REUSED COMPONENT: FocusInput ---
const FocusInput = ({ type, placeholder, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill("")); 
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Track which OTP box is focused
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(-1);

  // --- UPDATED OTP HANDLERS (To handle DOM traversal with wrappers) ---
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    
    // Find next input: Go up to wrapper, next sibling wrapper, then find input
    if (element.value) {
        const nextWrapper = element.parentElement.nextElementSibling;
        if (nextWrapper) {
            const nextInput = nextWrapper.querySelector('input');
            if (nextInput) nextInput.focus();
        }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index]) {
         const prevWrapper = e.target.parentElement.previousElementSibling;
         if (prevWrapper) {
             const prevInput = prevWrapper.querySelector('input');
             if (prevInput) prevInput.focus();
         }
      }
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        alert(`OTP sent to ${email}`);
        setStep(2);
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          otp: otpString, 
          new_password: newPassword 
        })
      });
      const data = await res.json();

      if (res.ok) {
        alert("Password reset successfully! Please login.");
        navigate('/login');
      } else {
        alert(data.message || "Reset failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{...COMMON_STYLES.container, justifyContent: 'flex-start'}}>
      
      <button 
        onClick={() => step === 2 ? setStep(1) : navigate(-1)} 
        style={{...COMMON_STYLES.backBtn, color: 'white', marginBottom: '32px'}}
      >
        <ChevronLeft size={24} />
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={COMMON_STYLES.wrapper}>
          
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
              {step === 1 ? "Forgot Password?" : "Reset Password"}
            </h1>
            <p style={{ fontSize: '16px', color: COLORS.textSub }}>
              {step === 1 
                ? "Enter your email to receive a verification code." 
                : `Enter the code sent to ${email}.`}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Focus Input for Email */}
              <FocusInput 
                type="email" 
                placeholder="Enter your email address"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              
              <button type="submit" disabled={loading} style={{...COMMON_STYLES.buttonPrimary, opacity: loading ? 0.7 : 1}}>
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* OTP Inputs with Gradient Wrappers */}
              <div style={{ display: 'flex', gap: '5px', justifyContent: 'space-between' }}>
                {otp.map((data, index) => (
                    <div 
                        key={index}
                        style={{
                            // Dynamic Gradient Border
                            background: focusedOtpIndex === index ? 'linear-gradient(to right, #6366F1, #8b5cf6)' : '#333',
                            padding: '2px',
                            borderRadius: '10px',
                            width: '60px', 
                            height: '60px',
                            transition: 'background 0.3s ease'
                        }}
                    >
                        <input
                          type="text" 
                          maxLength="1" 
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          
                          // Track focus state
                          onFocus={(e) => {
                              e.target.select();
                              setFocusedOtpIndex(index);
                          }}
                          onBlur={() => setFocusedOtpIndex(-1)}
                          
                          style={{
                            ...COMMON_STYLES.input,
                            width: '100%', height: '100%', 
                            textAlign: 'center', fontSize: '25px', fontWeight: 'bold', 
                            padding: '0', marginTop: '0',
                            backgroundColor: '#1E1E1E',
                            borderRadius: '8px', // Match inner radius
                            border: 'none', outline: 'none'
                          }}
                        />
                    </div>
                ))}
              </div>

              {/* Focus Inputs for Passwords */}
              <FocusInput 
                type="password" 
                placeholder="New Password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />

              <FocusInput 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />

              <button type="submit" disabled={loading} style={{...COMMON_STYLES.buttonPrimary, opacity: loading ? 0.7 : 1}}>
                {loading ? "Processing..." : "Reset Password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}