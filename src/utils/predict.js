export function getBestPick(trendsData, game) {
  if (!trendsData || !trendsData.trends || trendsData.trends.length === 0) {
    return null;
  }

  let bestTrend = null;
  let maxScore = -1;

  for (const t of trendsData.trends) {
    const rate = t.odds?.rate?.decimal || t.odds?.prematchRate?.decimal || 1;
    const text = (t.text || "").toLowerCase();
    
    let score = rate * 10;
    
    if (text.includes("más de 2.5 goles")) score += 20;
    else if (text.includes("más de 1.5 goles")) score += 20;
    else if (text.includes("ambos equipos") || text.includes("anotaron")) score += 15;
    else if (text.includes("ha ganado") || text.includes("victorias") || text.includes("ganador")) score += 10;
    
    if (score > maxScore && rate >= 1.20 && rate <= 3.00) {
      maxScore = score;
      bestTrend = t;
    }
  }

  if (!bestTrend) return null;

  const rate = bestTrend.odds?.rate?.decimal || bestTrend.odds?.prematchRate?.decimal || 0;
  const text = bestTrend.text.toLowerCase();
  let confidence = 75;
  if (rate > 0) {
    confidence = Math.min(95, Math.floor((1 / rate) * 100) + 12);
  }

  let pickType = 'UNKNOWN';
  let targetTeam = null;

  const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const homeName = game?.homeCompetitor?.name || "";
  const awayName = game?.awayCompetitor?.name || "";
  const cleanHomeName = homeName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanAwayName = awayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let isHome = false;
  let isAway = false;

  if (game) {
    if (bestTrend.competitorId) {
      if (bestTrend.competitorId === game.homeCompetitor?.id) isHome = true;
      else if (bestTrend.competitorId === game.awayCompetitor?.id) isAway = true;
    }
    
    if (!isHome && !isAway) {
      if (cleanText.includes(cleanHomeName)) isHome = true;
      else if (cleanText.includes(cleanAwayName)) isAway = true;
      else {
        const firstWord = cleanText.split(" ")[0].trim();
        if (firstWord.length > 2 && cleanHomeName.includes(firstWord)) isHome = true;
        else if (firstWord.length > 2 && cleanAwayName.includes(firstWord)) isAway = true;
      }
    }
  }

  const isDoubleChance = cleanText.includes("empata") || cleanText.includes("doble oportunidad");
  const isFirstToScore = cleanText.includes("primero") || cleanText.includes("primer gol") || cleanText.includes("anoto primero");

  if (cleanText.includes("mas de 2.5")) pickType = 'OVER_2_5';
  else if (cleanText.includes("mas de 1.5")) pickType = 'OVER_1_5';
  else if (cleanText.includes("menos de 2.5")) pickType = 'UNDER_2_5';
  else if (cleanText.includes("menos de 1.5")) pickType = 'UNDER_1_5';
  else if (cleanText.includes("ambos equipos") || cleanText.includes("anotaron") || cleanText.includes("marcaron")) pickType = 'BTTS';
  else if (isFirstToScore) {
    if (isHome) { pickType = 'HOME_FIRST_TO_SCORE'; targetTeam = 'home'; }
    else if (isAway) { pickType = 'AWAY_FIRST_TO_SCORE'; targetTeam = 'away'; }
  }
  else if (cleanText.includes("gana") || cleanText.includes("victorias") || cleanText.includes("invicto")) {
    if (isDoubleChance) {
      if (isHome) { pickType = 'HOME_WIN_OR_DRAW'; targetTeam = 'home'; }
      else if (isAway) { pickType = 'AWAY_WIN_OR_DRAW'; targetTeam = 'away'; }
    } else {
      if (isHome) { pickType = 'HOME_WIN'; targetTeam = 'home'; }
      else if (isAway) { pickType = 'AWAY_WIN'; targetTeam = 'away'; }
    }
  }
  
  return {
    text: bestTrend.text,
    market: bestTrend.odds?.lineName || 'Mercado Sugerido',
    odds: rate > 0 ? rate.toFixed(2) : null,
    confidence: confidence,
    type: pickType,
    targetTeam: targetTeam
  };
}

