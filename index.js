import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import db from "./db.js";


const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// Helpers
const getMenu = () => {
  const cats = db.prepare(`SELECT * FROM menu_categories ORDER BY sort_order ASC, name ASC`).all();
  const items = db.prepare(`SELECT * FROM menu_items ORDER BY id ASC`).all();
  return cats.map(c => ({
    id: c.id,
    name: c.name,
    items: items.filter(i => i.category_id === c.id).map(i => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price_cents: i.price_cents,
      available: !!i.available
    }))
  }));
};


const getOrderWithItems = (orderId) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
  const items = db.prepare(`
    SELECT oi.*, mi.name as current_name
    FROM order_items oi
    LEFT JOIN menu_items mi ON mi.id = oi.item_id
    WHERE oi.order_id = ?
  `).all(orderId);
  return { ...order, items };
};


const listActiveOrders = () => {
  // Show all not-completed orders, newest first
  const all = db.prepare(`
    SELECT * FROM orders WHERE status != 'COMPLETED' ORDER BY datetime(created_at) DESC
  `).all();
  return all.map(o => getOrderWithItems(o.id));
};


// Routes
app.get("/api/menu", (req, res) => {
  res.json({ categories: getMenu() });
});


app.post("/api/menu", (req, res) => {
  const { categoryId, name, description = "", priceZAR, available = true } = req.body || {};
  if (!categoryId || !name || priceZAR == null) {
    return res.status(400).json({ error: "categoryId, name, priceZAR are required" });
  }
  const stmt = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, price_cents, available)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(categoryId, name, description, Math.round(Number(priceZAR) * 100), available ? 1 : 0);
  res.json({ id: info.lastInsertRowid });
});


app.put("/api/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, description, priceZAR } = req.body || {};
  const existing = db.prepare(`SELECT * FROM menu_items WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: "Item not found" });
  const stmt = db.prepare(`
    UPDATE menu_items SET name = ?, description = ?, price_cents = ?
    WHERE id = ?
  `);
  stmt.run(name ?? existing.name, description ?? existing.description, priceZAR != null ? Math.round(Number(priceZAR) * 100) : existing.price_cents, id);
  res.json({ ok: true });
});


app.patch("/api/menu/:id/availability", (req, res) => {
  const id = Number(req.params.id);
  const { available } = req.body || {};
  if (available == null) return res.status(400).json({ error: "available is required" });
  const stmt = db.prepare(`UPDATE menu_items SET available = ? WHERE id = ?`);
  stmt.run(available ? 1 : 0, id);
  res.json({ ok: true });
});


app.get("/api/orders", (req, res) => {
  res.json({ orders: listActiveOrders() });
});


app.post("/api/orders", (req, res) => {
  const { customerName, phone, items } = req.body || {};
  if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "customerName, phone, and items[] are required" });
  }


  // Validate items and compute total from DB
  const getItem = db.prepare(`SELECT * FROM menu_items WHERE id = ?`);
  let total = 0;
  const normalized = [];
  for (const it of items) {
    const row = getItem.get(it.itemId);
    if (!row || !row.available) {
      return res.status(400).json({ error: `Item ${it.itemId} unavailable` });
    }
    const qty = Math.max(1, Number(it.qty || 1));
    total += row.price_cents * qty;
    normalized.push({
      item_id: row.id,
      qty,
      item_name_snapshot: row.name,
      price_cents_snapshot: row.price_cents
    });
  }


  // Insert order + order_items in a transaction
  const tx = db.transaction(() => {
    const oinfo = db.prepare(`
      INSERT INTO orders (customer_name, phone, total_cents, status)
      VALUES (?, ?, ?, 'NEW')
    `).run(customerName, phone, total);
    const orderId = oinfo.lastInsertRowid;


    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, item_id, qty, item_name_snapshot, price_cents_snapshot)
      VALUES (?, ?, ?, ?, ?)
    `);
    normalized.forEach(n => insertItem.run(orderId, n.item_id, n.qty, n.item_name_snapshot, n.price_cents_snapshot));
    return orderId;
  });


  const orderId = tx();
  const payload = getOrderWithItems(orderId);
  io.emit("order:new", payload);
  res.json({ ok: true, orderId });
});


app.patch("/api/orders/:id/status", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = new Set(["NEW", "PREPARING", "READY", "COMPLETED"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });


  const existing = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: "Order not found" });


  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
  const payload = getOrderWithItems(id);
  io.emit("order:update", payload);
  res.json({ ok: true });
});


// HTML routes (optional shortcuts)
app.get("/", (_, res) => res.redirect("/customer"));
app.get("/customer", (_, res) => res.sendFile(process.cwd() + "/public/customer.html"));
app.get("/admin", (_, res) => res.sendFile(process.cwd() + "/public/admin.html"));


// Socket.IO
io.on("connection", () => { /* no-op */ });


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Order MVP running on http://localhost:${PORT}`);
});