# Task Manager Monorepo

This repository is structured as a monorepo for:

- `backend/`: Rails application
- `frontend/`: React application
- `docker/`: shared Docker configuration for development and production

## Goals

- Keep frontend and backend in a single Git repository
- Centralize Docker and Compose configuration at the repo root
- Track project documentation at the root and within each app

## Notes

- The root `.gitignore` covers shared monorepo, Rails, React, and Docker-local artifacts.
- `README` files and Docker definitions remain committed by default.
- If `frontend/` and `backend/` were created as separate Git repositories, remove their inner `.git/` directories before adding their contents to this root repository.

## Suggested Layout

```text
.
├── backend/
├── frontend/
├── docker/
│   ├── dev/
│   └── prod/
├── .gitignore
└── README.md
```
