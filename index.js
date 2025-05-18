require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/user-routes');
const HttpError = require('./models/http-error');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use('/uploads/images',express.static(path.join('uploads','images')));

// CORS Configuration (Safe for Production)
const allowedOrigins = [
  "http://localhost:3000", // Local development // Production frontend URL
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


app.use('/api/places', placesRoutes); // => /api/places...
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  
  if(req.file) {
    fs.unlink(req.file.path , err => {
      console.log(err)
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  // ✅ Default: If error code is a number, use it. If not, use 500
  const statusCode = typeof error.code === "number" ? error.code : 500;

  res.status(statusCode).json({
    message: error.message || "An unknown error occurred!"
  });
});



mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pdsfvpg.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
.then( () => {
app.listen(3000);
})
.catch( (err) => {
  console.log(err);
})
