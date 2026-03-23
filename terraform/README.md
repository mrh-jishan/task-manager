# Terraform

Terraform in this repository provisions the AWS platform for Kubernetes deployment.

## Layout

- `terraform/bootstrap/aws_state_backend/`: bootstrap for the shared S3 Terraform state backend
- `terraform/modules/aws_eks_platform/`: reusable AWS infrastructure module
- `terraform/modules/aws_rds_postgres/`: reusable PostgreSQL database module
- `terraform/environments/aws-stage/`: example stage environment for EKS, ECR, and GitHub OIDC
- `terraform/environments/aws-prod/`: example production environment for EKS, ECR, and GitHub OIDC

## What the module creates

- VPC
- Public and private subnets
- Internet gateway and NAT gateway
- EKS cluster
- EKS managed node group
- RDS PostgreSQL database in private subnets
- EKS add-ons:
  - `vpc-cni`
  - `coredns`
  - `kube-proxy`
  - `aws-ebs-csi-driver`
  - `eks-pod-identity-agent`
- ECR repositories for frontend and backend images
- AWS Secrets Manager secret for backend database connection values
- backend-only EKS Pod Identity role and association for database secret access
- GitHub Actions OIDC role for CI/CD deployments

## Usage

```bash
cd terraform/bootstrap/aws_state_backend
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply

cd terraform/environments/aws-stage
cp backend.hcl.example backend.hcl
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

## Deployment flow

1. Provision AWS infrastructure with Terraform.
2. Set the GitHub environment variables and secrets documented below for both `stage` and `production`.
3. Push to `main` for production, or run the GitHub Actions workflow manually from any branch for stage.
4. GitHub Actions builds and pushes images to ECR, installs the AWS Secrets Store CSI provider, then deploys Helm to EKS.

## GitHub environment variables

- `AWS_REGION`
- `EKS_CLUSTER_NAME`
- `FRONTEND_ECR_REPOSITORY`
- `BACKEND_ECR_REPOSITORY`
- `BACKEND_DB_SECRET_ARN`
- `K8S_NAMESPACE`
- `HELM_RELEASE_NAME`

## GitHub environment secrets

- `AWS_ROLE_TO_ASSUME`
- `RAILS_MASTER_KEY`

## Recommended GitHub environment values

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

## GitHub setup checklist

1. Apply `terraform/environments/aws-stage` and capture:
   - `cluster_name`
   - `frontend_ecr_repository_name`
   - `backend_ecr_repository_name`
   - `database_secret_arn`
   - `backend_pod_identity_role_arn`
   - `github_actions_role_arn`
2. Apply `terraform/environments/aws-prod` and capture:
   - `cluster_name`
   - `frontend_ecr_repository_name`
   - `backend_ecr_repository_name`
   - `database_secret_arn`
   - `backend_pod_identity_role_arn`
   - `github_actions_role_arn`
3. In the GitHub `stage` environment, set variables:
   - `AWS_REGION=us-east-1`
   - `EKS_CLUSTER_NAME=task-manager-stage-eks`
   - `FRONTEND_ECR_REPOSITORY=task-manager-stage-frontend`
   - `BACKEND_ECR_REPOSITORY=task-manager-stage-backend`
   - `BACKEND_DB_SECRET_ARN=<database_secret_arn from aws-stage>`
   - `K8S_NAMESPACE=stage`
   - `HELM_RELEASE_NAME=task-manager-stage`
4. In the GitHub `production` environment, set variables:
   - `AWS_REGION=us-east-1`
   - `EKS_CLUSTER_NAME=task-manager-prod-eks`
   - `FRONTEND_ECR_REPOSITORY=task-manager-prod-frontend`
   - `BACKEND_ECR_REPOSITORY=task-manager-prod-backend`
   - `BACKEND_DB_SECRET_ARN=<database_secret_arn from aws-prod>`
   - `K8S_NAMESPACE=prod`
   - `HELM_RELEASE_NAME=task-manager-prod`
5. In the GitHub `stage` environment, set secrets:
   - `AWS_ROLE_TO_ASSUME=<github_actions_role_arn from aws-stage>`
   - `RAILS_MASTER_KEY=<stage rails master key>`
6. In the GitHub `production` environment, set secrets:
   - `AWS_ROLE_TO_ASSUME=<github_actions_role_arn from aws-prod>`
   - `RAILS_MASTER_KEY=<production rails master key>`

## Notes

- The Terraform module creates the IAM role that GitHub Actions should assume through OIDC for the environments you allow in `github_environments`.
- The Terraform module also creates the RDS instance, the backend database secret in Secrets Manager, and a pod-scoped IAM role bound to the backend service account through EKS Pod Identity.
- Use the S3 backend with `use_lockfile = true` for remote Terraform state. DynamoDB-based locking is intentionally not used.
- The backend uses PostgreSQL in AWS environments, while a persistent volume is still retained for app storage such as uploaded files.
- The current Terraform defaults intentionally keep stage and production cluster names distinct. If both environments are in different AWS accounts and you want the exact same cluster name, that can be changed safely.
