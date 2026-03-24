# Task Manager

Rails backend + React frontend in one repo.

## Local Start

1. Create local env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start the full local stack, including Postgres:

```bash
docker compose --env-file .env -f docker-compose.dev.yml up --build
```

3. Open:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- backend health: `http://localhost:3000/up`
- postgres: `localhost:5432`

Frontend integration by environment:

- local non-Docker: `frontend/.env` should point `API_BASE_URL` to `http://localhost:3000`
- local Docker dev: root `.env` uses `FRONTEND_API_BASE_URL=http://backend:3000`
- local Docker prod: root `.env` uses `PROD_FRONTEND_API_BASE_URL=http://backend`
- stage/prod Kubernetes: no frontend API host env is required; the frontend uses same-origin `/api` and the ALB routes that path to the backend

Run backend tests:

```bash
backend/bin/test
backend/bin/test test/integration/tasks_flow_test.rb
```

Run frontend checks:

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

Local Docker uses:

- `postgres` for the database
- `backend` for Rails
- `frontend` for React

## Search Choice

We use PostgreSQL search for tasks instead of Elasticsearch/OpenSearch in the first release.

Why:

- the app already depends on PostgreSQL, so search stays in the same durable data store
- Postgres full-text search handles keyword and phrase search well
- `pg_trgm` adds fuzzy matching for typo-tolerant search
- it avoids running and persisting a separate search cluster in Kubernetes
- it keeps the stack smaller, cheaper, and easier to operate early on

## Tasks API

`GET /tasks` supports `q`, `status`, `page`, and `per_page`. The list response returns `{ data: [...], pagination: { page, per_page, total_count, total_pages } }`.

The React Router v7 frontend uses server-side loaders and actions to talk to the Rails API, so the browser stays on the frontend app origin while CRUD and search still flow through the backend.

In Kubernetes, the deployed frontend should use the same public origin as the backend and let the ALB route `/api` to Rails. That avoids hardcoding a backend ELB hostname into the frontend and avoids churn if AWS recreates the ALB hostname later.

## Production-Like Local Run

```bash
docker compose --env-file .env -f docker-compose.prod.yml up --build -d
```

## Release

- `backend-ci.yml` runs RuboCop on Ruby 4.0.0 and Rails tests against a Postgres service container for backend changes
- `terraform-aws.yml` applies infra
- `deploy-backend.yml` deploys the backend Helm release only
- `deploy-frontend.yml` deploys the frontend Helm release only
- both deploy workflows install or upgrade the AWS Load Balancer Controller before releasing app changes
- `main` pushes deploy to `production`
- manual workflow dispatch can deploy `stage` or `production`
- Terraform uses S3 remote state with native S3 lockfiles
- AWS deployment uses EKS, ECR, RDS Postgres, Secrets Manager, and Helm
- the backend reads DB credentials through EKS Pod Identity
- backend and frontend use separate Helm charts and separate Helm releases
- frontend and backend are configured for AWS ALB ingress, sharing one public ALB per environment
- public paths are frontend at `/` and backend API at `/api`

Minimum GitHub environment variables for both `stage` and `production`:

- `AWS_REGION`
- `TF_STATE_BUCKET`
- `EKS_CLUSTER_NAME`
- `FRONTEND_ECR_REPOSITORY`
- `BACKEND_ECR_REPOSITORY`
- `K8S_NAMESPACE`

Minimum GitHub environment secrets for app deploys:

- `AWS_ROLE_TO_ASSUME`
- `RAILS_MASTER_KEY`

Minimum GitHub environment secret for Terraform:

- `AWS_TERRAFORM_ROLE_TO_ASSUME`

Apply infra:

```bash
cd terraform/bootstrap/aws_state_backend
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

Take the bootstrap output `bucket_name` and set it as `TF_STATE_BUCKET` in both GitHub environments.

Then apply an environment:

```bash
cd terraform/environments/aws-stage
cp backend.hcl.example backend.hcl
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform apply
```

Repeat for `aws-prod`.

## Public URL

No domain is required.

After deploy, get the public app URL with:

```bash
./scripts/print_public_urls.sh stage
./scripts/print_public_urls.sh prod
```

Use the frontend URL for the app and the backend URL for direct API access. The frontend is served at `/` and the backend API is served at `/api`.

The backend public URL is for direct API access and for local frontend-to-remote-backend testing. The deployed frontend in `stage` and `prod` should not hardcode that hostname. It uses same-origin `/api`, which keeps working even if AWS replaces the ALB hostname.

For local frontend testing against a remote environment, set `API_BASE_URL` in `frontend/.env` to the current backend URL printed by the script above.

## Local kubectl Access

Import the prod cluster into your local kubeconfig:

```bash
aws eks update-kubeconfig --name task-manager-prod-eks --region us-east-1 --alias task-manager-prod-eks
kubectl config use-context task-manager-prod-eks
```

Quick checks:

```bash
kubectl get namespaces
kubectl get nodes -o wide
kubectl -n prod get deploy,pods,svc,sa,secretsproviderclass
```

Backend release details:

- namespace: `prod`
- Helm release: `task-manager-backend-prod`
