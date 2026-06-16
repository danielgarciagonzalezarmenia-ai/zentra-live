import React from 'react';

export default function MatchCard({ game, competitionName, onClick }) {
  const home = game.homeCompetitor;
  const away = game.awayCompetitor;

  // Helper for team logo CDN URLs
  const getTeamLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_96,h_96,c_limit,q_auto:eco,d_competitors:default1.png/competitors/${id}`;
  };

  // Mapeo de estados de partidos según 365Scores
  const isLive = game.statusGroup === 3;
  const isScheduled = game.statusGroup === 1 || game.statusGroup === 2;
  const isFinished = game.statusGroup === 4;

  // Parse game time or start time
  const getGameTime = () => {
    if (isLive) {
      if (game.gameTime > 0) return `${game.gameTime}'`;
      return game.gameTimeDisplay || game.shortStatusText || 'En vivo';
    }
    if (isFinished) {
      if (game.statusText === 'Finalizado' || game.shortStatusText === 'Final' || game.shortStatusText === 'Fin') {
        return 'FIN';
      }
      return game.statusText || 'FIN'; // Mostrará "Cancelado", "Aplazado", "Suspendido"
    }
    if (isScheduled) {
      // Get hour and minute from startTime (ISO string format)
      try {
        const date = new Date(game.startTime);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
        return game.statusText || 'Prog.';
      }
    }
    return game.statusText || 'Prog.';
  };

  return (
    <div 
      className={`glass-panel match-card-item ${isLive ? 'live' : ''}`}
      onClick={() => onClick(game.id)}
      style={{
        padding: '16px 20px',
        margin: '0 16px 12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      {/* Horizontal Layout for Match Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', position: 'relative' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
          {competitionName}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
          
          {/* Home Team (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: home.isWinner ? '700' : '500', color: home.isWinner ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {home.name}
            </span>
            <img 
              src={getTeamLogo(home.id)} 
              alt={home.name} 
              style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* Center (Score or Time) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '70px', padding: '0 8px' }}>
             {(isLive || isFinished) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: '800', color: isLive ? 'var(--accent-emerald)' : 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                   <span>{home.score !== -1 ? home.score : '-'}</span>
                   <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>-</span>
                   <span>{away.score !== -1 ? away.score : '-'}</span>
                </div>
             ) : (
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>
                  {getGameTime()}
                </div>
             )}
             
             {isLive && (
                <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="live-dot" style={{ width: '4px', height: '4px' }} />
                  {getGameTime()}
                </span>
             )}
             {isFinished && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>{getGameTime()}</span>
             )}
          </div>

          {/* Away Team (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
            <img 
              src={getTeamLogo(away.id)} 
              alt={away.name} 
              style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span style={{ fontSize: '14px', fontWeight: away.isWinner ? '700' : '500', color: away.isWinner ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {away.name}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
