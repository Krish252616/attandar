# Team Arogya Attendance System - Setup Guide

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
- Go to https://supabase.com
- Sign up / Login
- Create new project
- Copy `Project URL` and `Anon Key` (save these!)

### 1.2 SQL Setup (Copy-paste in Supabase SQL Editor)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'member' or 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);

-- QR Codes (Daily Links)
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Logs
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL REFERENCES qr_codes(token),
  entry_time TIMESTAMP NOT NULL,
  exit_time TIMESTAMP,
  duration_seconds INTEGER,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "anyone_can_view_users" ON users FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_active_qr" ON qr_codes FOR SELECT 
  USING (expires_at > NOW() AND is_active = true);
CREATE POLICY "anyone_can_insert_attendance" ON attendance FOR INSERT 
  WITH CHECK (true);
CREATE POLICY "anyone_can_view_attendance" ON attendance FOR SELECT USING (true);

-- Insert 6 team members
INSERT INTO users (name, role) VALUES
  ('Member 1', 'member'),
  ('Member 2', 'member'),
  ('Member 3', 'member'),
  ('Member 4', 'member'),
  ('Member 5', 'member'),
  ('Member 6', 'member');
```

### 1.3 Enable Auth in Supabase
- Go to Authentication → Providers
- Enable Email (default)
- Create admin user: email: admin@arogya.com, password: (choose strong one)

---

## Step 2: Create React App

```bash
npm create vite@latest arogya-attendance -- --template react
cd arogya-attendance
npm install
npm install @supabase/supabase-js html5-qr axios
```

---

## Step 3: Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 4: Deploy to Netlify

1. Push to GitHub
2. Go to https://netlify.com
3. Click "New site from Git"
4. Select repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Add environment variables in Netlify settings
8. Deploy!

---

## URLs After Deployment

- **Member Page:** `https://your-site.netlify.app/?token=xyz`
- **Admin Dashboard:** `https://your-site.netlify.app/admin`
- **Generate Link:** Admin login → Click "Generate New Link"

---

## File Structure

```
src/
├── App.jsx
├── components/
│   ├── MemberPage.jsx
│   ├── AdminDashboard.jsx
│   ├── AdminLogin.jsx
│   ├── QRScanner.jsx
│   ├── Timer.jsx
│   └── LinkGenerator.jsx
├── lib/
│   └── supabase.js
└── App.css
```

Done! Now ready to build components.
