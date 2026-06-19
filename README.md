# UPSC Platform Backend

This repository contains the backend and frontend for the UPSC educational platform.

## Project Structure

- `GEMINI.md`: Core architectural and security principles.
- `instructions.md`: Step-by-step development phases.
- `Backend/`: The Node.js/Express backend application using PostgreSQL, Drizzle ORM, and Better Auth.
- `Frontend/`: The React Native/Expo mobile application.

## Getting Started

### Backend Setup

1. Navigate to the `Backend/` directory: `cd Backend`
2. Install dependencies: `npm install`
3. Copy the `.env.example` file to `.env`: `cp .env.example .env`
4. Fill in all required environment variables in the `.env` file (e.g., `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`).
5. Run Drizzle database migrations: `npx drizzle-kit push` (or `npx drizzle-kit generate` if applying locally).
6. Start the development server: `npm run dev`

The server will run on the specified `PORT` (default 5000) and validate your environment variables at startup.