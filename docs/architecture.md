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

- Presentation tier decision: Each React route fetches through the shared API client and presents accessible loading, empty, success, and error states. Reusable presentation stays in shared components; route-specific API paths and response shapes remain close to each route.
- Logic tier decision: Keep Express behavior in route handlers and service functions under `octofit-tracker/backend/src`, returning deliberate 4xx responses for invalid IDs, missing records, and bad payloads rather than exposing cast failures as 500 responses.
- Data tier decision: Use Mongoose schemas for users, teams, activities, and workouts, with model-level validation and stable upsert keys in the seed script so repeated seeding is safe and unrelated records are preserved.
- Activity tracking approach: Validate activity type, positive minutes, and existing user/team references; persist the user, team, type, minutes, computed points, and occurrence timestamp in one activity record.
- Team management approach: Require a non-empty team name and mascot, default members to an empty array, and validate member references when creating a team.
- Leaderboard approach: Aggregate stored activity points by team, sort totals descending with a deterministic team-name tie-break, and assign one-based ranks in the API service.
- Workout suggestions approach: Find users by normalized email, prioritize workouts matching their fitness goal or recent activity, explain each recommendation, and return a 4xx response for an unknown user.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies schema validation, relationships, seeded fixtures, and seed idempotency.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies request validation, status codes, business rules, and response shapes across all API capabilities.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies route data rendering and accessible loading, empty, and error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript errors in backend routes, services, and models.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — type-checks and produces the Vite production bundle.
- Run order: finish and verify the data tier first, then API behavior, then the React presentation, before running all suites and builds together.
