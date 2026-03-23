# Task Manager Monorepo

This repository is structured as a monorepo for:

- `backend/`: Rails application
- `frontend/`: React application
- root-level Docker Compose and shared environment files

## Goals

- Keep frontend and backend in a single Git repository
- Keep orchestration at the repository root
- Keep Dockerfiles inside each app
- Track project documentation at the root and within each app

## Notes

- The root `.gitignore` covers shared monorepo, Rails, React, and Docker-local artifacts.
- `README` files and Docker definitions remain committed by default.
- Shared Compose files live at the repository root.
- Shared Compose variables live in the root `.env` file, based on `.env.example`.
- If `frontend/` and `backend/` were created as separate Git repositories, remove their inner `.git/` directories before adding their contents to this root repository.

## Docker

Development:

```bash
cp .env.example .env
docker compose --env-file .env -f docker-compose.dev.yml up --build
```

Production-like run:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up --build -d
```

## Kubernetes

Helm deployment assets live under [`helm/`](./helm).

Render the chart:

```bash
helm template task-manager ./helm/task-manager
```

Install or upgrade:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace
```

Set your image repositories, image tags, and `RAILS_MASTER_KEY` through Helm values or the deployment workflow before deploying to a cluster.

On AWS, the backend reads its database credentials directly from AWS Secrets Manager through EKS Pod Identity and the AWS Secrets Store CSI provider. GitHub Actions only passes the secret ARN into Helm and does not fetch the database password itself.

The Terraform environments are set up for S3 remote state with native S3 lockfiles. DynamoDB locking is intentionally not used.

## Terraform

Terraform for AWS lives under [`terraform/`](./terraform).

Bootstrap the shared remote state bucket first:

```bash
cd terraform/bootstrap/aws_state_backend
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

Then initialize an environment with the generated S3 backend config:

```bash
cd terraform/environments/aws-stage
cp backend.hcl.example backend.hcl
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

Then deploy the app with Helm using the layered values files:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace \
  -f ./helm/task-manager/values.yaml \
  -f ./helm/task-manager/values.stage.yaml \
  -f ./helm/task-manager/values.aws.yaml
```

## GitHub CI/CD

AWS deployment automation lives in [`.github/workflows/deploy-aws.yml`](/Users/robin-hassan/Desktop/task-manager/.github/workflows/deploy-aws.yml).

The workflow is designed so that:

- pushes to `main` deploy to the GitHub `production` environment
- manual `workflow_dispatch` runs deploy to the GitHub `stage` environment from whichever branch you select in the Actions UI
- each GitHub environment can point at its own AWS account, EKS cluster, ECR repos, namespace, and release name through environment-scoped variables and secrets

It will:

- assume an AWS IAM role through GitHub OIDC
- build and push frontend and backend images to ECR
- update kubeconfig for EKS
- install the AWS Secrets Store CSI provider in the cluster
- apply the Rails master key as a Kubernetes secret
- deploy the Helm chart to the cluster

Required GitHub environment variables:

- `AWS_REGION`
- `EKS_CLUSTER_NAME`
- `FRONTEND_ECR_REPOSITORY`
- `BACKEND_ECR_REPOSITORY`
- `BACKEND_DB_SECRET_ARN`
- `K8S_NAMESPACE`
- `HELM_RELEASE_NAME`

Required GitHub environment secrets:

- `AWS_ROLE_TO_ASSUME`
- `RAILS_MASTER_KEY`

Recommended GitHub environment values with the current Terraform defaults:

- `stage`
  - `AWS_REGION=us-east-1`
  - `EKS_CLUSTER_NAME=task-manager-stage-eks`
  - `FRONTEND_ECR_REPOSITORY=task-manager-stage-frontend`
  - `BACKEND_ECR_REPOSITORY=task-manager-stage-backend`
  - `BACKEND_DB_SECRET_ARN=<terraform output database_secret_arn from aws-stage>`
  - `K8S_NAMESPACE=stage`
  - `HELM_RELEASE_NAME=task-manager-stage`
- `production`
  - `AWS_REGION=us-east-1`
  - `EKS_CLUSTER_NAME=task-manager-prod-eks`
  - `FRONTEND_ECR_REPOSITORY=task-manager-prod-frontend`
  - `BACKEND_ECR_REPOSITORY=task-manager-prod-backend`
  - `BACKEND_DB_SECRET_ARN=<terraform output database_secret_arn from aws-prod>`
  - `K8S_NAMESPACE=prod`
  - `HELM_RELEASE_NAME=task-manager-prod`

GitHub environment setup checklist:

1. Create a GitHub environment named `stage`.
2. Create a GitHub environment named `production`.
3. In `stage`, add variables:
   `AWS_REGION=us-east-1`
   `EKS_CLUSTER_NAME=task-manager-stage-eks`
   `FRONTEND_ECR_REPOSITORY=task-manager-stage-frontend`
   `BACKEND_ECR_REPOSITORY=task-manager-stage-backend`
   `BACKEND_DB_SECRET_ARN=<terraform output database_secret_arn from aws-stage>`
   `K8S_NAMESPACE=stage`
   `HELM_RELEASE_NAME=task-manager-stage`
4. In `production`, add variables:
   `AWS_REGION=us-east-1`
   `EKS_CLUSTER_NAME=task-manager-prod-eks`
   `FRONTEND_ECR_REPOSITORY=task-manager-prod-frontend`
   `BACKEND_ECR_REPOSITORY=task-manager-prod-backend`
   `BACKEND_DB_SECRET_ARN=<terraform output database_secret_arn from aws-prod>`
   `K8S_NAMESPACE=prod`
   `HELM_RELEASE_NAME=task-manager-prod`
5. In `stage`, add secrets:
   `AWS_ROLE_TO_ASSUME`
   `RAILS_MASTER_KEY`
6. In `production`, add secrets:
   `AWS_ROLE_TO_ASSUME`
   `RAILS_MASTER_KEY`

## Release Readiness

For the platform release path, the default public release option is an AWS-generated load balancer URL. The frontend service is deployed as a public `LoadBalancer`, so after a stage or production deployment you can fetch the public app URL with:

```bash
kubectl get svc -n stage
kubectl get svc -n prod
```

The external hostname on the frontend service is the public app URL. No custom domain is required.

What I still need from you only if you later want custom domains:

- the Route 53 hosted zone name
- the stage hostname, for example `stage.example.com`
- the production hostname, for example `app.example.com`
- whether the backend API should stay private or also get a public hostname such as `api.example.com`
- Whether the backend will store user-uploaded files in production. If yes, the app should move from local persistent volume storage to S3 before release.
- Whether the app needs outbound email in stage and production. If yes, I need the sender domain/address and either SES or SMTP details.

What still needs app-level production work before this is a real public release:

- Replace the starter frontend content with the actual task manager UI.
- Add the actual backend task manager routes/controllers; the backend currently only exposes the Rails health endpoint.
- Set real production mailer host and sender values instead of the Rails template placeholders.
- Decide whether frontend-to-backend traffic will be same-origin behind one hostname or cross-origin with an API hostname, then finalize CORS accordingly.
- Add monitoring, error reporting, and at least a smoke test path for stage before the first production cutover.

## Suggested Layout

```text
.
├── backend/
├── frontend/
├── helm/
├── terraform/bootstrap/
├── terraform/
├── .env.example
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```
