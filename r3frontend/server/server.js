const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { render } = require('@react-email/render');
const dotenv = require('dotenv');

// Import the transpiled React Email template
const { EmailTemplate } = require('./EmailTemplate');

dotenv.config();

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],        
    credentials: true                
}));

// Connect to SQLite database
const db = new sqlite3.Database('./LLMForms.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create a table if it doesn't exist
db.run(
    `CREATE TABLE IF NOT EXISTS credentials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, nationality TEXT, isKasrElBadiVisited TEXT)`,
    (err) => {
      if (err) {
        console.error(err.message);
      }
    }
);

// Configure nodemailer transporter
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, name) => {
  try {
    // Await the email HTML rendering
    const emailHtml = await render(EmailTemplate({ name }));
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'Thank You for Visiting Kasr El Badi',
      html: emailHtml,
    };

    // Send the email and return the result
    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email error:', error);
          reject(error);
        } else {
          console.log('Email sent:', info.response);
          resolve(info);
        }
      });
    });

    return info;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error;
  }
};

// Example route to send an email
app.post('/send-email', async (req, res) => {
  const { to, name } = req.body;

  try {
    const result = await sendEmail(to, name);
    res.status(200).json({ message: 'Email sent successfully', result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send email', error });
  }
});

// Endpoint to insert data into SQLite and send email
app.post('/api/credentials', async (req, res) => {
  const { name, email, nationality, isKasrElBadiVisited } = req.body;

  if (!name || !email || !nationality || isKasrElBadiVisited === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `INSERT INTO credentials (name, email, nationality, isKasrElBadiVisited) VALUES (?, ?, ?, ?)`;
  
  db.run(query, [name, email, nationality, isKasrElBadiVisited], async function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      await sendEmail(email, name);
      res.status(201).json({
        id: this.lastID,
        message: 'Data inserted and email sent successfully'
      });
    } catch (emailError) {
      // If email fails, we still keep the data but inform about email failure
      res.status(201).json({
        id: this.lastID,
        message: 'Data inserted successfully, but email could not be sent',
        emailError: emailError.message
      });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});