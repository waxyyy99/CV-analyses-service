# CV Analysis Service - Full Stack Implementation

This is a complete implementation of a CV (Resume) Analysis System with frontend (React), backend (Node.js/Express), and database (PostgreSQL).

## Project Structure

```
CV-analyses-service/
├── backend/              # Node.js + Express API
│   ├── index.js         # Main server file
│   ├── package.json
│   ├── .env             # Environment variables
│   ├── Dockerfile
│   └── migrations/
│       └── 001_init.sql # Database schema
├── frontend/            # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts       # API client
│   │   ├── main.tsx
│   │   └── components/
│   │       ├── Auth.tsx         # Login/Register
│   │       ├── ResumeUpload.tsx # File upload
│   │       ├── ResumeAnalysis.tsx # Analysis results
│   │       └── History.tsx      # View history
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.local
│   └── Dockerfile
├── docker-compose.yml   # Docker Compose configuration
└── README.md
```

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed

### 1. Build and Start Services

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **Backend** on `localhost:3000`
- **Frontend** on `localhost:5173`

### 2. Access the Application

Open your browser:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend
npm install
npm start
```

Backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "phone": "+1234567890",
    "password": "password",
    "name": "John Doe"
  }
  ```

- `POST /auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

### Resume Analysis
- `POST /resume/upload` - Upload resume (multipart/form-data)
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `file` (PDF or text file)

- `POST /analyze` - Analyze uploaded resume
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "resumeId": "uuid" }`

### History
- `GET /analyses` - Get all analyses for user
  - **Headers**: `Authorization: Bearer <token>`

- `GET /analyses/:id` - Get specific analysis
  - **Headers**: `Authorization: Bearer <token>`

## Features Implemented

### Backend
✅ JWT Authentication (register, login)
✅ File upload (PDF, text)
✅ Mock ML analysis with scoring:
  - Structure (0-10)
  - Content (0-10)
  - Keywords (0-10)
  - Formatting (0-10)
  - Experience (0-10)
✅ Analysis history
✅ Error handling and validation
✅ CORS support

### Frontend
✅ Authentication pages (register/login)
✅ Drag-and-drop file upload
✅ Resume analysis results with charts
✅ Detailed feedback and recommendations
✅ Analysis history view
✅ Responsive design
✅ Clean UI with Tailwind CSS

### Database
✅ PostgreSQL schema with tables:
  - users
  - resumes
  - analyses
  - skills
  - audit_logs
  - model_versions

## Mock Analysis Logic

The analysis endpoint returns mock scores based on resume content:

1. **Structure** - Checks for email, phone, experience, education, skills
2. **Content** - Based on word count
3. **Keywords** - Random score (6-9)
4. **Formatting** - Random score (7.5-9.5)
5. **Experience** - Checks for experience section

## Environment Variables

### Backend (.env)
```
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cv_analysis
JWT_SECRET=your_secret_key_change_in_production
PORT=3000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
```

## Testing the Flow

1. **Register** - Create new account
2. **Login** - Sign in with credentials
3. **Upload Resume** - Drag-drop or select file
4. **View Analysis** - See scores and recommendations
5. **Check History** - View previous analyses

## Next Steps (For Future Implementation)

1. **Replace Mock Analysis** with actual ML model:
   - Use fine-tuned BERT for scoring
   - Implement NER for entity extraction
   - Add TF-IDF for keyword analysis

2. **Database Integration**:
   - Replace in-memory storage with PostgreSQL queries
   - Add ORM (TypeORM, Sequelize, or Prisma)
   - Implement proper migrations

3. **Authentication**:
   - Add refresh tokens
   - Implement session management
   - Add 2FA support

4. **File Storage**:
   - Replace in-memory with S3/MinIO
   - Add file versioning
   - Implement cleanup job

## License

MIT
