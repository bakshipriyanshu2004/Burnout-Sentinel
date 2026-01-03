# 🛡️ Burnout Sentinel - AI-Powered Student Well-being Platform

**Burnout Sentinel** is an intelligent early intervention system designed to detect, prevent, and manage student burnout. By combining real-time engagement analytics with a supportive AI companion ("Sathi"), it helps institutions proactively support students before they fall behind.

![Burnout Sentinel Banner](https://via.placeholder.com/1200x400.png?text=Burnout+Sentinel+Dashboard)

## 🚀 Key Features

### 🎓 For Students
*   **"Sathi" AI Companion**: A supportive, Gemini-powered chatbot available 24/7 on the Student Portal.
    *   **Emotional Support**: Chats like a friend to reduce stress.
    *   **Smart Scheduling**: One-click "Focus Block" scheduling to Google Calendar.
    *   **Motivation**: Instant motivational boosts via Quick Actions.
*   **Personalized Dashboard**: View engagement scores, attendance trends, and assignment status.
*   **Assignment Tracking**: Easy view of pending assignments and upload capabilities.

### 🏫 For Admins / Counselors
*   **Risk Analysis Dashboard**: Real-time identification of "High Risk" students based on:
    *   Falling grades
    *   Low engagement (login frequency, video watch time)
    *   Missed deadlines
*   **Instant Intervention**: 
    *   **Instant Counseling**: Generate a Google Meet link instantly for high-risk students.
    *   **Assign Focus**: Manually schedule focus blocks for students who are struggling.
*   **Deep Analytics**: Detailed charts and insights for every student.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Chart.js
*   **Backend**: Node.js, Express.js
*   **AI Engine**: Google Gemini Pro (via `@google/generative-ai`)
*   **Integrations**: Google Calendar API, Google Meet API (Simulated/Ready for OAuth)
*   **Database**: In-memory store (MVP pattern) / Extensible to MongoDB/PostgreSQL

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/bakshipriyanshu2004/Burnout-Sentinel.git
cd Burnout-Sentinel
```

### 2. server Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
# Optional for fully working Google integration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000
```

Start the server:
```bash
npm run dev
```

### 3. Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Start the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🚀 Deployment Guide (Vercel)

If you are deploying to **Vercel** and see a `404: NOT_FOUND` error, it is likely because Vercel is looking for the app in the root folder, but the Next.js app is inside `client/`.

### Fix: Set Root Directory
1.  Go to your Vercel Project Settings.
2.  Navigate to **General** > **Root Directory**.
3.  Click **Edit** and select the `client` folder.
4.  **Save** and **Redeploy**.

---

## 📖 Usage Workflow

### Login
*   **Admin Portal**: Access via `/login` (Use credentials provided in `student_credentials.txt` or default admin login).
*   **Student Portal**: Access via `/login`.
    *   **Demo Student**: `bakshi@gmail.com` / `pass123` (ID: STD2506)

### Scenario 1: The Stressed Student
1.  **Login** as **Priyanshu Bakshi**.
2.  Navigate to the **Student Dashboard**.
3.  Open **Sathi Chat** (bottom right).
4.  Click **"📅 Focus Block"** or type "I'm overwhelmed".
5.  Sathi schedules a dedicated study session on your mock Google Calendar.

### Scenario 2: The Proactive Counselor
1.  **Login** as **Admin**.
2.  View the **Risk Dashboard**.
3.  Identify students marked with **HIGH RISK** red badges.
4.  Click "View Details" on a student.
5.  Click **"Instant Counseling"** to open a Google Meet session immediately.

---

## 📂 Project Structure

```
├── client/                 # Next.js Frontend
│   ├── src/app/            # App Router Pages (Dashboard, Student, Login)
│   ├── src/components/     # UI Components (SathiChat, Charts, Modals)
│   └── ...
├── server/                 # Express Backend
│   ├── src/data/           # Mock Data Store
│   ├── src/risk/           # Risk Calculation Engine
│   ├── src/routes/         # API Routes (Chat, Calendar, Students)
│   ├── src/services/       # AI & Google Services
│   └── ...
└── README.md
```

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License
MIT License.
