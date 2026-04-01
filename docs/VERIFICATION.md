# VisualPC — VERIFICATION CHECKLIST

## Build & Routes

| Check | Command | Expected |
|-------|---------|----------|
| Frontend build | `cd frontend && npm run build` | ✅ Compiles. Routes: `/`, `/login`, `/dashboard`, `/submit-job`, `/architecture`, `/api/auth/[...nextauth]` |
| Backend syntax | `python -c "import ast; ast.parse(open('backend/metrics_api.py').read())"` | ✅ No errors |
| Docker build | `docker-compose up --build` | ✅ All 3 services start |

## API Contract

| Endpoint | Method | Response Format | Auth |
|----------|--------|-----------------|------|
| `/health` | GET | `{ status, service, version, workers, jobs, metrics, queued_jobs }` | No |
| `/auth/login` | POST | `{ access_token, token_type }` | No |
| `/metrics` | GET | `{ data: [...], count: N }` | JWT |
| `/metrics/export` | GET | CSV file download | JWT |
| `/jobs` | GET | `{ data: [...], count: N }` | JWT |
| `/jobs` | POST | `{ status: "queued", job: {...} }` (201) | JWT |
| `/workers` | GET | `{ data: [...], count: N }` | JWT |
| `/register-worker` | POST | `{ status: "registered", worker: {...} }` (201) | JWT |
| `/ingest` | POST | `{ status: "ok", ingested: {...} }` | JWT |
| Errors | Any | `{ detail: { error: { code, message } } }` | — |

## CORS

```bash
curl -H "Origin: http://localhost:3000" -I http://localhost:8500/health
# → Access-Control-Allow-Origin: http://localhost:3000
```

## Authentication

- [ ] Credentials login: `admin` / `visualpc2026` → JWT → redirects to `/dashboard`
- [ ] OAuth buttons: disabled with tooltip when env vars not set
- [ ] OAuth buttons: enabled when `NEXT_PUBLIC_GOOGLE_CONFIGURED=1` / `NEXT_PUBLIC_GITHUB_CONFIGURED=1`
- [ ] 401 response auto-clears token and redirects to `/login`

## Dashboard Functional

- [ ] System health cards show workers/metrics/GPU/latency
- [ ] GPU chart renders with area gradient
- [ ] Latency chart renders with color-coded bars
- [ ] Workers table shows name, device, CUDA, memory, status, IP
- [ ] Jobs table shows ID, type, workload, priority, status, submitted_by
- [ ] Metrics timeline shows last 10 events
- [ ] Live indicator pulses ("refreshing every 5 seconds")
- [ ] Data refreshes automatically (check lastUpdated time changes)

## Responsive Layout

- [ ] **Mobile (375px)**: Sidebar hidden, hamburger visible, single-column grid, navbar condensed
- [ ] **Tablet (768px)**: Sidebar overlay via hamburger, 2-column grid
- [ ] **Desktop (1024px+)**: Sidebar fixed, 2-3 column grid
- [ ] **Ultra-wide (1440px+)**: 3-4 column grid

## Submit Job

- [ ] Navigate to `/submit-job` via sidebar
- [ ] Select workload (small/medium/large) + priority (high/medium/low)
- [ ] Submit → success toast with job ID
- [ ] Job appears in `/dashboard` jobs table with status "queued"

## Architecture Page

- [ ] Navigate to `/architecture` via sidebar
- [ ] SVG diagram renders: Edge → Master → GPU Worker → Monitor → DB → Dashboard
- [ ] Nodes glow on hover
- [ ] Edge labels show protocol/endpoint

## Security

- [ ] `X-Frame-Options: DENY` header present
- [ ] `X-Content-Type-Options: nosniff` header present
- [ ] No stack traces in error responses
- [ ] JWT expiry set (60 min)

## Pipeline Files UNTOUCHED

```bash
git diff --name-only master.py local_execution.py cloud_only_test.py auto_gpu_experiment_TESTLOAD_FIG4.py
# → (empty output = ✅)
```

## E2E Tests (Playwright)

```bash
cd frontend
npx playwright install --with-deps chromium
npx playwright test --reporter=list
```

## Missing External Dependencies (TODOs)

> [!IMPORTANT]
> These require external secrets that must be provided by the user:

1. **Google OAuth**: Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` + `NEXT_PUBLIC_GOOGLE_CONFIGURED=1`
2. **GitHub OAuth**: Set `GITHUB_ID`, `GITHUB_SECRET` + `NEXT_PUBLIC_GITHUB_CONFIGURED=1`
3. **GPU Worker**: Have Rishi run `POST /register-worker` with real CUDA/GPU metadata
4. **Docker Registry**: Provide credentials for CI image push (optional)
