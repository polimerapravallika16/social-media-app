const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const User = require("../models/User"); // ✅ missing before
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, name);
  }
});

const upload = multer({ storage });


// GET USER POSTS
router.get("/user/:id", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate("user", "username")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ✅ GET ALL POSTS (ONLY ONE ROUTE)
router.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "username")
      .populate("likes", "username")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(posts);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// CREATE POST
// Support image upload via multipart/form-data (field name 'image')
router.post("/create", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const post = new Post({
      user: req.user.id,
      caption: req.body.caption,
      image: imagePath
    });

    await post.save();
    const populated = await Post.findById(post._id)
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .populate('likes', 'username');

    res.json({ message: "Post Created Successfully", post: populated });
  } catch (error) {
    res.status(500).json(error.message);
  }
});


// LIKE POST
router.put("/like/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post.likes.map(l => l.toString()).includes(req.user.id)) {
      post.likes.push(req.user.id);
    } else {
      // unlike
      post.likes = post.likes.filter(l => l.toString() !== req.user.id);
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .populate('likes', 'username');

    res.json({ message: 'Post Liked', post: populated });
  } catch (error) {
    res.status(500).json(error.message);
  }
});


// COMMENT
router.put("/comment/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    post.comments.push({ user: req.user.id, text: req.body.text });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .populate('likes', 'username');

    res.json({ message: 'Comment Added', post: populated });
  } catch (error) {
    res.status(500).json(error.message);
  }
});


// DELETE
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json("Post not found");

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json("Unauthorized");
    }

    await post.deleteOne();

    res.json("Post Deleted");
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// DELETE COMMENT
router.delete('/comment/:postId/:commentId', authMiddleware, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId).populate('comments.user', 'username');
    if (!post) return res.status(404).json('Post not found');

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json('Comment not found');

    // allow comment owner or post owner to delete
    if (comment.user && comment.user._id.toString() !== req.user.id && post.user.toString() !== req.user.id) {
      return res.status(401).json('Unauthorized');
    }

    comment.remove();
    await post.save();

    const populated = await Post.findById(postId)
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .populate('likes', 'username');

    res.json({ message: 'Comment deleted', post: populated });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
