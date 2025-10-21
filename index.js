import express from "express";
import path from "path";
import { tmpdir } from "os";
import { unlink } from "fs";
import youtubedl from "youtube-dl-exec";

const app = express();
const PORT = process.env.PORT || 10000;

// Health-check route
app.get("/", (req, res) => {
  res.send("✅ YouTube Download API is live!");
});

// Download route
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const type = (req.query.type || "mp4").toLowerCase();

  if (!videoUrl) return res.status(400).send("❌ Missing ?url parameter.");

  const tempFile = path.join(tmpdir(), `${Date.now()}.${type === "mp3" ? "mp3" : "mp4"}`);

  try {
    if (type === "mp3") {
      await youtubedl(videoUrl, {
        output: tempFile,
        extractAudio: true,
        audioFormat: "mp3",
        quiet: true
      });
    } else {
      await youtubedl(videoUrl, {
        output: tempFile,
        format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        quiet: true
      });
    }

    res.download(tempFile, `${type === "mp3" ? "audio" : "video"}.${type}`, err => {
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
