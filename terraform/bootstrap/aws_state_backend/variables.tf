variable "aws_region" {
  type        = string
  description = "AWS region where the Terraform state bucket will be created."
}

variable "name_prefix" {
  type        = string
  description = "Prefix used for the Terraform state bucket and optional lock table."
  default     = "task-manager-terraform-state"
}

variable "bucket_name" {
  type        = string
  description = "Optional explicit S3 bucket name. Leave null to derive one from name_prefix."
  default     = null
}

variable "force_destroy" {
  type        = bool
  description = "Whether to allow Terraform to destroy a non-empty state bucket."
  default     = false
}

variable "tags" {
  type        = map(string)
  description = "AWS tags applied to created resources."
  default = {
    ManagedBy = "terraform"
  }
}
