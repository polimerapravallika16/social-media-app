const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/all", async (req, res) => {
  try {
    // include follower counts so client can display suggestions with more context
    const users = await User.find().select("username email followers");
    const payload = users.map((u) => ({ _id: u._id, username: u.username, email: u.email, followers: u.followers?.length || 0 }));
    return res.json(payload);
  } catch (err) {
    return res.status(500).json(err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const posts = await Post.find({ user: req.params.id });
    res.json({
      username: user.username,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
      posts: posts.length,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get("/followers/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "username");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.followers || []);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get("/following/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "username");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.following || []);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/follow/:id", authMiddleware, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);

    if (!target || !me) return res.status(404).json("User not found");

    if (target.followers.includes(me._id)) {
      return res.status(400).json("Already following");
    }

    target.followers.push(me._id);
    me.following.push(target._id);

    await target.save();
    await me.save();

    res.json({ message: "Followed" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/unfollow/:id", authMiddleware, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);

    if (!target || !me) return res.status(404).json("User not found");

    target.followers = target.followers.filter((f) => f.toString() !== me._id.toString());
    me.following = me.following.filter((f) => f.toString() !== target._id.toString());

    await target.save();
    await me.save();

    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// also accept PATCH semantics for follow/unfollow
router.patch("/follow/:id", authMiddleware, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);

    if (!target || !me) return res.status(404).json("User not found");

    if (target.followers.includes(me._id)) {
      return res.status(400).json("Already following");
    }

    target.followers.push(me._id);
    me.following.push(target._id);

    await target.save();
    await me.save();

    res.json({ message: "Followed" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.patch("/unfollow/:id", authMiddleware, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);

    if (!target || !me) return res.status(404).json("User not found");

    target.followers = target.followers.filter((f) => f.toString() !== me._id.toString());
    me.following = me.following.filter((f) => f.toString() !== target._id.toString());

    await target.save();
    await me.save();

    res.json({ message: "Unfollowed" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// return whether current user follows the target user
router.get("/relationship/:id", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ message: "User not found" });
    const follows = me.following.some((f) => f.toString() === req.params.id.toString());
    res.json({ following: !!follows });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
