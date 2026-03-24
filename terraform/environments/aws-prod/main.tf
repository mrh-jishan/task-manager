module "platform" {
  source = "../../modules/aws_eks_platform"

  name_prefix                          = var.name_prefix
  az_count                             = var.az_count
  vpc_cidr                             = var.vpc_cidr
  public_subnet_cidrs                  = var.public_subnet_cidrs
  private_subnet_cidrs                 = var.private_subnet_cidrs
  kubernetes_version                   = var.kubernetes_version
  cluster_endpoint_public_access       = var.cluster_endpoint_public_access
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs
  cluster_enabled_log_types            = var.cluster_enabled_log_types
  node_instance_types                  = var.node_instance_types
  node_capacity_type                   = var.node_capacity_type
  node_ami_type                        = var.node_ami_type
  node_disk_size                       = var.node_disk_size
  node_desired_size                    = var.node_desired_size
  node_min_size                        = var.node_min_size
  node_max_size                        = var.node_max_size
  github_repository                    = var.github_repository
  github_environments                  = var.github_environments
  github_actions_oidc_provider_arn     = var.github_actions_oidc_provider_arn
  tags                                 = var.tags
}

module "database" {
  source = "../../modules/aws_rds_postgres"

  name_prefix                      = var.name_prefix
  vpc_id                           = module.platform.vpc_id
  private_subnet_ids               = module.platform.private_subnet_ids
  eks_cluster_name                 = module.platform.cluster_name
  eks_cluster_security_group_id    = module.platform.cluster_security_group_id
  kubernetes_namespace             = var.kubernetes_namespace
  service_account_name             = var.backend_service_account_name
  database_name                    = var.database_name
  database_cache_name              = var.database_cache_name
  database_queue_name              = var.database_queue_name
  database_cable_name              = var.database_cable_name
  database_username                = var.database_username
  database_engine_version          = var.database_engine_version
  database_instance_class          = var.database_instance_class
  database_allocated_storage       = var.database_allocated_storage
  database_max_allocated_storage   = var.database_max_allocated_storage
  database_backup_retention_period = var.database_backup_retention_period
  database_multi_az                = var.database_multi_az
  database_deletion_protection     = var.database_deletion_protection
  database_skip_final_snapshot     = var.database_skip_final_snapshot
  tags                             = var.tags
}
