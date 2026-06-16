import React, { useState, useEffect } from 'react';
import { LayoutList, Users, BarChart3, Target, Crosshair, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import TimelineTab from './TimelineTab';
import LineupPitch from './LineupPitch';
import StatsTab from './StatsTab';
import PreMatchStats from './PreMatchStats';
import TrendsTab from './TrendsTab';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function MatchDetails({ matchId, onClose, onClear, onOpenModal, user, isInline = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [activeTab, setActiveTab] = useState('trends'); // 'trends', 'timeline', 'lineup', 'stats'
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!matchId) return;
    
    const fetchAllData = async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const trendDocRef = doc(db, 'game_trends', matchId.toString());
        
        // Si es silent, solo actualizamos detalles y stats
        let detailsRes, statsRes, trendSnap, proxyTrendsRes;
        
        if (silent) {
          [detailsRes, statsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/game/${matchId}?_=${Date.now()}`),
            axios.get(`${API_BASE_URL}/api/game/${matchId}/stats?_=${Date.now()}`)
          ]);
        } else {
          [detailsRes, statsRes, trendSnap, proxyTrendsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/game/${matchId}?_=${Date.now()}`),
            axios.get(`${API_BASE_URL}/api/game/${matchId}/stats?_=${Date.now()}`),
            getDoc(trendDocRef).catch((e) => { console.error('Firebase error:', e); return null; }),
            axios.get(`${API_BASE_URL}/api/game/${matchId}/trends`).catch(() => ({ data: { trends: [] } }))
          ]);
        }

        const gameData = detailsRes.data?.game || {};
        
        if (!silent) {
          const startTime = new Date(gameData.startTime);
          const now = new Date();
          const diffMins = (startTime - now) / 1000 / 60;
          
          const isFrozenWindow = diffMins <= 30 || gameData.statusGroup !== 1;
          let finalTrends = null;

          if (isFrozenWindow) {
             if (trendSnap && trendSnap.exists()) {
                finalTrends = trendSnap.data();
             } else {
                finalTrends = proxyTrendsRes.data;
                if (finalTrends?.trends?.length > 0) {
                   await setDoc(trendDocRef, finalTrends).catch(e => console.error('Firebase write error:', e));
                }
             }
          } else {
             finalTrends = proxyTrendsRes.data;
          }
          setTrendsData(finalTrends);
        }

        setGameDetails(detailsRes.data);
        setStatsData(statsRes.data);
      } catch (err) {
        console.error('Error fetching details:', err);
        if (!silent) setError('No se pudieron cargar los detalles de este partido.');
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchAllData(false);

    // Auto-refresh data every 15 seconds for live matches
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [matchId]);

  if (!matchId) return null;

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div className="skeleton" style={{ height: '100px', width: '100%' }} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="skeleton" style={{ height: '40px', flex: 1 }} />
        <div className="skeleton" style={{ height: '40px', flex: 1 }} />
        <div className="skeleton" style={{ height: '40px', flex: 1 }} />
      </div>
      <div className="skeleton" style={{ height: '400px', width: '100%' }} />
    </div>
  );

  const getTeamLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_120,h_120,c_limit,q_auto:eco,d_competitors:default1.png/competitors/${id}`;
  };

  useEffect(() => {
    if (!gameDetails?.game?.startTime) return;
    const game = gameDetails.game;
    if (game.statusGroup !== 1 && game.statusGroup !== 2) {
       setCountdown('');
       return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(game.startTime);
      const diff = startTime - now;
      
      if (diff <= 0) {
        setCountdown('00:00:00');
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Show hours only if there are hours left
        if (h > 0) {
          setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        } else {
          setCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameDetails]);

  const game = gameDetails?.game;
  const home = game?.homeCompetitor;
  const away = game?.awayCompetitor;

  return (
    <>
      {/* Background Overlay */}
      {!isInline && <div className="drawer-overlay" onClick={onClose} />}
      
      {/* Container (Modal or Inline) */}
      <div className={isInline ? "" : "drawer-content"} style={isInline ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        
        {/* Widescreen Header */}
        <div style={{ 
          padding: '16px 12px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          position: 'relative',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, transparent 100%)'
        }}>
          {/* Top Bar (Back Button & Category Tag) */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
            <button 
              onClick={onClose}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'var(--border-color)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-secondary)', 
                padding: '8px 12px', 
                borderRadius: '0', 
                cursor: 'pointer', 
                fontSize: '12px', 
                fontWeight: '600', 
                transition: 'all 0.2s ease' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.background = 'var(--border-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--border-color)';
              }}
            >
              ← Volver
            </button>
            
            <button 
              onClick={onClear}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer', 
                fontSize: '20px',
                fontWeight: '300',
                padding: '0 8px'
              }}
            >
              ✕
            </button>
          </div>

          {gameDetails && game && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <span 
                onClick={() => onOpenModal('league', game.competitionId)}
                style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'center' }}
                className="hover-underline"
              >
                {game.competitionDisplayName}
              </span>
              
              {/* Scoreboard Block */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%' }}>
                {/* Home */}
                <div 
                  onClick={() => onOpenModal('team', home.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <img src={getTeamLogo(home.id)} alt={home.name} style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }} className="hover-underline">{home.name}</span>
                </div>

                {/* Score or Countdown */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    fontSize: (countdown && home.score === -1) ? '22px' : '32px', 
                    fontWeight: '900', 
                    letterSpacing: (countdown && home.score === -1) ? '2px' : '6px', 
                    color: 'var(--text-primary)', 
                    fontFamily: "'Outfit', sans-serif",
                    textShadow: '0 0 20px rgba(255,255,255,0.1)'
                  }}>
                    {home.score !== -1 ? `${home.score} - ${away.score}` : (countdown || 'vs')}
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    background: game.statusGroup === 3 ? 'rgba(13, 240, 163, 0.15)' : 'var(--border-color)', 
                    color: game.statusGroup === 3 ? 'var(--accent-emerald)' : 'var(--text-secondary)', 
                    border: game.statusGroup === 3 ? '1px solid rgba(13, 240, 163, 0.3)' : '1px solid var(--border-color)',
                    padding: '4px 12px', 
                    borderRadius: '0', 
                    marginTop: '8px', 
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {game.statusGroup === 3 && <span className="live-dot" style={{ width: '6px', height: '6px' }} />}
                    {game.statusGroup === 3 && game.gameTime > 0 
                      ? `${game.gameTime}'` 
                      : (game.statusText || 'Programado')}
                  </span>
                </div>

                {/* Away */}
                <div 
                  onClick={() => onOpenModal('team', away.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <img src={getTeamLogo(away.id)} alt={away.name} style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }} className="hover-underline">{away.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection Bar */}
        {gameDetails && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)' }}>
            <div className="hide-scrollbar" style={{ display: 'flex', width: '100%', maxWidth: '800px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'trends', name: 'Radar de Valor', icon: <BarChart3 size={14} /> },
                { id: 'timeline', name: 'Resumen', icon: <LayoutList size={14} /> },
                (game.statusGroup === 3 || game.statusGroup === 4) ? { id: 'game-stats', name: 'Est. del Partido', icon: <Target size={14} /> } : null,
                { id: 'lineup', name: 'Alineación Táctica', icon: <Users size={14} /> },
                { id: 'stats', name: 'Estadísticas', icon: <Activity size={14} /> }
              ].filter(Boolean).map(tab => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: '0 0 auto',
                      minWidth: '140px',
                      flexShrink: 0,
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'inset 0 -10px 10px -10px rgba(13,240,163,0.1)' : 'none'
                    }}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Body container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 40px 16px', width: '100%', boxSizing: 'border-box' }}>
          {loading ? (
            renderSkeleton()
          ) : error ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--danger)', maxWidth: '600px', margin: '0 auto' }}>
              <p>{error}</p>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: activeTab === 'lineup' ? '1200px' : '700px', margin: '0 auto', boxSizing: 'border-box' }}>
              
              {activeTab === 'timeline' && (
                <TimelineTab 
                  events={gameDetails.game?.events} 
                  members={gameDetails.game?.members || []} 
                  homeId={home.id} 
                  awayId={away.id} 
                  gameDetails={gameDetails}
                  onOpenModal={onOpenModal}
                />
              )}
              
              {activeTab === 'lineup' && (
                <LineupPitch gameDetails={gameDetails} onOpenModal={onOpenModal} />
              )}

              {activeTab === 'game-stats' && (
                <StatsTab 
                  statsList={statsData?.statistics} 
                  homeId={home.id} 
                  awayId={away.id} 
                />
              )}

              {activeTab === 'stats' && (
                <PreMatchStats 
                  gameId={game.id}
                  homeCompetitor={gameDetails?.game?.homeCompetitor} 
                  awayCompetitor={gameDetails?.game?.awayCompetitor} 
                />
              )}
              
              {activeTab === 'trends' && (
                <TrendsTab 
                  trendsData={trendsData} 
                  game={gameDetails?.game}
                  homeTeam={gameDetails?.homeCompetitor} 
                  awayTeam={gameDetails?.awayCompetitor} 
                  user={user}
                  onOpenModal={onOpenModal}
                />
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
