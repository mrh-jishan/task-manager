output "vpc_id" {
  value = module.platform.vpc_id
}

output "cluster_name" {
  value = module.platform.cluster_name
}

output "cluster_arn" {
  value = module.platform.cluster_arn
}

output "cluster_endpoint" {
  value = module.platform.cluster_endpoint
}

output "frontend_ecr_repository_name" {
  value = module.platform.frontend_ecr_repository_name
}

output "frontend_ecr_repository_url" {
  value = module.platform.frontend_ecr_repository_url
}

output "backend_ecr_repository_name" {
  value = module.platform.backend_ecr_repository_name
}

output "backend_ecr_repository_url" {
  value = module.platform.backend_ecr_repository_url
}

output "github_actions_role_arn" {
  value = module.platform.github_actions_role_arn
}

output "github_actions_oidc_provider_arn" {
  value = module.platform.github_actions_oidc_provider_arn
}

output "configure_kubectl_command" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.platform.cluster_name}"
}

output "database_endpoint" {
  value = module.database.database_endpoint
}

output "database_name" {
  value = module.database.database_name
}

output "database_secret_arn" {
  value = module.database.database_secret_arn
}

output "database_secret_name" {
  value = module.database.database_secret_name
}

output "backend_pod_identity_role_arn" {
  value = module.database.backend_pod_identity_role_arn
}
