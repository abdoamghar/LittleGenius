# LittleGenius

LittleGenius is a learning platform for children ages 6–12. This repository contains the Next.js frontend, Express API, MongoDB models, and Flask AI service used by teachers and students.

## What the app supports

- Teacher and student sign-in with role-based pages.
- Teacher workflows for classes, courses, lessons, and activity drafts.
- Teacher review and approval before activities are shown to students.
- Student workflows for lessons, quizzes, matching, fill-in-the-blank activities, and progress.
- Backend-powered account and learning data; the frontend does not use a local mock-data store.

## Run locally

### Requirements

- Node.js and npm.
- Python 3.10+ for the Flask AI service.
- MongoDB Atlas or a reachable MongoDB instance.

### Setup

Install frontend dependencies and create a local frontend environment file:

```bash
npm ci
```

```powershell
Copy-Item .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express API origin. For local development, use `http://localhost:5000`.

Start the Express API in a second terminal:

```bash
cd backend
npm ci
npm run dev
```

Create `backend/.env` from `backend/.env.example` and configure MongoDB, the JWT secret, frontend URL, AI service URL, and AI provider settings. Start the Flask AI service in another terminal after installing its requirements:

```bash
cd backend
python -m venv .venv
```

Activate the environment, then run:

```bash
pip install -r ai_service/requirements.txt
python ai_service/app.py
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). AI activity drafting requires the Flask service and a working model-provider configuration.

> Do not commit `.env.local` or put real credentials in source files. `.env.example` is the safe configuration template.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Check frontend code with ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |

When switching between `npm run dev` and `npm run build`, stop the other server first. Both use the `.next` directory, so running them at the same time can break the development server’s assets.

## Main routes

### Public

- `/login` — sign in.
- `/register` — create an account.
- `/teacher/sign-in` — teacher sign-in entry.

### Teacher

- `/teacher` — dashboard.
- `/teacher/classes` — classes and rosters.
- `/teacher/classes/[classId]` — class progress and students.
- `/teacher/courses` — course list and management.
- `/teacher/courses/[courseId]/edit` — course editor.
- `/teacher/drafts` — review AI-drafted activities.
- `/teacher/activities/new` — create an activity draft.
- `/teacher/activities/[activityId]/review` — review an activity.
- `/teacher/progress` — student and class progress.

### Student

- `/student` — Today page.
- `/student/courses` — assigned courses.
- `/student/course/[courseId]` — course outline and lessons.
- `/student/lesson/[lessonId]` — lesson content.
- `/student/activity/[activityId]` — complete an activity.
- `/student/activity/[activityId]/result` — view feedback and result.
- `/student/progress` — learning progress.

Protected teacher and student routes require a signed-in user with the matching role.

## Project structure

```text
app/                 Next.js App Router pages, layouts, and providers
src/screens/         Screen-level page UI
src/components/      Shared layouts, teacher/student UI, activities, and controls
src/lib/api.js       Data interface used by screens
src/lib/backend-client.js  HTTP requests and authentication calls
src/lib/backend-data.js    Converts backend responses to frontend view data
public/learning-art/ Local illustrations and decorative images used by the app
```

## How data flows

```text
Next.js page and screen
        ↓
src/lib/api.js
        ↓
backend-client.js + backend-data.js
        ↓
Express API ─── MongoDB
        └──────── Flask AI service for activity drafting
```

The frontend sends authenticated requests to Express using the configured API URL. Express manages application data in MongoDB. AI generation is handled through the backend’s Flask service; teachers can review generated content before approving it for students.

## Project structure

Frontend dependencies are declared in the root `package.json`. The Express API has its own manifest and lockfile under `backend/`; Flask dependencies are listed in `backend/ai_service/requirements.txt`.

```text
app/                         Next.js App Router pages and layouts
src/screens/                 Teacher and student screen UI
src/components/              Shared UI, layouts, and activities
src/lib/                     Frontend API, auth, and data mapping
backend/                     Express API, MongoDB models, and Flask AI service
```

## Demo walkthrough

1. Sign in as a teacher and open a class or course.
2. Review or create an activity and approve it for students.
3. Sign in as a student, complete the activity, and review the feedback.
4. Return to the teacher view to see recorded progress and recent activity.

Demo accounts and sample records are stored in the configured backend database; credentials are intentionally not listed in this repository.

## Notes

- Frontend, Express, and Flask are separate services in one repository; configure and deploy each service with its own start command and environment variables. See [`backend/README.md`](./backend/README.md) and [`backend/BACKEND_SETUP.md`](./backend/BACKEND_SETUP.md) for API details.
- Course illustrations currently include image URLs hosted by the legacy Base44 media CDN; authentication and learning data use the LittleGenius backend.
