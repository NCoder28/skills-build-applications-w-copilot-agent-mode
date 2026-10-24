# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the React UI to consume the shared API client in `octofit-tracker/frontend/src/api/client.ts`, with each route component responsible only for rendering stateful views: loading, empty, success, and error. Use Bootstrap layout and semantic text so the tests validate accessible output, not implementation details.
- Logic tier decision: Keep Express behavior in route handlers and service functions under `octofit-tracker/backend/src`, returning deliberate 4xx responses for invalid IDs, missing records, and bad payloads while avoiding raw Mongo/Mongoose cast errors leaking as 500 responses.
- Data tier decision: Model the domain with Mongoose schemas for activities, users, teams, leaderboard aggregation, and seeded workout patterns; keep validation constraints in schema definitions and use stable upsert keys in the seed script so rerunning the seed is safe.
- Activity tracking approach: Validate that `userId` and `teamId` map to persisted records, store a normalized activity record with `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`, and compute points from minutes using the exercise contract rather than hard-coding UI-only values.
- Team management approach: Require a non-empty team name at creation time and preserve member relationships in the seed fixtures. Keep the list endpoint focused on returning team records with their displayed metadata.
- Leaderboard approach: Aggregate activity points per team from stored activities, sort descending by total points, and assign a 1-based rank to each team. This keeps ranking logic centralized in the API/service layer rather than scattered in the frontend.
- Workout suggestions approach: Match a seeded user by email, inspect their recent activity context or goal, and return recommendation records whose `focus` and `reason` are aligned with that user profile. Missing users should return a 4xx rather than a blank or fake success response.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`  
  Use this to verify Mongoose validation, schema invariants, and seed data compatibility before touching the API.
- API command: `npm run test:api --prefix octofit-tracker/backend`  
  Use this to verify request validation, status codes, business rules, and the exact response shapes for activities, teams, leaderboard, and workout endpoints.
- Frontend command: `npm test --prefix octofit-tracker/frontend`  
  Use this to validate accessible UI states and route rendering. Red tests indicate missing loading/empty/error/success handling or wrong API path usage.
- Backend build command: `npm run build --prefix octofit-tracker/backend`  
  Use this to catch TypeScript, route, and service issues that unit tests may not exercise.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`  
  Use this to confirm the Vite app builds with the expected API client and route structure.
- Run order: complete the data tier first, then API, then frontend. Each failing test should guide the smallest next change instead of broad rewrites.
