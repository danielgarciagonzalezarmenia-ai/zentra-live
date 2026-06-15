import React from 'react';
import { TrendingUp, Award, ExternalLink, Percent } from 'lucide-react';

export default function TrendsTab({ trendsData, homeTeam, awayTeam }) {
  const trends = trendsData?.trends || [];

  const getTrendRate = (t) => t.odds?.rate?.decimal || t.odds?.prematchRate?.decimal || 0;

  // Filter out trends with rate < 1.40
  const validTrends = trends.filter(t => getTrendRate(t) >= 1.40);

  if (validTrends.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <TrendingUp size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '14px' }}>No hay tendencias de valor (+1.40) disponibles para este partido.</p>
      </div>
    );
  }

  // Sort trends by percentage confidence descending
  const sortedTrends = [...validTrends].sort((a, b) => b.percentage - a.percentage);

  // Top Trends: confidence percentage >= 0.80, or top 2 if none meet threshold
  const topTrendsFilter = sortedTrends.filter(t => t.percentage >= 0.80);
  const topTrends = topTrendsFilter.length > 0 ? topTrendsFilter : sortedTrends.slice(0, 2);

  // Helper to render bookmaker rate trend
  const renderTrendIcon = (trend) => {
    if (trend === 1) return <span style={{ color: 'var(--success)', marginLeft: '4px' }}>▲</span>;
    if (trend === 3) return <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>▼</span>;
    return null;
  };

  const renderTrendCard = (t) => {
    const bookmaker = trendsData?.bookmakers?.find(b => b.id === t.bookmakerId);
    const betLink = t.odds?.link || bookmaker?.link || 'https://www.bet365.com';
    const rateVal = getTrendRate(t);

    return (
      <div 
        key={t.id} 
        className="glass-panel" 
        style={{ 
          padding: '16px 20px', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '16px', 
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.01)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.background = 'var(--border-color)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
        }}
      >
        {/* Left: Trend description and confidence percentage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '240px' }}>
          
          {/* Percentage badge */}
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '50%', 
            background: t.percentage >= 0.85 ? 'rgba(13,240,163,0.08)' : 'rgba(59,130,246,0.08)',
            border: t.percentage >= 0.85 ? '2px solid var(--accent-emerald)' : '2px solid var(--accent-blue)',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: t.percentage >= 0.85 ? '0 0 10px rgba(13,240,163,0.1)' : 'none',
            flexShrink: 0
          }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '900', 
              color: t.percentage >= 0.85 ? 'var(--accent-emerald)' : 'var(--accent-blue)',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {Math.round(t.percentage * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700', lineHeight: '1.4' }}>
              {t.text}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Efectividad Histórica
            </span>
          </div>
        </div>

        {/* Right: Betting Rate CTA Box */}
        {rateVal && (
          <a
            href={betLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'var(--border-color)',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              minWidth: '140px',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-emerald)';
              e.currentTarget.style.background = 'rgba(13,240,163,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.betCTA || 'Cuota'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {rateVal.toFixed(2)}
                {renderTrendIcon(t.odds?.trend)}
              </span>
            </div>
            <div style={{ padding: '6px', background: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
              <ExternalLink size={12} />
            </div>
          </a>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px 8px' }}>
      
      {/* 1. Tendencias TOP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <Award size={16} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Tendencias Top
          </h3>
          <span style={{ fontSize: '9px', background: 'rgba(13,240,163,0.1)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Alta Probabilidad
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topTrends.map(t => renderTrendCard(t))}
        </div>
      </div>

      {/* 2. Todas las Tendencias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <Percent size={14} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Todas las Tendencias
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedTrends.map(t => renderTrendCard(t))}
        </div>
      </div>

    </div>
  );
}
