output "database_endpoint" {
  value = aws_db_instance.postgres.address
}

output "database_port" {
  value = aws_db_instance.postgres.port
}

output "database_name" {
  value = var.database_name
}

output "database_secret_arn" {
  value = aws_secretsmanager_secret.backend_database.arn
}

output "database_secret_name" {
  value = aws_secretsmanager_secret.backend_database.name
}

output "backend_pod_identity_role_arn" {
  value = aws_iam_role.backend_pod_identity.arn
}
