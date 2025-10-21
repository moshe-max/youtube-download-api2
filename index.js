import express from "express";
import ytdl from "@distube/ytdl-core";  // <- Updated import
import { exec } from "child_process";

const app = express();

// Health check
app.get("/", (req, res) => {
  res.status(200).send("✅ YouTube Download API is live and healthy (DisTube core)!");
});

// Download route
app.get("/download", async (req, res) => {
  const url = req.query.url;
  const type = (req.query.type || "mp4").toLowerCase();

  if (!url) {
    return res.status(400).send("❌ Missing 'url' query parameter.");
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");

    if (type === "mp3" || type === "audio") {
      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      ytdl(url, { filter: "audioonly", quality: "highestaudio" }).pipe(res);
    } else {
      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      ytdl(url, { quality: "highestvideo", format: "mp4" }).pipe(res);
    }
  } catch (error) {
    console.error("⚠️ Download error:", error.message);
    res.status(500).send("❌ Failed to process video. Please try again later.");
  }
});

// Auto-update fallback
exec("npm install @distube/ytdl-core@latest", (err, stdout, stderr) => {
  if (err) console.error("⚠️ Auto-update failed:", stderr);
  else console.log("🔄 @distube/ytdl-core auto-updated successfully.");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
