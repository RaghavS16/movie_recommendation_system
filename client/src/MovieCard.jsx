// src/MovieCard.jsx
import React, { useState } from 'react';
import { Star, Clock, MonitorPlay, Heart, X, PlayCircle, Sparkles } from 'lucide-react'; 
import { COLORS } from './theme';

const MovieCard = ({ data, isLiked, onToggle, onMoreLikeThis }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullPoster, setShowFullPoster] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // 1. Image Logic
  let imageUrl = "https://via.placeholder.com/500x750?text=No+Poster";
  if (data.poster_path) {
    imageUrl = data.poster_path.startsWith('/') 
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : data.poster_path;
  }
  
  let fullSizeUrl = imageUrl;
  if (data.poster_path && data.poster_path.startsWith('/')) {
      fullSizeUrl = `https://image.tmdb.org/t/p/original${data.poster_path}`;
  }

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
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, #1E1E1E, transparent)', pointerEvents: 'none' }} />

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

          <div onClick={() => isLongText && setIsExpanded(!isExpanded)} style={{ cursor: isLongText ? 'pointer' : 'default', marginBottom: '20px' }}>
            <p style={{ 
              color: '#ccc', fontSize: '15px', lineHeight: '1.6', margin: '0',
              display: (isExpanded || !isLongText) ? 'block' : '-webkit-box', 
              WebkitLineClamp: (isExpanded || !isLongText) ? 'unset' : '3', 
              WebkitBoxOrient: 'vertical', overflow: 'hidden' 
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
              
              {/* ACTION BUTTONS ROW */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                
                {/* Trailer Button */}
                {data.trailer_key ? (
                   <button 
                     onClick={() => setShowTrailer(true)}
                     style={{
                        flex: 1, backgroundColor: '#FF0000', color: 'white', border: 'none',
                        padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontSize: '14px', fontWeight: 'bold', transition: 'background 0.2s'
                     }}
                   >
                     <PlayCircle size={18} fill="white" color="#FF0000" /> 
                     Trailer
                   </button>
                ) : (
                   <button disabled style={{ 
                      flex: 1, backgroundColor: '#333', color: '#666', 
                      border: 'none', padding: '10px', borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                   }}>
                      <X size={18} /> No Trailer
                   </button>
                )}

                {/* CONDITIONALLY RENDER 'SIMILAR' BUTTON */}
                {onMoreLikeThis && (
                    <button 
                        onClick={() => onMoreLikeThis(data.id)} 
                        style={{ 
                            flex: 1, backgroundColor: '#6366F1', color: 'white', border: 'none', 
                            padding: '10px', borderRadius: '8px', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                            fontSize: '14px', fontWeight: 'bold' 
                        }}
                    >
                        <Sparkles size={18} /> Similar
                    </button>
                )}
                
              </div>

              {/* Where to Watch */}
              {data.where_to_watch && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#6366F1', fontSize: '15px', fontWeight: '600' }}>
                      <div style={{ minWidth: '18px', display: 'flex', marginTop: '3px' }}><MonitorPlay size={18} /></div>
                      {data.where_to_watch.includes('http') ? (
                         <a 
                           href={data.where_to_watch.replace('Click to find: ', '')}
                           target="_blank" rel="noopener noreferrer"
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

      {/* --- TRAILER MODAL --- */}
      {showTrailer && data.trailer_key && (
        <div 
            onClick={() => setShowTrailer(false)}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
        >
            <div style={{ position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9', backgroundColor: 'black', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                <button 
                    onClick={() => setShowTrailer(false)}
                    style={{
                        position: 'absolute', top: '-40px', right: '0px',
                        background: 'none', border: 'none', color: 'white', cursor: 'pointer'
                    }}
                >
                    <X size={32} />
                </button>
                <iframe 
                    width="100%" height="100%" 
                    src={`https://www.youtube.com/embed/${data.trailer_key}?autoplay=1`} 
                    title="YouTube video player" frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
        </div>
      )}

      {/* --- POSTER MODAL --- */}
      {showFullPoster && (
        <div 
            onClick={() => setShowFullPoster(false)}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
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
                src={fullSizeUrl} alt="Full Poster" onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
        </div>
      )}
    </>
  );
};

export default MovieCard;