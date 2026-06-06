# Secure Cloud Log Analyzer (Safari)

A modular, high-performance web application designed to analyze large-scale web server logs (Apache/Nginx) using a concurrent Python MapReduce processing engine. The analysis results are loaded into a PostgreSQL database and presented in a premium, real-time React dashboard.

---

## 📂 Project Architecture

```
Safari/
├── complete_backend/
│   ├── backend/                # Node.js + Express.js API Server
│   │   ├── src/
│   │   │   ├── config/         # DB connection pool, env validator
│   │   │   ├── controllers/    # API request handlers
│   │   │   ├── middleware/     # JWT authentication, file uploader
│   │   │   ├── routes/         # Router mounts (Auth, Logs, Analytics, Audit)
│   │   │   └── services/       # DB queries, Python MapReduce driver
│   │   └── package.json
│   ├── mapreduce/              # Python MapReduce Engine
│   │   ├── engine/             # Splitter, Mapper, Shuffler, Reducer modules
│   │   ├── tests/              # Python test cases
│   │   ├── main.py             # CLI pipeline orchestrator
│   │   └── requirements.txt
│   └── .env                    # Shared backend environment configuration
├── frontend/                   # React + Vite + Tailwind CSS (v4) UI Portal
│   ├── src/
│   │   ├── components/         # Reusable charts, uploader, metrics cards
│   │   ├── context/            # AuthContext provider
│   │   ├── pages/              # Dashboard, Login, Register, Audit Logs
│   │   └── services/           # Axios Client (with interceptors)
│   ├── .env                    # Frontend environment configuration
│   └── package.json
└── README.md                   # This instruction guide
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (vibrant palette, glassmorphism UI)
- **Charts**: Recharts (smooth SVG visualization)
- **Networking**: Axios (JWT interception & error redirection)

### Backend
- **Framework**: Express.js
- **Database**: Serverless Neon PostgreSQL
- **Security**: JWT Authentication, bcryptjs password hashing
- **File Processing**: Multer middleware (handling `.log`/`.txt` uploads securely)

### Processing Engine
- **Language**: Python 3
- **Concurrency**: `concurrent.futures.ProcessPoolExecutor` for multi-core chunk mapping
- **Architecture**: MapReduce (Split ➔ Map ➔ Shuffle ➔ Reduce)

---

## 🚀 Installation & Setup

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **Python 3**
3. **PostgreSQL Database** (e.g. Neon.tech)

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd complete_backend/backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in `complete_backend/.env` (one level up from `backend/`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   PYTHON_PATH=python
   MAPREDUCE_WORKERS=4
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```
4. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```

---

## 💻 Python MapReduce CLI Usage

The core processing engine can also be executed as a standalone CLI tool:

```bash
# From the project root
$env:PYTHONPATH="." # For Windows PowerShell
# OR
export PYTHONPATH="." # For Unix-like systems

python complete_backend/mapreduce/main.py --input <path_to_log_file> --workers <number_of_workers> --output-json <path_to_save_report.json>
```

### MapReduce Pipeline Details:
- **Split**: Reads the source file and splits it into discrete line segments.
- **Map**: Spawns parallel processes to extract HTTP status codes (`HTTP_<status>`), traffic hours (`Hour_<HH>`), and log anomalies/severities (`Severity_<LVL>`).
- **Shuffle**: Group values systematically by sorted alphabetical keys.
- **Reduce**: Computes sum counts and compiles analytics metrics into a single structured JSON report.
