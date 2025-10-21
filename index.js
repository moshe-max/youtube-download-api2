import express from "express";
import { execFile } from "child_process";
import { createWriteStream, unlink } from "fs";
import { tmpdir } from "os";
import path from "path";
import ytdlp from "yt-dlp-exec";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ YouTube Downloader API is running!");
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send("❌ Missing ?url parameter.");

  try {
    console.log(`Downloading: ${videoUrl}`);
    const tempFile = path.join(tmpdir(), `${Date.now()}.mp4`);

    await ytdlp(videoUrl, {
      output: tempFile,
      format: "best[ext=mp4]/best",
      quiet: true
    });

    res.download(tempFile, "video.mp4", err => {
      unlink(tempFile, () => {});
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("❌ Failed to process video.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});
