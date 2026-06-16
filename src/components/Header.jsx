import React, { useRef, useState, useEffect } from 'react';
import { Calendar, RefreshCw, Trophy, Zap, Search, LogIn, LogOut, User, Crown, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Header({ 
  selectedDate, 
  setSelectedDate, 
  filterLive, 
  setFilterLive, 
  competitions, 
  selectedLeagueId, 
  setSelectedLeagueId, 
  onRefresh, 
  loading,
  onOpenModal,
  user,
  authLoading,
  onLogin,
  onLogout,
  theme,
  toggleTheme
}) {
  const fileInputRef = useRef(null);

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/search?query=${searchQuery}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
      setShowUserDropdown(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Generate 7 days around selected date (3 before, selected, 3 after)
  const getDaysArray = () => {
    const days = [];
    const baseDate = parseDateString(selectedDate);
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Helper to parse DD/MM/YYYY string into a Date object
  const parseDateString = (str) => {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to format Date object into DD/MM/YYYY
  const formatDateString = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to display day names (Dom, Lun, Mar, etc.)
  const getDayName = (date) => {
    const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return weekdays[date.getDay()];
  };

  const handleCustomDateChange = (e) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [year, month, day] = val.split('-');
      setSelectedDate(`${day}/${month}/${year}`);
    }
  };

  const days = getDaysArray();

  return (
    <header className="glass-panel" style={{ position: 'relative', zIndex: 50, margin: '16px auto', maxWidth: '800px', width: 'calc(100% - 32px)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
      {/* Brand & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/images/favicon.png" alt="ZENTRA Logo" style={{ height: '48px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} />
        </div>

        {/* Search Engine */}
        <div 
          style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '280px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar torneo, equipo, jugador..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              style={{
                width: '100%',
                background: 'var(--border-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '8px 12px 8px 32px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowDropdown(false);
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showDropdown && searchQuery.trim() !== '' && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              right: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              zIndex: 1000,
              padding: '6px 0'
            }}>
              {searchLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Buscando...
                </div>
              ) : (!searchResults || (
                (!searchResults.competitions || searchResults.competitions.length === 0) &&
                (!searchResults.competitors || searchResults.competitors.length === 0) &&
                (!searchResults.athletes || searchResults.athletes.length === 0)
              )) ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  No se encontraron resultados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px 12px' }}>
                  {/* Ligas / Torneos */}
                  {searchResults.competitions && searchResults.competitions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '4px' }}>Torneos</span>
                      {searchResults.competitions.slice(0, 3).map(comp => (
                        <div 
                          key={comp.id}
                          onClick={() => { onOpenModal('league', comp.id); setShowDropdown(false); setSearchQuery(''); }}
                          style={{ padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', transition: 'background 0.2s ease' }}
                          className="search-item"
                        >
                          <img 
                            src={`https://imagecache.365scores.com/image/upload/f_auto,w_32,h_32,c_limit,q_auto:eco,d_competitions:default1.png/competitions/${comp.id}`} 
                            alt={comp.name} 
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitions:default1.png/competitions/default1'; }}
                          />
                          <span className="hover-underline">{comp.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Equipos */}
                  {searchResults.competitors && searchResults.competitors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '4px' }}>Equipos</span>
                      {searchResults.competitors.slice(0, 4).map(team => (
                        <div 
                          key={team.id}
                          onClick={() => { onOpenModal('team', team.id); setShowDropdown(false); setSearchQuery(''); }}
                          style={{ padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', transition: 'background 0.2s ease' }}
                          className="search-item"
                        >
                          <img 
                            src={`https://imagecache.365scores.com/image/upload/f_auto,w_32,h_32,c_limit,q_auto:eco,d_competitors:default1.png/competitors/${team.id}`} 
                            alt={team.name} 
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }}
                            onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitors:default1.png/competitors/default1'; }}
                          />
                          <span className="hover-underline">{team.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Jugadores */}
                  {searchResults.athletes && searchResults.athletes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '4px' }}>Jugadores</span>
                      {searchResults.athletes.slice(0, 4).map(player => (
                        <div 
                          key={player.id}
                          onClick={() => { onOpenModal('player', player.id); setShowDropdown(false); setSearchQuery(''); }}
                          style={{ padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', transition: 'background 0.2s ease' }}
                          className="search-item"
                        >
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '8px', fontWeight: '900', color: 'var(--bg-primary)' }}>
                            {player.name ? player.name[0].toUpperCase() : '?'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="hover-underline">{player.name}</span>
                            {player.position && (
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{player.position.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Live Filter, Refresh & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setFilterLive(!filterLive)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filterLive ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
              background: filterLive ? 'rgba(13, 240, 163, 0.1)' : 'transparent',
              color: filterLive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: filterLive ? '0 0 10px rgba(13, 240, 163, 0.15)' : 'none'
            }}
          >
            <span className={filterLive ? 'live-dot' : ''} style={{ width: '6px', height: '6px', backgroundColor: filterLive ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
            En Vivo
          </button>

          <button 
            onClick={onRefresh}
            disabled={loading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Actualizar partidos"
          >
            <RefreshCw size={16} className={loading ? 'skeleton' : ''} style={{ animation: loading ? 'skeleton-glow 1s infinite' : 'none' }} />
          </button>


          {/* Firebase Authentication Area */}
          {authLoading ? (
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
          ) : user ? (
            <div 
              style={{ position: 'relative' }} 
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Avatar trigger */}
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: user.isPremium ? '2px solid var(--warning)' : '1px solid var(--border-color)',
                  background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-color) 100%)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: user.isPremium ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                title={user.displayName}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                {user.isPremium && (
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: 'var(--warning)',
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--bg-primary)'
                  }}>
                    <Crown size={8} color="#070a13" style={{ strokeWidth: 3 }} />
                  </div>
                )}
              </button>

              {/* User Profile Dropdown */}
              {showUserDropdown && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '260px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  zIndex: 1000,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  {/* User Profile Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: user.isPremium ? '2px solid var(--warning)' : '1px solid var(--border-color)',
                      flexShrink: 0
                    }}>
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontSize: '18px', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                          {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.displayName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

                  {/* Membership Card */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: user.isPremium 
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' 
                      : 'var(--border-color)',
                    border: user.isPremium 
                      ? '1px solid rgba(245, 158, 11, 0.3)' 
                      : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {user.isPremium ? (
                        <>
                          <Crown size={14} color="var(--warning)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--warning)' }}>MIEMBRO PREMIUM</span>
                        </>
                      ) : (
                        <>
                          <User size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>PLAN GRATUITO</span>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {user.isPremium 
                        ? (user.premiumUntil ? `Vence el: ${new Date(user.premiumUntil).toLocaleDateString()}` : 'Acceso Ilimitado')
                        : 'Regístrate para obtener funciones exclusivas en el futuro.'}
                    </span>
                  </div>

                  {/* Log Out Button */}
                  <button 
                    onClick={() => { setShowUserDropdown(false); onLogout(); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                  >
                    <LogOut size={12} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onLogin}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: '1px solid var(--accent-emerald)',
                background: 'rgba(13, 240, 163, 0.05)',
                color: 'var(--accent-emerald)',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(13, 240, 163, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(13, 240, 163, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(13, 240, 163, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogIn size={13} />
              Acceder
            </button>
          )}
        </div>
      </div>

      {/* Date Slider Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1, paddingBottom: '4px', scrollbarWidth: 'none' }} className="date-slider">
          {days.map((d, idx) => {
            const formatted = formatDateString(d);
            const isSelected = formatted === selectedDate;
            const isToday = formatDateString(new Date()) === formatted;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(formatted)}
                style={{
                  minWidth: '46px',
                  padding: '6px 8px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                  background: isSelected ? 'rgba(13, 240, 163, 0.08)' : 'var(--border-color)',
                  color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '8px', fontWeight: '700', color: isSelected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {getDayName(d)}
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800' }}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Date Input Trigger */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => fileInputRef.current && fileInputRef.current.showPicker()}
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={18} />
          </button>
          <input 
            type="date"
            ref={fileInputRef}
            onChange={handleCustomDateChange}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        </div>
      </div>

    </header>
  );
}
