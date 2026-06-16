import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, ExternalLink, Percent, Lock, Loader2, Target, Zap, Mail, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getBestPick, evaluatePickStatus } from '../utils/predict';
import { signInWithGoogle } from '../firebase';

export default function TrendsTab({ trendsData, game, homeTeam, awayTeam, user }) {
  const isPremium = user?.isPremium;
  const [loadingPayment, setLoadingPayment] = useState(false);

  const handlePayment = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        const result = await signInWithGoogle();
        currentUser = result.user;
        // La app principal detectará el cambio de auth y actualizará el estado
        return; 
      } catch (err) {
        console.error("Error al iniciar sesión:", err);
        return;
      }
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
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.5px' }}>ZENTRA Premium</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px' }}>Mejora tu rentabilidad con herramientas profesionales.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '380px', width: '100%', textAlign: 'left', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '6px', background: 'rgba(13,240,163,0.1)', borderRadius: '8px', color: 'var(--accent-emerald)' }}>
              <Target size={18} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Radar de Valor Exclusivo</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Accede a las tendencias y oportunidades de alta probabilidad con cuotas superiores a 1.40.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '6px', background: 'rgba(14,165,233,0.1)', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
              <Mail size={18} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Alertas de "Gol Inminente"</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Nuestro robot escanea partidos en vivo y te envía correos cuando un equipo está dominando brutalmente.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '6px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', color: '#f59e0b' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Sin Riesgo de Publicidad</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Navegación limpia, rápida y enfocada 100% en análisis de datos puros y reales.</p>
            </div>
          </div>
        </div>
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
        <Target size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '14px' }}>El radar no ha detectado oportunidades de valor (+1.40) para este partido.</p>
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
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '16px', 
          flexWrap: 'wrap',
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
  const sortedByOddsTrends = Array.from(uniqueMap.values()).sort((a, b) => getTrendRate(b) - getTrendRate(a));

  // Predictive Algorithm
  const bestPick = getBestPick(trendsData, game);
  const pickStatus = evaluatePickStatus(bestPick, game);

  const renderPickStatus = () => {
    if (pickStatus === 'WON') return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(13,240,163,0.1)', color: 'var(--accent-emerald)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}><CheckCircle2 size={12}/> GANADO</div>;
    if (pickStatus === 'LOST') return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}><XCircle size={12}/> PERDIDO</div>;
    if (game?.statusGroup === 4) return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}><Clock size={12}/> FINALIZADO</div>;
    return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}><Clock size={12}/> EN JUEGO</div>;
  };

  return (
    <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ZENTRA Predictor Card */}
      {bestPick && (
        <div style={{ background: 'linear-gradient(135deg, rgba(13,240,163,0.1) 0%, rgba(14,165,233,0.1) 100%)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(13,240,163,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Zap size={18} color="var(--accent-emerald)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>ALGORITMO ZENTRA</h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mejor oportunidad encontrada matemáticamente</span>
            </div>
            {renderPickStatus()}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{bestPick.text}</span>
              {bestPick.odds && (
                <div style={{ background: 'var(--accent-emerald)', color: '#000', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '14px' }}>
                  {bestPick.odds}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nivel de Confianza Algorítmica</span>
                <span style={{ color: bestPick.confidence > 80 ? 'var(--warning)' : 'var(--accent-emerald)' }}>{bestPick.confidence}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${bestPick.confidence}%`, height: '100%', background: bestPick.confidence > 80 ? 'var(--warning)' : 'var(--accent-emerald)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Título de tendencias */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <Target size={16} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Oportunidades de Valor
          </h3>
          <span style={{ fontSize: '9px', background: 'rgba(13,240,163,0.1)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cuota {'>='} 1.40
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedByOddsTrends.map(t => renderTrendCard(t))}
        </div>
      </div>

    </div>
  );
}
