# Contributing to VisualPC

Thank you for your interest in contributing to VisualPC! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your changes: `git checkout -b feature/your-feature`
4. **Install dependencies** following the README setup instructions
5. **Make your changes** with clear, descriptive commits
6. **Test your changes** to ensure nothing breaks
7. **Push** to your fork and submit a **Pull Request**

## Development Setup

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create backend/.env with your DATABASE_URL
cp ../.env.example backend/.env
# Edit backend/.env

# Run database setup
python -m backend.migrate
python -m backend.init_db

# Start the API
python -m uvicorn backend.metrics_api:app --host 0.0.0.0 --port 8500 --reload
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local

npm run dev
```

### Master Scheduler

```bash
python master.py
```

## Code Guidelines

- **Python**: Follow PEP 8 style. Use type hints where practical.
- **TypeScript/React**: Follow the existing component patterns. Use functional components with hooks.
- **Commits**: Use clear, imperative commit messages (e.g., "Add worker heartbeat timeout")
- **No secrets**: Never commit API keys, passwords, or certificates

## Testing

```bash
# Backend integration tests
python -m pytest tests/test_integration.py -v

# Frontend E2E tests
cd frontend
npx playwright test --reporter=list
```

## Pull Request Process

1. Ensure your code passes all existing tests
2. Update documentation if adding new features
3. Add test coverage for new functionality
4. Keep PRs focused — one feature or fix per PR
5. Fill out the PR template with a clear description

## Architecture Rules

> **Critical:** Do not modify these pipeline files without discussion:
> - `master.py` — Master scheduler core logic
> - `research/experiments/` — Published experiment scripts

These files produce reproducible results tied to research publications.

## Questions?

Open a GitHub Discussion or Issue for questions about contributing.
