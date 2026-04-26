
# 🔥 BACKEND README (TickFlow Server)

```md
# 🎬 TickFlow Backend

Robust backend powering a real-world movie ticket booking platform with secure authentication, seat locking, payments, and booking workflows.

Built using **Node.js + Express + PostgreSQL + Redis**

---

## 🚀 Live API
https://tickflow-backend.onrender.com

---

## ⚡ Core Features

### 🔐 Authentication
- JWT Access + Refresh Tokens
- OTP Verification with Redis expiry
- Secure HTTP-only cookies
- Password hashing

### 🎟️ Booking Engine
- Seat availability validation
- Temporary seat locking
- Booking expiry timers
- Prevent double booking

### 💳 Payment System
- Razorpay order creation
- Signature verification
- Booking confirmation after payment
- Refund support structure

### 🎬 Public APIs
- Movies
- Shows
- Theatres
- Screens
- Universal Search
- Trending Movies

### 🛡️ Admin Features
- Add movies
- Add theatres
- Add shows
- Manage platform inventory

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT
- Razorpay
- bcrypt
- Nodemailer

---

## 📂 Architecture

```bash
src/
├── controllers/
├── routes/
├── middlewares/
├── db/
├── utils/
├── services/
⚙️ Setup
git clone https://github.com/sakshisingh0101/TickFlow_Backend.git
cd server
npm install
npm run dev
🔑 Environment Variables
PORT=5000

DATABASE_URL=your_postgres_url

REDIS_URL=your_redis_url

ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

EMAIL_USER=your_email
EMAIL_PASS=your_password
📌 Key Engineering Concepts
Relational DB design
Redis TTL sessions
Transactions for bookings
Payment gateway integration
Concurrency handling
REST API architecture
📈 Example Endpoints
GET /api/v1/public/getAllMovies
GET /api/v1/public/search
POST /api/v1/auth/login
POST /api/v1/bookings/createBooking
POST /api/v1/payments/createPaymentOrder/:bookingId
👨‍💻 Author

Sakshi
