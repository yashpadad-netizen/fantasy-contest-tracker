const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'fantasy-secret';
const DB_FILE = path.join(__dirname, 'db.json');

const users = [
  {
    id: '1',
    name: 'Admin',
    isAdmin: true,
    username: 'admin',
    passwordHash: '9a0c5eb0b0cd3658d3aeefc41a63d8923264f5b454106bfa9a21fce9e29db989'
  },
  {
    id: '2',
    name: 'User',
    isAdmin: false,
    username: 'user',
    passwordHash: '3e7c19576488862816f13b512cacf3e4ba97dd97243ea0bd6a2ad1642d86ba72'
  }
];

app.use(cors());
app.use(express.json());

async function loadDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { contests: [] };
    }
    throw error;
  }
}

async function saveDb(db) {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const normalizedUsername = username.toString().trim().toLowerCase();
  const account = users.find((user) => user.username === normalizedUsername);

  if (!account || hashPassword(password) !== account.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: account.id, name: account.name, isAdmin: account.isAdmin },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    user: {
      id: account.id,
      name: account.name,
      isAdmin: account.isAdmin
    },
    token
  });
});

app.get('/api/contests', requireAuth, async (req, res) => {
  const db = await loadDb();
  res.json(db.contests || []);
});

app.get('/api/contests/:id', requireAuth, async (req, res) => {
  const db = await loadDb();
  const contest = db.contests.find((item) => item.id === req.params.id);
  if (!contest) {
    return res.status(404).json({ message: 'Contest not found' });
  }
  res.json(contest);
});

app.post('/api/contests', requireAuth, requireAdmin, async (req, res) => {
  const contest = req.body;
  if (!contest || !contest.id) {
    return res.status(400).json({ message: 'Contest data is required' });
  }

  const db = await loadDb();
  db.contests = [...(db.contests || []), contest];
  await saveDb(db);

  res.status(201).json(contest);
});

app.put('/api/contests/:id', requireAuth, requireAdmin, async (req, res) => {
  const updatedContest = req.body;
  if (!updatedContest || !updatedContest.id) {
    return res.status(400).json({ message: 'Contest data is required' });
  }

  const db = await loadDb();
  const index = (db.contests || []).findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Contest not found' });
  }

  db.contests[index] = updatedContest;
  await saveDb(db);
  res.json(updatedContest);
});

app.delete('/api/contests/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = await loadDb();
  db.contests = (db.contests || []).filter((item) => item.id !== req.params.id);
  await saveDb(db);
  res.status(204).send();
});

app.post('/api/contests/import', requireAuth, requireAdmin, async (req, res) => {
  const contests = req.body;
  if (!Array.isArray(contests)) {
    return res.status(400).json({ message: 'Array of contests required' });
  }

  const db = await loadDb();
  db.contests = [...(db.contests || []), ...contests];
  await saveDb(db);
  res.status(201).json(db.contests);
});

app.put('/api/contests', requireAuth, requireAdmin, async (req, res) => {
  const contests = req.body;
  if (!Array.isArray(contests)) {
    return res.status(400).json({ message: 'Array of contests required' });
  }

  const db = await loadDb();
  db.contests = contests;
  await saveDb(db);
  res.json(db.contests);
});

const distPath = path.join(__dirname, '..', 'dist', 'fantasy-contest-tracker');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'browser', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
