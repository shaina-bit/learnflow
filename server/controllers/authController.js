const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 🔥 REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      streak: user.streak,
      dailyGoal: user.dailyGoal,
      dailyCompleted: user.dailyCompleted,
      lastActiveDate: user.lastActiveDate,
      xp: user.xp || 0,
      level: user.level || 1,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// 🔥 LOGIN
const loginUser = async (req, res) => {
  try {
    console.log("LOGIN CONTROLLER HIT");
    const { email, password } = req.body;

    console.log("Email:", email);
    console.log("Password entered:", password);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ✅ FIRST declare user
    const user = await User.findOne({ email }).select("+password");

    // ✅ THEN use it
    console.log("User from DB:", user);
    console.log("Stored password:", user?.password);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      streak: user.streak,
      dailyGoal: user.dailyGoal,
      dailyCompleted: user.dailyCompleted,
      lastActiveDate: user.lastActiveDate,
      xp: user.xp || 0,
      level: user.level || 1,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

const updateGoal = async (req, res) => {
  try {
    const { dailyGoal } = req.body;

    if (!dailyGoal || dailyGoal < 1) {
      return res.status(400).json({ message: "Invalid daily goal" });
    }

    const user = await User.findById(req.user.id);
    user.dailyGoal = dailyGoal;
    await user.save();

    res.json({ message: "Daily goal updated", dailyGoal: user.dailyGoal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateGoal,
};
