import React, { useState } from 'react';

export default function LineupPitch({ gameDetails, onOpenModal }) {
  const homeLineup = gameDetails.game?.homeCompetitor?.lineups;
  const awayLineup = gameDetails.game?.awayCompetitor?.lineups;
  const members = gameDetails.game?.members || [];

  if (!homeLineup || !awayLineup || !homeLineup.members || !awayLineup.members) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Alineaciones no disponibles para este partido.</p>
      </div>
    );
  }

  const homeId = gameDetails.game?.homeCompetitor?.id;
  const awayId = gameDetails.game?.awayCompetitor?.id;
  const [selectedTeamId, setSelectedTeamId] = useState(homeId);

  // Create a quick map of player IDs to their details (jersey number, name)
  const membersMap = {};
  members.forEach(m => {
    membersMap[m.id] = m;
  });

  // Filter starters (status === 1), substitutes (status === 2) and coaches (status === 4)
  const homeStarters = homeLineup.members.filter(m => m.status === 1);
  const homeSubs = homeLineup.members.filter(m => m.status === 2);
  const homeCoach = homeLineup.members.find(m => m.status === 4);
  const homeCoachName = homeCoach ? (membersMap[homeCoach.id]?.name || membersMap[homeCoach.id]?.shortName) : null;
  
  const awayStarters = awayLineup.members.filter(m => m.status === 1);
  const awaySubs = awayLineup.members.filter(m => m.status === 2);
  const awayCoach = awayLineup.members.find(m => m.status === 4);
  const awayCoachName = awayCoach ? (membersMap[awayCoach.id]?.name || membersMap[awayCoach.id]?.shortName) : null;

  // Helper to calculate CSS absolute positions for home team (defends bottom, attacks top, spread across whole pitch)
  const getHomePlayerPosition = (yard) => {
    if (!yard) return { left: '50%', top: '90%' };
    // Compress left coordinate between 6% and 94% to avoid players getting cut off at the side borders
    const left = 6 + (yard.fieldSide * 0.88);
    // Map yard.fieldLine (0 to 100) across the entire pitch height: 10% (opponent goal) to 92% (own GK)
    const top = 92 - (yard.fieldLine * 0.82);
    return { left: `${left}%`, top: `${top}%` };
  };

  // Helper to calculate CSS absolute positions for away team (defends top, attacks bottom, spread across whole pitch)
  const getAwayPlayerPosition = (yard) => {
    if (!yard) return { left: '50%', top: '10%' };
    // Mirrored horizontally so left-wingers are on the left, etc.
    const rawLeft = 100 - yard.fieldSide;
    // Compress left coordinate between 6% and 94% to avoid players getting cut off at the side borders
    const left = 6 + (rawLeft * 0.88);
    // Map yard.fieldLine (0 to 100) across the entire pitch height: 8% (own GK) to 90% (opponent goal)
    const top = 8 + (yard.fieldLine * 0.82);
    return { left: `${left}%`, top: `${top}%` };
  };

  const renderStartersOnPitch = () => {
    return (
      <div className="soccer-pitch-container">
        <div className="pitch-lines">
          <div className="pitch-midline" />
          <div className="pitch-midcircle" />
          <div className="pitch-penalty-area-top" />
          <div className="pitch-penalty-area-bottom" />
          <div className="pitch-goal-area-top" />
          <div className="pitch-goal-area-bottom" />
          <div className="pitch-goal-top" />
          <div className="pitch-goal-bottom" />
        </div>

        {/* Home Players */}
        {selectedTeamId === homeId && homeStarters.map((player) => {
          const details = membersMap[player.id] || {};
          const isGK = player.position?.id === 1;
          const pos = getHomePlayerPosition(player.yardFormation);
          
          return (
            <div 
              key={player.id} 
              className="player-node" 
              style={{ left: pos.left, top: pos.top, cursor: 'pointer' }}
              title={`${details.name || 'Player'} (${player.position?.name || ''})`}
              onClick={() => onOpenModal('player', player.id)}
            >
              <div className={`player-jersey ${isGK ? 'goalkeeper' : ''}`}>
                {details.jerseyNumber || ''}
              </div>
              <span className="player-name hover-underline">{details.shortName || details.name || 'Player'}</span>
              {player.ranking && (
                <span style={{ fontSize: '7px', fontWeight: '800', background: 'rgba(0,0,0,0.6)', padding: '0 2px', borderRadius: '2px', color: 'var(--accent-emerald)', marginTop: '1px' }}>
                  {player.ranking}
                </span>
              )}
            </div>
          );
        })}

        {/* Away Players */}
        {selectedTeamId === awayId && awayStarters.map((player) => {
          const details = membersMap[player.id] || {};
          const isGK = player.position?.id === 1;
          const pos = getAwayPlayerPosition(player.yardFormation);
          
          return (
            <div 
              key={player.id} 
              className="player-node" 
              style={{ left: pos.left, top: pos.top, cursor: 'pointer' }}
              title={`${details.name || 'Player'} (${player.position?.name || ''})`}
              onClick={() => onOpenModal('player', player.id)}
            >
              <div className={`player-jersey away ${isGK ? 'goalkeeper' : ''}`}>
                {details.jerseyNumber || ''}
              </div>
              <span className="player-name hover-underline">{details.shortName || details.name || 'Player'}</span>
              {player.ranking && (
                <span style={{ fontSize: '7px', fontWeight: '800', background: 'rgba(0,0,0,0.6)', padding: '0 2px', borderRadius: '2px', color: 'var(--accent-emerald)', marginTop: '1px' }}>
                  {player.ranking}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }} className="lineups-split-container">
      
      {/* Left Column: Pitch & Formations */}
      <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Selector de Equipo */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setSelectedTeamId(homeId)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: selectedTeamId === homeId ? 'rgba(13,240,163,0.1)' : 'transparent',
              color: selectedTeamId === homeId ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            {gameDetails.game?.homeCompetitor?.name}
          </button>
          <button
            onClick={() => setSelectedTeamId(awayId)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: selectedTeamId === awayId ? 'rgba(13,202,240,0.1)' : 'transparent',
              color: selectedTeamId === awayId ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            {gameDetails.game?.awayCompetitor?.name}
          </button>
        </div>

        {/* Formations & Coaches Header */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Formación táctica</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
              {selectedTeamId === homeId ? (homeLineup.formation || 'N/A') : (awayLineup.formation || 'N/A')}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Director Técnico</span>
            <strong 
              onClick={() => {
                const coach = selectedTeamId === homeId ? homeCoach : awayCoach;
                if (coach) onOpenModal('player', coach.id);
              }}
              style={{ color: selectedTeamId === homeId ? 'var(--accent-emerald)' : 'var(--accent-cyan)', fontSize: '13px', cursor: (selectedTeamId === homeId ? homeCoach : awayCoach) ? 'pointer' : 'default' }}
              className={(selectedTeamId === homeId ? homeCoach : awayCoach) ? 'hover-underline' : ''}
            >
              {selectedTeamId === homeId ? (homeCoachName || 'No disponible') : (awayCoachName || 'No disponible')}
            </strong>
          </div>
        </div>

        {/* Pitch */}
        {renderStartersOnPitch()}
      </div>

      {/* Right Column: Bench / Substitutes */}
      <div style={{ 
        flex: '1', 
        minWidth: '300px', 
        background: 'rgba(255,255,255,0.01)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '16px', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        boxSizing: 'border-box'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          color: 'var(--text-primary)', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '10px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px', 
          margin: 0,
          fontWeight: '700'
        }}>
          Banquillo de Suplentes
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedTeamId === homeId ? (
            <div>
              <h5 style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', fontWeight: '700' }}>
                {gameDetails.game?.homeCompetitor?.name}
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {homeSubs.map(s => {
                  const details = membersMap[s.id] || {};
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => onOpenModal('player', s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      className="hover-underline"
                    >
                      <span style={{ minWidth: '20px', fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)' }}>
                        #{details.jerseyNumber || ''}
                      </span>
                      <span>{details.shortName || details.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {s.position?.shortName ? `(${s.position.shortName})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h5 style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', fontWeight: '700' }}>
                {gameDetails.game?.awayCompetitor?.name}
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {awaySubs.map(s => {
                  const details = membersMap[s.id] || {};
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => onOpenModal('player', s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      className="hover-underline"
                    >
                      <span style={{ minWidth: '20px', fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)' }}>
                        #{details.jerseyNumber || ''}
                      </span>
                      <span>{details.shortName || details.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {s.position?.shortName ? `(${s.position.shortName})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
