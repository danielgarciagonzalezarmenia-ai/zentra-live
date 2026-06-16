import React from 'react';
import { translate } from '../utils/translations';
import { 
  ArrowLeftRight, 
  HelpCircle, 
  MapPin, 
  User, 
  Tv, 
  Trophy, 
  Star, 
  Info 
} from 'lucide-react';

// Eliminado SoccerBallIcon

export default function TimelineTab({ events, members, homeId, awayId, gameDetails, onOpenModal }) {
  // Map player IDs to details
  const membersMap = {};
  (members || []).forEach(m => {
    membersMap[m.id] = m;
  });

  // Helper to determine the key player of each team
  const getKeyPlayer = (teamId, isHome) => {
    // 1. Try to get from topPerformers
    const topPerformers = gameDetails?.game?.topPerformers || [];
    if (topPerformers.length > 0) {
      const playerObj = isHome ? topPerformers[0]?.homePlayer : topPerformers[0]?.awayPlayer;
      if (playerObj?.name) {
        return playerObj.name;
      }
    }
    // 2. Try to get from lineups (starting player with highest ranking)
    const competitor = isHome ? gameDetails?.game?.homeCompetitor : gameDetails?.game?.awayCompetitor;
    const lineupsMembers = competitor?.lineups?.members || [];
    const starters = lineupsMembers.filter(m => m.status === 1 && m.ranking);
    if (starters.length > 0) {
      let bestPlayer = null;
      let maxRanking = 0;
      starters.forEach(m => {
        const rank = parseFloat(m.ranking);
        if (!isNaN(rank) && rank > maxRanking) {
          maxRanking = rank;
          bestPlayer = m;
        }
      });
      if (bestPlayer) {
        const membersList = gameDetails?.game?.members || [];
        const details = membersList.find(member => member.id === bestPlayer.id);
        if (details) {
          return `${details.shortName || details.name} (${bestPlayer.ranking})`;
        }
      }
    }
    // 3. Fallback to first available lineup player
    const firstLineupPlayer = lineupsMembers[0];
    if (firstLineupPlayer) {
      const membersList = gameDetails?.game?.members || [];
      const details = membersList.find(member => member.id === firstLineupPlayer.id);
      if (details) return details.shortName || details.name;
    }
    return 'No disponible';
  };

  // Sort events by gameTime order
  const sortedEvents = events ? [...events].sort((a, b) => a.order - b.order) : [];

  // Helper to render event icon
  const getEventIcon = (event) => {
    const type = event.eventType.name.toLowerCase();
    const subType = event.eventType.subTypeName ? event.eventType.subTypeName.toLowerCase() : '';
    const id = event.eventType.id;

    const isPen = subType.includes('penal');
    const isOG = subType.includes('contra') || subType.includes('own');
    const isMissedPen = type.includes('miss') && type.includes('penal');
    const isPost = type.includes('post') || type.includes('palo') || type.includes('woodwork');
    const isSecondYellow = type.includes('second yellow') || type.includes('doble amarilla');

    if (isOG) {
      return <img src="/icons/events/own-goal.png" alt="Autogol" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (isMissedPen) {
      return <img src="/icons/events/missed-penalty.png" alt="Penal Fallado" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (isPen) {
      return <img src="/icons/events/penalty-goal.png" alt="Gol de Penal" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (id === 1 || type.includes('gol') || type.includes('goal')) {
      return <img src="/icons/events/goal.png" alt="Gol" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (isSecondYellow) {
      return <img src="/icons/events/second-yellow.png" alt="Doble Amarilla" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (type.includes('amarilla') || type.includes('yellow')) {
      return <img src="/icons/events/yellow-card.png" alt="Tarjeta Amarilla" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (type.includes('roja') || type.includes('red')) {
      return <img src="/icons/events/red-card.png" alt="Tarjeta Roja" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (isPost) {
      return <img src="/icons/events/post.png" alt="Palo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    if (id === 1000 || type.includes('sub') || type.includes('sust') || type.includes('change')) {
      return <img src="/icons/events/sub.png" alt="Sustitución" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />;
    }
    
    return <HelpCircle size={16} color="var(--text-muted)" />;
  };

  // Helper to build descriptive text for events
  const getEventContent = (event) => {
    const type = event.eventType.name.toLowerCase();
    const id = event.eventType.id;
    const player = membersMap[event.playerId];
    const playerName = player ? (player.shortName || player.name) : 'Jugador';

    const extraPlayer = event.extraPlayers && event.extraPlayers[0] ? membersMap[event.extraPlayers[0]] : null;
    const extraPlayerName = extraPlayer ? (extraPlayer.shortName || extraPlayer.name) : '';

    if (id === 1 || type.includes('gol') || type.includes('goal')) {
      const isPen = event.eventType.subTypeName && event.eventType.subTypeName.toLowerCase().includes('penal');
      const isOG = event.eventType.subTypeName && event.eventType.subTypeName.toLowerCase().includes('contra');
      return (
        <div>
          <strong 
            onClick={() => event.playerId && onOpenModal('player', event.playerId)}
            style={{ color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
            className="hover-underline"
          >
            {playerName}
          </strong>
          {isPen && <span style={{ fontSize: '10px', color: 'var(--warning)', marginLeft: '4px' }}>(Penal)</span>}
          {isOG && <span style={{ fontSize: '10px', color: 'var(--danger)', marginLeft: '4px' }}>(Autogol)</span>}
          {extraPlayerName && !isOG && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Asist: <span 
                onClick={() => event.extraPlayers && event.extraPlayers[0] && onOpenModal('player', event.extraPlayers[0])}
                style={{ cursor: 'pointer' }}
                className="hover-underline"
              >{extraPlayerName}</span>
            </div>
          )}
        </div>
      );
    }

    if (id === 1000 || type.includes('sub') || type.includes('sust') || type.includes('change')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
            <span style={{ display: 'inline-flex', padding: '2px', background: 'rgba(13,240,163,0.1)', borderRadius: '0' }}>
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </span>
            <span 
              onClick={() => event.playerId && onOpenModal('player', event.playerId)}
              style={{ cursor: 'pointer' }}
              className="hover-underline"
            >
              {playerName || 'Entra'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: '700' }}>
            <span style={{ display: 'inline-flex', padding: '2px', background: 'rgba(239,68,68,0.1)', borderRadius: '0' }}>
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
            <span 
              onClick={() => event.extraPlayers && event.extraPlayers[0] && onOpenModal('player', event.extraPlayers[0])}
              style={{ cursor: event.extraPlayers && event.extraPlayers[0] ? 'pointer' : 'default' }}
              className={event.extraPlayers && event.extraPlayers[0] ? 'hover-underline' : ''}
            >
              {extraPlayerName || 'Sale'}
            </span>
          </div>
        </div>
      );
    }

    // Default card or warning event
    return (
      <div>
        <strong 
          onClick={() => event.playerId && onOpenModal('player', event.playerId)}
          style={{ color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}
          className="hover-underline"
        >
          {playerName}
        </strong>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {translate(event.eventType.name)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 2. Events Timeline */}
      {sortedEvents.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '0' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Línea de tiempo no disponible o sin eventos aún.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', padding: '24px 8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Central Stem Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            backgroundColor: 'var(--border-color)',
            zIndex: 1
          }} />

          {sortedEvents.map((event, idx) => {
            const isHome = event.competitorId === homeId;
            const gameTimeStr = event.gameTimeDisplay || `${event.gameTime}'`;

            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  width: '100%', 
                  alignItems: 'center', 
                  position: 'relative', 
                  zIndex: 2 
                }}
              >
                {/* Home Side Event (Left) */}
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  paddingRight: '16px',
                  textAlign: 'right',
                  opacity: isHome ? 1 : 0,
                  pointerEvents: isHome ? 'auto' : 'none'
                }}>
                  {isHome && (
                    <div className="glass-panel" style={{ padding: '10px 14px', border: '1px solid var(--border-color)', maxWidth: '80%', borderRadius: '0' }}>
                      {getEventContent(event)}
                    </div>
                  )}
                </div>

                {/* Time Indicator (Center Circle) */}
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '0', 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '2px solid rgba(255, 255, 255, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  zIndex: 3
                }}>
                  {getEventIcon(event)}
                </div>

                {/* Away Side Event (Right) */}
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  justifyContent: 'flex-start', 
                  paddingLeft: '16px',
                  textAlign: 'left',
                  opacity: isHome ? 0 : 1,
                  pointerEvents: isHome ? 'none' : 'auto'
                }}>
                  {!isHome && (
                    <div className="glass-panel" style={{ padding: '10px 14px', border: '1px solid var(--border-color)', maxWidth: '80%', borderRadius: '0' }}>
                      {getEventContent(event)}
                    </div>
                  )}
                </div>

                {/* Floating Minute Tag */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: isHome ? 'calc(50% + 24px)' : 'auto',
                  right: !isHome ? 'calc(50% + 24px)' : 'auto',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: '800',
                  color: 'var(--accent-emerald)',
                  background: 'var(--bg-primary)',
                  padding: '2px 6px',
                  borderRadius: '0',
                  border: '1px solid var(--border-color)',
                  pointerEvents: 'none',
                  zIndex: 4
                }}>
                  {gameTimeStr}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 1. Styled Summary Card */}
      {gameDetails?.game && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-color)', borderRadius: '0', background: 'rgba(255, 255, 255, 0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Info size={16} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Detalles del Encuentro</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* Estadio */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(13,240,163,0.06)', borderRadius: '0', color: 'var(--accent-emerald)' }}>
                <MapPin size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estadio</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {gameDetails.game.venue?.name || 'No disponible'}
                </span>
                {gameDetails.game.venue?.capacity && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Capacidad: {gameDetails.game.venue.capacity.toLocaleString()}
                  </span>
                )}
                {gameDetails.game.venue?.attendance && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                    Asistencia: {gameDetails.game.venue.attendance.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Arbitro */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(56,189,248,0.06)', borderRadius: '0', color: 'var(--accent-blue)' }}>
                <User size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Árbitro</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {gameDetails.game.officials?.[0]?.name || 'Por definir'}
                </span>
              </div>
            </div>

            {/* Dónde Ver */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(234,179,8,0.06)', borderRadius: '0', color: '#eab308' }}>
                <Tv size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transmisión</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {gameDetails.game.tvNetworks && gameDetails.game.tvNetworks.length > 0 ? (
                    gameDetails.game.tvNetworks.map(tv => (
                      <span key={tv.id} style={{ background: 'var(--border-color)', padding: '2px 8px', borderRadius: '0', fontSize: '10px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: '600' }}>
                        {tv.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No disponible</span>
                  )}
                </div>
              </div>
            </div>

            {/* Posición Tabla / Grupo */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(239,68,68,0.06)', borderRadius: '0', color: '#ef4444' }}>
                <Trophy size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Posiciones</span>
                {gameDetails.game.groupName && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                    {gameDetails.game.groupName}
                  </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span 
                      onClick={() => onOpenModal('team', gameDetails.game.homeCompetitor.id)}
                      style={{ cursor: 'pointer', fontWeight: '600' }}
                      className="hover-underline"
                    >
                      {gameDetails.game.homeCompetitor?.name}
                    </span>: <strong style={{ color: 'var(--text-primary)' }}>
                      {gameDetails.game.homeCompetitor?.rankings?.[0]?.position 
                        ? `#${gameDetails.game.homeCompetitor.rankings[0].position} (${gameDetails.game.homeCompetitor.rankings[0].name})` 
                        : 'N/A'}
                    </strong>
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span 
                      onClick={() => onOpenModal('team', gameDetails.game.awayCompetitor.id)}
                      style={{ cursor: 'pointer', fontWeight: '600' }}
                      className="hover-underline"
                    >
                      {gameDetails.game.awayCompetitor?.name}
                    </span>: <strong style={{ color: 'var(--text-primary)' }}>
                      {gameDetails.game.awayCompetitor?.rankings?.[0]?.position 
                        ? `#${gameDetails.game.awayCompetitor.rankings[0].position} (${gameDetails.game.awayCompetitor.rankings[0].name})` 
                        : 'N/A'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Jugador Clave */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
              <div style={{ padding: '8px', background: 'rgba(6,182,212,0.06)', borderRadius: '0', color: 'var(--accent-cyan)' }}>
                <Star size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jugadores Destacados</span>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--border-color)', padding: '6px 12px', borderRadius: '0', border: '1px solid var(--border-color)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '0', background: 'var(--accent-emerald)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{gameDetails.game.homeCompetitor?.name}:</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{getKeyPlayer(gameDetails.game.homeCompetitor?.id, true)}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--border-color)', padding: '6px 12px', borderRadius: '0', border: '1px solid var(--border-color)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '0', background: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{gameDetails.game.awayCompetitor?.name}:</span>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{getKeyPlayer(gameDetails.game.awayCompetitor?.id, false)}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
