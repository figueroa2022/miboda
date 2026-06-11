import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Safe detection for ES modules vs CommonJS
let localFilename = '';
let localDirname = '';
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    localFilename = fileURLToPath(import.meta.url);
    localDirname = path.dirname(localFilename);
  } else {
    localFilename = __filename;
    localDirname = __dirname;
  }
} catch (e) {
  // Safe fallback if neither is available
}

const PORT = 3000;

// Setup directories
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Pre-create categorized folders under uploads as requested by the user
const ALBUMS = ['engagement', 'civil', 'ceremony', 'reception'];
ALBUMS.forEach(album => {
  const albumDir = path.join(UPLOADS_DIR, album);
  if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
  }
});

// Default initial data for database
const defaultDb = {
  photos: [
    {
      id: 'init-1',
      url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200',
      category: 'engagement',
      uploadedBy: 'Inspiración',
      uploadedAt: '2024-06-14T10:00:00.000Z',
      likes: 12,
      caption: 'La mágica propuesta de matrimonio de Valentina y Anderson, donde dijimos "¡Sí, acepto!" bajo el atardecer.',
      comments: [
        {
          id: 'c1',
          username: 'Valentina',
          text: '¡El inicio más tierno de toda nuestra vida juntos! 😍💍',
          createdAt: '2024-06-14T10:02:00.000Z'
        },
        {
          id: 'c2',
          username: 'Anderson',
          text: 'Estaba muy nervioso cuidando que el anillo no se cayera, ¡pero valió cada milésima de segundo! ❤️',
          createdAt: '2024-06-14T10:05:00.000Z'
        }
      ]
    },
    {
      id: 'init-2',
      url: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=1200',
      category: 'civil',
      uploadedBy: 'Inspiración',
      uploadedAt: '2024-06-14T11:00:00.000Z',
      likes: 8,
      caption: 'Nuestra elegante boda civil: firmando nuestro compromiso ante la ley con corazones llenos de ilusión.',
      comments: [
        {
          id: 'c3',
          username: 'Mamá Sofía',
          text: '¡Qué felicidad tan grande verlos consolidar legalmente este hermoso amor! Los amamos.',
          createdAt: '2024-06-14T11:15:00.000Z'
        }
      ]
    },
    {
      id: 'init-3',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
      category: 'ceremony',
      uploadedBy: 'Inspiración',
      uploadedAt: '2024-06-14T14:30:00.000Z',
      likes: 24,
      caption: 'La ceremonia nupcial donde unimos nuestros caminos bajo pétalos, sonrisas y votos eternos.',
      comments: [
        {
          id: 'c4',
          username: 'Tía Marta',
          text: '¡Se me salieron las lágrimas al verlos caminar hacia el altar! Un día inolvidable.',
          createdAt: '2024-06-14T15:00:00.000Z'
        }
      ]
    },
    {
      id: 'init-4',
      url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=1200',
      category: 'reception',
      uploadedBy: 'Inspiración',
      uploadedAt: '2024-06-14T19:00:00.000Z',
      likes: 35,
      caption: 'El espectacular espacio de la Recepción: risas, primer baile de esposos, brindis, ¡y fiesta sin fin!',
      comments: [
        {
          id: 'c5',
          username: 'Primo Diego',
          text: '¡El banquete y la música estuvieron increíbles! Qué manera de celebrar el amor de Valentina y Anderson.',
          createdAt: '2024-06-14T20:30:00.000Z'
        }
      ]
    }
  ],
  backgroundUrl: null
};

// Ensure database file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
}

