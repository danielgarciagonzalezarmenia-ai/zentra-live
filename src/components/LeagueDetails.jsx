import React, { useState, useEffect } from 'react';
import { Trophy, BarChart3, HelpCircle } from 'lucide-react';
import axios from 'axios';

export default function LeagueDetails({ leagueId, onClose, onClear, onOpenModal }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [standingsData, setStandingsData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings', 'stats'

  useEffect(() => {
    if (!leagueId) return;

    const fetchLeagueData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [standingsRes, statsRes] = await Promise.all([
          axios.get(`http://${window.location.hostname}:5000/api/competition/${leagueId}/standings`),
          axios.get(`http://${window.location.hostname}:5000/api/competition/${leagueId}/stats`).catch(() => ({ data: { stats: {} } }))
        ]);
        setStandingsData(standingsRes.data);
        setStatsData(statsRes.data);
      } catch (err) {
        console.error('Error fetching league details:', err);
        setError('No se pudieron cargar las clasificaciones de este torneo.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId]);

  if (!leagueId) return null;

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div className="skeleton" style={{ height: '80px', width: '100%' }} />
      <div className="skeleton" style={{ height: '40px', width: '200px' }} />
      <div className="skeleton" style={{ height: '300px', width: '100%' }} />
    </div>
  );

  const getTeamLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_64,h_64,c_limit,q_auto:eco,d_competitors:default1.png/competitors/${id}`;
  };

  const getLeagueLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_128,h_128,c_limit,q_auto:eco,d_competitions:default1.png/competitions/${id}`;
  };

  const competition = standingsData?.competitions?.find(c => c.id === Number(leagueId)) || 
                      statsData?.competitions?.find(c => c.id === Number(leagueId)) || 
                      (standingsData?.standings?.[0] ? { name: standingsData.standings[0].displayName || 'Liga' } : { name: 'Competición' });

  const standingsObj = standingsData?.standings?.[0];
  const groups = standingsObj?.groups || [];
  const rows = standingsObj?.rows || [];
  const destinations = standingsObj?.destinations || [];

  // Group rows by groupNum if groups are defined
  const groupMap = {};
  if (groups.length > 0) {
    groups.forEach(g => {
      groupMap[g.num] = {
        name: g.name,
        rows: []
      };
    });
    rows.forEach(r => {
      if (groupMap[r.groupNum]) {
        groupMap[r.groupNum].rows.push(r);
      }
    });
  }

  // Sort rows in each group by position
  Object.keys(groupMap).forEach(k => {
    groupMap[k].rows.sort((a, b) => a.position - b.position);
  });

  const sortedSingleTableRows = [...rows].sort((a, b) => a.position - b.position);

  // Stats
  const athletesStats = statsData?.stats?.athletesStats || [];

  const getDestinationStyle = (destNum) => {
    const dest = destinations.find(d => d.num === destNum);
    if (!dest) return null;
    return {
      borderLeft: `3px solid ${dest.color || 'var(--accent-cyan)'}`,
      title: dest.name
    };
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClear} />
      <div className="drawer-content">
        
        {/* Header */}
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          background: 'linear-gradient(180deg, rgba(15, 22, 38, 0.4) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <button 
              onClick={onClose}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(255,255,255,0.02)', 
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

          {competition && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <img 
                src={getLeagueLogo(leagueId)} 
                alt={competition.name} 
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitions:default1.png/competitions/default1'; }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  {competition.name || competition.longName}
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px' }}>
                  {competition.tableName || 'Clasificaciones'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        {!loading && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', background: 'rgba(15,22,38,0.3)' }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '800px' }}>
              <button
                onClick={() => setActiveTab('standings')}
                style={{
                  flex: 1,
                  padding: '16px 6px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'standings' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                  color: activeTab === 'standings' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Trophy size={14} />
                Clasificación
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                style={{
                  flex: 1,
                  padding: '16px 6px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'stats' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                  color: activeTab === 'stats' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <BarChart3 size={14} />
                Estadísticas
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
              
              {activeTab === 'standings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {groups.length > 0 ? (
                    // Render Groups (e.g. World Cup)
                    Object.keys(groupMap).map(gNum => {
                      const group = groupMap[gNum];
                      return (
                        <div key={gNum} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-emerald)', margin: 0 }}>
                            {group.name}
                          </h3>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>
                                  <th style={{ padding: '8px 4px', width: '30px' }}>#</th>
                                  <th style={{ padding: '8px 4px' }}>Equipo</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px' }}>PJ</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '30px' }}>PG</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '30px' }}>PE</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '30px' }}>PP</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px' }}>DG</th>
                                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px', color: 'var(--text-primary)' }}>Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.rows.map(row => {
                                  const destStyle = getDestinationStyle(row.destinationNum);
                                  return (
                                    <tr 
                                      key={row.competitor.id} 
                                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}
                                    >
                                      <td style={{ padding: '10px 4px', color: 'var(--text-muted)', fontWeight: '700', ...destStyle }}>
                                        {row.position}
                                      </td>
                                      <td 
                                        onClick={() => onOpenModal('team', row.competitor.id)}
                                        style={{ padding: '10px 4px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                      >
                                        <img 
                                          src={getTeamLogo(row.competitor.id)} 
                                          alt={row.competitor.name} 
                                          style={{ width: '18px', height: '18px', objectFit: 'contain' }} 
                                          onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitors:default1.png/competitors/default1'; }}
                                        />
                                        <span className="hover-underline">{row.competitor.name}</span>
                                      </td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.gamePlayed}</td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesWon}</td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesEven}</td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesLost}</td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: row.ratio > 0 ? 'var(--accent-emerald)' : (row.ratio < 0 ? 'var(--danger)' : 'var(--text-muted)'), fontWeight: '600' }}>
                                        {row.ratio > 0 ? `+${row.ratio}` : row.ratio}
                                      </td>
                                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--accent-emerald)', fontWeight: '800' }}>{row.points}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Render Single Table (e.g. League)
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>
                              <th style={{ padding: '8px 4px', width: '30px' }}>#</th>
                              <th style={{ padding: '8px 4px' }}>Equipo</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px' }}>PJ</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px' }}>PG</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px' }}>PE</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px' }}>PP</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '45px' }}>GF-GC</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px' }}>DG</th>
                              <th style={{ padding: '8px 4px', textAlign: 'center', width: '40px', color: 'var(--text-primary)' }}>Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedSingleTableRows.map(row => {
                              const destStyle = getDestinationStyle(row.destinationNum);
                              return (
                                <tr 
                                  key={row.competitor.id} 
                                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px' }}
                                >
                                  <td style={{ padding: '12px 4px', color: 'var(--text-muted)', fontWeight: '700', ...destStyle }}>
                                    {row.position}
                                  </td>
                                  <td 
                                    onClick={() => onOpenModal('team', row.competitor.id)}
                                    style={{ padding: '12px 4px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                  >
                                    <img 
                                      src={getTeamLogo(row.competitor.id)} 
                                      alt={row.competitor.name} 
                                      style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                      onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitors:default1.png/competitors/default1'; }}
                                    />
                                    <span className="hover-underline">{row.competitor.name}</span>
                                  </td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.gamePlayed}</td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesWon}</td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesEven}</td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.gamesLost}</td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.for}-{row.against}</td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: row.ratio > 0 ? 'var(--accent-emerald)' : (row.ratio < 0 ? 'var(--danger)' : 'var(--text-muted)'), fontWeight: '600' }}>
                                    {row.ratio > 0 ? `+${row.ratio}` : row.ratio}
                                  </td>
                                  <td style={{ padding: '12px 4px', textAlign: 'center', color: 'var(--accent-emerald)', fontWeight: '800' }}>{row.points}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Destinations Legend */}
                  {destinations.length > 0 && (
                    <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zonas de Clasificación</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        {destinations.map(dest => (
                          <div key={dest.num} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dest.color }} />
                            <span>{dest.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {athletesStats.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>Estadísticas no disponibles para este torneo.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {athletesStats.slice(0, 6).map((category, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-cyan)', margin: 0, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                            {category.name}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {category.rows?.slice(0, 5).map((row, rIdx) => (
                              <div 
                                key={row.entity.id} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: rIdx < 4 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', width: '15px' }}>{rIdx + 1}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong 
                                      onClick={() => onOpenModal('player', row.entity.id)}
                                      style={{ color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}
                                      className="hover-underline"
                                    >
                                      {row.entity.shortName || row.entity.name}
                                    </strong>
                                    <span 
                                      onClick={() => row.entity.competitorId && onOpenModal('team', row.entity.competitorId)}
                                      style={{ fontSize: '10px', color: 'var(--text-muted)', cursor: row.entity.competitorId ? 'pointer' : 'default' }}
                                      className={row.entity.competitorId ? 'hover-underline' : ''}
                                    >
                                      {row.entity.competitorName || 'Equipo'}
                                    </span>
                                  </div>
                                </div>
                                <strong style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                                  {row.stats?.[0]?.value || row.value}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
