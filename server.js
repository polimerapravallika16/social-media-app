const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors({ origin: true, credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "build")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "client", "build", "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.send("API Running 🚀");
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  const indexPath = path.join(__dirname, "client", "build", "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send("Not Found");
});

app.get("/users", async (req, res) => {
  const users = await require("./models/User").find();
  res.json(users);
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/socialmedia")
  .then(async () => {
    console.log("MongoDB Connected ✅");
    const User = require("./models/User");
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("No users found — seeding default data");
      try {
        const seed = require("./seed");
        await seed();
        console.log("Seeding finished");
      } catch (err) {
        console.error("Seeding error:", err.message || err);
      }
    }
  })
  .catch((err) => console.log(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
