import { useState, useEffect } from "react";
import { createTask, getTasks, updateTask, getRecommendation } from "../api/tasks";
import { getProfile, updateGoal } from "../api/user";
import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [user, setUser] = useState({ name: "", streak: 0, dailyCompleted: 0, dailyGoal: 3 });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [recommendationData, setRecommendationData] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | done
  const [editingGoal, setEditingGoal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [noteTaskId, setNoteTaskId] = useState(null);
  const [noteVal, setNoteVal] = useState("");
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const CATEGORIES = ["DSA", "AI/ML", "Web Dev", "General", "Self Care", "Hobbies"];

  const CATEGORY_COLORS = {
    "DSA": { bg: "rgba(99,102,241,0.18)", border: "rgba(99,102,241,0.4)", text: "#a5b4fc" },
    "AI/ML": { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.4)", text: "#f9a8d4" },
    "Web Dev": { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#93c5fd" },
    "General": { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
    "Self Care": { bg: "rgba(34,197,94,0.13)", border: "rgba(34,197,94,0.35)", text: "#86efac" },
    "Hobbies":   { bg: "rgba(251,146,60,0.15)",  border: "rgba(251,146,60,0.35)", text: "#fdba74" },
  };

  const PRIORITY_COLORS = {
    low:    { bg: "rgba(59,130,246,0.2)",  text: "#60a5fa" },
    medium: { bg: "rgba(245,158,11,0.18)", text: "#fbbf24" },
    high:   { bg: "rgba(239,68,68,0.22)",  text: "#f87171" },
  };

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(Array.isArray(res.data) ? res.data : res.data.tasks || []);
    } catch {
      setError("Failed to load tasks.");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setUser({
        name: res.data.name || "Learner",
        streak: res.data.streak || 0,
        dailyCompleted: res.data.dailyCompleted || 0,
        dailyGoal: res.data.dailyGoal || 3,
        xp: res.data.xp || 0,
        level: res.data.level || 1,
      });
    } catch {
      const storedName = localStorage.getItem("userName") || "Learner";
      setUser((prev) => ({ ...prev, name: storedName, xp: 0, level: 1 }));
    }
  };

  const fetchRecommendation = async () => {
    try {
      const res = await getRecommendation();
      setRecommendationData(res.data);
    } catch {
      setRecommendationData(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchProfile(), fetchRecommendation()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    setError("");
    try {
      await createTask({ 
        title: title.trim(), 
        category,
        dueDate: dueDate || null,
        priority
      });
      setTitle("");
      setCategory("General");
      setDueDate("");
      setPriority("medium");
      await fetchTasks();
      await fetchRecommendation();
    } catch {
      setError("Could not add task. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleComplete = async (id) => {
    try {
      await updateTask(id, { completed: true });
      await fetchTasks();
      await fetchRecommendation();
      await fetchProfile();
    } catch {
      setError("Could not update task.");
    }
  };

  const openNoteModal = (task) => {
    setNoteTaskId(task._id);
    setNoteVal(task.notes || "");
  };

  const handleSaveNote = async () => {
    try {
      await updateTask(noteTaskId, { notes: noteVal });
      setNoteTaskId(null);
      await fetchTasks();
      await fetchRecommendation();
    } catch {
      setError("Could not save note.");
    }
  };

  const handleGoalChange = async (newGoal) => {
    try {
      await updateGoal(parseInt(newGoal));
      setUser((prev) => ({ ...prev, dailyGoal: parseInt(newGoal) }));
      setEditingGoal(false);
    } catch {
      setError("Failed to update daily goal.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "/";
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const catStats = CATEGORIES.map((cat) => {
    const catTasks = tasks.filter((t) => (t.category || "General") === cat);
    const total = catTasks.length;
    const completed = catTasks.filter((t) => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: cat, total, completed, percentage };
  }).filter((s) => s.total > 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessages = () => {
    const messages = [];

    if (user.streak > 0) {
      messages.push(`You're on a ${user.streak}-day streak 🔥`);
    }

    const tasksLeft = user.dailyGoal - user.dailyCompleted;
    if (tasksLeft > 0) {
      messages.push(`Just ${tasksLeft} more task${tasksLeft > 1 ? 's' : ''} to hit today's goal 💪`);
    } else if (user.dailyCompleted > 0 && tasksLeft <= 0) {
      messages.push(`You smashed today's goal! 🚀`);
    }

    if (progress >= 80) {
      messages.push(`You have an incredible ${progress}% completion rate 🌟`);
    } else if (progress >= 50) {
      messages.push(`You've completed ${progress}% of your tasks. Keep pushing! 📈`);
    }

    return messages;
  };
  const motivations = getMotivationalMessages();

  const tasksCompletedToday = tasks.filter((t) => {
    if (!t.completed || (!t.completedAt && !t.updatedAt)) return false;
    const completedDate = new Date(t.completedAt || t.updatedAt).toDateString();
    return completedDate === new Date().toDateString();
  });

  const strongestCategory = catStats.length > 0 
    ? catStats.reduce((prev, current) => (current.percentage > prev.percentage ? current : prev)).name 
    : null;

  const weakestCatInsight = catStats.length > 0 
    ? catStats.reduce((prev, current) => (current.percentage < prev.percentage ? current : prev)).name 
    : null;

  const completedTasksOnly = tasks.filter(t => t.completed);
  let focusPercentage = 0;
  let mostActiveCategory = "None";
  let mostActiveTime = "the day";

  if (completedTasksOnly.length > 0) {
    const counts = {};
    const timeCounts = { mornings: 0, afternoons: 0, evenings: 0, nights: 0 };

    completedTasksOnly.forEach(t => {
      const cat = t.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;

      const date = new Date(t.completedAt || t.updatedAt || t.createdAt);
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) timeCounts.mornings++;
      else if (hour >= 12 && hour < 17) timeCounts.afternoons++;
      else if (hour >= 17 && hour < 21) timeCounts.evenings++;
      else timeCounts.nights++;
    });

    let maxCat = "";
    let maxCount = 0;
    for (const cat in counts) {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        maxCat = cat;
      }
    }
    mostActiveCategory = maxCat;
    focusPercentage = Math.round((maxCount / completedTasksOnly.length) * 100);

    let maxTime = "mornings";
    let maxTimeCount = -1;
    for (const time in timeCounts) {
      if (timeCounts[time] > maxTimeCount) {
        maxTimeCount = timeCounts[time];
        maxTime = time;
      }
    }
    mostActiveTime = maxTime;
  }

  const getTimeToDue = (date) => {
    if (!date) return null;
    const now = new Date();
    const due = new Date(date);
    const diff = due - now;

    if (diff < 0) return { text: "Overdue", type: "overdue" };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return { text: `Due in ${days}d`, type: "upcoming" };
    if (hours > 0) return { text: `Due in ${hours}h`, type: "urgent" };
    return { text: "Due soon", type: "urgent" };
  };

  // ✅ XP Progress Logic
  const currentLevel = user.level || 1;
  const currentXp = user.xp || 0;
  const nextLevelThreshold = currentLevel * 500;
  const xpPct = Math.min(Math.round((currentXp / nextLevelThreshold) * 100), 100);

  // ✅ Weekly Report Logic
  const getWeeklyStats = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyTasks = tasks.filter(t => 
      t.completed && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo
    );

    const totalCompleted = weeklyTasks.length;
    
    const catCounts = {};
    let highPriorityCount = 0;

    weeklyTasks.forEach(t => {
      const c = t.category || "General";
      catCounts[c] = (catCounts[c] || 0) + 1;
      if (t.priority === "high") highPriorityCount++;
    });

    let topCat = "None";
    let max = 0;
    for (const [c, count] of Object.entries(catCounts)) {
      if (count > max) { max = count; topCat = c; }
    }

    const highPriorityPct = totalCompleted > 0 ? Math.round((highPriorityCount / totalCompleted) * 100) : 0;

    return { totalCompleted, topCat, highPriorityPct };
  };

  const weeklyStats = getWeeklyStats();

return (
  <div className="db-root">
    <div className="db-blob db-blob-1" />
    <div className="db-blob db-blob-2" />
    <div className="db-blob db-blob-3" />

    <div className="db-wrapper">
      <header className="db-header">
        <div className="db-brand">
          <span className="db-logo">⚡</span>
          <span className="db-brand-name">LearnFlow</span>
        </div>
        <div className="db-header-right">
          <nav className="db-nav">
            <Link to="/history" className="db-nav-link">History</Link>
            <button className="db-nav-link db-nav-btn" onClick={() => setShowWeeklyReport(true)}>
              Weekly Report
            </button>
          </nav>
          <div className="db-stats-chips">
            <div className="db-chip db-chip-goal">
              <span className="db-chip-icon">🎯</span>
              {editingGoal ? (
                <select
                  className="db-goal-select"
                  value={user.dailyGoal}
                  onChange={(e) => handleGoalChange(e.target.value)}
                  onBlur={() => setEditingGoal(false)}
                  autoFocus
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              ) : (
                <>
                  <span>{user.dailyCompleted}/{user.dailyGoal} today</span>
                  <button
                    className="db-edit-goal-btn"
                    onClick={() => setEditingGoal(true)}
                    aria-label="Edit daily goal"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className="db-chip db-chip-streak">
              <span className="db-chip-icon">🔥</span>
              <span>{user.streak} day streak</span>
            </div>
            <div className="db-chip db-chip-level">
              <span className="db-chip-icon">👑</span>
              <span>Level {currentLevel}</span>
            </div>
          </div>
          <div className="db-xp-section">
            <div className="db-xp-bar-track">
              <div className="db-xp-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="db-xp-label">{currentXp} / {nextLevelThreshold} XP</span>
          </div>
          <button className="db-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <section className="db-greeting">
        <h1>{greeting()}, <span className="db-name-highlight">{user.name || "Learner"}</span> 👋</h1>
        {motivations.length > 0 ? (
          <div className="db-motivations" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
            {motivations.map((msg, i) => (
              <span key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.85rem", color: "#e2e8f0", fontWeight: "500", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                {msg}
              </span>
            ))}
          </div>
        ) : (
          <p className="db-subtitle">Track your learning goals and stay consistent.</p>
        )}
      </section>

      {/* ── WHAT YOU LEARNED TODAY ── */}
      {tasksCompletedToday.length > 0 && (
        <section className="db-today-highlights">
          <div className="db-today-header">
            <span className="db-today-icon">✨</span>
            <h3>What you learned today</h3>
          </div>
          <div className="db-today-list">
            {tasksCompletedToday.map((task) => (
              <div key={task._id} className="db-today-item">
                <span className="db-today-dot"></span>
                {task.title}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SMART STUDY PLANNER ── */}
      {recommendationData?.dailyPlan && recommendationData.dailyPlan.length > 0 ? (
        <section className="db-suggestion">
          <div className="db-sugg-card" style={{ display: "block" }}>
            <div className="db-sugg-info" style={{ width: "100%", marginBottom: "16px" }}>
              <span className="db-sugg-label" style={{ marginBottom: "4px", display: "inline-block" }}>Smart Study Planner 🧠</span>
              {strongestCategory && (
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", margin: "0 0 8px 0", fontWeight: "600" }}>
                  You're doing great in {strongestCategory} 🔥
                </p>
              )}
              <p className="db-sugg-reason" style={{ margin: 0 }}>
                Let's improve <span className="db-sugg-cat">{(recommendationData.weakestCategory || "General")}</span> today 💪
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recommendationData.dailyPlan.map(task => (
                <div key={task._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                   <div style={{ flex: 1, paddingRight: "16px" }}>
                     <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "#f8fafc" }}>{task.title}</h4>
                     <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#cbd5e1" }}>{task.category || "General"}</span>
                     </div>
                     {task.reason && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic", lineHeight: "1.3" }}>
                          {task.reason}
                        </p>
                     )}
                   </div>
                   <button 
                     className="db-sugg-action"
                     onClick={() => handleComplete(task._id)}
                     style={{ padding: "6px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                   >
                     Mark Done
                   </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : tasks.length === 0 ? (
        <section className="db-suggestion">
          <div className="db-sugg-card" style={{ justifyContent: "center", border: "1px solid rgba(99,102,241,0.4)" }}>
            <div className="db-sugg-info" style={{ textAlign: "center", width: "100%" }}>
              <span className="db-sugg-label" style={{ color: "#a5b4fc", display: "block", marginBottom: "8px" }}>Let's Get Started! 🚀</span>
              <p className="db-sugg-reason" style={{ margin: 0 }}>You have no tasks yet. Add a new learning task below to kickstart your progress!</p>
            </div>
          </div>
        </section>
      ) : recommendationData?.message === "You're all caught up!" ? (
        <section className="db-suggestion">
          <div className="db-sugg-card" style={{ justifyContent: "center", border: "1px solid rgba(34,197,94,0.3)" }}>
            <div className="db-sugg-info" style={{ textAlign: "center", width: "100%" }}>
              <span className="db-sugg-label" style={{ color: "#86efac", display: "block", marginBottom: "8px" }}>All Caught Up! 🎉</span>
              <p className="db-sugg-reason" style={{ margin: 0 }}>You've completed all your active tasks. Great job!</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── LEARNING INSIGHTS ── */}
      {(completedTasksOnly.length > 0 || catStats.length > 0) && (
        <section className="db-insights" style={{ marginTop: "24px", marginBottom: "24px" }}>
          <div className="db-sugg-card" style={{ display: "block" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
              📊 Learning Insights
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              {focusPercentage > 0 && (
                <li style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "1.2rem" }}>🎯</span>
                  <p style={{ margin: 0, color: "#cbd5e1" }}>You focus <strong style={{color: "#fff"}}>{focusPercentage}%</strong> on <strong style={{color: "#fff"}}>{mostActiveCategory}</strong></p>
                </li>
              )}
              {weakestCatInsight && (
                <li style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "1.2rem" }}>📉</span>
                  <p style={{ margin: 0, color: "#cbd5e1" }}><strong style={{color: "#fff"}}>{weakestCatInsight}</strong> is your weakest area</p>
                </li>
              )}
              {completedTasksOnly.length > 0 && (
                <li style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌙</span>
                  <p style={{ margin: 0, color: "#cbd5e1" }}>You're most active in the <strong style={{color: "#fff"}}>{mostActiveTime}</strong></p>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      <section className="db-stats">
        <div className="db-stat-card db-stat-total">
          <div className="db-stat-icon">📋</div>
          <div>
            <div className="db-stat-number">{tasks.length}</div>
            <div className="db-stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="db-stat-card db-stat-pending">
          <div className="db-stat-icon">⏳</div>
          <div>
            <div className="db-stat-number">{pendingCount}</div>
            <div className="db-stat-label">Pending</div>
          </div>
        </div>
        <div className="db-stat-card db-stat-done">
          <div className="db-stat-icon">✅</div>
          <div>
            <div className="db-stat-number">{completedCount}</div>
            <div className="db-stat-label">Completed</div>
          </div>
        </div>
        <div className="db-stat-card db-stat-daily">
          <div className="db-stat-icon">🌟</div>
          <div>
            <div className="db-stat-number">{user.dailyCompleted}/{user.dailyGoal}</div>
            <div className="db-stat-label">Daily Target</div>
          </div>
        </div>
        <div className="db-stat-card db-stat-progress">
          <div className="db-stat-icon">🎯</div>
          <div>
            <div className="db-stat-number">{progress}%</div>
            <div className="db-stat-label">Progress</div>
          </div>
        </div>
      </section>

      {/* ── PROGRESS BAR ── */}
      {tasks.length > 0 && (
        <div className="db-progress-bar-wrap">
          <div className="db-progress-bar-track">
            <div className="db-progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="db-progress-label">{progress}% complete</span>
        </div>
      )}

      {/* ── CATEGORY PROGRESS ── */}
      {catStats.length > 0 && (
        <section className="db-cat-stats">
          {catStats.map((cat) => {
            const col = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS["General"];
            return (
              <div key={cat.name} className="db-cat-card">
                <div className="db-cat-header">
                  <span className="db-cat-name">{cat.name}</span>
                  <span className="db-cat-pct" style={{ color: col.text }}>
                    {cat.percentage}%
                  </span>
                </div>
                <div className="db-cat-bar-track">
                  <div
                    className="db-cat-bar-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      background: col.text,
                      boxShadow: `0 0 10px ${col.text}44`
                    }}
                  />
                </div>
                <div className="db-cat-meta">
                  {cat.completed} of {cat.total} done
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── MAIN CARD ── */}
      <div className="db-card">
        {/* Add task input */}
        <div className="db-add-row">
          <input
            id="new-task-input"
            className="db-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new learning task…"
            disabled={adding}
          />
          <div className="db-add-opts">
            <select
              id="task-category-select"
              className="db-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={adding}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="db-select db-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={adding}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              className="db-select db-date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={adding}
            />
          </div>
          <button
            id="add-task-btn"
            className="db-add-btn"
            onClick={handleAdd}
            disabled={adding || !title.trim()}
          >
            {adding ? <span className="db-spinner" /> : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>

        {error && <p className="db-error">{error}</p>}

        {/* Filter tabs */}
        <div className="db-filters">
          {["all", "pending", "done"].map((f) => (
            <button
              key={f}
              className={`db-filter-btn${filter === f ? " db-filter-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "pending" ? "Pending" : "Completed"}
              <span className="db-filter-count">
                {f === "all" ? tasks.length : f === "pending" ? pendingCount : completedCount}
              </span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="db-loading">
            <div className="db-pulse" />
            <div className="db-pulse" />
            <div className="db-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="db-empty">
            <span className="db-empty-icon">🌱</span>
            <p>{filter === "done" ? "No completed tasks yet." : filter === "pending" ? "All tasks done! Great job! 🎉" : "No tasks yet. Add one above!"}</p>
          </div>
        ) : (
          <ul className="db-task-list">
            {filtered.map((task, idx) => {
              const col = CATEGORY_COLORS[task.category] || CATEGORY_COLORS["General"];
              const pCol = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              const dueInfo = getTimeToDue(task.dueDate);
              const isOverdue = dueInfo?.type === "overdue" && !task.completed;

              return (
                <li
                  key={task._id}
                  className={`db-task-item${task.completed ? " db-task-done" : ""}${isOverdue ? " db-task-overdue" : ""}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="db-task-left">
                    <button
                      className={`db-check-btn${task.completed ? " db-check-checked" : ""}`}
                      onClick={() => !task.completed && handleComplete(task._id)}
                      aria-label="Mark complete"
                    >
                      {task.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div className="db-task-text-wrap">
                      <div className="db-task-main-row">
                        <span className="db-task-title">{task.title}</span>
                        {task.priority && (
                          <span className="db-priority-badge" style={{ background: pCol.bg, color: pCol.text }}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      <div className="db-task-meta-row">
                        {task.dueDate ? (
                          <span className="db-task-date">
                            Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        ) : (
                          <span className="db-task-date">No deadline</span>
                        )}
                        {dueInfo && (
                          <span className={`db-due-tag db-due-${dueInfo.type}`}>
                            • {dueInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="db-task-right">
                    <span
                      className="db-category-badge"
                      style={{ background: col.bg, borderColor: col.border, color: col.text }}
                    >
                      {task.category || "General"}
                    </span>
                    {task.completed && (
                      <>
                        <button 
                          className="db-note-btn"
                          onClick={() => openNoteModal(task)}
                          aria-label="Add or view notes"
                        >
                          {task.notes ? "📝 View Notes" : "➕ Add Note"}
                        </button>
                        <span className="db-task-badge">Done ✓</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── REFLECTION MODAL ── */}
      {noteTaskId && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            <div className="db-modal-header">
              <h3>Learning Reflection</h3>
              <button className="db-modal-close" onClick={() => setNoteTaskId(null)}>×</button>
            </div>
            <div className="db-modal-body">
              <p className="db-modal-hint">What are your key takeaways from this task?</p>
              <textarea
                className="db-modal-textarea"
                value={noteVal}
                onChange={(e) => setNoteVal(e.target.value)}
                placeholder="Write your thoughts here..."
                autoFocus
              />
            </div>
            <div className="db-modal-footer">
              <button className="db-btn-secondary" onClick={() => setNoteTaskId(null)}>Cancel</button>
              <button className="db-btn-primary" onClick={handleSaveNote}>Save Reflection</button>
            </div>
          </div>
        </div>
      )}
      {/* ── WEEKLY REPORT MODAL ── */}
      {showWeeklyReport && (
        <div className="db-modal-overlay">
          <div className="db-modal db-report-modal">
            <div className="db-modal-header">
              <h3>Weekly Power Report</h3>
              <button className="db-modal-close" onClick={() => setShowWeeklyReport(false)}>×</button>
            </div>
            <div className="db-modal-body">
              <div className="db-report-hero">
                <span className="db-report-icon">🏆</span>
                <h4>7-Day Retrospective</h4>
                <p>Here's what you've achieved in the last week.</p>
              </div>
              <div className="db-report-grid">
                <div className="db-report-stat">
                  <span className="db-rs-val">{weeklyStats.totalCompleted}</span>
                  <span className="db-rs-label">Tasks Conquered</span>
                </div>
                <div className="db-report-stat">
                  <span className="db-rs-val" style={{ color: CATEGORY_COLORS[weeklyStats.topCat === "None" ? "General" : weeklyStats.topCat]?.text || "#fff" }}>
                    {weeklyStats.topCat}
                  </span>
                  <span className="db-rs-label">Most Active Focus</span>
                </div>
                <div className="db-report-stat">
                  <span className="db-rs-val" style={{ color: "#f87171" }}>{weeklyStats.highPriorityPct}%</span>
                  <span className="db-rs-label">High Priority Hits</span>
                </div>
              </div>
            </div>
            <div className="db-modal-footer">
              <button className="db-btn-primary" onClick={() => setShowWeeklyReport(false)}>Keep it up!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default Dashboard;
