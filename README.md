# SkillLoop - Peer-to-Peer Skill Exchange Platform

A full-stack application for skill exchange and peer learning.

## Project Structure

```
├── Skill-Loop/          # Backend (FastAPI + Python)
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Security & config
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy models
│   │   └── schemas/     # Pydantic schemas
│   └── main.py
│
└── SkillLoop/           # Frontend (React + TypeScript + Vite)
    └── src/
        ├── components/  # React components
        ├── contexts/    # Auth context
        ├── hooks/       # Custom hooks (API)
        └── lib/         # API client
```

## Setup

### Backend (Skill-Loop)

1. Create virtual environment:
```bash
cd Skill-Loop
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Auth0 and database credentials
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
python main.py
# Or: uvicorn main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend (SkillLoop)

1. Install dependencies:
```bash
cd SkillLoop
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env if needed (default API URL is http://localhost:8000)
```

3. Start development server:
```bash
npm run dev
```

Frontend runs at: http://localhost:5173

## Authentication

The app uses Auth0 for authentication. Configure your Auth0 application:

1. Create an Auth0 application (Regular Web Application)
2. Set callback URL: `http://localhost:8000/api/auth/callback`
3. Set logout URL: `http://localhost:5173`
4. Copy credentials to backend `.env`

For development/demo, the frontend includes a demo login that bypasses Auth0.

## API Endpoints

- `POST /api/auth/login` - Initiate Auth0 login
- `GET /api/auth/callback` - Auth0 callback
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/skills` - Get user's skills
- `POST /api/skills` - Add a skill
- `GET /api/matches` - Get matches
- `GET /api/matches/find` - Find potential matches
- `POST /api/matches/{id}/accept` - Accept match
- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Create session
- `POST /api/sessions/{id}/complete` - Complete session
- `POST /api/sessions/{id}/rate` - Rate session
- `GET /api/credits/balance` - Get credit balance
- `GET /api/credits/history` - Get credit history

## Features

- **Smart Matching**: Find users with complementary skills
- **Session Management**: Schedule, complete, and rate sessions
- **Credit System**: Earn credits by teaching, spend by learning
- **Skill Profiles**: Manage teaching and learning skills
- **Real-time Updates**: React Query for data synchronization
