import React from 'react';

export default function StatsTab({ statsList, homeId, awayId }) {
  if (!statsList || statsList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Estadísticas no disponibles para este partido.</p>
      </div>
    );
  }

  // Group stats by name to pair home and away values
  const groupedMap = {};
  statsList.forEach(item => {
    const key = item.name;
    if (!groupedMap[key]) {
      groupedMap[key] = {
        name: item.name,
        homeValue: '0',
        awayValue: '0',
        homePercent: 0.5,
        awayPercent: 0.5
      };
    }

    // Convert values like "65%" or "4.22" to numbers for percentage bars
    const cleanVal = item.value.replace('%', '');
    const numVal = parseFloat(cleanVal) || 0;

    if (item.competitorId === homeId) {
      groupedMap[key].homeValue = item.value;
      groupedMap[key].homePercent = item.valuePercentage !== undefined ? item.valuePercentage : numVal / 100;
    } else if (item.competitorId === awayId) {
      groupedMap[key].awayValue = item.value;
      groupedMap[key].awayPercent = item.valuePercentage !== undefined ? item.valuePercentage : numVal / 100;
    }
  });

  const stats = Object.values(groupedMap);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      {stats.map((stat, idx) => {
        // Calculate relative weights for the comparison bar
        const total = (parseFloat(stat.homeValue) || 0) + (parseFloat(stat.awayValue) || 0);
        let homeBarWidth = 50;
        let awayBarWidth = 50;

        if (stat.homeValue.includes('%') || stat.awayValue.includes('%')) {
          homeBarWidth = parseFloat(stat.homeValue) || 0;
          awayBarWidth = parseFloat(stat.awayValue) || 0;
        } else if (total > 0) {
          homeBarWidth = ((parseFloat(stat.homeValue) || 0) / total) * 100;
          awayBarWidth = ((parseFloat(stat.awayValue) || 0) / total) * 100;
        }

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Stat Header (Home Value - Stat Name - Away Value) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700' }}>
              <span style={{ color: 'var(--text-primary)', width: '40px', textAlign: 'left' }}>
                {stat.homeValue}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.name}
              </span>
              <span style={{ color: 'var(--text-primary)', width: '40px', textAlign: 'right' }}>
                {stat.awayValue}
              </span>
            </div>

            {/* Custom Dual Progress Bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', overflow: 'hidden', width: '100%' }}>
              {/* Home Bar (Fills from right to left inside its half) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', borderRight: '1px solid var(--bg-secondary)' }}>
                <div style={{ 
                  width: `${homeBarWidth}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-emerald) 100%)',
                  borderRadius: '4px 0 0 4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              
              {/* Away Bar (Fills from left to right inside its half) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ 
                  width: `${awayBarWidth}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
                  borderRadius: '0 4px 4px 0',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
