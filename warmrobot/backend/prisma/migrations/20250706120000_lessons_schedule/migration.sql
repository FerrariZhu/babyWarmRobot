-- Lessons schedule: day teachers, permissions, lessons

CREATE TABLE IF NOT EXISTS day_teacher_assignments (
  day_index INT PRIMARY KEY CHECK (day_index >= 0 AND day_index <= 6),
  base_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  substitute_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_day_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_index INT NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  can_create BOOLEAN NOT NULL DEFAULT TRUE,
  can_edit BOOLEAN NOT NULL DEFAULT TRUE,
  can_delete_others BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, day_index)
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index INT NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  "order" INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  goal TEXT,
  date TIMESTAMPTZ,
  block TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  age_group TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lessons_day_order_idx ON lessons (day_index, "order");
