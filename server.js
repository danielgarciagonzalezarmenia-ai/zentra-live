const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

// ----------------------------------------------------
// FIREBASE ADMIN SETUP (For updating user Premium status)
// ----------------------------------------------------
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT not set in environment.");
}

const dbAdmin = admin.getApps().length ? getFirestore() : null;

// ----------------------------------------------------
// MERCADO PAGO SETUP
// ----------------------------------------------------
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_TOKEN || 'TEST-TOKEN' 
});

// ----------------------------------------------------
// NODEMAILER SETUP
// ----------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
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
app.get('/api/player/:id/games', async (req, res) => {
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

// 13. Get athlete (player) details
app.get('/api/player/:id', async (req, res) => {
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

// ----------------------------------------------------
// PREMIUM: MERCADO PAGO ENDPOINTS
// ----------------------------------------------------

// Crear preferencia de pago
app.post('/api/create_preference', async (req, res) => {
  const { uid, email, title, price } = req.body;
  
  if (!uid) {
    return res.status(400).json({ error: 'Falta el UID del usuario.' });
  }

  try {
    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            title: title || 'ZENTRA Premium',
            quantity: 1,
            unit_price: Number(price) || 10000,
            currency_id: 'COP'
          }
        ],
        payer: {
          email: email
        },
        metadata: {
          uid: uid // Guardamos el UID para saber a quién activar el premium
        },
        back_urls: {
          success: 'https://danielgarciagonzalezarmenia-ai.github.io/zentra-live',
          failure: 'https://danielgarciagonzalezarmenia-ai.github.io/zentra-live',
          pending: 'https://danielgarciagonzalezarmenia-ai.github.io/zentra-live'
        },
        auto_return: 'approved',
        notification_url: 'https://zentra-live-backend.onrender.com/api/webhook'
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago.' });
  }
});

// Webhook para recibir notificación de pago exitoso
app.post('/api/webhook', async (req, res) => {
  const payment = req.query;

  try {
    if (payment.type === 'payment') {
      const data = await axios.get(`https://api.mercadopago.com/v1/payments/${payment['data.id']}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_TOKEN}`
        }
      });

      const paymentData = data.data;
      
      if (paymentData.status === 'approved') {
        const uid = paymentData.metadata.uid;
        
        if (uid && dbAdmin) {
          // Activar Premium en Firestore por 1 mes
          await dbAdmin.collection('users').doc(uid).update({
            isPremium: true,
            premiumUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), // 1 mes
            planType: 'premium'
          });
          console.log(`[Premium Activado] Usuario: ${uid}`);
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en Webhook:', error);
    res.status(500).send('Error');
  }
});

app.listen(PORT, () => {
  console.log(`ZENTRA backend server running on port ${PORT}`);
});

// ----------------------------------------------------
// ZENTRA VALUE RADAR - EMAIL NOTIFIER CRON JOB
// ----------------------------------------------------
const notifiedMatches = new Set();

async function checkLiveMatchesAndAlert() {
  try {
    const url = `https://webws.365scores.com/web/games/current/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1`;
    const res = await axios.get(url, { headers: scrapeHeaders });
    const games = res.data.games || [];
    
    // Filter live matches (statusGroup 3 is live)
    const liveGames = games.filter(g => g.statusGroup === 3);
    
    for (const game of liveGames) {
      if (notifiedMatches.has(game.id)) continue; // Already alerted for this game

      // Check time: 60 to 85 mins. Usually gameTime is the minute.
      const minute = game.gameTime || 0;
      if (minute >= 60 && minute <= 85) {
        
        // Calculate goal difference
        const homeScore = game.homeCompetitor.score >= 0 ? game.homeCompetitor.score : 0;
        const awayScore = game.awayCompetitor.score >= 0 ? game.awayCompetitor.score : 0;
        const diff = Math.abs(homeScore - awayScore);
        
        // Fetch stats (We fetch stats if it's within the window regardless of goal diff, because corners don't care about goal diff as much, though tight games are better)
        const statsRes = await axios.get(`https://webws.365scores.com/web/game/stats/?appTypeId=5&langId=29&timezoneName=America/Bogota&userCountryId=1&games=${game.id}`, { headers: scrapeHeaders }).catch(() => null);
          
          if (statsRes && statsRes.data.statistics && statsRes.data.statistics[0]) {
            const stats = statsRes.data.statistics[0].statistics;
            
            let homeAttacks = 0, awayAttacks = 0;
            let homeShots = 0, awayShots = 0;
            let homePoss = 0, awayPoss = 0;
            let homeCorners = 0, awayCorners = 0;
            
            stats.forEach(s => {
              const name = s.name.toLowerCase();
              if (name.includes('peligros') || name.includes('danger')) {
                homeAttacks = parseInt(s.homeValue) || 0;
                awayAttacks = parseInt(s.awayValue) || 0;
              }
              if (name.includes('puerta') || name.includes('arco') || name.includes('target')) {
                homeShots = parseInt(s.homeValue) || 0;
                awayShots = parseInt(s.awayValue) || 0;
              }
              if (name.includes('poses') || name.includes('poss')) {
                homePoss = parseInt(s.homeValue) || 0;
                awayPoss = parseInt(s.awayValue) || 0;
              }
              if (name.includes('corner') || name.includes('córner') || name.includes('tiro de esquina')) {
                homeCorners = parseInt(s.homeValue) || 0;
                awayCorners = parseInt(s.awayValue) || 0;
              }
            });
            
            // 1. Criteria for Goal (Dominio Extremo)
            const homeDomination = homeAttacks >= 50 && homeShots >= 4 && homePoss >= 55 && diff <= 1 && minute >= 60 && minute <= 85;
            const awayDomination = awayAttacks >= 50 && awayShots >= 4 && awayPoss >= 55 && diff <= 1 && minute >= 60 && minute <= 85;
            
            // 2. Criteria for Corners (Partido Roto / Ritmo Alto)
            const highPace = (homeAttacks + awayAttacks) >= 100 && (homeCorners + awayCorners) >= 8 && minute >= 75 && minute <= 85;

            let alertType = null;
            let dominatingTeam = null;

            if (homeDomination || awayDomination) {
              alertType = 'goal';
              dominatingTeam = homeDomination ? game.homeCompetitor.name : game.awayCompetitor.name;
            } else if (highPace) {
              alertType = 'corner';
            }
            
            if (alertType) {
              console.log(`[ALERTA RADAR] Tipo: ${alertType} para el partido ${game.homeCompetitor.name} vs ${game.awayCompetitor.name}! Minuto: ${minute}`);
              await sendPremiumAlertEmails(alertType, game, dominatingTeam, homeScore, awayScore, homeAttacks, awayAttacks, homeShots, awayShots, homeCorners, awayCorners, minute);
              notifiedMatches.add(game.id);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking live matches:", error.message);
  }
}

async function sendPremiumAlertEmails(alertType, game, dominatingTeam, homeScore, awayScore, homeAttacks, awayAttacks, homeShots, awayShots, homeCorners, awayCorners, minute) {
  if (!dbAdmin) return;
  
  try {
    // 1. Get all premium users
    const usersSnapshot = await dbAdmin.collection('users').where('isPremium', '==', true).get();
    const emails = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) emails.push(data.email);
    });
    
    if (emails.length === 0) return;
    
    let sugTitle = '';
    let sugBody = '';
    
    if (alertType === 'goal') {
      sugTitle = '🔥 SUGERENCIA: GOL INMINENTE';
      sugBody = `El <strong>${dominatingTeam}</strong> está generando una presión extrema sobre el rival. Recomendamos apostar a <strong>Próximo Gol</strong> o <strong>Over de Goles</strong>.`;
    } else {
      const currentCorners = homeCorners + awayCorners;
      sugTitle = '⛳ SUGERENCIA: OVER DE CÓRNERS';
      sugBody = `El partido tiene un ritmo frenético con mucha ida y vuelta. Recomendamos apostar a <strong>Más de ${currentCorners + 0.5} o ${currentCorners + 1.5} Córners</strong> totales.`;
    }

    // 2. Build HTML Template
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #0df0a3 0%, #0ea5e9 100%); padding: 24px; text-align: center;">
          <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">ZENTRA PREMIUM</h1>
          <p style="color: #000; margin: 5px 0 0 0; font-weight: 700; opacity: 0.8;">RADAR DE VALOR - ALERTA EN VIVO</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #334155; margin-bottom: 24px;">
            <p style="color: #94a3b8; font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0 0 12px 0;">Minuto ${minute}'</p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
              <div style="text-align: right; flex: 1;">
                <span style="font-weight: 800; font-size: 18px;">${game.homeCompetitor.name}</span>
              </div>
              <div style="background: #1e293b; padding: 8px 16px; border-radius: 8px; font-weight: 900; font-size: 24px; color: #0df0a3;">
                ${homeScore} - ${awayScore}
              </div>
              <div style="text-align: left; flex: 1;">
                <span style="font-weight: 800; font-size: 18px;">${game.awayCompetitor.name}</span>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(13, 240, 163, 0.1); border-left: 4px solid #0df0a3; padding: 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px;">
            <h3 style="color: #0df0a3; margin: 0 0 8px 0; font-size: 18px;">${sugTitle}</h3>
            <p style="color: #cbd5e1; margin: 0; font-size: 15px; line-height: 1.5;">${sugBody}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: rgba(255,255,255,0.02); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr>
                <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; border-bottom: 1px solid #334155;">Estadística</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; border-bottom: 1px solid #334155;">Local</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; border-bottom: 1px solid #334155;">Visitante</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 600;">Ataques Peligrosos</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #1e293b; font-weight: 800; color: #fff;">${homeAttacks}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #1e293b; font-weight: 800; color: #fff;">${awayAttacks}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 600;">Tiros a Puerta</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #1e293b; font-weight: 800; color: #fff;">${homeShots}</td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #1e293b; font-weight: 800; color: #fff;">${awayShots}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-size: 14px; font-weight: 600;">Córners</td>
                <td style="padding: 12px; text-align: center; font-weight: 800; color: #fff;">${homeCorners}</td>
                <td style="padding: 12px; text-align: center; font-weight: 800; color: #fff;">${awayCorners}</td>
              </tr>
            </tbody>
          </table>
          
          <a href="https://danielgarciagonzalezarmenia-ai.github.io/zentra-live/" style="display: block; width: 100%; text-align: center; background: #0df0a3; color: #000; padding: 14px 0; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px;">Ir a ZENTRA Live</a>
        </div>
        <div style="background: #0b1120; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          Recibes este correo porque tienes activa tu membresía ZENTRA Premium. Las apuestas conllevan riesgo, juega con responsabilidad.
        </div>
      </div>
    `;

    const mailOptions = {
      from: '"ZENTRA Premium Radar" <' + process.env.EMAIL_USER + '>',
      bcc: emails.join(','), // bcc para no revelar los correos entre sí
      subject: alertType === 'goal' 
        ? `🔥 ALERTA DE GOL: ${game.homeCompetitor.name} vs ${game.awayCompetitor.name}`
        : `⛳ ALERTA DE CÓRNERS: ${game.homeCompetitor.name} vs ${game.awayCompetitor.name}`,
      html: htmlTemplate
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Premium Radar] Alerta enviada a ${emails.length} usuarios para el partido ${game.id}`);
    
  } catch (err) {
    console.error("Error sending premium emails:", err);
  }
}

// Iniciar el cron job cada 5 minutos (300,000 ms)
setInterval(checkLiveMatchesAndAlert, 300000);
console.log("ZENTRA Premium Radar cron job started. Checking live games every 5 minutes.");
