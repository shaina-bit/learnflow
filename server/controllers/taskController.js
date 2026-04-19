const Task = require("../models/Task");
const User = require("../models/User");

const createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title,
      description,
      category,
      dueDate,
      priority,
      user: req.user.id,
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // Only update if marking as completed for first time
  if (!task.completed && req.body.completed === true) {
    task.completed = true;
    task.completedAt = new Date(); // ✅ Record completion time

    // ✅ Handle Daily Goals & Streaks
    const user = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    // 1. Check if it's a new day
    if (!lastDate || today.getTime() > lastDate.getTime()) {
      const diffTime = lastDate ? today.getTime() - lastDate.getTime() : 0;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        user.streak = 0; // ❌ Reset if a day was missed
      }
      user.dailyCompleted = 0; // 🔄 Reset daily count for the new day
    }

    // 2. Increment completion count for today
    user.dailyCompleted += 1;
    user.lastActiveDate = new Date(); // Update activity timestamp

    // 3. Increment streak ONLY if they hit exactly the goal count today
    if (user.dailyCompleted === user.dailyGoal) {
      user.streak += 1;
    }

    console.log(`[XP DEBUG] Marking task ${req.params.id} as complete. Priority: ${task.priority}`);
    console.log(`[XP DEBUG] Current User XP: ${user.xp}, Level: ${user.level}`);

    // 🏆 Gamification: XP & Leveling
    const xpTable = { low: 20, medium: 50, high: 100 };
    const earnedXp = xpTable[task.priority] || 50;
    
    // Ensure values exist (existing users might have them as undefined)
    const currentXp = user.xp || 0;
    const currentLevel = user.level || 1;

    user.xp = currentXp + earnedXp;
    user.level = currentLevel;

    // Level up logic (e.g., Level 1 -> 2: 500 XP, Level 2 -> 3: 1000 XP total, etc.)
    const nextLevelThreshold = user.level * 500;
    if (user.xp >= nextLevelThreshold) {
      user.level += 1;
    }

    console.log(`[XP DEBUG] New User XP: ${user.xp}, Level: ${user.level}`);
    await user.save();
    console.log(`[XP DEBUG] User saved successfully`);
  }

  if (req.body.notes !== undefined) {
    task.notes = req.body.notes;
  }

  const updatedTask = await task.save();

  res.json(updatedTask);
};

const getTaskRecommendation = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    const allCategories = [
      "DSA",
      "AI/ML",
      "Web Dev",
      "General",
      "Self Care",
      "Hobbies",
    ];

    const categoryStats = {};
    const incompleteTasksByCategory = {};
    const stats = {};

    allCategories.forEach((cat) => {
      categoryStats[cat] = { total: 0, completed: 0 };
      incompleteTasksByCategory[cat] = [];
      stats[cat] = 0;
    });

    tasks.forEach((task) => {
      const cat = task.category || "General";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0 };
        incompleteTasksByCategory[cat] = [];
        stats[cat] = 0;
      }

      categoryStats[cat].total += 1;
      if (task.completed) {
        categoryStats[cat].completed += 1;
      } else {
        incompleteTasksByCategory[cat].push(task);
      }
    });

    let weakestCategory = null;
    let lowestPercentage = Infinity;
    let hasIncompleteTasks = false;

    for (const cat in categoryStats) {
      const { total, completed } = categoryStats[cat];
      if (total > 0) {
        const percentage = Math.round((completed / total) * 100);
        stats[cat] = percentage;

        if (total > completed) {
          hasIncompleteTasks = true;
          if (percentage < lowestPercentage) {
            lowestPercentage = percentage;
            weakestCategory = cat;
          }
        }
      }
    }

    if (!hasIncompleteTasks) {
      return res.status(200).json({ message: "You're all caught up!", stats });
    }

    const dailyPlan = [];

    // Prioritize weakest category
    if (incompleteTasksByCategory[weakestCategory].length > 0) {
      dailyPlan.push({
        ...incompleteTasksByCategory[weakestCategory].shift().toObject(),
        reason: `This task is prioritized because ${weakestCategory || "General"} is your weakest category.`
      });
    }

    // Try to get a mix from other categories, starting from those with lowest completion
    const sortedCategories = Object.keys(categoryStats)
      .filter((c) => incompleteTasksByCategory[c].length > 0)
      .sort((a, b) => stats[a] - stats[b]);

    while (dailyPlan.length < 3) {
      let addedInThisPass = false;
      for (const cat of sortedCategories) {
        if (dailyPlan.length >= 3) break;
        if (incompleteTasksByCategory[cat].length > 0) {
          dailyPlan.push({
            ...incompleteTasksByCategory[cat].shift().toObject(),
            reason: `This task is suggested because your ${cat} progress is low.`
          });
          addedInThisPass = true;
        }
      }
      if (!addedInThisPass) break;
    }

    return res.status(200).json({
      dailyPlan,
      weakestCategory,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  getTaskRecommendation,
};
