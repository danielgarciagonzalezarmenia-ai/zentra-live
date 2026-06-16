import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, X, ShieldAlert, Zap, BarChart3, ChevronRight, Lock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getBestPick } from '../utils/predict';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function PredictionsModal({ onClose, user, onOpenModal, selectedDate }) {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If not premium, stop here (the Header already blocks it usually, but just in case)
    if (!user || user.status !== 'premium') {
      setLoading(false);
      return;
    }

    const fetchAllPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all games for selected date
        const res = await axios.get(`${API_BASE_URL}/api/games?date=${selectedDate}`);
        const games = res.data.games || [];
        
        if (games.length === 0) {
          setPredictions([]);
          setLoading(false);
          return;
        }

        const validGames = games; 
        const results = [];
        const batchSize = 10;

        for (let i = 0; i < validGames.length; i += batchSize) {
          const batch = validGames.slice(i, i + batchSize);
          const promises = batch.map(async (game) => {
            const trendDocRef = doc(db, 'game_trends', game.id.toString());
            let finalTrends = null;

            try {
              const snap = await getDoc(trendDocRef);
              if (snap.exists()) {
                finalTrends = snap.data();
              }
            } catch (e) {
              console.warn("Firebase read error", e);
            }

            if (!finalTrends || !finalTrends.trends || finalTrends.trends.length === 0) {
              try {
                const apiRes = await axios.get(`${API_BASE_URL}/api/game/${game.id}/trends`);
                finalTrends = apiRes.data;
                if (finalTrends && finalTrends.trends && finalTrends.trends.length > 0) {
                  await setDoc(trendDocRef, finalTrends).catch(() => {});
                }
              } catch (e) {
                finalTrends = { trends: [] };
              }
            }

            if (finalTrends && finalTrends.trends && finalTrends.trends.length > 0) {
              const bestPick = getBestPick(finalTrends, game);
              if (bestPick) {
                return { game, pick: bestPick };
              }
            }
            return null;
          });

          const batchResults = await Promise.all(promises);
          results.push(...batchResults.filter(Boolean));
        }

        results.sort((a, b) => b.pick.confidence - a.pick.confidence);
        setPredictions(results);
      } catch (err) {
        console.error("Error fetching global predictions", err);
        setError("Ocurrió un error obteniendo los pronósticos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllPredictions();
  }, [selectedDate, user]);

  const renderContent = () => {
    if (!user || user.status !== 'premium') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Lock size={48} color="var(--warning)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Solo Premium</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Esta sección es exclusiva para usuarios Premium.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <TrendingUp className="spin-fast" size={40} color="var(--accent-emerald)" />
          <div>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Analizando Pronósticos...</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>El algoritmo de ZENTRA está evaluando todos los partidos del día.</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
        </div>
      );
    }

    if (predictions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BarChart3 size={48} color="var(--border-color)" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No hay pronósticos con alta probabilidad para esta fecha.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>
          Basado en análisis de algoritmos para {predictions.length} partidos hoy.
        </p>
        {predictions.map((item, idx) => {
          const game = item.game;
          const pick = item.pick;
          const homeName = game.homeCompetitor?.name || 'Local';
          const awayName = game.awayCompetitor?.name || 'Visitante';
          
          return (
            <div 
              key={`${game.id}-${idx}`}
              onClick={() => {
                onClose();
                onOpenModal('match', game.id);
              }}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={`https://imagecache.365scores.com/image/upload/f_auto,w_24,h_24,c_limit,q_auto:eco,d_competitions:default1.png/competitions/${game.competitionId}`} alt="" style={{width: '14px', height: '14px'}} onError={(e)=>e.target.style.display='none'} />
                  {game.competitionDisplayName || 'Partido'}
                </div>
                <div style={{ 
                  background: 'rgba(13,240,163,0.1)', 
                  color: 'var(--accent-emerald)', 
                  padding: '4px 8px', 
                  fontSize: '14px', 
                  fontWeight: '800' 
                }}>
                  {pick.confidence}% Seguro
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{homeName}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{awayName}</div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pronóstico del Algoritmo</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-cyan)', textAlign: 'right' }}>
                    {pick.text}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: '700' }}>
                    Cuota: {pick.odds}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--border-color)" style={{ marginLeft: '12px' }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div className="glass-panel hide-scrollbar" style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(13,240,163,0.1)', padding: '8px', borderRadius: '0' }}>
              <TrendingUp size={20} color="var(--accent-emerald)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Central de Pronósticos</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mejores opciones del día ({selectedDate})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
