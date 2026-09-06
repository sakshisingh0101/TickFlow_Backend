import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app=express();
const allowedOriginsString = process.env.CORS_ORIGIN;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',').map(s => s.trim()) : [];

// app.use(cors({
//     origin:process.env.CORS_ORIGIN,
//     credentials:true
// }))

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json(
    {
        limit:"16kb"
    }
))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())


import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import publicRouter from './routes/public.routes.js';
import userRouter from './routes/user.routes.js';
import paymentRouter from './routes/payment.routes.js';
import bookingRouter from './routes/bookings.routes.js';

app.use("/api/v1/auth" , authRouter);
app.use("/api/v1/admin" , adminRouter);
app.use("/api/v1/public" , publicRouter);
app.use("/api/v1/users",userRouter);
app.use("/api/v1/payments" , paymentRouter);
app.use("/api/v1/bookings" , bookingRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});


export {app};