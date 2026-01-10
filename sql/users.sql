-- Users and authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager')),
  full_name VARCHAR(100),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Insert default users (password: admin123)
INSERT INTO users (username, password_hash, role, full_name) VALUES
('owner', '$2b$10$rKZvVqZ5YXqZ5YXqZ5YXqOqZ5YXqZ5YXqZ5YXqZ5YXqZ5YXqZ5YXq', 'owner', 'Owner Admin'),
('manager', '$2b$10$rKZvVqZ5YXqZ5YXqZ5YXqOqZ5YXqZ5YXqZ5YXqZ5YXqZ5YXqZ5YXq', 'manager', 'Manager User')
ON CONFLICT (username) DO NOTHING;
