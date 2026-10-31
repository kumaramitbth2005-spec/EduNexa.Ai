# EduNexa — AI-Powered Smart Education Platform

> **"Learn Better. Practice Smarter. Build Your Future."**

EduNexa is a production-grade, full-stack, AI-powered smart education ecosystem built with modern cloud and web engineering practices. It provides an all-in-one learning hub for university students, educators, and administrators—integrating personalized curriculum delivery, real-time examinations, generative AI tutoring, document summarization, career/placement tracks, and collaborative peer community boards.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v3, React Router v7, Lucide Icons, Recharts, React Markdown |
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose, Multer, Helmet, Morgan, Express Validator |
| **Database** | MongoDB with Mongoose ODM (24 Data collections & indexes) |
| **Authentication** | JSON Web Tokens (JWT), bcrypt password hashing, Role-based Access Control (Student, Teacher, Admin) |
| **AI Integration** | Google Gemini API (Direct Node.js SDK & optional Python FastAPI microservice) |
| **File Storage** | Cloudinary / Multi-format document parser |
| **Real-time** | Socket.IO WebSockets for notifications and live communication |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance or free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

---

### 2. Environment Variables Setup

#### Backend Configuration (`backend/.env`)
Create `backend/.env` (copy from `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/edunexa

# JWT Security
JWT_SECRET=edunexa_super_secure_production_secret_key_2026_min32chars
JWT_EXPIRE=7d

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Storage (optional for cloud image/pdf hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration (`frontend/.env`)
Create `frontend/.env` (copy from `frontend/.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=EduNexa
```

---

### 3. Installation & Database Seeding

#### Install Backend & Frontend:
```bash
# 1. Backend Dependencies
cd backend
npm install --legacy-peer-deps

# 2. Frontend Dependencies
cd ../frontend
npm install --legacy-peer-deps
```

#### Seed Database with Demo Accounts & Sample Curricula:
```bash
cd ../backend
node seed.js
```

**Pre-seeded Demo Accounts:**
- **Student**: `student@edunexa.com` / `Password123!`
- **Teacher**: `teacher@edunexa.com` / `Password123!`
- **Administrator**: `admin@edunexa.com` / `Password123!`

---

### 4. Running the Application

Open two terminal windows:

#### Terminal 1 — Backend API:
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

#### Terminal 2 — Frontend Client:
```bash
cd frontend
npm run dev
# Client running at http://localhost:5173
```

---

## 🌟 Key Application Features

### 🎓 1. Student Learning Hub
- **Personalized Dashboard**: Dynamic study streak tracker, points, badge achievements, and enrolled course progress cards.
- **Curriculum Browser**: Filter courses by university semester, technical category, and difficulty level.
- **Interactive Course Viewer**: Step-by-step syllabus lessons with video, code, and text content with completion checks.
- **Study Materials Library**: Instant access to previous year question papers, lab manuals, and revision notes.

### 🤖 2. Generative AI Suite
- **Bilingual AI Tutor**: Ask doubts in English or Hindi, receive step-by-step explanations, code examples, and speech audio playback.
- **AI PDF Summarizer**: Ingest large textbooks or lecture notes to generate executive summaries and key exam takeaways.
- **Practice Question Generator**: On-demand Multiple Choice, Short Answer, and True/False questions by topic with difficulty levels and JSON export.
- **AI Study Planner**: Custom timeline roadmaps tailored to your available hours per day and target exam date.

### 📝 3. Online Examination Platform
- **Timed Assessments**: Fullscreen test environment with real-time countdown timer.
- **Interactive Question Navigator**: Track answered, unanswered, and marked-for-review questions.
- **Server-Side Evaluation**: Secure answer evaluation preventing frontend answer leakage.
- **Instant Result Analytics**: Score percentage, pass/fail badge, time taken, and detailed explanation breakdown.
- **Exam History**: Historical performance trend visualization using Recharts.

### 💼 4. Career & Placement Preparation
- **DSA Roadmap**: Interactive topic tracker for Arrays, Trees, Graphs, DP, and LeetCode patterns.
- **Interview Core Prep**: Curated OS, DBMS, Computer Networks, and System Design questions.
- **Behavioral & HR Bank**: STAR method interview guidance.
- **Verified Opportunities**: Curated placement drives and internships linking to official company portals.

### 💬 5. Student Community
- **Discussion Forum**: Create technical questions, announcements, and resource sharing posts.
- **Upvote & Downvote System**: Community-curated best answers.
- **Code Highlighting**: Syntax highlighting for shared code snippets.
- **Moderation Flagging**: Content reporting pipeline for administrative review.

### 👨‍🏫 6. Teacher Portal
- **Course Studio**: Author, edit, and publish semester curricula.
- **Exam Authoring Tool**: Interactive builder for MCQ questions, answer keys, time limits, and passing thresholds.
- **Student Analytics**: Track student enrollment numbers across courses.

### 🛡️ 7. Administrator Control
- **User Governance**: Search, filter, inspect, and toggle active/deactivated status for student and teacher accounts.
- **System Metrics**: Visual role distribution charts and platform telemetry.

---

## 🔒 Security Best Practices Implemented
- Passwords salted and hashed using **bcrypt** (12 rounds).
- Stateless authentication using **JWT** tokens.
- **Helmet.js** protection for HTTP security headers.
- **express-rate-limit** protection against brute force and DDoS.
- **express-mongo-sanitize** against NoSQL injection.
- Role-based route guards on both API endpoints and React navigation.
- Examination answer keys strictly evaluated server-side and never sent to clients prior to submission.

---

## 📋 Production Deployment Instructions

### Frontend (Vercel)
1. Push repository to GitHub.
2. In Vercel, import the repository and set **Root Directory** to `frontend`.
3. Set Environment Variable: `VITE_API_URL=https://your-backend-domain.onrender.com/api`.
4. Deploy!

### Backend (Render / Railway)
1. In Render, create a new **Web Service** pointing to the repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install --legacy-peer-deps`.
4. Start Command: `node server.js`.
5. Set Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `FRONTEND_URL`.
6. Deploy!

