variable "aws_region" {
  type        = string
  description = "AWS region for the environment."
}

variable "name_prefix" {
  type        = string
  description = "Prefix for AWS resource names."
  default     = "task-manager-prod"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "kubernetes_version" {
  type        = string
  description = "EKS Kubernetes version, for example 1.34."
  default     = "1.34"
}

variable "cluster_endpoint_public_access" {
  type    = bool
  default = true
}

variable "cluster_endpoint_public_access_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "cluster_enabled_log_types" {
  type    = list(string)
  default = ["api", "audit", "authenticator"]
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_capacity_type" {
  type    = string
  default = "ON_DEMAND"
}

variable "node_ami_type" {
  type    = string
  default = "AL2_x86_64"
}

variable "node_disk_size" {
  type    = number
  default = 50
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "database_name" {
  type    = string
  default = "backend_production"
}

variable "database_cache_name" {
  type    = string
  default = "backend_production_cache"
}

variable "database_queue_name" {
  type    = string
  default = "backend_production_queue"
}

variable "database_cable_name" {
  type    = string
  default = "backend_production_cable"
}

variable "database_username" {
  type    = string
  default = "backend"
}

variable "database_engine_version" {
  type    = string
  default = "16.4"
}

variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "database_allocated_storage" {
  type    = number
  default = 20
}

variable "database_max_allocated_storage" {
  type    = number
  default = 100
}

variable "database_backup_retention_period" {
  type    = number
  default = 7
}

variable "database_multi_az" {
  type    = bool
  default = false
}

variable "database_deletion_protection" {
  type    = bool
  default = true
}

variable "database_skip_final_snapshot" {
  type    = bool
  default = false
}

variable "kubernetes_namespace" {
  type    = string
  default = "prod"
}

variable "backend_service_account_name" {
  type    = string
  default = "task-manager-backend"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in owner/repo format."
}

variable "github_environments" {
  type    = list(string)
  default = ["production"]
}

variable "github_actions_oidc_provider_arn" {
  type    = string
  default = null
}

variable "tags" {
  type = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
