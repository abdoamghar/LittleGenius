# LittleGenius Backend

The LittleGenius backend provides the API and AI activity-generation service for the learning platform.

## Services

- **Express API:** TypeScript, Express, MongoDB, and Mongoose.
- **AI service:** Python Flask service that requests structured educational activities from an OpenAI-compatible model provider.
- **Authentication:** Separate teacher and student routes, role-based access, and HTTP-only session cookies.

Teachers review AI-generated activities before publishing them to students.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB connection string.
- Python 3.10 or newer and pip if running AI generation.
- Model-provider URL, API key, and model name if using AI generation.

## Local setup

1. Copy `.env.example` to `.env` and fill in the local values. Keep `.env` private.
2. Install and start the Express API:

   ```bash
   npm ci
   npm run dev
   ```

3. In a second terminal, install and start the Flask AI service:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r ai_service/requirements.txt
   python ai_service/app.py
   ```

4. Set the frontend's `NEXT_PUBLIC_API_URL` to the Express API origin. Configure `FRONTEND_URL` to match the frontend origin.

Locally, Express uses `API_PORT` (default `5000`) and Flask uses `AI_PORT` (default `8000`). On Railway, each service uses Railway’s injected `PORT`. Flask binds to `0.0.0.0` so Express can reach it over the private network. The Flask health endpoint is `/health`.

## Configuration

Set values in `.env` or in the deployment provider's environment settings:

| Variable | Purpose |
| --- | --- |
| `PORT` | Railway-assigned service port; takes priority in deployment |
| `API_PORT` | Local Express API port (defaults to `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `FRONTEND_URL` | Allowed frontend origin for credentialed requests |
| `AI_SERVICE_URL` | Express-to-Flask service URL |
| `AI_PORT` | Local Flask service port |
| `AI_PROVIDER_URL` | OpenAI-compatible model endpoint |
| `AI_PROVIDER_API_KEY` | Model-provider API key |
| `AI_MODEL` | Model identifier |

Never commit real credentials or `.env` files.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express with file watching |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Start the compiled Express server |
| `npm test` | Run the current typecheck script |

## API route groups

- `/api/auth` — current session.
- `/api/teachers` and `/api/students` — registration, sign-in, profiles, and sign-out.
- `/api/classes` — class management, rosters, and course assignment.
- `/api/courses`, `/api/chapters`, and `/api/sections` — learning content.
- `/api/activities` — student activity reads, answer checks, submissions, results, and progress.
- `/api/ai` — teacher-protected activity generation and regeneration.

See `BACKEND_SETUP.md` for the API flow and frontend integration details.
