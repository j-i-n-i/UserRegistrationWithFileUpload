const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// MySQL Database Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'newuser',  
    password: 'newpassword',  
    database: 'UserRegistrationDB'
});


// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// File Upload Configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Route: Display Form
app.get('/', (req, res) => {
    res.render('register');
});

// Route: Handle Form Submission
app.post('/register', upload.array('files', 10), (req, res) => {
    const { username, email, password } = req.body;
    const profileImage = req.files[0]?.filename || null;
    const uploadedFiles = req.files.map(file => file.filename).join(',');

    const query = 'INSERT INTO Users (Username, Email, Password, ProfileImage, UploadedFiles) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [username, email, password, profileImage, uploadedFiles], (err, results) => {
        if (err) {
            console.error(err);
            res.send('Error saving user data.');
            return;
        }
        res.redirect('/files');
    });
});

// Route: List Uploaded Files
app.get('/files', (req, res) => {
    db.query('SELECT UploadedFiles FROM Users', (err, results) => {
        if (err) {
            console.error(err);
            res.send('Error fetching files.');
            return;
        }
        const files = results.map(record => record.UploadedFiles).join(',').split(',');
        res.render('files', { files: files });
    });
});

// Route: Download File
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.download(filePath);
});

// Start Server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
