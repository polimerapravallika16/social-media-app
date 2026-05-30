const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/User");
const Post = require("./models/Post");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {

    await User.deleteMany();
    await Post.deleteMany();

    // ✅ CREATE USERS
    const bujji = new User({
      username: "bujji",
      email: "b@gmail.com",
      password: "123"
    });

    const kittuu = new User({
      username: "kittuu",
      email: "k@gmail.com",
      password: "123"
    });

    const sneha = new User({
      username: "sneha",
      email: "s@gmail.com",
      password: "123"
    });

    await bujji.save();
    await kittuu.save();
    await sneha.save();

    // ✅ FOLLOW SYSTEM
    bujji.following = [kittuu._id, sneha._id];
    kittuu.followers = [bujji._id];
    sneha.followers = [bujji._id];

    await bujji.save();
    await kittuu.save();
    await sneha.save();

    // ✅ CREATE POSTS
    await Post.insertMany([
      {
        user: kittuu._id,
        content: "Kittuu first post 🔥",
        image: "https://picsum.photos/300"
      },
      {
        user: sneha._id,
        content: "Sneha enjoying 🌸",
        image: "https://picsum.photos/301"
      },
      {
        user: bujji._id,
        content: "Hello from bujji 😍",
        image: "https://picsum.photos/302"
      }
    ]);

    console.log("✅ USERS + FOLLOW + POSTS CREATED");
    process.exit();

  })
  .catch(err => console.log(err));