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
      {/* Team Info (Left/Right) & Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {competitionName}
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Home Team */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={getTeamLogo(home.id)} 
                alt={home.name} 
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitors:default1.png/competitors/default1'; }}
              />
              <span style={{ fontSize: '15px', fontWeight: home.isWinner ? '700' : '500', color: home.isWinner ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {home.name}
              </span>
            </div>
            {home.score !== -1 && (
              <span style={{ fontSize: '16px', fontWeight: '800', color: home.isWinner ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                {home.score}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={getTeamLogo(away.id)} 
                alt={away.name} 
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitors:default1.png/competitors/default1'; }}
              />
              <span style={{ fontSize: '15px', fontWeight: away.isWinner ? '700' : '500', color: away.isWinner ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {away.name}
              </span>
            </div>
            {away.score !== -1 && (
              <span style={{ fontSize: '16px', fontWeight: '800', color: away.isWinner ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                {away.score}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Match Clock / Time / Status Indicator (Right) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-end', 
        justifyContent: 'center',
        paddingLeft: '20px',
        borderLeft: '1px solid var(--border-color)',
        minWidth: '70px'
      }}>
        {isLive && (
          <span style={{ 
            fontSize: '9px', 
            fontWeight: '800', 
            color: 'var(--accent-emerald)', 
            letterSpacing: '1px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: '4px',
            textTransform: 'uppercase'
          }}>
            <span className="live-dot" />
            Vivo
          </span>
        )}
        <span style={{ 
          fontSize: isLive ? '18px' : '14px', 
          fontWeight: '800', 
          color: isLive ? 'var(--accent-emerald)' : (isFinished ? 'var(--text-muted)' : 'var(--text-secondary)'),
          fontFamily: "'Outfit', sans-serif"
        }}>
          {getGameTime()}
        </span>
      </div>
    </div>
  );
}
