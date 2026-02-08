import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { COMMON_STYLES } from "./theme";
import logo from "./assets/logo.png"; 

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome");
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ ...COMMON_STYLES.container, justifyContent: 'space-between' }}>
      
      {/* 1. Main Logo & Name Section */}
      {/* Added flexDirection: 'column' to stack Logo then Name */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%' 
      }}>
        
        <img 
          src={logo} 
          alt="FilmoBot Logo" 
          // EXACT ORIGINAL STYLES KEPT
          style={{ 
            width: '50%', 
            maxWidth: '300px', 
            minWidth: '100px', 
            height: 'auto', 
            objectFit: 'contain' ,
            marginBottom: '25px'
          }} 
        />
        
        {/* Name moved here (Logo -> Name) */}
        <h1 style={{ 
          fontSize: '65px', 
          fontWeight: 'bold', 
          color: 'white', 
          marginTop: '20px', // Changed from marginBottom to marginTop to push off the logo
          marginBottom: '12px'
        }}>
            FilmoBot
        </h1>
      <div style={{ paddingBottom: '190px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '4px solid #333',
          borderTop: '4px solid #6366F1',
          animation: 'spin 1s linear infinite',
          marginTop: '30px'
        }} />
      </div>
      </div>

      {/* 2. Loading Spinner (Name -> Loading) */}
      {/* EXACT ORIGINAL STYLES KEPT */}


      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}