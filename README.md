# ️ Burnout Sentinel - AI-Powered Student Well-being Platform

**Burnout Sentinel** is an intelligent early intervention system designed to detect, prevent, and manage student burnout. By combining real-time engagement analytics with a supportive AI companion ("Sathi"), it helps institutions proactively support students before they fall behind.

![Burnout Sentinel Banner](https://via.placeholder.com/1200x400.png?text=Burnout+Sentinel+Dashboard)

##  Key Features

###  For Students.
    *   **Smart Scheduling**: One-click "Focus Block" scheduling to Google Calendar.

*   **Comprehensive Academic Dashboard**: 
    *   View exact Continuous Assessment (CA1 - CA4) marks and a trend graph for 6 specific subjects.
    *   Real-time attendance tracking (out of 120 total classes per semester).
    *   **Critical Alerts**: Prominent warnings if attendance drops below the 60% requirement.
*   **Raise Hand Feature**: Instantly request help or a 1-on-1 Meet session directly with the subject teacher.
*   **Notifications Inbox**: Receive broadcast announcements and direct messages from teachers.

###  For Subject Teachers / Admins
*   **Subject-Isolated Dashboard**: Teachers only see data relevant to their specific assigned subject.
*   **Real-time Database Editing**: Inline data table to directly update CA marks and attendance. Risk scores instantly recalculate.
*   **Raised Hands Queue**: Instantly view students who are requesting help and launch Google Meet directly from the queue.
*   **Messaging & Broadcast**: Send instant notifications to the entire class or select students.
*   **Risk Analysis Dashboard**: Real-time identification of "High Risk" students based on:
    *   Falling grades and academic deficits
    *   Low engagement and critically low attendance (< 60%)

---

## ️ Tech Stack

*   **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Chart.js
*   **Backend**: Node.js, Express.js
*   **AI Engine**: Google Gemini Pro (via `@google/generative-ai`)
*   **Integrations**: Google Calendar API, Google Meet API (Simulated/Ready for OAuth)
*   **Database**: In-memory store (MVP pattern) / Extensible to MongoDB/PostgreSQL

---

## ️ Installation & Setup

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

##  Deployment Guide (Vercel)

If you are deploying to **Vercel** and see a `404: NOT_FOUND` error, it is likely because Vercel is looking for the app in the root folder, but the Next.js app is inside `client/`.

### Fix: Set Root Directory
1.  Go to your Vercel Project Settings.
2.  Navigate to **General** > **Root Directory**.
3.  Click **Edit** and select the `client` folder.
4.  **Save** and **Redeploy**.

---

##  Usage Workflow

### Login
*   **Admin Portal**: Access via `/login` (Use credentials provided in `student_credentials.txt` or default admin login).
*   **Student Portal**: Access via `/login`.
    *   **Demo Student**: `priyanshubakshi2506@gmail.com` / `pass123` (ID: STD2506)

### Scenario 1: The Struggling Student
1.  **Login** as any student from `student_credentials.txt` (e.g., Roll: 12031523001).
2.  Navigate to the **Student Dashboard**.
3.  Switch between subjects. Notice the **Critical Attendance Warning** if attendance is below 60%.
4.  Click **"Raise Hand / Meet"** to request help from the respective subject teacher.

### Scenario 2: The Proactive Teacher
1.  **Login** as a subject teacher from `student_credentials.txt` (e.g., Guru ID: Swadhin, Subject: Games & App Design).
2.  View the **Risk Dashboard** for your subject.
3.  Acknowledge the **Raised Hands Queue** and start a Google Meet with the struggling student.
4.  Update a student's **CA marks** or **Classes Attended**. Notice how the Danger Score dynamically shifts.
5.  Use the **Broadcast / Message** tool to send an encouraging notification to the class.


---

##  Project Structure

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

##  Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

##  License
MIT License.
