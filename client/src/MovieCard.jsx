// src/MovieCard.jsx
import React, { useState } from 'react';
import { Star, Clock, MonitorPlay, Heart, X } from 'lucide-react';
import { COLORS } from './theme';

const MovieCard = ({ data, isLiked, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullPoster, setShowFullPoster] = useState(false);

  // 1. Image Logic
  let imageUrl = "https://via.placeholder.com/500x750?text=No+Poster";
  if (data.poster_path) {
    imageUrl = data.poster_path.startsWith('/') 
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : data.poster_path;
  }
  
  // High-Quality Image for Modal
  let fullSizeUrl = imageUrl;
  if (data.poster_path && data.poster_path.startsWith('/')) {
      fullSizeUrl = `https://image.tmdb.org/t/p/original${data.poster_path}`;
  }

  // 2. Text Logic
  const overviewText = data.overview || "No overview available.";
  const isLongText = overviewText.length > 150; 

  return (
    <>
      <div style={{
        backgroundColor: '#1E1E1E',
        borderRadius: '20px',
        overflow: 'hidden',
        maxWidth: '500px',
        marginBottom: '16px',
        border: '1px solid #333',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        
        {/* Poster Image Area */}
        <div 
            onClick={() => setShowFullPoster(true)} 
            style={{ position: 'relative', height: '240px', overflow: 'hidden', cursor: 'pointer' }}
        >
          <img 
            src={imageUrl} 
            alt={data.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: '0.8', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          />
          <div style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            height: '50%', background: 'linear-gradient(to top, #1E1E1E, transparent)', pointerEvents: 'none'
          }} />

          {/* Heart Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(data); }}
            style={{
              position: 'absolute', top: '12px', right: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
              width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10
            }}
          >
            <Heart size={24} color={isLiked ? "#EF4444" : "white"} fill={isLiked ? "#EF4444" : "none"} />
          </button>
        </div>

        {/* Content Details */}
        <div style={{ padding: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{data.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#333', padding: '6px 10px', borderRadius: '8px' }}>
              <Star size={16} fill="#FFD700" color="#FFD700" />
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                 {data.imdb_rating && data.imdb_rating !== "N/A" ? data.imdb_rating : (data.tmdb_rating ? data.tmdb_rating.toFixed(1) : "N/A")}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '14px', color: COLORS.textSub }}>
            <span>{data.director || "Unknown Director"}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} /> {data.duration || "-- min"}
            </span>
          </div>

          <div 
            onClick={() => isLongText && setIsExpanded(!isExpanded)} 
            style={{ cursor: isLongText ? 'pointer' : 'default', marginBottom: '20px' }}
          >
            <p style={{ 
              color: '#ccc', fontSize: '15px', lineHeight: '1.6', margin: '0',
              display: (isExpanded || !isLongText) ? 'block' : '-webkit-box', 
              WebkitLineClamp: (isExpanded || !isLongText) ? 'unset' : '3', 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden' 
            }}>
              {overviewText}
            </p>
            {isLongText && (
              <span style={{ color: '#6366F1', fontSize: '13px', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                {isExpanded ? "Show less" : "Read more..."}
              </span>
            )}
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid #333' }}>
              <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: COLORS.textSub, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Starring</span>
                  <div style={{ color: 'white', fontSize: '14px', marginTop: '4px' }}>
                      {data.cast || "Cast unavailable"}
                  </div>
              </div>

              {/* --- WHERE TO WATCH SECTION (UPDATED) --- */}
              {data.where_to_watch && (
                  <div style={{ 
                      display: 'flex', alignItems: 'flex-start', gap: '8px', 
                      marginTop: '16px', color: '#6366F1', fontSize: '15px', fontWeight: '600' 
                  }}>
                      <div style={{ minWidth: '18px', display: 'flex', marginTop: '3px' }}> 
                          <MonitorPlay size={18} />
                      </div>
                      
                      {/* Check if it's a URL (Google Link) or Text (Providers) */}
                      {data.where_to_watch.includes('http') ? (
                         <a 
                           href={data.where_to_watch.replace('Click to find: ', '')}
                           target="_blank"
                           rel="noopener noreferrer"
                           onClick={(e) => e.stopPropagation()} // Prevent opening modal
                           style={{ color: '#6366F1', textDecoration: 'underline', lineHeight: '1.4', cursor: 'pointer' }}
                         >
                           Find where to watch online
                         </a>
                      ) : (
                         <span style={{ lineHeight: '1.4' }}>Watch on {data.where_to_watch}</span>
                      )}
                  </div>
              )}
          </div>
        </div>
      </div>

      {/* --- FULL SCREEN MODAL --- */}
      {showFullPoster && (
        <div 
            onClick={() => setShowFullPoster(false)}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                animation: 'fadeIn 0.2s ease-in-out'
            }}
        >
            <button 
                onClick={() => setShowFullPoster(false)}
                style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                    width: '50px', height: '50px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}
            >
                <X size={32} />
            </button>
            <img 
                src={fullSizeUrl} 
                alt="Full Poster" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
};

export default MovieCard;