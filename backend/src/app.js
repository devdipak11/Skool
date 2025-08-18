const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const resultRoutes = require('./routes/resultRoutes');

const commentRoutes = require('./routes/commentRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded files (banners, etc.) from public/uploads
// Multer in controllers saves files to backend/public/uploads — serve that directory
const uploadsPath = path.join(__dirname, '../public/uploads');
console.log('Serving uploaded files from:', uploadsPath);
// Ensure directory exists
if (!fs.existsSync(uploadsPath)) {
   console.warn('Uploads directory does not exist, creating:', uploadsPath);
   fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// <-- Add public banners endpoint so students can fetch the real banners set by admin -->
app.get('/api/banners', async (req, res) => {
  try {
    const Banner = require('./models/Banner');
    const banners = await Banner.find().sort({ createdAt: -1 });
    // return array of banner objects: {_id, title, description, imageUrl, ...}
    return res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return res.status(500).json({ message: 'Error fetching banners' });
  }
});
// <-- end public banners endpoint -->

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/results', resultRoutes);

app.use('/api/comments', commentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});