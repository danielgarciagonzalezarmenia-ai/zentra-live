const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Common request headers to mimic a browser request
const scrapeHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Origin': 'https://www.365scores.com',
  'Referer': 'https://www.365scores.com/'
};

// Health check endpoint for keeping server awake
app.get('/ping', (req, res) => {
  res.send('pong');
});

// 1. Get games by date
app.get('/api/games', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Falta el parámetro de fecha (date=DD/MM/YYYY).' });
  }

  try {
    const url = `https://webws.365scores.com/web/games/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&startDate=${date}&endDate=${date}`;
    console.log(`Fetching games for date: ${date}`);
    const response = await axios.get(url, { headers: scrapeHeaders });

    const data = response.data;
    if (data.games) {
      // Filter for football (sportId === 1)
      data.games = data.games.filter(g => g.sportId === 1);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching games:', error.message);
    res.status(500).json({ error: 'Error al obtener los partidos desde el proveedor.', message: error.message });
  }
});

// 2. Get game details (events, lineups, players info)
app.get('/api/game/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const url = `https://webws.365scores.com/web/game/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&gameId=${id}`;
    console.log(`Fetching game details for ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching game details for ID ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los detalles del partido.', message: error.message });
  }
});

// 3. Get match stats (Possession, shots, passes, corners, etc.)
// Note: parameter is 'games' instead of 'gameId'
app.get('/api/game/:id/stats', async (req, res) => {
  const { id } = req.params;
  
  try {
    const url = `https://webws.365scores.com/web/game/stats/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&games=${id}`;
    console.log(`Fetching statistics for game ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching statistics for ID ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener las estadísticas del partido.', message: error.message });
  }
});

// 4. Get game trends (Top Trends and All Trends)
app.get('/api/game/:id/trends', async (req, res) => {
  const { id } = req.params;
  
  try {
    const url = `https://webws.365scores.com/web/trends/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&games=${id}`;
    console.log(`Fetching trends for game ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching trends for ID ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener las tendencias del partido.', message: error.message });
  }
});
// 5. Search leagues, teams, players
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda (query).' });
  }
  try {
    const url = `https://webws.365scores.com/web/search/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&query=${encodeURIComponent(query)}`;
    console.log(`Searching for: ${query}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error('Error in search:', error.message);
    res.status(500).json({ error: 'Error al realizar la búsqueda.', message: error.message });
  }
});

// 6. Get competition info (meta)
app.get('/api/competition/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/competitions/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitions=${id}`;
    console.log(`Fetching competition info for: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error in competition info ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener datos de la competición.', message: error.message });
  }
});

// 7. Get standings for a competition
app.get('/api/competition/:id/standings', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/standings/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitions=${id}`;
    console.log(`Fetching standings for competition: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error in standings ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener la tabla de posiciones.', message: error.message });
  }
});

// 8. Get player statistics (scorers/assists) for a competition
app.get('/api/competition/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/stats/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitions=${id}&withSeasons=true`;
    console.log(`Fetching stats for competition: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error in stats ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener estadísticas de la competición.', message: error.message });
  }
});

// 9. Get competitor (team) info
app.get('/api/competitor/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/competitors/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitors=${id}`;
    console.log(`Fetching competitor details for ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching competitor ID ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener detalles del equipo.', message: error.message });
  }
});

// 10. Get competitor squad
app.get('/api/competitor/:id/squad', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/squads/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitors=${id}`;
    console.log(`Fetching squad for competitor ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching squad for competitor ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener la plantilla del equipo.', message: error.message });
  }
});

// 11. Get competitor games
app.get('/api/competitor/:id/games', async (req, res) => {
  const { id } = req.params;
  
  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  try {
    const today = new Date();
    
    // Window 1: Past 35 days
    const start1 = new Date(today);
    start1.setDate(today.getDate() - 35);
    const end1 = new Date(today);
    end1.setDate(today.getDate() - 1);
    
    // Window 2: Next 30 days
    const start2 = new Date(today);
    const end2 = new Date(today);
    end2.setDate(today.getDate() + 30);
    
    // Window 3: Next 31-61 days
    const start3 = new Date(today);
    start3.setDate(today.getDate() + 31);
    const end3 = new Date(today);
    end3.setDate(today.getDate() + 61);

    const w1Str = formatDate(start1);
    const e1Str = formatDate(end1);
    const w2Str = formatDate(start2);
    const e2Str = formatDate(end2);
    const w3Str = formatDate(start3);
    const e3Str = formatDate(end3);

    console.log(`Fetching windowed games for competitor ID: ${id}`);
    
    const [res1, res2, res3] = await Promise.all([
      axios.get(`https://webws.365scores.com/web/games/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitors=${id}&startDate=${w1Str}&endDate=${e1Str}`, { headers: scrapeHeaders }).catch(() => ({ data: { games: [] } })),
      axios.get(`https://webws.365scores.com/web/games/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitors=${id}&startDate=${w2Str}&endDate=${e2Str}`, { headers: scrapeHeaders }).catch(() => ({ data: { games: [] } })),
      axios.get(`https://webws.365scores.com/web/games/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&competitors=${id}&startDate=${w3Str}&endDate=${e3Str}`, { headers: scrapeHeaders }).catch(() => ({ data: { games: [] } }))
    ]);

    const games1 = res1.data.games || [];
    const games2 = res2.data.games || [];
    const games3 = res3.data.games || [];

    const combinedGames = [...games1, ...games2, ...games3];
    const gameMap = {};
    combinedGames.forEach(g => {
      if (g.sportId === 1) {
        gameMap[g.id] = g;
      }
    });

    const uniqueGames = Object.values(gameMap);
    uniqueGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.json({ games: uniqueGames, competitorId: Number(id) });
  } catch (error) {
    console.error(`Error fetching games for competitor ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los partidos del equipo.', message: error.message });
  }
});

// 12. Get athlete (player) games
app.get('/api/athlete/:id/games', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/athletes/games/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&athleteId=${id}`;
    console.log(`Fetching games for athlete ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching games for athlete ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener los partidos del jugador.', message: error.message });
  }
});

// 12. Get athlete (player) details
app.get('/api/athlete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://webws.365scores.com/web/athletes/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&athletes=${id}`;
    console.log(`Fetching athlete details for ID: ${id}`);
    const response = await axios.get(url, { headers: scrapeHeaders });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching athlete details for ${id}:`, error.message);
    res.status(500).json({ error: 'Error al obtener detalles del jugador.', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ZENTRA backend server running on port ${PORT}`);
});
