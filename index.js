import express from "express";
import path from "path";
import { tmpdir } from "os";
import { unlink } from "fs";
import youtubedl from "youtube-dl-exec";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const PROXY = process.env.PROXY || "";

// Health-check route
app.get("/", (req, res) => {
  res.send("✅ YouTube Download API with proxy is live!");
});

// Download route
// Usage: /download?url=<YouTube_URL>&type=<mp4|mp3>
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const type = (req.query.type || "mp4").toLowerCase();

  if (!videoUrl) return res.status(400).send("❌ Missing ?url parameter.");

  const tempFile = path.join(tmpdir(), `${Date.now()}.${type === "mp3" ? "mp3" : "mp4"}`);

  try {
    const options = {
      output: tempFile,
      quiet: true,
      youtubeSkipDashManifest: true,
    };

    if (PROXY) options.proxy = PROXY;

    if (type === "mp3") {
      options.extractAudio = true;
      options.audioFormat = "mp3";
    } else {
      options.format = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best";
    }

    await youtubedl(videoUrl, options);

    res.download(tempFile, `${type === "mp3" ? "audio" : "video"}.${type}`, err => {
      unlink(tempFile, () => {});
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("❌ Failed to process video. YouTube may have blocked the server IP or proxy.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});
