const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const eventRoutes = require('./routes/eventRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const ticketRoutes = require('./routes/ticketRoutes.js');
const organizerRoutes = require('./routes/organizerRoutes.js');
const paymentRoutes = require('./routes/paymentRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('EventZilla API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