const getDbData = () => {
  let db: any;
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(content);
  } catch (error) {
    console.error('Error reading DB:', error);
    db = JSON.parse(JSON.stringify(defaultDb));
  }

  // Scan physical directories for files added directly through the code editor/filesystem
  const categories = ['engagement', 'civil', 'ceremony', 'reception'];
  const existingUrls = new Set(db.photos.map((p: any) => p.url));
  let changed = false;

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.bmp'];

  categories.forEach(category => {
    const albumDir = path.join(UPLOADS_DIR, category);
    if (fs.existsSync(albumDir)) {
      try {
        const files = fs.readdirSync(albumDir);
        files.forEach(file => {
          if (file.startsWith('.') || file === '.gitkeep') {
            return;
          }
          const ext = path.extname(file).toLowerCase();
          if (!validExtensions.includes(ext)) {
            return;
          }

          const relativeUrl = `/uploads/${category}/${file}`;
          // If this file does not have an entry in the JSON database, register it as shared by "Novios"
          if (!existingUrls.has(relativeUrl)) {
            const stats = fs.statSync(path.join(albumDir, file));
            const newPhoto = {
              id: `imported-${category}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              url: relativeUrl,
              category: category,
              uploadedBy: 'Novios',
              uploadedAt: stats.mtime.toISOString(),
              likes: 0,
              caption: '',
              comments: []
            };
            db.photos.unshift(newPhoto);
            existingUrls.add(relativeUrl);
            changed = true;
          }
        });
      } catch (err) {
        console.error(`Error scanning album directory for ${category}:`, err);
      }
    }
  });

  if (changed) {
    saveDbData(db);
  }

  return db;
};

const saveDbData = (data: typeof defaultDb) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
};

async function startServer() {
  const app = express();

  // Set high limit for base64 photo uploads from mobile camera (otherwise express errors block heavy uploads)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads folder
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Get album content
  app.get('/api/album-data', (req, res) => {
    const db = getDbData();
    res.json(db);
  });

  // Upload photo as base64 string
  app.post('/api/upload', (req, res) => {
    try {
      const { filename, data, category, username, caption } = req.body;

      if (!data || !category || !username) {
        return res.status(400).json({ error: 'Missing required fields: data, category, username' });
      }

      // Validate that category represents one of our registered albums
      const ALL_ALBUMS = ['engagement', 'civil', 'ceremony', 'reception'];
      if (!ALL_ALBUMS.includes(category)) {
        return res.status(400).json({ error: `La categoría '${category}' no es válida. Debe ser una de: ${ALL_ALBUMS.join(', ')}` });
      }

      // Check if it has the base64 prefix and extract it
      const matches = data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 image data format' });
      }

      const ext = matches[1];
      const base64Content = matches[2];
      const buffer = Buffer.from(base64Content, 'base64');

      // Unique filename
      const uniqueFilename = `photo-${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;
      
      // Target localized subfolder inside the code uploads directory
      const albumDirPath = path.join(UPLOADS_DIR, category);
      if (!fs.existsSync(albumDirPath)) {
        fs.mkdirSync(albumDirPath, { recursive: true });
      }

      const filePath = path.join(albumDirPath, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      const db = getDbData();
      const relativeUrl = `/uploads/${category}/${uniqueFilename}`;

      const newPhoto = {
        id: `uploaded-${Date.now()}`,
        url: relativeUrl,
        category: category,
        uploadedBy: username,
        uploadedAt: new Date().toISOString(),
        likes: 0,
        caption: caption || '',
        comments: []
      };

      db.photos.unshift(newPhoto); // Add to the beginning corresponding to live feed
      saveDbData(db);

      res.status(201).json(newPhoto);
    } catch (error) {
      console.error('Error during file upload:', error);
      res.status(500).json({ error: 'An error occurred while uploading. Please ensure image file is valid.' });
    }
  });

  // Update background image
  app.post('/api/update-background', (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const matches = data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid base64 image format' });
      }

      const ext = matches[1];
      const base64Content = matches[2];
      const buffer = Buffer.from(base64Content, 'base64');

      const bgFilename = `background-couple.${ext}`;
      const filePath = path.join(UPLOADS_DIR, bgFilename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Clear old background
      }

      fs.writeFileSync(filePath, buffer);

      const db = getDbData();
      db.backgroundUrl = `/uploads/${bgFilename}?t=${Date.now()}`; // Add timestamp to bypass caching
      saveDbData(db);

      res.json({ success: true, backgroundUrl: db.backgroundUrl });
    } catch (error) {
      console.error('Error setting background:', error);
      res.status(500).json({ error: 'Failed to save background image' });
    }
  });

  // Post comment
  app.post('/api/comment', (req, res) => {
    try {
      const { photoId, username, text } = req.body;

      if (!photoId || !username || !text) {
        return res.status(400).json({ error: 'Missing comment fields: photoId, username, text' });
      }

      const db = getDbData();
      const photo = db.photos.find((p: any) => p.id === photoId);

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      const newComment = {
        id: `comment-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        username,
        text,
        createdAt: new Date().toISOString()
      };

      photo.comments.push(newComment);
      saveDbData(db);

      res.status(201).json(newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  // Like photo
  app.post('/api/like', (req, res) => {
    try {
      const { photoId } = req.body;

      if (!photoId) {
        return res.status(400).json({ error: 'Missing photoId' });
      }

      const db = getDbData();
      const photo = db.photos.find((p: any) => p.id === photoId);

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      photo.likes = (photo.likes || 0) + 1;
      saveDbData(db);

      res.json({ success: true, likes: photo.likes });
    } catch (error) {
      console.error('Error liking photo:', error);
      res.status(500).json({ error: 'Failed to register like' });
    }
  });

  // Delete static item (for user organization control)
  app.post('/api/delete-photo', (req, res) => {
    try {
      const { photoId, username } = req.body;
      if (!photoId) {
        return res.status(400).json({ error: 'Missing photoId' });
      }
      
      const db = getDbData();
      const photoIndex = db.photos.findIndex((p: any) => p.id === photoId);
      
      if (photoIndex === -1) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      const photo = db.photos[photoIndex];
      // Allow deletion only if uploaded by user or 'Inspiración'
      if (photo.uploadedBy !== 'Inspiración' && photo.uploadedBy !== username) {
        return res.status(403).json({ error: 'No tienes permiso para borrar esta foto.' });
      }

      db.photos.splice(photoIndex, 1);
      saveDbData(db);

      // Try deleting file if it was a custom uploaded file
      if (photo.url.startsWith('/uploads/')) {
        const fileToDelete = path.join(process.cwd(), photo.url.split('?')[0]);
        if (fs.existsSync(fileToDelete)) {
          try {
            fs.unlinkSync(fileToDelete);
          } catch(e) {
            console.error('Error deleting physical file', e);
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ error: 'Failed to delete photo' });
    }
  });

  // --- End API ---

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULLSTACK SERVER] listening on http://localhost:${PORT}`);
  });
}

startServer();
