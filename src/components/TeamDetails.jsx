import React, { useState, useEffect } from 'react';
import { Calendar, Users, Info } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function TeamDetails({ teamId, onClose, onClear, onOpenModal, isInline = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMeta, setTeamMeta] = useState(null);
  const [squadData, setSquadData] = useState(null);
  const [gamesData, setGamesData] = useState(null);
  const [activeTab, setActiveTab] = useState('games'); // 'games', 'squad'

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metaRes, squadRes, gamesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/competitor/${teamId}`),
          axios.get(`${API_BASE_URL}/api/competitor/${teamId}/squad`).catch(() => ({ data: { squads: [] } })),
          axios.get(`${API_BASE_URL}/api/competitor/${teamId}/games`).catch(() => ({ data: { games: [] } }))
        ]);
        
        setTeamMeta(metaRes.data);
        setSquadData(squadRes.data);
        setGamesData(gamesRes.data);
      } catch (err) {
        console.error('Error fetching team details:', err);
        setError('No se pudieron cargar los datos de este equipo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (!teamId) return null;

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div className="skeleton" style={{ height: '80px', width: '100%' }} />
      <div className="skeleton" style={{ height: '40px', width: '200px' }} />
      <div className="skeleton" style={{ height: '300px', width: '100%' }} />
    </div>
  );

  const getTeamLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_120,h_120,c_limit,q_auto:eco,d_competitors:default1.png/competitors/${id}`;
  };

  const competitor = teamMeta?.competitors?.find(c => c.id === Number(teamId)) || 
                      squadData?.competitors?.find(c => c.id === Number(teamId)) || 
                      gamesData?.competitors?.find(c => c.id === Number(teamId));

  const country = teamMeta?.countries?.find(c => c.id === competitor?.countryId);

  // Group squad by positions
  const squadObj = squadData?.squads?.[0];
  const players = squadObj?.athletes || [];
  const positions = squadObj?.positions || [];

  const playersByPosition = {};
  positions.forEach(pos => {
    playersByPosition[pos.id] = {
      title: pos.title || pos.name,
      isStaff: pos.isStaff,
      list: []
    };
  });

  players.forEach(player => {
    const posId = player.position?.id;
    if (playersByPosition[posId]) {
      playersByPosition[posId].list.push(player);
    } else {
      // Fallback
      if (!playersByPosition['other']) {
        playersByPosition['other'] = { title: 'Otros', isStaff: false, list: [] };
      }
      playersByPosition['other'].list.push(player);
    }
  });

  // Games
  const games = gamesData?.games || [];
  // Sort games: live first, then finished (descending date), then scheduled (ascending date)
  const sortedGames = [...games].sort((a, b) => {
    if (a.statusGroup === 3 && b.statusGroup !== 3) return -1;
    if (a.statusGroup !== 3 && b.statusGroup === 3) return 1;
    
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    
    if (a.statusGroup === 4 && b.statusGroup === 4) {
      return dateB - dateA; // finished: newest first
    }
    if (a.statusGroup !== 4 && b.statusGroup !== 4) {
      return dateA - dateB; // scheduled: closest first
    }
    
    // Scheduled matches after finished
    return a.statusGroup === 4 ? 1 : -1;
  });

  const formatGameDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getGameTimeOrScore = (game) => {
    if (game.statusGroup === 3) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <strong style={{ color: 'var(--accent-emerald)', fontSize: '15px' }}>{game.homeCompetitor.score} - {game.awayCompetitor.score}</strong>
          <span style={{ fontSize: '9px', color: 'var(--accent-emerald)', fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span className="live-dot" style={{ width: '4px', height: '4px' }} /> Vivo
          </span>
        </div>
      );
    }
    if (game.statusGroup === 4) {
      return (
        <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
          {game.homeCompetitor.score} - {game.awayCompetitor.score}
        </strong>
      );
    }
    // Scheduled
    try {
      const date = new Date(game.startTime);
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      return <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{timeStr}</span>;
    } catch (e) {
      return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prog.</span>;
    }
  };

  return (
    <>
      {!isInline && <div className="drawer-overlay" onClick={onClear} />}
      <div className={isInline ? "" : "drawer-content"} style={isInline ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        
        {/* Header */}
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <button 
              onClick={onClose}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'var(--border-color)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-secondary)', 
                padding: '8px 16px', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                fontSize: '13px', 
                fontWeight: '600' 
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
                fontWeight: '300'
              }}
            >
              ✕
            </button>
          </div>

          {competitor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '16px',
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                boxSizing: 'border-box'
              }}>
                <img 
                  src={getTeamLogo(teamId)} 
                  alt={competitor.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {competitor.longName || competitor.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>
                  <span>{country?.name || 'Internacional'}</span>
                  {competitor.symbolicName && (
                    <>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                      <span>{competitor.symbolicName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        {!loading && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '800px' }}>
              <button
                onClick={() => setActiveTab('games')}
                style={{
                  flex: 1,
                  padding: '16px 6px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'games' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                  color: activeTab === 'games' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Calendar size={14} />
                Partidos
              </button>
              <button
                onClick={() => setActiveTab('squad')}
                style={{
                  flex: 1,
                  padding: '16px 6px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'squad' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                  color: activeTab === 'squad' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Users size={14} />
                Plantilla
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 40px 16px', boxSizing: 'border-box' }}>
          {loading ? (
            renderSkeleton()
          ) : error ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--danger)', maxWidth: '600px', margin: '0 auto' }}>
              <p>{error}</p>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
              
              {activeTab === 'games' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sortedGames.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>No hay partidos programados o recientes para este equipo.</p>
                    </div>
                  ) : (
                    sortedGames.slice(0, 15).map(game => {
                      const isHome = game.homeCompetitor.id === Number(teamId);
                      const opponent = isHome ? game.awayCompetitor : game.homeCompetitor;
                      const teamScore = isHome ? game.homeCompetitor.score : game.awayCompetitor.score;
                      const oppScore = isHome ? game.awayCompetitor.score : game.homeCompetitor.score;
                      
                      let resultText = '';
                      let resultColor = 'var(--text-muted)';
                      if (game.statusGroup === 4) {
                        if (teamScore > oppScore) {
                          resultText = 'G';
                          resultColor = 'var(--accent-emerald)';
                        } else if (teamScore < oppScore) {
                          resultText = 'P';
                          resultColor = 'var(--danger)';
                        } else {
                          resultText = 'E';
                          resultColor = 'var(--text-secondary)';
                        }
                      }

                      return (
                        <div 
                          key={game.id}
                          className="glass-panel"
                          style={{
                            padding: '14px 20px',
                            borderRadius: '14px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            gap: '12px'
                          }}
                          onClick={() => onOpenModal('match', game.id)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                              {game.competitionDisplayName}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <img 
                                src={getTeamLogo(opponent.id)} 
                                alt={opponent.name} 
                                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                {isHome ? 'vs' : '@'} <span className="hover-underline" onClick={(e) => { e.stopPropagation(); onOpenModal('team', opponent.id); }}>{opponent.name}</span>
                              </strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                {formatGameDate(game.startTime)}
                              </span>
                              {getGameTimeOrScore(game)}
                            </div>
                            
                            {resultText && (
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                background: 'var(--border-color)',
                                border: `1px solid ${resultColor}`,
                                color: resultColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '800'
                              }}>
                                {resultText}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'squad' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {positions.length === 0 || players.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>Plantilla no disponible para este equipo.</p>
                    </div>
                  ) : (
                    positions.filter(pos => playersByPosition[pos.id]?.list.length > 0).map(pos => {
                      const posData = playersByPosition[pos.id];
                      return (
                        <div key={pos.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                            {posData.title}
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                            {posData.list.map(player => (
                              <div 
                                key={player.id}
                                className="glass-panel"
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => onOpenModal('player', player.id)}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} className="hover-underline">
                                    {player.shortName || player.name}
                                  </strong>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {player.nationalityName || 'N/A'}{player.age ? ` • ${player.age} años` : ''}
                                  </span>
                                </div>
                                {player.jerseyNum && (
                                  <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--border-color)', fontFamily: "'Outfit', sans-serif" }}>
                                    #{player.jerseyNum}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </>
  );
}
