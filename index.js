// const express = require('express');
// const cors = require('cors');
// const app = express();
// const tools = require('./data/tools.json');

// app.use(cors());
// app.use(express.json());

// let favorites = [];

// // GET /api/tools
// app.get('/api/tools', (req, res) => {
//   const category = req.query.category?.toLowerCase();
//   const filtered = category
//     ? tools.filter(tool => tool.category.toLowerCase() === category)
//     : tools;
//   res.json(filtered);
// });

// // GET /api/favorites
// app.get('/api/favorites', (req, res) => {
//   const favTools = tools.filter(tool => favorites.includes(tool.id));
//   res.json(favTools);
// });

// // POST /api/favorites
// app.post('/api/favorites', (req, res) => {
//   const { toolId } = req.body;
//   if (favorites.includes(toolId)) {
//     return res.status(400).json({ message: 'Tool already favorited' });
//   }
//   favorites.push(toolId);
//   res.json({ success: true });
// });

// // DELETE /api/favorites/:id
// app.delete('/api/favorites/:id', (req, res) => {
//   const id = Number(req.params.id);
//   favorites = favorites.filter(fav => fav !== id);
//   res.json({ success: true });
// });

// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Load initial tools data
let tools = [];
let favorites = [];

// Initialize data
async function initializeData() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'tools.json'), 'utf-8');
    tools = JSON.parse(data);
    console.log('Tools data loaded successfully');
  } catch (err) {
    console.error('Error loading tools data:', err);
    tools = []; // Fallback to empty array
  }
}

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000'], // Add your frontend URLs here
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// GET /api/tools - Get all tools or filter by category
app.get('/api/tools', (req, res) => {
  try {
    const category = req.query.category?.toLowerCase();
    const search = req.query.search?.toLowerCase();
    
    let filteredTools = [...tools];
    
    if (category) {
      filteredTools = filteredTools.filter(tool => 
        tool.category.toLowerCase().includes(category)
      );
    }
    
    if (search) {
      filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(search) ||
        tool.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    res.json(filteredTools);
  } catch (err) {
    console.error('Error fetching tools:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/favorites - Get favorite tools
app.get('/api/favorites', (req, res) => {
  try {
    const favTools = tools.filter(tool => favorites.includes(tool.id));
    res.json(favTools);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/favorites - Add a tool to favorites
app.post('/api/favorites', (req, res) => {
  try {
    const { toolId } = req.body;
    
    if (!toolId) {
      return res.status(400).json({ error: 'Tool ID is required' });
    }
    
    if (favorites.includes(toolId)) {
      return res.status(400).json({ message: 'Tool already favorited' });
    }
    
    favorites.push(toolId);
    res.json({ success: true, favorites });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/favorites/:id - Remove a tool from favorites
app.delete('/api/favorites/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    favorites = favorites.filter(fav => fav !== id);
    res.json({ success: true, favorites });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`- GET http://localhost:${PORT}/api/tools`);
    console.log(`- GET http://localhost:${PORT}/api/favorites`);
    console.log(`- POST http://localhost:${PORT}/api/favorites`);
    console.log(`- DELETE http://localhost:${PORT}/api/favorites/:id`);
  });
}).catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});