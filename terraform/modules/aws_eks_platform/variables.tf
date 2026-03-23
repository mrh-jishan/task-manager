variable "name_prefix" {
  type        = string
  description = "Prefix used for AWS resource names."
}

variable "az_count" {
  type        = number
  description = "Number of availability zones to use."
  default     = 2
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet CIDRs. Must have at least az_count entries."

  validation {
    condition     = length(var.public_subnet_cidrs) >= var.az_count
    error_message = "public_subnet_cidrs must contain at least az_count entries."
  }
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet CIDRs. Must have at least az_count entries."

  validation {
    condition     = length(var.private_subnet_cidrs) >= var.az_count
    error_message = "private_subnet_cidrs must contain at least az_count entries."
  }
}

variable "kubernetes_version" {
  type        = string
  description = "EKS Kubernetes version."
}

variable "cluster_endpoint_public_access" {
  type        = bool
  description = "Whether the EKS API endpoint is public."
  default     = true
}

variable "cluster_endpoint_public_access_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to access the EKS public API endpoint."
  default     = ["0.0.0.0/0"]
}

variable "cluster_enabled_log_types" {
  type        = list(string)
  description = "EKS control plane log types."
  default     = ["api", "audit", "authenticator"]
}

variable "node_instance_types" {
  type        = list(string)
  description = "Managed node group instance types."
  default     = ["t3.medium"]
}

variable "node_capacity_type" {
  type        = string
  description = "Managed node group capacity type."
  default     = "ON_DEMAND"
}

variable "node_ami_type" {
  type        = string
  description = "Managed node group AMI type."
  default     = "AL2_x86_64"
}

variable "node_disk_size" {
  type        = number
  description = "Node root volume size in GiB."
  default     = 50
}

variable "node_desired_size" {
  type        = number
  description = "Desired node group size."
  default     = 2
}

variable "node_min_size" {
  type        = number
  description = "Minimum node group size."
  default     = 2
}

variable "node_max_size" {
  type        = number
  description = "Maximum node group size."
  default     = 4
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in owner/repo format."
}

variable "github_environments" {
  type        = list(string)
  description = "GitHub environment names allowed to assume the deployment role."
  default     = ["production"]
}

variable "tags" {
  type        = map(string)
  description = "AWS tags applied to created resources."
  default     = {}
}
