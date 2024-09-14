const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');  // Import nodemailer

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

// Configure nodemailer transporter (this is an example using Gmail)
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'merykarimi09@gmail.com',    // Replace with your email
    pass: 'gcsj zlsy xjtv twic'      // Replace with your email password (consider using environment variables)
  }
});

// Endpoint to insert data into SQLite and send email
app.post('/api/credentials', (req, res) => {
  const { name, email, nationality, isKasrElBadiVisited } = req.body;

  if (!name || !email || !nationality || !isKasrElBadiVisited) {
    return res.status(400).json({ error: 'Name, email, and others are required' });
  }

  const query = `INSERT INTO credentials (name, email, nationality, isKasrElBadiVisited) VALUES (?, ?, ?, ?)`;
  
  db.run(query, [name, email, nationality, isKasrElBadiVisited], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If data is inserted successfully, send the email
    let mailOptions = {
      from: 'merykarimi09@gmail.com',  // Replace with your email
      to: email,                     // Send email to the user who submitted the form
      subject: 'Form Submission Confirmation',
      text: `Dear ${name},\n\nThank you for submitting your information and visiting Kasr El Badi.\n\nWe would really appreciate it if you could take a moment to rate your visit and provide feedback.\n\nPlease click on the link below to rate your experience:\n\n[Provide Your Rating](https://docs.google.com/forms/d/e/1FAIpQLSeNNHo_-PPcGWuyjHIVzce-Qnwaffn-4XLjaVt3NjIW6p8vag/viewform?usp=sf_link)\n\nThank you for your time!\n\nBest regards,\nYour Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email error:', error); // Log the error to the console
        return res.status(500).json({ error: 'Email could not be sent: ' + error.message });
      }
      console.log('Email sent: ' + info.response); // Log successful email sending
      res.status(201).json({
        id: this.lastID,
        message: 'Data inserted and email sent successfully'
      });
    });
    
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
