import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function PreMatchStats({ gameId, homeCompetitor, awayCompetitor }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!gameId || !homeCompetitor || !awayCompetitor) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/game/${gameId}/prematch-stats`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching pre-match stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [gameId, homeCompetitor, awayCompetitor]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-emerald)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!data || !data.statistics || data.statistics.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Activity size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Estadísticas no disponibles</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Aún no hay datos pre-partido suficientes para este encuentro.</p>
      </div>
    );
  }

  // Group statistics by ID to match home and away
  const statsById = {};
  data.statistics.forEach(stat => {
    if (!statsById[stat.id]) {
      statsById[stat.id] = { id: stat.id, name: stat.name, group: stat.statisticGroup, home: null, away: null };
    }
    if (stat.competitorId === homeCompetitor.id) {
      statsById[stat.id].home = stat;
    } else if (stat.competitorId === awayCompetitor.id) {
      statsById[stat.id].away = stat;
    }
  });

  const statsList = Object.values(statsById).filter(s => s.home && s.away);

  const group1Stats = statsList.filter(s => s.group === 1);
  const group2Stats = statsList.filter(s => s.group === 2);

  const parsePct = (val) => {
    if (!val) return 0;
    const match = val.match(/\((\d+)%\)/);
    if (match) return parseInt(match[1], 10);
    return 0;
  };

  const StatRowBar = ({ label, homeVal, awayVal }) => {
    const homePct = parsePct(homeVal);
    const awayPct = parsePct(awayVal);
    const isHomeGreater = homePct > awayPct;
    const isAwayGreater = awayPct > homePct;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
             <span style={{ fontSize: '15px', fontWeight: isHomeGreater ? '800' : '600', color: isHomeGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {homeVal}
             </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', flex: 1.5, padding: '0 8px' }}>
            {label}
          </span>
          <div style={{ textAlign: 'right', flex: 1 }}>
             <span style={{ fontSize: '15px', fontWeight: isAwayGreater ? '800' : '600', color: isAwayGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {awayVal}
             </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* Home Bar */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
            <div style={{ 
              width: `${homePct}%`, 
              background: isHomeGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          {/* Away Bar */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
            <div style={{ 
              width: `${awayPct}%`, 
              background: isAwayGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>
    );
  };

  const StatRowPlain = ({ label, homeVal, awayVal }) => {
    const hNum = parseFloat(homeVal) || 0;
    const aNum = parseFloat(awayVal) || 0;
    const isHomeGreater = hNum > aNum;
    const isAwayGreater = aNum > hNum;

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ textAlign: 'left', flex: 1 }}>
           <span style={{ fontSize: '15px', fontWeight: isHomeGreater ? '800' : '600', color: isHomeGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {homeVal}
           </span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', flex: 1.5, padding: '0 8px' }}>
          {label}
        </span>
        <div style={{ textAlign: 'right', flex: 1 }}>
           <span style={{ fontSize: '15px', fontWeight: isAwayGreater ? '800' : '600', color: isAwayGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {awayVal}
           </span>
        </div>
      </div>
    );
  };

  const homeText = data.statisticGamesPlayed?.homeText || '';
  const awayText = data.statisticGamesPlayed?.awayText || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Grupo 1: Todas las competiciones (Porcentajes) */}
      {group1Stats.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{homeText}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>Todas las competiciones</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{awayText}</span>
          </div>

          {group1Stats.map(stat => (
            <StatRowBar 
              key={stat.id}
              label={stat.name}
              homeVal={stat.home.value}
              awayVal={stat.away.value}
            />
          ))}
        </div>
      )}

      {/* Grupo 2: Estadísticas promedio (Números crudos) */}
      {group2Stats.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>Estadísticas promedio</span>
          </div>

          {group2Stats.map(stat => (
            <StatRowPlain 
              key={stat.id}
              label={stat.name}
              homeVal={stat.home.value}
              awayVal={stat.away.value}
            />
          ))}
        </div>
      )}

    </div>
  );
}
