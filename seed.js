require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/socialmedia";

async function seed() {
  await mongoose.connect(MONGO);

  await User.deleteMany();
  await Post.deleteMany();

  const pwd = await bcrypt.hash("password", 10);

  const users = await User.insertMany([
    { username: "alice", email: "alice@example.com", password: pwd },
    { username: "bob", email: "bob@example.com", password: pwd },
    { username: "carol", email: "carol@example.com", password: pwd },
    { username: "dave", email: "dave@example.com", password: pwd },
    { username: "eva", email: "eva@example.com", password: pwd },
    { username: "fiona", email: "fiona@example.com", password: pwd },
    { username: "lucas", email: "lucas@example.com", password: pwd },
    { username: "mia", email: "mia@example.com", password: pwd },
    { username: "nora", email: "nora@example.com", password: pwd },
    { username: "pravalli", email: "pravalli@example.com", password: pwd },
  ]);

  const [alice, bob, carol, dave, eva, fiona, lucas, mia, nora, pravalli] = users;

  alice.following = [bob._id, carol._id, lucas._id];
  alice.followers = [pravalli._id, nora._id];

  bob.followers = [alice._id, pravalli._id];
  bob.following = [carol._id, eva._id, mia._id];

  carol.followers = [alice._id, bob._id, lucas._id];
  carol.following = [eva._id, fiona._id];

  dave.followers = [eva._id, mia._id];
  dave.following = [bob._id, nora._id];

  eva.followers = [bob._id, carol._id, pravalli._id];
  eva.following = [dave._id, lucas._id];

  fiona.followers = [carol._id];
  fiona.following = [alice._id, nora._id];

  lucas.followers = [alice._id, eva._id];
  lucas.following = [carol._id, mia._id];

  mia.followers = [bob._id, dave._id];
  mia.following = [nora._id, alice._id];

  nora.followers = [lucas._id, mia._id];
  nora.following = [alice._id, dave._id];

  pravalli.followers = [dave._id, nora._id];
  pravalli.following = [alice._id, bob._id, eva._id];

  await Promise.all(users.map((user) => user.save()));

  await Post.insertMany([
    { user: bob._id, caption: "Hello from Bob!", image: "https://picsum.photos/seed/bob/800/400" },
    { user: carol._id, caption: "Carol enjoying the sun ☀️", image: "https://picsum.photos/seed/carol/800/400" },
    { user: alice._id, caption: "Alice checking in 👋", image: "https://picsum.photos/seed/alice/800/400" },
    { user: dave._id, caption: "Dave loves coffee and code ☕", image: "https://picsum.photos/seed/dave/800/400" },
    { user: eva._id, caption: "Eva found a new favorite place!", image: "https://picsum.photos/seed/eva/800/400" },
    { user: fiona._id, caption: "Fiona sharing travel vibes ✈️", image: "https://picsum.photos/seed/fiona/800/400" },
    { user: lucas._id, caption: "Lucas is exploring the city tonight.", image: "https://picsum.photos/seed/lucas/800/400" },
    { user: mia._id, caption: "Mia just posted a new photo!", image: "https://picsum.photos/seed/mia/800/400" },
    { user: nora._id, caption: "Nora discovered a cozy coffee shop.", image: "https://picsum.photos/seed/nora/800/400" },
    { user: pravalli._id, caption: "Pravalli is ready to build a social app!", image: "https://picsum.photos/seed/pravalli/800/400" },
    { user: pravalli._id, caption: "My personal profile is here, follow me to see more! 😊", image: "https://picsum.photos/seed/pravalli2/800/400" },
  ]);

  console.log("Seed complete ✅");
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
