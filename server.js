const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const products = [
  { id: 1, name: 'Energy Drink A', price: 20, stock: 10 },
  { id: 2, name: 'Energy Drink B', price: 25, stock: 10 },
  { id: 3, name: 'Energy Drink C', price: 30, stock: 10 }
];

const orders = [];
const points = new Map();

app.get('/api/products', (_req, res) => res.json(products));

app.post('/api/orders', (req, res) => {
  const { customer = 'guest', items = [], paymentMethod = 'promptpay' } = req.body;
  let total = 0;
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity < 1 || product.stock < item.quantity) {
      return res.status(400).json({ message: 'Invalid product or insufficient stock' });
    }
    total += product.price * item.quantity;
  }
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  }
  const currentPoints = points.get(customer) || 0;
  const earned = items.reduce((sum, item) => sum + item.quantity, 0);
  const nextPoints = currentPoints + earned;
  const free = Math.floor(nextPoints / 10);
  points.set(customer, nextPoints % 10);
  const order = { id: orders.length + 1, customer, items, total, paymentMethod, paymentStatus: 'pending', freeReward: free, createdAt: new Date().toISOString() };
  orders.push(order);
  res.status(201).json(order);
});

app.patch('/api/orders/:id/payment', (req, res) => {
  const order = orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.paymentStatus = req.body.status === 'paid' ? 'paid' : 'pending';
  res.json(order);
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vending server running on ${PORT}`));
