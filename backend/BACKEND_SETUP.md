# LittleGenius backend setup

## Before connecting the frontend

1. Copy `.env.example` to `.env` and fill in the values for your machine and AI provider. Never commit `.env`.
2. Install backend dependencies with `npm install`.
3. Start MongoDB, then run `npm run dev` from this folder.
4. In another terminal, install the Flask requirements and start the AI service. It should stay on localhost for the demo.
5. Set the Next.js frontend API URL to this Express server and use the exact frontend origin in `FRONTEND_URL` (including the current port).

## Current API routes

- `/api/auth/me`: restore the signed-in account after a page refresh.
- `/api/teachers` and `/api/students`: separate role login/register routes, profile and logout.
- `/api/courses`, `/api/chapters`, `/api/sections`, `/api/classes`: course content and teacher class management.
- `/api/activities/section/:sectionId`: published activities for students; teacher reads include answer keys.
- `/api/activities/:id/check`: check answers without saving an attempt.
- `/api/activities/:id/submit`: server-grade and save a completed attempt.
- `/api/ai/activities`: teacher-protected AI generation; stores a `pending_review` activity.
- `/api/ai/activities/:id/regenerate`: teacher-protected regeneration; returns it to `pending_review`.

Activity responses keep answers private on student reads. `mcq` content accepts one question or a `questions[]` list; `matching` uses `pairs[]`; `fill_in_the_blanks` accepts one answer or `parts[]`. Both check and submit accept `{ "answers": { "itemId": "answer" } }`; multiple choice also accepts the selected option index. Only submit creates an `ActivityResult`.

## Current frontend integration

The Next.js frontend is connected to this API through its backend client and data adapter. Set NEXT_PUBLIC_API_URL in the frontend to the Express origin, and set FRONTEND_URL here to the frontend origin. Browser requests include the HTTP-only authentication cookie. AI activity drafting flows from Express to the Flask service configured with AI_SERVICE_URL; the provider credentials are read by Flask from the environment. Teachers review drafts before approval.
