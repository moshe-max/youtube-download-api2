import express from "express";
import ytdl from "ytdl-core";
import { exec } from "child_process";

const app = express();

// ========== Render Health Check ==========
app.get("/", (req, res) => {
  res.status(200).send("✅ YouTube Download API is live and healthy!");
});

// ========== Main Download Route ==========
// Example:
// /download?url=https://youtube.com/watch?v=...&type=mp3
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
      // Audio-only stream
      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      ytdl(url, { filter: "audioonly", quality: "highestaudio" }).pipe(res);
    } else {
      // Full video
      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      ytdl(url, { quality: "highestvideo", format: "mp4" }).pipe(res);
    }
  } catch (error) {
    console.error("⚠️ Download error:", error.message);
    res
      .status(500)
      .send("❌ Failed to process video. YouTube may have updated its encryption.");
  }
});

// ========== Auto-update ytdl-core ==========
exec("npm install ytdl-core@latest", (err, stdout, stderr) => {
  if (err) {
    console.error("⚠️ Auto-update failed:", stderr);
  } else {
    console.log("🔄 ytdl-core auto-updated successfully.");
  }
});

// ========== Start Server ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
