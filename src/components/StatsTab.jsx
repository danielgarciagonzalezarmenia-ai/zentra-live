import React from 'react';
import { Activity } from 'lucide-react';

export default function StatsTab({ statsList, homeId, awayId }) {
  
  if (!statsList || statsList.length === 0 || !statsList[0].statistics) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <Activity size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Sin estadísticas</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Las estadísticas de este partido aún no están disponibles.</p>
      </div>
    );
  }

  const statistics = statsList[0].statistics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      {statistics.map((stat, index) => {
        // Extraer números si el valor viene como string con porcentaje (ej: "40%")
        const cleanHomeVal = typeof stat.homeValue === 'string' ? stat.homeValue.replace('%', '') : stat.homeValue;
        const cleanAwayVal = typeof stat.awayValue === 'string' ? stat.awayValue.replace('%', '') : stat.awayValue;

        const homeVal = parseFloat(cleanHomeVal) || 0;
        const awayVal = parseFloat(cleanAwayVal) || 0;
        const total = homeVal + awayVal;
        
        let homePercentage = 50;
        let awayPercentage = 50;
        
        if (total > 0) {
          homePercentage = (homeVal / total) * 100;
          awayPercentage = (awayVal / total) * 100;
        }

        const isHomeGreater = homeVal > awayVal;
        const isAwayGreater = awayVal > homeVal;

        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: isHomeGreater ? '800' : '600', color: isHomeGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {stat.homeValue}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.name}
              </span>
              <span style={{ fontSize: '14px', fontWeight: isAwayGreater ? '800' : '600', color: isAwayGreater ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {stat.awayValue}
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
              {/* Home Bar */}
              <div style={{ 
                width: `${homePercentage}%`, 
                background: isHomeGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
                transition: 'width 0.5s ease',
                borderRight: '2px solid var(--bg-card)'
              }} />
              {/* Away Bar */}
              <div style={{ 
                width: `${awayPercentage}%`, 
                background: isAwayGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
