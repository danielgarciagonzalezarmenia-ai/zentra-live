export const translations = {
  // Event Types
  "Goal": "Gol",
  "Yellow Card": "Tarjeta Amarilla",
  "Red Card": "Tarjeta Roja",
  "Substitution": "Sustitución",
  "Missed Penalty": "Penal Fallado",
  "Penalty Goal": "Gol de Penal",
  "Assist": "Asistencia",
  "VAR": "VAR",
  "Offside": "Fuera de Juego",
  "Own Goal": "Autogol",
  "Second Yellow Card": "Doble Amarilla",
  "Penalty": "Penalti",
  
  // Stat Categories
  "General": "General",
  "Attack": "Ataque",
  "Defense": "Defensa",
  "Passes": "Pases",
  "Duels": "Duelos",
  
  // Stats
  "Ball Possession": "Posesión de Balón",
  "Shots on Target": "Tiros a Puerta",
  "Shots off Target": "Tiros Fuera",
  "Corner Kicks": "Tiros de Esquina",
  "Offsides": "Fueras de Juego",
  "Fouls": "Faltas",
  "Yellow Cards": "Tarjetas Amarillas",
  "Red Cards": "Tarjetas Rojas",
  "Goalkeeper Saves": "Atajadas",
  "Total Shots": "Tiros Totales",
  "Blocked Shots": "Tiros Bloqueados",
  "Free Kicks": "Tiros Libres",
  "Throw-ins": "Saques de Banda",
  "Goal Kicks": "Saques de Meta",
  "Passes Completed": "Pases Completados",
  "Tackles": "Entradas",
  "Attacks": "Ataques",
  "Dangerous Attacks": "Ataques Peligrosos",
  "Expected Goals (xG)": "Goles Esperados (xG)",
  "Crosses": "Centros",
  "Interceptions": "Intercepciones",
  "Clearances": "Despejes",
  "Matches won": "Partidos ganados",
  "Matches drawn": "Partidos empatados",
  "Matches lost": "Partidos perdidos",
  "Goals scored": "Goles anotados",
  "Goals conceded": "Goles recibidos",
  "Clean sheets": "Porterías a cero",
  "Both teams scored": "Ambos anotan",
  "Matches with goal": "Partidos con gol",
  "Over 2.5 goals": "Más de 2.5 goles",
  "Under 2.5 goals": "Menos de 2.5 goles",
  
  // Lineup / Positions
  "Goalkeeper": "Portero",
  "Defender": "Defensa",
  "Midfielder": "Centrocampista",
  "Attacker": "Delantero",
  "Forward": "Delantero",
  "Coach": "Entrenador",
  "Substitute": "Suplente",
  "Bench": "Banquillo",
  "Formation": "Formación",
  "Starting Lineup": "Once Inicial",
  "Substitutes": "Suplentes",
  "Missing Players": "Bajas",
  
  // Position Shortnames
  "GK": "PO",
  "D": "DEF",
  "M": "MED",
  "F": "DEL",
  "A": "DEL",
  
  // General fallback
  "To": "a"
};

export function translate(text) {
  if (!text) return text;
  return translations[text] || text;
}
