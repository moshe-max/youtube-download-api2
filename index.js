const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const basicAuth = require('basic-auth');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(morgan('dev'));

// === Basic Authentication Middleware ===
const AUTH_USER = process.env.API_USER || 'trainer';
const AUTH_PASS = process.env.API_PASS || 'secret';

app.use((req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== AUTH_USER || user.pass !== AUTH_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="Training Access"');
    return res.status(401).send('Access denied.');
  }
  next();
});

// === Rate Limiting ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 requests per 15 minutes per IP
  message: { error: 'Rate limit exceeded, please wait before retrying.' }
});
app.use(limiter);

// === Auto-update ytdl-core (failsafe) ===
exec('npm install ytdl-core@latest', (err, stdout, stderr) => {
  if (err) console.error('ytdl-core update error:', stderr);
  else console.log('ytdl-core auto-updated:', stdout);
});

// === Endpoints ===

// Get basic video info
app.get('/info', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing ?url=');
  try {
    const info = await ytdl.getInfo(videoUrl);
    const details = info.videoDetails;
    res.json({
      title: details.title,
      author: details.author.name,
      duration: `${Math.floor(details.lengthSeconds / 60)}:${details.lengthSeconds % 60}`,
      thumbnail: details.thumbnails.pop().url
    });
  } catch (err) {
    console.error('Info error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Download MP3
app.get('/mp3', (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing ?url=');
  try {
    res.header('Content-Disposition', 'attachment; filename=audio.mp3');
    ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
  } catch (err) {
    console.error('MP3 error:', err.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Download MP4
app.get('/mp4', (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing ?url=');
  try {
    res.header('Content-Disposition', 'attachment; filename=video.mp4');
    ytdl(videoUrl, { filter: 'videoandaudio', quality: 'highest' }).pipe(res);
  } catch (err) {
    console.error('MP4 error:', err.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('🎓 YouTube Download API for Training Use Only - Authenticated Access');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server live on port ${PORT}`));
