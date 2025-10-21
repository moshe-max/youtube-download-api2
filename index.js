import express from "express";
import ytdl from "ytdl-core";

const app = express();

// === Health Check Route ===
app.get("/", (req, res) => {
  res.status(200).send("✅ YouTube Download API is live and healthy!");
});

// === Download Route ===
app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("❌ Missing 'url' query parameter.");
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "_");
    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);

    ytdl(url, {
      format: "mp4",
      quality: "highestvideo",
    }).pipe(res);
  } catch (error) {
    console.error("⚠️ Error downloading video:", error.message);
    res.status(500).send("❌ Failed to process video. Possibly YouTube updated their encryption.");
  }
});

// === Auto-update logic for ytdl-core (Render-friendly) ===
import { exec } from "child_process";
exec("npm install ytdl-core@latest", (err, stdout, stderr) => {
  if (err) {
    console.error("⚠️ Auto-update failed:", stderr);
  } else {
    console.log("🔄 ytdl-core auto-updated successfully.");
  }
});

// === Start Server (Render expects process.env.PORT) ===
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
