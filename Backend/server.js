require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '12h';
const refreshTokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const resetTokenTtlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES || 60);
const resetReturnToken = String(process.env.RESET_RETURN_TOKEN || 'false') === 'true';
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = String(process.env.SMTP_SECURE || 'false') === 'true';
const smtpFrom = process.env.SMTP_FROM || 'no-reply@example.com';
const offlineAfterMinutes = Number(process.env.OFFLINE_AFTER_MINUTES || 10);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  })
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins.includes('*') ? '*' : allowedOrigins },
});

// 1. Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 2. MQTT Connection (Input from Sensors)
const mqttClient = mqtt.connect(process.env.MQTT_URL || 'mqtt://broker.hivemq.com'); // Or your local broker

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  // Subscribe to all chamber data topics
  mqttClient.subscribe('chambers/+/data'); 
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const serialNumber = topic.split('/')[1]; // Extract serial from topic

    // Find Chamber ID based on Serial Number
    const chamberRes = await pool.query('SELECT id FROM chambers WHERE serial_number = $1', [serialNumber]);
    if (chamberRes.rows.length === 0) return;
    const chamberId = chamberRes.rows[0].id;

    // Update Chamber Status (reading already stored by ingestion layer)
    await pool.query("UPDATE chambers SET last_seen = NOW(), status = 'online' WHERE id = $1", [chamberId]);

    // Emit to Frontend via Socket.IO
    io.to(`chamber_${chamberId}`).emit('reading', {
      chamber_id: chamberId,
      temperature: payload.temperature,
      humidity: payload.humidity,
      co2: payload.co2,
      ethylene: payload.ethylene,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
    
  } catch (err) { console.error('MQTT processing error', err); }
});

mqttClient.on('error', (err) => {
  console.error('MQTT connection error', err);
});

// 3. API Endpoints (Output to Frontend)

const signAccessToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const mailTransporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

const sendResetEmail = async ({ email, resetUrl }) => {
  if (!mailTransporter) return;
  await mailTransporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Reset your FruitRipe password',
    text: `Use this link to reset your password: ${resetUrl}`,
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

// Login (JWT + password hash)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshTokenHash, refreshExpiresAt]
  );

  res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
});

// Registration (hash password)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, passwordHash]
  );

  const user = created.rows[0];
  const token = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshTokenHash, refreshExpiresAt]
  );

  res.status(201).json({ token, refreshToken, user });
});