export function evaluatePickStatus(pick, game) {
  if (!pick || !game || pick.type === 'UNKNOWN') return 'PENDING';
  
  const homeScore = game.homeCompetitor?.score >= 0 ? game.homeCompetitor.score : 0;
  const awayScore = game.awayCompetitor?.score >= 0 ? game.awayCompetitor.score : 0;
  const totalGoals = homeScore + awayScore;
  const isFinished = game.statusGroup === 4;

  switch (pick.type) {
    case 'OVER_2_5':
      if (totalGoals >= 3) return 'WON';
      if (isFinished && totalGoals < 3) return 'LOST';
      break;
    case 'OVER_1_5':
      if (totalGoals >= 2) return 'WON';
      if (isFinished && totalGoals < 2) return 'LOST';
      break;
    case 'UNDER_2_5':
      if (totalGoals >= 3) return 'LOST';
      if (isFinished && totalGoals < 3) return 'WON';
      break;
    case 'UNDER_1_5':
      if (totalGoals >= 2) return 'LOST';
      if (isFinished && totalGoals < 2) return 'WON';
      break;
    case 'BTTS':
      if (homeScore > 0 && awayScore > 0) return 'WON';
      if (isFinished && (homeScore === 0 || awayScore === 0)) return 'LOST';
      break;
    case 'HOME_WIN':
      if (isFinished) {
        if (homeScore > awayScore) return 'WON';
        else return 'LOST';
      }
      break;
    case 'AWAY_WIN':
      if (isFinished) {
        if (awayScore > homeScore) return 'WON';
        else return 'LOST';
      }
      break;
    case 'HOME_WIN_OR_DRAW':
      if (isFinished) {
        if (homeScore >= awayScore) return 'WON';
        else return 'LOST';
      }
      break;
    case 'AWAY_WIN_OR_DRAW':
      if (isFinished) {
        if (awayScore >= homeScore) return 'WON';
        else return 'LOST';
      }
      break;
    case 'HOME_FIRST_TO_SCORE':
      if (game.events && game.events.length > 0) {
        // eventType 1 = goal, 72 = penalty goal, 10 = own goal (competitorId is the team that scored it, for own goal it's the team that conceded, but let's check basic goals)
        const goals = game.events.filter(e => e.eventType?.id === 1 || e.eventType?.id === 72 || (e.eventType?.name && e.eventType.name.toLowerCase().includes('gol')));
        if (goals.length > 0) {
          const firstGoal = goals[0];
          // Si el evento es autogol (own goal), el ID del competidor suele ser del que lo hizo en contra, pero a veces es al revés. 
          // Para no complicarlo, usamos el ID que provee la API o comparamos puntajes.
          if (firstGoal.competitorId === game.homeCompetitor?.id) return 'WON';
          else return 'LOST';
        }
      }
      if (isFinished && homeScore === 0 && awayScore === 0) return 'LOST';
      // Fallback a verificar puntajes si no hay eventos pero ya terminó y alguien anotó
      if (isFinished && homeScore > 0 && awayScore === 0) return 'WON';
      if (isFinished && homeScore === 0 && awayScore > 0) return 'LOST';
      if (isFinished) return 'UNKNOWN';
      break;
    case 'AWAY_FIRST_TO_SCORE':
      if (game.events && game.events.length > 0) {
        const goals = game.events.filter(e => e.eventType?.id === 1 || e.eventType?.id === 72 || (e.eventType?.name && e.eventType.name.toLowerCase().includes('gol')));
        if (goals.length > 0) {
          const firstGoal = goals[0];
          if (firstGoal.competitorId === game.awayCompetitor?.id) return 'WON';
          else return 'LOST';
        }
      }
      if (isFinished && homeScore === 0 && awayScore === 0) return 'LOST';
      if (isFinished && awayScore > 0 && homeScore === 0) return 'WON';
      if (isFinished && awayScore === 0 && homeScore > 0) return 'LOST';
      if (isFinished) return 'UNKNOWN';
      break;
  }

  return 'PENDING';
}

