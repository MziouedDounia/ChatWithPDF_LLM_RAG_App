const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;

// Adjust the path to look for .env file in the correct directory
const envPath = path.resolve(__dirname, '..', '..', '.env');
console.log('Current working directory:', process.cwd());
console.log('.env file path:', envPath);

const result = dotenv.config({ 
  path: envPath,
  debug: process.env.DEBUG
});

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
} else {
  console.log('.env file loaded successfully');
}

console.log('Environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[REDACTED]' : 'Not set');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Database setup
const db = new sqlite3.Database('./LLMForms.db', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

const createTable = async () => {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT, 
        nationality TEXT, 
        isKasrElBadiVisited TEXT
      )`,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify the transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('Transporter verification error:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

const sendEmail = async (to, name) => {
  try {
    const templatePath = path.join(__dirname, 'emailTemplate.html');
    let emailHtml = await fs.readFile(templatePath, 'utf-8');
    emailHtml = emailHtml.replace('{{name}}', name);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Thank You for Visiting Kasr El Badi',
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error;
  }
};

// Routes
app.post('/send-email', async (req, res) => {
  const { to, name } = req.body;

  try {
    const result = await sendEmail(to, name);
    res.status(200).json({ message: 'Email sent successfully', result });
  } catch (error) {
    console.error('Error in /send-email route:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/api/credentials', async (req, res) => {
  const { name, email, nationality, isKasrElBadiVisited } = req.body;

  if (!name || !email || !nationality || isKasrElBadiVisited === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `INSERT INTO credentials (name, email, nationality, isKasrElBadiVisited) VALUES (?, ?, ?, ?)`;
  
  try {
    await new Promise((resolve, reject) => {
      db.run(query, [name, email, nationality, isKasrElBadiVisited], function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    await sendEmail(email, name);
    res.status(201).json({
      message: 'Data inserted and email sent successfully'
    });
  } catch (error) {
    console.error('Error in /api/credentials route:', error);
    res.status(500).json({
      message: 'An error occurred',
      error: error.message
    });
  }
});

// Server initialization
const startServer = async () => {
  try {
    await createTable();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();