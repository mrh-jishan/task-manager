# AWS RDS Postgres Module

Reusable Terraform module for provisioning the backend PostgreSQL database, its AWS secret, and the backend pod identity access to that secret.

## Resources

- RDS PostgreSQL instance
- DB subnet group
- database security group
- generated password
- Secrets Manager secret containing backend database environment values
- IAM role and EKS Pod Identity association for the backend service account

## Inputs

- VPC ID
- private subnet IDs
- EKS cluster name
- EKS cluster security group ID
- Kubernetes namespace and backend service account name
- database sizing and naming settings

## Outputs

- database endpoint
- database port
- database name
- Secrets Manager secret ARN and name
- backend pod identity role ARN
