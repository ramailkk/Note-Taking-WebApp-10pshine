const express = require('express');
const cors = require('cors');
// require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // your frontend dev port
app.use(express.json());


app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
