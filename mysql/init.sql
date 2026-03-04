-- シフト管理システム 初期化SQL
CREATE DATABASE IF NOT EXISTS shift_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shift_management;

-- ユーザー（管理者・従業員）テーブル
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) DEFAULT NULL
);


-- シフトテーブル
CREATE TABLE IF NOT EXISTS shifts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT UNSIGNED NOT NULL,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  status      ENUM('confirmed', 'unconfirmed') NOT NULL DEFAULT 'unconfirmed',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (employee_id) REFERENCES users(id),
  UNIQUE KEY uk_shifts_employee_date (employee_id, date)
);

CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_shifts_status ON shifts(status);

-- 希望シフトテーブル
CREATE TABLE IF NOT EXISTS shift_requests (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     BIGINT UNSIGNED NOT NULL,
  date            DATE NOT NULL,
  availability    ENUM('available', 'unavailable', 'negotiable') NOT NULL,
  preferred_start TIME DEFAULT NULL,
  preferred_end   TIME DEFAULT NULL,
  note            VARCHAR(200) DEFAULT NULL,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (employee_id) REFERENCES users(id),
  UNIQUE KEY uk_shift_requests_employee_date (employee_id, date)
);

CREATE INDEX idx_shift_requests_date ON shift_requests(date);
CREATE INDEX idx_shift_requests_employee_id ON shift_requests(employee_id);

-- 初期データ: 管理者アカウント
-- パスワード: admin1234 (bcryptハッシュ済み)
INSERT INTO users (name, email, password, role) VALUES
  ('管理者', 'admin@example.com', '$2a$10$x4bojWSChzVZRWpisiG6iem4.AaqFaT7XGO5yghsAzRXiPDn3N4Fi', 'admin');

-- 初期データ: 従業員アカウント
-- パスワード: employee1234 (bcryptハッシュ済み)
INSERT INTO users (name, email, password, role) VALUES
  ('田中 太郎', 'tanaka@example.com', '$2a$10$V33HjZBJtBeSUc8lBqLk3uzfSA8Y.3WRz6rBRf8RmvFmFYGhibl3K', 'employee'),
  ('鈴木 花子', 'suzuki@example.com', '$2a$10$V33HjZBJtBeSUc8lBqLk3uzfSA8Y.3WRz6rBRf8RmvFmFYGhibl3K', 'employee');
