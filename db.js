import Database from "better-sqlite3";


const db = new Database("orders.db");
db.pragma("journal_mode = WAL");


// --- Tables (create if not exists)
db.exec(`
CREATE TABLE IF NOT EXISTS menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_cents INTEGER NOT NULL,
  available INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(category_id) REFERENCES menu_categories(id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW', -- NEW, PREPARING, READY, COMPLETED
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  item_name_snapshot TEXT NOT NULL,
  price_cents_snapshot INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(item_id) REFERENCES menu_items(id)
);
`);


// --- Seed data only if empty
const catCount = db.prepare(`SELECT COUNT(*) as c FROM menu_categories`).get().c;
if (catCount === 0) {
  const insertCat = db.prepare(`INSERT INTO menu_categories (name, sort_order) VALUES (?, ?)`);
  const burgersId = insertCat.run("Burgers", 1).lastInsertRowid;
  const sidesId = insertCat.run("Sides", 2).lastInsertRowid;
  const drinksId = insertCat.run("Drinks", 3).lastInsertRowid;


  const insertItem = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, price_cents, available)
    VALUES (@category_id, @name, @description, @price_cents, @available)
  `);


  const items = [
    { category_id: burgersId, name: "Classic Burger", description: "150g beef patty, lettuce, tomato", price_cents: 8500, available: 1 },
    { category_id: burgersId, name: "Cheese Burger", description: "Beef patty with cheddar", price_cents: 9500, available: 1 },
    { category_id: sidesId, name: "Chips", description: "Crispy fries", price_cents: 3500, available: 1 },
    { category_id: drinksId, name: "Cola", description: "330ml can", price_cents: 2000, available: 1 }
  ];
  const tx = db.transaction(() => items.forEach(i => insertItem.run(i)));
  tx();
}


export default db;