// Request password reset
app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const userRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    return res.json({ success: true });
  }

  const user = userRes.rows[0];
  const resetToken = generateRefreshToken();
  const resetTokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + resetTokenTtlMinutes * 60 * 1000);

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, resetTokenHash, expiresAt]
  );

  const resetUrl = `${frontendBaseUrl}/#/reset?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;

  try {
    await sendResetEmail({ email, resetUrl });
  } catch (err) {
    console.error('Failed to send reset email', err);
  }

  if (resetReturnToken) {
    return res.json({ success: true, resetToken, resetUrl });
  }
  return res.json({ success: true, resetUrl });
});

// Confirm password reset
app.post('/api/auth/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  const tokenHash = hashToken(token);
  const tokenRes = await pool.query(
    'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  if (tokenRes.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const stored = tokenRes.rows[0];
  if (stored.used_at || new Date(stored.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, stored.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [stored.id]);

  res.json({ success: true });
});

// Refresh token rotation
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const refreshTokenHash = hashToken(refreshToken);
  const tokenRes = await pool.query(
    'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = $1',
    [refreshTokenHash]
  );
  if (tokenRes.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const stored = tokenRes.rows[0];
  if (new Date(stored.expires_at) < new Date()) {
    await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [stored.id]);
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [stored.user_id]);
  if (userRes.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const user = userRes.rows[0];
  const token = signAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = hashToken(newRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [stored.id]);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, newRefreshTokenHash, refreshExpiresAt]
  );

  res.json({ token, refreshToken: newRefreshToken, user });
});

// Logout (invalidate refresh token)
app.post('/api/auth/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const refreshTokenHash = hashToken(refreshToken);
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshTokenHash]);
  res.json({ success: true });
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

app.use('/api', authMiddleware);

app.get('/api/chambers', async (req, res) => {
  // Return chambers with their latest reading attached
  const result = await pool.query(`
    SELECT c.*, 
    (SELECT row_to_json(r) FROM (SELECT * FROM sensor_readings WHERE chamber_id = c.id ORDER BY timestamp DESC LIMIT 1) r) as current_reading 
    FROM chambers c WHERE c.user_id = $1 ORDER BY c.name`, [req.user.userId]);
  res.json(result.rows);
});

app.get('/api/chambers/:id/readings', async (req, res) => {
  const range = String(req.query.range || '24h');
  const rangeHoursMap = { '1h': 1, '24h': 24, '7d': 24 * 7 };
  const hours = rangeHoursMap[range] || 24;
  const limitMap = { '1h': 200, '24h': 1000, '7d': 5000 };
  const limit = limitMap[range] || 1000;

  const result = await pool.query(
    `SELECT r.*
     FROM sensor_readings r
     JOIN chambers c ON c.id = r.chamber_id
     WHERE r.chamber_id = $1 AND c.user_id = $2
     AND r.timestamp >= NOW() - ($3 * INTERVAL '1 hour')
     ORDER BY r.timestamp DESC
     LIMIT $4`,
    [req.params.id, req.user.userId, hours, limit]
  );
  res.json(result.rows.reverse()); // Send oldest to newest for charts
});

app.get('/api/chambers/:id/events', async (req, res) => {
  const result = await pool.query(
    `SELECT e.*
     FROM device_events e
     JOIN chambers c ON c.id = e.chamber_id
     WHERE e.chamber_id = $1 AND c.user_id = $2
     ORDER BY e.event_timestamp DESC LIMIT 50`,
    [req.params.id, req.user.userId]
  );
  res.json(result.rows);
});

app.get('/api/chambers/:id/alerts', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*
     FROM alert_rules a
     JOIN chambers c ON c.id = a.chamber_id
     WHERE a.chamber_id = $1 AND c.user_id = $2`,
    [req.params.id, req.user.userId]
  );
  res.json(result.rows);
});

app.put('/api/chambers/:id/alerts', async (req, res) => {
  const { parameter, min_value, max_value, enabled } = req.body;
  const chamberId = req.params.id;

  const chamberRes = await pool.query('SELECT id FROM chambers WHERE id = $1 AND user_id = $2', [
    chamberId,
    req.user.userId,
  ]);
  if (chamberRes.rows.length === 0) {
    return res.status(404).json({ error: 'Chamber not found' });
  }

  await pool.query(`
    INSERT INTO alert_rules (chamber_id, parameter, min_value, max_value, enabled)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (chamber_id, parameter) 
    DO UPDATE SET min_value = EXCLUDED.min_value, max_value = EXCLUDED.max_value, enabled = EXCLUDED.enabled;
  `, [chamberId, parameter, min_value, max_value, enabled]);
  
  res.json({ success: true });
});

// Socket.io Room Management
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    socket.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_room', async (room) => {
    const chamberId = Number(String(room).replace('chamber_', ''));
    if (!Number.isFinite(chamberId)) return;
    const chamberRes = await pool.query('SELECT id FROM chambers WHERE id = $1 AND user_id = $2', [
      chamberId,
      socket.user.userId,
    ]);
    if (chamberRes.rows.length === 0) return;
    socket.join(room);
  });
  socket.on('leave_room', (room) => socket.leave(room));
});

// Background job to mark chambers offline after inactivity
setInterval(async () => {
  try {
    await pool.query(
      "UPDATE chambers SET status = 'offline' WHERE last_seen IS NOT NULL AND last_seen < NOW() - ($1 * INTERVAL '1 minute') AND status <> 'offline'",
      [offlineAfterMinutes]
    );
  } catch (err) {
    console.error('Offline status job failed', err);
  }
}, 60 * 1000);

const port = Number(process.env.PORT || 4000);
server.listen(port, () => console.log(`Server running on port ${port}`));