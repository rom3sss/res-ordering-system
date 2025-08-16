# 🍔 Order App MVP

A simple & efficient **order-taking system** for restaurants.  
Customers place an order from a digital menu (via link or QR code), and it instantly appears on the staff dashboard.  

- ✅ Customer-facing menu (mobile-friendly web page)  
- ✅ Admin dashboard with live ticket rail & menu management  
- ✅ Instant updates via WebSockets (with ping sound)  
- ✅ Offline-friendly: uses SQLite, no external services needed  
- ❌ No payments, accounts, or analytics (MVP only)  

---

## 🚀 Getting Started

### 1. Install Node.js
Download & install [Node.js](https://nodejs.org/en/download/) (v18+ recommended).

### 2. Clone or create project folder
```bash
git clone https://github.com/yourname/order-mvp.git
cd order-mvp
(or manually create the order-mvp/ folder and copy these files)

3. Install dependencies
bash
Copy
Edit
npm install
4. Run the server
bash
Copy
Edit
npm start
Server will start at:

arduino
Copy
Edit
http://localhost:3000
📱 Usage
Customer Menu: http://localhost:3000/customer

Browse menu, add items, review order, enter name & phone, place order.

Customer sees confirmation with order number.

Admin Dashboard: http://localhost:3000/admin

Live "ticket rail" shows new orders instantly (with ping).

Update order status: NEW → PREPARING → READY → COMPLETED.

Manage menu: add/edit items, mark unavailable.

🗄️ Database
Uses SQLite (orders.db) created automatically in the project root.

Pre-seeded with 3 categories and some sample items.

Tables:

menu_categories

menu_items

orders

order_items

✨ Example Workflow
Owner sets up menu in Admin Dashboard.

Customer scans QR → /customer menu opens.

Customer orders → order appears in Admin with ping.

Staff updates order status as it’s prepared.

Customer collects food & pays (outside system).

Order marked COMPLETED.

🛠️ Tech Stack
Backend: Node.js, Express

Database: SQLite (better-sqlite3)

Realtime: Socket.IO

Frontend: Plain HTML, CSS, Vanilla JS

📌 Notes
This is a Minimum Viable Product – simple, fast, and local-first.

No login, payments, or analytics included.

Can run entirely on a laptop, mini-PC, or Raspberry Pi.

Future features (optional): online payments, SMS notifications, live cart.

🏁 License
MIT License. Use freely for your restaurant MVP.

yaml
Copy
Edit

---

Would you like me to also include a **QR code generator script** (so you can print QR codes pointing to `/customer`)? That way your customers just scan and order right away.








