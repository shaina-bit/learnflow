import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTasks } from "../api/tasks";
import "./History.css";

function History() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupTasksByDate = () => {
    const groups = {};
    tasks
      .filter((t) => t.completed)
      .forEach((task) => {
        const date = new Date(task.completedAt || task.updatedAt).toLocaleDateString("en-US", {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
      });
    return groups;
  };

  const grouped = groupTasksByDate();
  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="hist-root">
      <div className="db-blob db-blob-1" />
      <div className="db-blob db-blob-2" />
      
      <div className="hist-wrapper">
        <header className="hist-header">
          <div className="hist-header-left">
            <Link to="/dashboard" className="hist-back-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Dashboard
            </Link>
            <h1>Learning <span className="hist-title-accent">History</span></h1>
          </div>
          <div className="hist-stats-brief">
            <div className="hist-stat-item">
              <span className="hist-stat-val">{tasks.filter(t => t.completed).length}</span>
              <span className="hist-stat-lbl">Achievements</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="hist-loading">
            <div className="db-spinner"></div>
            <p>Gathering your accomplishments...</p>
          </div>
        ) : dates.length === 0 ? (
          <div className="hist-empty">
            <div className="hist-empty-icon">🌱</div>
            <h3>Your journey is just beginning</h3>
            <p>Every small step counts. Complete your first task to start your history.</p>
            <Link to="/dashboard" className="hist-cta">Go to Dashboard</Link>
          </div>
        ) : (
          <div className="hist-timeline">
            {dates.map((date) => (
              <div key={date} className="hist-day-block">
                <div className="hist-date-sticky">
                  <div className="hist-date-content">
                    <span className="hist-date-text">{date}</span>
                    <span className="hist-date-count">{grouped[date].length} tasks</span>
                  </div>
                </div>
                <div className="hist-tasks-grid">
                  {grouped[date].map((task) => (
                    <div key={task._id} className="hist-task-card">
                      <div className="hist-task-cat-tag" style={{ borderLeft: `3px solid var(--cat-color-${task.category?.replace(/\s/g, '-')})` }}>
                        {task.category || "General"}
                      </div>
                      <h3 className="hist-task-title">{task.title}</h3>
                      <div className="hist-task-time">
                        {new Date(task.completedAt || task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
