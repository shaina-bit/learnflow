const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateGoal,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/goal", protect, updateGoal);

module.exports = router;
