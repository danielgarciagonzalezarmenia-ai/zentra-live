import React from 'react';
import { TrendingUp, Award, ExternalLink, Percent, Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function TrendsTab({ trendsData, homeTeam, awayTeam, user }) {
  const isPremium = user?.isPremium;
  const [loadingPayment, setLoadingPayment] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert("Debes iniciar sesión primero.");
      return;
    }
    
    try {
      setLoadingPayment(true);
      const res = await axios.post(`${API_BASE_URL}/api/create_preference`, {
        uid: user.uid,
        email: user.email,
        title: 'ZENTRA Premium (1 Mes)',
        price: 15000 // Pago de 15.000 COP mensuales
      });
      
      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      }
    } catch (err) {
      console.error("Error al iniciar pago:", err);
      alert("Hubo un error al conectar con Mercado Pago. Intenta más tarde.");
    } finally {
      setLoadingPayment(false);
    }
  };

  if (!isPremium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, var(--aura-emerald) 0%, transparent 50%)', opacity: 0.5, pointerEvents: 'none' }} />
        <Lock size={48} color="var(--accent-emerald)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>ZENTRA Premium</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.6', marginBottom: '24px' }}>
          Para acceder a las tendencias de alta probabilidad y asegurar tus apuestas, adquiere la versión ZENTRA Premium.
        </p>
        <button 
          onClick={handlePayment}
          disabled={loadingPayment}
          style={{ padding: '12px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)', color: '#000', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loadingPayment ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(13,240,163,0.3)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
          onMouseEnter={(e) => !loadingPayment && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !loadingPayment && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {loadingPayment && <Loader2 size={16} className="animate-spin" />}
          {user ? (loadingPayment ? 'Cargando...' : 'Adquirir Premium') : 'Inicia Sesión para Adquirir'}
        </button>
      </div>
    );
  }

  const trends = trendsData?.trends || [];

  const getTrendRate = (t) => t.odds?.rate?.decimal || t.odds?.prematchRate?.decimal || 0;

  // Filter out trends with rate < 1.40
  const validTrends = trends.filter(t => getTrendRate(t) >= 1.40);

  // Remove duplicates by text (keeping the one with highest percentage if duplicate)
  const uniqueMap = new Map();
  validTrends.forEach(t => {
    const key = t.text.toLowerCase().trim();
    if (!uniqueMap.has(key) || t.percentage > uniqueMap.get(key).percentage) {
      uniqueMap.set(key, t);
    }
  });

  const uniqueTrends = Array.from(uniqueMap.values());

  if (uniqueTrends.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <TrendingUp size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '14px' }}>No hay tendencias de valor (+1.40) disponibles para este partido.</p>
      </div>
    );
  }

  // Sort trends by percentage confidence descending
  const sortedTrends = [...uniqueTrends].sort((a, b) => b.percentage - a.percentage);

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
      
      {/* Todas las Tendencias Unificadas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <TrendingUp size={16} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Tendencias del Partido
          </h3>
          <span style={{ fontSize: '9px', background: 'rgba(13,240,163,0.1)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cuota {'>='} 1.40
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedTrends.map(t => renderTrendCard(t))}
        </div>
      </div>

    </div>
  );
}
