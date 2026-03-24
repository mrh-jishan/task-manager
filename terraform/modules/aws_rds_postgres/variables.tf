variable "name_prefix" {
  type        = string
  description = "Prefix used for AWS resource names."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where the database resources will be created."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs used for the database subnet group."
}

variable "eks_cluster_security_group_id" {
  type        = string
  description = "EKS cluster security group ID allowed to reach PostgreSQL."
}

variable "eks_cluster_name" {
  type        = string
  description = "EKS cluster name used for the backend pod identity association."
}

variable "kubernetes_namespace" {
  type        = string
  description = "Kubernetes namespace where the backend service account lives."
}

variable "service_account_name" {
  type        = string
  description = "Kubernetes service account name that should receive access to the database secret."
}

variable "database_name" {
  type        = string
  description = "Primary PostgreSQL database name."
}

variable "database_cache_name" {
  type        = string
  description = "PostgreSQL database name for Rails cache."
}

variable "database_queue_name" {
  type        = string
  description = "PostgreSQL database name for Rails queue."
}

variable "database_cable_name" {
  type        = string
  description = "PostgreSQL database name for Rails cable."
}

variable "database_username" {
  type        = string
  description = "Master username for the PostgreSQL instance."
  default     = "backend"
}

variable "database_engine_version" {
  type        = string
  description = "RDS PostgreSQL engine version."
  default     = "16.13"
}

variable "database_instance_class" {
  type        = string
  description = "RDS instance class."
  default     = "db.t4g.micro"
}

variable "database_allocated_storage" {
  type        = number
  description = "Initial allocated storage in GiB."
  default     = 20
}

variable "database_max_allocated_storage" {
  type        = number
  description = "Autoscaling storage limit in GiB."
  default     = 100
}

variable "database_backup_retention_period" {
  type        = number
  description = "Automated backup retention in days."
  default     = 7
}

variable "database_multi_az" {
  type        = bool
  description = "Whether to enable Multi-AZ for PostgreSQL."
  default     = false
}

variable "database_deletion_protection" {
  type        = bool
  description = "Whether to enable deletion protection on the database."
  default     = true
}

variable "database_skip_final_snapshot" {
  type        = bool
  description = "Whether to skip the final snapshot on destroy."
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "AWS tags applied to created resources."
  default     = {}
}
