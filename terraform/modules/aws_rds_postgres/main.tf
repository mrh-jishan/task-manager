resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_id" "final_snapshot" {
  byte_length = 4
}

locals {
  common_tags               = merge(var.tags, { Project = var.name_prefix })
  final_snapshot_identifier = "${var.name_prefix}-postgres-final-${lower(random_id.final_snapshot.hex)}"
}

resource "aws_db_subnet_group" "this" {
  name_prefix = "${var.name_prefix}-db-subnet-group-"
  subnet_ids  = var.private_subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name        = "${var.name_prefix}-database-sg"
  description = "PostgreSQL access for workloads running in EKS"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-database-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "database_from_cluster" {
  security_group_id            = aws_security_group.database.id
  referenced_security_group_id = var.eks_cluster_security_group_id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Allow PostgreSQL from EKS cluster security group"
}

resource "aws_db_instance" "postgres" {
  identifier                 = "${var.name_prefix}-postgres"
  engine                     = "postgres"
  engine_version             = var.database_engine_version
  instance_class             = var.database_instance_class
  allocated_storage          = var.database_allocated_storage
  max_allocated_storage      = var.database_max_allocated_storage
  db_name                    = var.database_name
  username                   = var.database_username
  password                   = random_password.database.result
  port                       = 5432
  db_subnet_group_name       = aws_db_subnet_group.this.name
  vpc_security_group_ids     = [aws_security_group.database.id]
  publicly_accessible        = false
  multi_az                   = var.database_multi_az
  backup_retention_period    = var.database_backup_retention_period
  deletion_protection        = var.database_deletion_protection
  skip_final_snapshot        = var.database_skip_final_snapshot
  final_snapshot_identifier  = var.database_skip_final_snapshot ? null : local.final_snapshot_identifier
  storage_encrypted          = true
  auto_minor_version_upgrade = true
  apply_immediately          = true

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-postgres"
  })
}

resource "aws_secretsmanager_secret" "backend_database" {
  name = "${var.name_prefix}/backend/database"

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-backend-database"
  })
}

resource "aws_secretsmanager_secret_version" "backend_database" {
  secret_id = aws_secretsmanager_secret.backend_database.id
  secret_string = jsonencode({
    BACKEND_DATABASE_HOST       = aws_db_instance.postgres.address
    BACKEND_DATABASE_PORT       = tostring(aws_db_instance.postgres.port)
    BACKEND_DATABASE_NAME       = var.database_name
    BACKEND_DATABASE_USERNAME   = var.database_username
    BACKEND_DATABASE_PASSWORD   = random_password.database.result
    BACKEND_CACHE_DATABASE_NAME = var.database_cache_name
    BACKEND_QUEUE_DATABASE_NAME = var.database_queue_name
    BACKEND_CABLE_DATABASE_NAME = var.database_cable_name
  })
}

resource "aws_iam_role" "backend_pod_identity" {
  name = "${var.name_prefix}-backend-pod-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "pods.eks.amazonaws.com"
        }
        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "backend_database_secret" {
  name = "${var.name_prefix}-backend-db-secret"
  role = aws_iam_role.backend_pod_identity.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.backend_database.arn
      }
    ]
  })
}

resource "aws_eks_pod_identity_association" "backend_database" {
  cluster_name    = var.eks_cluster_name
  namespace       = var.kubernetes_namespace
  service_account = var.service_account_name
  role_arn        = aws_iam_role.backend_pod_identity.arn
}
