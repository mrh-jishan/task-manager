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

Local Docker uses:

- `postgres` for the database
- `backend` for Rails
- `frontend` for React

## Production-Like Local Run

```bash
docker compose --env-file .env -f docker-compose.prod.yml up --build -d
```

## Release

- `main` deploys to GitHub environment `production`
- manual workflow dispatch deploys to GitHub environment `stage`
- Terraform uses S3 remote state with native S3 lockfiles
- AWS deployment uses EKS, ECR, RDS Postgres, Secrets Manager, and Helm
- the backend reads DB credentials through EKS Pod Identity

Minimum GitHub environment variables for both `stage` and `production`:

- `AWS_REGION`
- `EKS_CLUSTER_NAME`
- `FRONTEND_ECR_REPOSITORY`
- `BACKEND_ECR_REPOSITORY`
- `BACKEND_DB_SECRET_ARN`
- `K8S_NAMESPACE`
- `HELM_RELEASE_NAME`

Minimum GitHub environment secrets:

- `AWS_ROLE_TO_ASSUME`
- `RAILS_MASTER_KEY`

Apply infra:

```bash
cd terraform/bootstrap/aws_state_backend
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply

cd ../../environments/aws-stage
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

Use the external hostname of the frontend service.
