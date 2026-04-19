const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  streak: { type: Number, default: 0 },
  dailyGoal: { type: Number, default: 3 },
  dailyCompleted: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
});

module.exports = mongoose.model("User", userSchema);
