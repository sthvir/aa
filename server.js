const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // For deleting files from the filesystem

const app = express();
const PORT = 3000;
// !!! IMPORTANT: THIS CODE IS ONLY FOR TESTING. USE ENVIRONMENT VARIABLES FOR PRODUCTION !!!
const UPLOAD_SECRET = '9B-Teacher-2024'; 

// --- 1. Database Setup (MongoDB) ---
mongoose.connect('mongodb://localhost:27017/Alliant9B', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const ResourceSchema = new mongoose.Schema({
    title: String,
    filename: String, 
    mimetype: String,
    uploadDate: { type: Date, default: Date.now }
});
const Resource = mongoose.model('Resource', ResourceSchema);

// --- 2. File Storage Setup (Multer) ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        // Creates a unique name to prevent collisions
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 3. Middleware ---
app.use(cors()); 
app.use(express.json());
// Serves files from the /uploads folder so users can download them
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// Middleware to check authentication code for upload/delete
function checkAuth(req, res, next) {
    const code = req.headers['x-upload-code']; // Code is passed in the header
    if (code === UPLOAD_SECRET) {
        next(); 
    } else {
        res.status(401).json({ success: false, message: 'Invalid Permission Code.' });
    }
}

// --- 4. API Endpoints ---

// GET: Fetch all resources for display (Students and Teachers)
app.get('/api/resources', async (req, res) => {
    const resources = await Resource.find().sort({ uploadDate: -1 });
    res.json({ success: true, resources });
});

// POST: Upload a new file (Protected by checkAuth)
app.post('/api/upload', checkAuth, upload.single('resourceFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file selected.' });
    }
    
    const newResource = new Resource({
        title: req.body.resourceTitle,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
    });
    
    await newResource.save();
    res.json({ success: true, message: 'File uploaded and resource created successfully!' });
});

// DELETE: Delete a resource (Protected by checkAuth)
app.delete('/api/resource/:id', checkAuth, async (req, res) => {
    const resourceId = req.params.id;
    
    try {
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found.' });
        }
        
        // 1. Delete the file from the server's filesystem
        const filePath = path.join(__dirname, 'uploads', resource.filename);
        fs.unlinkSync(filePath); // Synchronous delete
        
        // 2. Delete the record from the database
        await Resource.deleteOne({ _id: resourceId });

        res.json({ success: true, message: 'Resource deleted successfully.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting resource.', error });
    }
});

// --- 5. Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});