import React from 'react';
import { Target } from 'lucide-react';
import { translate } from '../utils/translations';

export default function StatsTab({ statsList, homeId, awayId }) {
  
  // statsList is the flat array of stats from 365scores
  if (!statsList || !Array.isArray(statsList) || statsList.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '0', border: '1px solid var(--border-color)' }}>
        <Target size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Sin estadísticas</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Las estadísticas de este partido aún no están disponibles.</p>
      </div>
    );
  }

  // Agrupar por ID de estadística
  const statsById = {};
  statsList.forEach(stat => {
    if (!statsById[stat.id]) {
      statsById[stat.id] = { 
        id: stat.id, 
        name: translate(stat.name), 
        categoryId: stat.categoryId,
        categoryName: translate(stat.categoryName || 'General'),
        homeValue: null, 
        awayValue: null 
      };
    }
    if (stat.competitorId === homeId) {
      statsById[stat.id].homeValue = stat.value;
    } else if (stat.competitorId === awayId) {
      statsById[stat.id].awayValue = stat.value;
    }
  });

  // Filtrar solo las que tienen datos para ambos equipos
  const validStats = Object.values(statsById).filter(s => s.homeValue !== null && s.awayValue !== null);

  // Agrupar por categoría
  const statsByCategory = {};
  validStats.forEach(stat => {
    if (!statsByCategory[stat.categoryName]) {
      statsByCategory[stat.categoryName] = [];
    }
    statsByCategory[stat.categoryName].push(stat);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.entries(statsByCategory).map(([category, stats]) => (
        <div key={category} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '0', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {category}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stats.map((stat, index) => {
              // Extraer números si el valor viene como string con porcentaje (ej: "40%") o fraccional "6/36 (17%)"
              let cleanHomeVal = stat.homeValue;
              let cleanAwayVal = stat.awayValue;

              // Parsear fracciones como "6/36 (17%)" -> usar el porcentaje para la barra
              const hMatch = typeof cleanHomeVal === 'string' ? cleanHomeVal.match(/\((\d+)%\)/) : null;
              const aMatch = typeof cleanAwayVal === 'string' ? cleanAwayVal.match(/\((\d+)%\)/) : null;
              
              let hNum = 0, aNum = 0;
              if (hMatch) {
                hNum = parseInt(hMatch[1], 10);
                cleanHomeVal = cleanHomeVal.replace(/\s*\(\d+%\)/, ''); // Remove the parenthesis from display
              } else {
                hNum = parseFloat((typeof cleanHomeVal === 'string' ? cleanHomeVal.replace('%', '') : cleanHomeVal)) || 0;
              }

              if (aMatch) {
                aNum = parseInt(aMatch[1], 10);
                cleanAwayVal = cleanAwayVal.replace(/\s*\(\d+%\)/, '');
              } else {
                aNum = parseFloat((typeof cleanAwayVal === 'string' ? cleanAwayVal.replace('%', '') : cleanAwayVal)) || 0;
              }

              const total = hNum + aNum;
              let homePercentage = 50;
              let awayPercentage = 50;
              
              if (total > 0) {
                homePercentage = (hNum / total) * 100;
                awayPercentage = (aNum / total) * 100;
              } else if (hNum === 0 && aNum === 0) {
                homePercentage = 50;
                awayPercentage = 50;
              }

              const isHomeGreater = hNum > aNum;
              const isAwayGreater = aNum > hNum;

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: isHomeGreater ? '800' : '600', color: isHomeGreater ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
                      {stat.homeValue}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', flex: 1.5 }}>
                      {stat.name}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: isAwayGreater ? '800' : '600', color: isAwayGreater ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>
                      {stat.awayValue}
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Home Bar */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '8px', borderRadius: '0', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <div style={{ 
                        width: `${homePercentage}%`, 
                        background: isHomeGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {/* Away Bar */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', height: '8px', borderRadius: '0', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                      <div style={{ 
                        width: `${awayPercentage}%`, 
                        background: isAwayGreater ? 'var(--accent-emerald)' : 'var(--border-color)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
