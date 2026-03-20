// src/MovieCard.jsx
import React, { useState } from 'react';
import { Star, Clock, MonitorPlay, Heart, X, PlayCircle, Sparkles, User, Film } from 'lucide-react';

const C = {
  bg: '#080810', card: '#0e0e1a', border: 'rgba(255,255,255,0.07)',
  text: '#f0eee8', sub: '#7a7a9a', muted: '#4a4a6a',
  gold: '#f5c842', goldBg: 'rgba(245,200,66,0.08)',
};

const MovieCard = ({ data, isLiked, onToggle, onMoreLikeThis }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [showPoster,  setShowPoster]  = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [imgError,    setImgError]    = useState(false);
  const [liked,       setLiked]       = useState(isLiked);
  const [hovered,     setHovered]     = useState(false);

  let imageUrl = null;
  if (data.poster_path && !imgError) {
    imageUrl = data.poster_path.startsWith('/')
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : data.poster_path;
  }
  const fullUrl = data.poster_path?.startsWith('/')
    ? `https://image.tmdb.org/t/p/original${data.poster_path}`
    : imageUrl;

  const rawRating = (data.imdb_rating && data.imdb_rating !== 'N/A')
    ? parseFloat(data.imdb_rating) : data.tmdb_rating || null;
  const ratingStr   = rawRating ? rawRating.toFixed(1) : null;
  const ratingColor = !rawRating ? C.muted : rawRating >= 8 ? '#4ade80' : rawRating >= 6.5 ? C.gold : '#f87171';

  const overview = data.overview || 'No overview available.';
  const isLong   = overview.length > 160;

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: C.card, borderRadius: '20px', overflow: 'hidden',
          maxWidth: '480px', width: '100%', marginBottom: '20px',
          border: `1px solid ${hovered ? 'rgba(245,200,66,0.2)' : C.border}`,
          boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.6)' : '0 6px 24px rgba(0,0,0,0.4)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* POSTER */}
        <div onClick={() => imageUrl && setShowPoster(true)} style={{
          position: 'relative', height: '255px', overflow: 'hidden',
          cursor: imageUrl ? 'zoom-in' : 'default', background: C.bg,
        }}>
          {imageUrl && !imgError ? (
            <img src={imageUrl} alt={data.title} onError={() => setImgError(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: hovered ? 1 : 0.88,
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.4s ease',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Film size={44} color="rgba(245,200,66,0.2)" />
              <span style={{ color: C.muted, fontSize: '13px' }}>No Poster</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #0e0e1a, transparent)', pointerEvents: 'none' }} />

          {ratingStr && (
            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${ratingColor}40`, borderRadius: '10px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star size={12} fill={ratingColor} color={ratingColor} />
              <span style={{ color: ratingColor, fontSize: '13px', fontWeight: '700' }}>{ratingStr}</span>
            </div>
          )}

          <button onClick={e => { e.stopPropagation(); setLiked(l => !l); onToggle(data); }} style={{
            position: 'absolute', top: '10px', right: '10px',
            background: liked ? 'rgba(239,68,68,0.25)' : 'rgba(8,8,16,0.75)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${liked ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '50%', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 5, transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart size={17} color={liked ? '#ef4444' : 'white'} fill={liked ? '#ef4444' : 'none'} />
          </button>

          {data.duration && data.duration !== 'N/A' && (
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(8,8,16,0.75)', backdropFilter: 'blur(6px)', borderRadius: '8px', padding: '4px 9px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={11} color={C.sub} />
              <span style={{ color: C.sub, fontSize: '12px' }}>{data.duration}</span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div style={{ padding: '18px 20px 20px' }}>
          <h3 style={{ margin: '0 0 6px', color: C.text, fontSize: '19px', fontWeight: '700', lineHeight: '1.3', fontFamily: "'Playfair Display', serif" }}>
            {data.title}
          </h3>

          {data.director && data.director !== 'N/A' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: C.sub, fontSize: '13px' }}>
              <User size={12} style={{ minWidth: 12 }} /><span>{data.director}</span>
            </div>
          )}

          <div onClick={() => isLong && setExpanded(e => !e)} style={{ cursor: isLong ? 'pointer' : 'default', marginBottom: '16px' }}>
            <p style={{ color: 'rgba(240,238,232,0.5)', fontSize: '14px', lineHeight: '1.7', margin: 0, display: expanded || !isLong ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {overview}
            </p>
            {isLong && <span style={{ color: C.gold, fontSize: '12px', fontWeight: '600', marginTop: '4px', display: 'block' }}>{expanded ? '↑ Less' : '↓ More'}</span>}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            {data.trailer_key ? (
              <button onClick={() => setShowTrailer(true)} style={{ flex: 1, background: 'linear-gradient(135deg, #cc0000, #990000)', color: 'white', border: 'none', padding: '11px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <PlayCircle size={16} fill="white" color="transparent" /> Trailer
              </button>
            ) : (
              <button disabled style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: C.muted, border: `1px solid ${C.border}`, padding: '11px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '13px', fontFamily: 'inherit' }}>
                <X size={14} /> No Trailer
              </button>
            )}
            {onMoreLikeThis && (
              <button onClick={() => onMoreLikeThis(data.id)} style={{ flex: 1, background: C.goldBg, border: '1px solid rgba(245,200,66,0.25)', color: C.gold, padding: '11px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,200,66,0.16)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.goldBg; e.currentTarget.style.transform = 'scale(1)'; }}>
                <Sparkles size={15} /> Similar
              </button>
            )}
          </div>

          {data.where_to_watch && (
            <div style={{ background: C.goldBg, border: '1px solid rgba(245,200,66,0.15)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MonitorPlay size={15} color={C.gold} style={{ minWidth: 15, flexShrink: 0 }} />
              {data.where_to_watch.includes('http') ? (
                <a href={data.where_to_watch.replace('Click to find: ', '')} target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
                  Find where to stream →
                </a>
              ) : (
                <span style={{ color: C.gold, fontSize: '13px', fontWeight: '500' }}>Stream on {data.where_to_watch}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRAILER MODAL */}
      {showTrailer && data.trailer_key && (
        <div onClick={() => setShowTrailer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '960px', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 80px rgba(245,200,66,0.12)' }}>
            <button onClick={e => { e.stopPropagation(); setShowTrailer(false); }} style={{ position: 'absolute', top: '-44px', right: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <X size={18} />
            </button>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${data.trailer_key}?autoplay=1`} title="Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {/* POSTER MODAL */}
      {showPoster && (
        <div onClick={() => setShowPoster(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <X size={20} />
          </button>
          <img src={fullUrl} alt="Full Poster" onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '14px', boxShadow: '0 0 80px rgba(0,0,0,0.8)', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
};

export default MovieCard;