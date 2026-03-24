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

Run backend tests:

```bash
backend/bin/test
backend/bin/test test/integration/tasks_flow_test.rb
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

## Production-Like Local Run

```bash
docker compose --env-file .env -f docker-compose.prod.yml up --build -d
```

## Release

- `backend-ci.yml` runs RuboCop on Ruby 4.0.0 and Rails tests against a Postgres service container for backend changes
- `terraform-aws.yml` applies infra
- `deploy-backend.yml` deploys the backend Helm release only
- `deploy-frontend.yml` deploys the frontend Helm release only
- `main` pushes deploy to `production`
- manual workflow dispatch can deploy `stage` or `production`
- Terraform uses S3 remote state with native S3 lockfiles
- AWS deployment uses EKS, ECR, RDS Postgres, Secrets Manager, and Helm
- the backend reads DB credentials through EKS Pod Identity
- backend and frontend use separate Helm charts and separate Helm releases

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
kubectl get svc -n stage
kubectl get svc -n prod
```

Use the external hostname of the frontend service release.
