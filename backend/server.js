const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const JWT_SECRET = 'shopvault_secret_2024_premium';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── In-Memory Database ────────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'db.json');

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return { users: [], orders: [] };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ─── Seed Products ─────────────────────────────────────────────────
const PRODUCTS = [
  { id: '1', name: 'Obsidian Desk Lamp', price: 129.99, category: 'Lighting', rating: 4.8, reviews: 234, stock: 15, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80', description: 'Architectural masterpiece with adjustable arm and tungsten-warm LED. Perfect for the discerning workspace.', badge: 'Bestseller' },
  { id: '2', name: 'Merino Wool Throw', price: 89.99, category: 'Textiles', rating: 4.9, reviews: 178, stock: 8, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80', description: 'Ultra-fine 18.5 micron Merino sourced from New Zealand highlands. Naturally thermoregulating.', badge: 'New' },
  { id: '3', name: 'Ceramic Pour-Over Set', price: 74.99, category: 'Kitchen', rating: 4.7, reviews: 312, stock: 22, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', description: 'Hand-thrown stoneware pour-over with matching server. Matte charcoal glaze finish.', badge: null },
  { id: '4', name: 'Leather Journal', price: 54.99, category: 'Stationery', rating: 4.6, reviews: 445, stock: 30, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', description: 'Full-grain vegetable-tanned leather with 240 pages of 100gsm acid-free paper.', badge: 'Popular' },
  { id: '5', name: 'Walnut Side Table', price: 299.99, category: 'Furniture', rating: 4.9, reviews: 89, stock: 4, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', description: 'Solid black walnut with hairpin legs. Each piece unique, bearing the wood\'s natural character.', badge: 'Limited' },
  { id: '6', name: 'Linen Apron', price: 48.99, category: 'Kitchen', rating: 4.5, reviews: 201, stock: 18, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', description: 'Stonewashed Belgian linen with brass rivets. Cross-back design, fully adjustable.', badge: null },
  { id: '7', name: 'Brass Bookends', price: 64.99, category: 'Decor', rating: 4.7, reviews: 156, stock: 12, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80', description: 'Solid cast brass with an aged patina finish. Each set develops a unique character over time.', badge: null },
  { id: '8', name: 'Modular Planter', price: 39.99, category: 'Garden', rating: 4.4, reviews: 367, stock: 25, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', description: 'Self-watering concrete-look polymer. Modular design stacks infinitely.', badge: 'Sale' },
];

// ─── Auth Middleware ───────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────

// Products
app.get('/api/products', (req, res) => {
  const { category, search, sort } = req.query;
  let products = [...PRODUCTS];
  if (category && category !== 'All') products = products.filter(p => p.category === category);
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
  if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = PRODUCTS.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  const cats = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  res.json(cats);
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const db = loadDB();
  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashed, createdAt: new Date().toISOString() };
  db.users.push(user);
  saveDB(db);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json(req.user);
});

// Orders
app.post('/api/orders', auth, (req, res) => {
  const { items, shipping, payment } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items' });
  const db = loadDB();
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    userId: req.user.id,
    items,
    shipping,
    total: total + 9.99,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  saveDB(db);
  res.json(order);
});

app.get('/api/orders', auth, (req, res) => {
  const db = loadDB();
  const orders = db.orders.filter(o => o.userId === req.user.id);
  res.json(orders.reverse());
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`ShopVault running on http://localhost:${PORT}`));
