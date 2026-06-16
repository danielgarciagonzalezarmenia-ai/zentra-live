import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function PreMatchStats({ homeCompetitor, awayCompetitor }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!homeCompetitor || !awayCompetitor) return;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const [homeRes, awayRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/competitor/${homeCompetitor.id}/games`),
          axios.get(`${API_BASE_URL}/api/competitor/${awayCompetitor.id}/games`)
        ]);

        const homeData = homeRes.data;
        const awayData = awayRes.data;

        const homeGames = (homeData.games || []).filter(g => g.statusGroup === 4 || g.statusGroup === 3);
        const awayGames = (awayData.games || []).filter(g => g.statusGroup === 4 || g.statusGroup === 3);

        // Calculate stats using last 16 games (or less if not available)
        const computeStats = (games, teamId) => {
          const recent = games.slice(-16);
          let wins = 0;
          let btts = 0;
          let over25 = 0;
          let firstToScore = 0;

          recent.forEach(g => {
            const isHome = g.homeCompetitor.id === teamId;
            const myScore = isHome ? g.homeCompetitor.score : g.awayCompetitor.score;
            const oppScore = isHome ? g.awayCompetitor.score : g.homeCompetitor.score;
            
            if (myScore > oppScore) wins++;
            if (myScore > 0 && oppScore > 0) btts++;
            if ((myScore + oppScore) > 2.5) over25++;
            // We can't know who scored first exactly without events, so we skip or estimate
          });

          return {
            total: recent.length,
            wins,
            btts,
            over25,
            winPct: recent.length > 0 ? Math.round((wins / recent.length) * 100) : 0,
            bttsPct: recent.length > 0 ? Math.round((btts / recent.length) * 100) : 0,
            over25Pct: recent.length > 0 ? Math.round((over25 / recent.length) * 100) : 0
          };
        };

        const homeStats = computeStats(homeGames, homeCompetitor.id);
        const awayStats = computeStats(awayGames, awayCompetitor.id);

        setStats({ home: homeStats, away: awayStats });
      } catch (error) {
        console.error("Error fetching games for stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [homeCompetitor, awayCompetitor]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-emerald)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!stats || stats.home.total === 0 || stats.away.total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Activity size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Sin suficientes datos</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No hay suficientes partidos previos para mostrar estadísticas.</p>
      </div>
    );
  }

  const StatRow = ({ label, homeVal, homePct, awayVal, awayPct, homeTotal, awayTotal }) => {
    const isHomeGreater = homePct > awayPct;
    const isAwayGreater = awayPct > homePct;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
             <span style={{ fontSize: '15px', fontWeight: isHomeGreater ? '800' : '600', color: isHomeGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {homeVal} ({homePct}%)
             </span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', flex: 1 }}>
            {label}
          </span>
          <div style={{ textAlign: 'right', flex: 1 }}>
             <span style={{ fontSize: '15px', fontWeight: isAwayGreater ? '800' : '600', color: isAwayGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {awayVal} ({awayPct}%)
             </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          <div style={{ 
            width: `${homePct}%`, 
            background: isHomeGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
            transition: 'width 0.5s ease',
            borderRight: '2px solid var(--bg-card)'
          }} />
          <div style={{ width: `${100 - homePct}%`, background: 'transparent' }} />
        </div>
        
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)', marginTop: '-4px' }}>
          <div style={{ width: `${100 - awayPct}%`, background: 'transparent', borderRight: '2px solid var(--bg-card)' }} />
          <div style={{ 
            width: `${awayPct}%`, 
            background: isAwayGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Últimos {stats.home.total} partidos</span>
        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>Todas las competiciones</span>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Últimos {stats.away.total} partidos</span>
      </div>

      <StatRow 
        label="Partidos ganados"
        homeVal={stats.home.wins} homePct={stats.home.winPct} homeTotal={stats.home.total}
        awayVal={stats.away.wins} awayPct={stats.away.winPct} awayTotal={stats.away.total}
      />

      <StatRow 
        label="Ambos equipos marcaron"
        homeVal={stats.home.btts} homePct={stats.home.bttsPct} homeTotal={stats.home.total}
        awayVal={stats.away.btts} awayPct={stats.away.bttsPct} awayTotal={stats.away.total}
      />

      <StatRow 
        label="Más de 2.5 goles"
        homeVal={stats.home.over25} homePct={stats.home.over25Pct} homeTotal={stats.home.total}
        awayVal={stats.away.over25} awayPct={stats.away.over25Pct} awayTotal={stats.away.total}
      />
      
    </div>
  );
}
