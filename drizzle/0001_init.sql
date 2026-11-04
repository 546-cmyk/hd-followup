-- 创建 user_profile 复合类型（与妙搭平台兼容）
DO $$ BEGIN
  CREATE TYPE user_profile AS (
    user_id text,
    name text,
    avatar text,
    i18n_name text,
    en_name text
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建 file_attachment 复合类型
DO $$ BEGIN
  CREATE TYPE file_attachment AS (
    bucket_id text,
    file_path text
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 家长用户表
CREATE TABLE IF NOT EXISTS parent_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(20) NOT NULL UNIQUE,
  password varchar(255) NOT NULL DEFAULT '123456',
  name varchar(50) NOT NULL,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

-- 医生用户表
CREATE TABLE IF NOT EXISTS doctor_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(20) NOT NULL UNIQUE,
  password varchar(255) NOT NULL DEFAULT '123456',
  name varchar(50) NOT NULL,
  department varchar(100),
  title varchar(50),
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

-- 患儿信息表
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
  name varchar(50) NOT NULL,
  gender varchar(10),
  birth_date date,
  surgery_date date NOT NULL,
  diagnosis_type varchar(20) NOT NULL DEFAULT '短段型',
  current_risk_level varchar(10) NOT NULL DEFAULT 'green',
  latest_check_date date,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_risk_level ON children(current_risk_level);

-- 红旗征自查记录表
CREATE TABLE IF NOT EXISTS red_flag_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  risk_level varchar(10) NOT NULL,
  advice text NOT NULL,
  post_op_days integer NOT NULL DEFAULT 0,
  checked_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_red_flag_child_id ON red_flag_records(child_id);
CREATE INDEX IF NOT EXISTS idx_red_flag_risk_level ON red_flag_records(risk_level);
CREATE INDEX IF NOT EXISTS idx_red_flag_checked_at ON red_flag_records(checked_at);

-- 排便日记记录表
CREATE TABLE IF NOT EXISTS bowel_diary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  bowel_count integer NOT NULL DEFAULT 0,
  stool_type integer NOT NULL DEFAULT 4,
  bloating_level varchar(20) NOT NULL DEFAULT 'none',
  temperature numeric NOT NULL DEFAULT '36.5',
  notes text,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_bowel_diary_child_id ON bowel_diary_records(child_id);
CREATE INDEX IF NOT EXISTS idx_bowel_diary_record_date ON bowel_diary_records(record_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bowel_diary_child_date ON bowel_diary_records(child_id, record_date);

-- Rintala评分记录表
CREATE TABLE IF NOT EXISTS rintala_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  total_score integer NOT NULL DEFAULT 0,
  level varchar(10) NOT NULL DEFAULT 'good',
  dimensions jsonb NOT NULL DEFAULT '{}',
  post_op_months integer NOT NULL DEFAULT 0,
  completed_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_rintala_child_id ON rintala_records(child_id);
CREATE INDEX IF NOT EXISTS idx_rintala_completed_at ON rintala_records(completed_at);

-- 随访备注表
CREATE TABLE IF NOT EXISTS followup_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  next_followup_date date,
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_followup_child_id ON followup_notes(child_id);
CREATE INDEX IF NOT EXISTS idx_followup_doctor_id ON followup_notes(doctor_id);

-- 健康科普文章表
CREATE TABLE IF NOT EXISTS health_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  summary varchar(500),
  content text NOT NULL,
  cover_image_url text,
  category varchar(50) NOT NULL DEFAULT 'general',
  _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT NULL,
  _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT NULL
);
