# AWS EKS Platform Module

Reusable Terraform module for provisioning the AWS infrastructure needed by this project.

## Resources

- VPC and subnets
- EKS cluster and managed node group
- EKS add-ons for networking, DNS, proxy, EBS CSI, and Pod Identity
- ECR repositories
- GitHub OIDC provider and deployment role

## Outputs

- VPC and subnet IDs
- EKS cluster name and endpoint
- ECR repository names and URLs
- GitHub Actions IAM role ARN

## Assumptions

- Public AWS load balancer for the frontend service
- Private worker nodes
- GitHub Actions deploys from protected GitHub environments such as `stage` and `production`
