# 🌾 BarterRoot — Smart Barter Exchange Platform

A full-stack web application for fair, cashless exchange of goods using Standard Value Units (SVU).

---

## 📁 Project Structure

```
barterroot/
├── backend/
│   ├── models/
│   │   ├── User.js        ← MongoDB user schema
│   │   ├── Listing.js     ← Product listing schema + SVU auto-calc
│   │   └── Trade.js       ← Trade request schema
│   ├── routes/
│   │   ├── auth.js        ← POST /api/auth/register, /api/auth/login
│   │   ├── listings.js    ← GET/POST/DELETE + matching engine
│   │   ├── trades.js      ← GET/POST + accept/decline/confirm/dispute
│   │   └── users.js       ← GET/PATCH /api/users/me
│   ├── middleware/
│   │   └── auth.js        ← JWT protect middleware
│   ├── server.js          ← Express app + MongoDB connect
│   ├── package.json
│   └── .env.example       ← Copy to .env and fill values
└── frontend/
    └── index.html         ← Full SPA (all 4 screens)
```

---

## 🚀 Setup & Run

### Step 1 — Install MongoDB
- Download from https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (free cloud): https://cloud.mongodb.com

### Step 2 — Install Node.js
- Download from https://nodejs.org (version 16 or above)

### Step 3 — Install dependencies
```bash
cd barterroot/backend
npm install
```

### Step 4 — Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/barterroot
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### Step 5 — Run the server
```bash
node server.js
```
You should see:
```
✅ MongoDB connected
🚀 BarterRoot server running on http://localhost:5000
```

### Step 6 — Open the app
Go to: **http://localhost:5000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get token |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/listings | Browse all active listings |
| GET | /api/listings/mine | My listings |
| GET | /api/listings/match | Find matched listings (SVU matching engine) |
| POST | /api/listings | Add a new listing |
| DELETE | /api/listings/:id | Remove a listing |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trades | All my trades |
| GET | /api/trades/incoming | Pending requests received |
| POST | /api/trades | Send trade request |
| PATCH | /api/trades/:id/accept | Accept a trade |
| PATCH | /api/trades/:id/decline | Decline a trade |
| PATCH | /api/trades/:id/confirm | Confirm receipt |
| PATCH | /api/trades/:id/dispute | Raise dispute |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/me | Get my profile |
| PATCH | /api/users/me | Update name/location |

---

## ⚙️ SVU Rate Table

| Category | Rate |
|----------|------|
| Grains (Rice, Wheat, Dal) | 50 SVU / kg |
| Fruits | 120 SVU / kg |
| Vegetables | 40 SVU / kg |
| Dairy | 80 SVU / kg |
| Pharmaceuticals | 800 SVU / unit |
| Other goods | 60 SVU / kg |

**Formula:** Total SVU = SVU Rate × Quantity

---

## 🧠 Matching Algorithm

```
User A SVU = 380 (6kg rice + 2kg wheat)
User B SVU = 390 (2kg apples + 5kg tomatoes)

Difference = |380 - 390| = 10 SVU
Percentage = (10 / 390) × 100 = 2.56%

→ FAIR TRADE ✅ (within 5% threshold)
```

| Range | Label |
|-------|-------|
| 0% – 5% | ✅ Fair Trade |
| 5% – 15% | ⚠️ Near Match |
| 15%+ | ❌ Imbalanced |

---

## 💻 Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Password | bcryptjs (hashed) |

---

## 📱 App Screens

1. **Login / Register** — Secure auth with JWT
2. **How It Works** — SVU explanation + 5-step guide
3. **List Goods** — Add goods, auto SVU calc, manage listings
4. **Browse** — See all listings, filter by category, find matches
5. **Trading** — Incoming requests, accept/decline/confirm, history

---

## 🔮 Future Enhancements

- Real-time notifications with Socket.io
- Image upload for quality verification (Multer)
- Location-based matching with GPS
- Rating system after completed trades
- Mobile app with React Native

---

*Advanced Web Technologies Project — 2025-2026*
