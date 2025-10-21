import express from "express";
import { tmpdir } from "os";
import path from "path";
import { unlink } from "fs";
import ytdlp from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 10000;

// Health-check route
app.get("/", (req, res) => {
  res.status(200).send("✅ YouTube Download API is live and healthy!");
});

// Download route
// Usage: /download?url=<YouTube_URL>&type=<mp4|mp3>
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const type = (req.query.type || "mp4").toLowerCase();

  if (!videoUrl) return res.status(400).send("❌ Missing ?url parameter.");

  const tempFile = path.join(tmpdir(), `${Date.now()}.${type === "mp3" ? "mp3" : "mp4"}`);

  try {
    if (type === "mp3") {
      await ytdlp(videoUrl, {
        output: tempFile,
        extractAudio: true,
        audioFormat: "mp3",
        quiet: true
      });
    } else {
      await ytdlp(videoUrl, {
        output: tempFile,
        format: "best[ext=mp4]/best",
        quiet: true
      });
    }

    res.download(tempFile, `${type === "mp3" ? "audio" : "video"}.${type}`, err => {
      // Clean up temp file
      unlink(tempFile, () => {});
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("❌ Failed to process video. Please try again later.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});
