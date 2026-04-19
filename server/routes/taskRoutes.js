const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  updateTask,
  getTaskRecommendation
} = require("../controllers/taskController");

const router = express.Router();

// 🔒 Protected routes
router.get("/recommendation", protect, getTaskRecommendation);
router.get("/", protect, getTasks);
router.post("/", protect, createTask);
router.put("/:id", protect, updateTask);

module.exports = router;
