# EduNexa — System Architecture & Design Specification

## 1. Architectural Overview
EduNexa follows a modular monolithic architecture, separating concerns cleanly across:
- **Presentation Layer**: Client-side single page application built with React 19, Tailwind CSS, and Vite.
- **Application & API Gateway**: Node.js & Express.js REST API layer handling authentication, business logic, role guards, and Socket.IO real-time channels.
- **AI & NLP Microservice**: Hybrid model supporting direct Gemini 1.5 Flash SDK calls in Node.js alongside a high-performance Python FastAPI service for heavy document extraction.
- **Persistence Layer**: MongoDB database with Mongoose schemas, indexes, and validation rules.

---

## 2. Database Schema (Mongoose Models)

### Core Collections:
1. **User**: Name, email, password (hashed), role (`student`, `teacher`, `admin`), college, branch, semester, streak, points, avatar, badges, language preference.
2. **Course**: Title, description, teacher reference, category, level, semester, price, duration, enrollment count, rating, publication status.
3. **Lesson**: Title, content, course reference, teacher reference, type (`video`, `text`, `pdf`, `quiz`), completion time, order.
4. **Enrollment**: Student reference, course reference, progress percentage, completed lessons list, certificate status.
5. **Exam**: Title, duration, total marks, passing marks, attempt limits, questions array with options, correct answers, and explanations.
6. **Result**: Student reference, exam reference, evaluated answers array, obtained marks, percentage, pass/fail status, attempt number, time taken.
7. **StudyMaterial**: Title, fileUrl, type (`pdf`, `question-paper`, `lab-manual`), semester, uploadedBy, download counter.
8. **Post & Comment**: Discussion threads, tags, upvotes/downvotes, code snippets, moderation flags.
9. **Notification**: Recipient, sender, type, title, body, read status.
10. **AIConversation**: Chat history with Gemini LLM, tokens used, context cache.

---

## 3. Security Architecture
- **Authentication**: JWT signed with HS256 algorithm and 7-day expiration.
- **Password Protection**: Salted hash using bcrypt with work factor 12.
- **Role Enforcement**: Middleware `authorize('teacher', 'admin')` validates roles before executing controller logic.
- **Exam Integrity**: The `/api/exams/:id` endpoint strips `isCorrect` flags and explanations before transmitting question payloads to students. Scoring is executed entirely on the server.

