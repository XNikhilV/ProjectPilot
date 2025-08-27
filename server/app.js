const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date DATETIME,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [userId, email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }

        const token = jwt.sign({ userId, email, name }, JWT_SECRET);
        res.json({ token, user: { id: userId, email, name } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  });
});

// Projects routes
app.get('/api/projects', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json(projects);
    }
  );
});

app.post('/api/projects', authenticateToken, (req, res) => {
  const { name, description, color } = req.body;
  const projectId = uuidv4();

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  db.run(
    'INSERT INTO projects (id, name, description, color, user_id) VALUES (?, ?, ?, ?, ?)',
    [projectId, name, description || '', color || '#3B82F6', req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create project' });
      }

      db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch created project' });
        }
        res.status(201).json(project);
      });
    }
  );
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const { name, description, color } = req.body;
  const projectId = req.params.id;

  db.run(
    'UPDATE projects SET name = ?, description = ?, color = ? WHERE id = ? AND user_id = ?',
    [name, description, color, projectId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update project' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated project' });
        }
        res.json(project);
      });
    }
  );
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;

  // Delete tasks first, then project
  db.run('DELETE FROM tasks WHERE project_id = ?', [projectId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete project tasks' });
    }

    db.run(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete project' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
      }
    );
  });
});

// Tasks routes
app.get('/api/tasks', authenticateToken, (req, res) => {
  const { project_id, status, priority } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  let params = [req.user.userId];

  if (project_id) {
    query += ' AND project_id = ?';
    params.push(project_id);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(tasks);
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, status, priority, due_date, project_id } = req.body;
  const taskId = uuidv4();

  if (!title || !project_id) {
    return res.status(400).json({ error: 'Title and project_id are required' });
  }

  db.run(
    'INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      taskId,
      title,
      description || '',
      status || 'todo',
      priority || 'medium',
      due_date,
      project_id,
      req.user.userId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create task' });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch created task' });
        }
        res.status(201).json(task);
      });
    }
  );
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const taskId = req.params.id;

  db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [title, description, status, priority, due_date, taskId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update task' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch updated task' });
        }
        res.json(task);
      });
    }
  );
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;

  db.run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete task' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ message: 'Task deleted successfully' });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;