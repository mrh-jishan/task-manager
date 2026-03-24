# AWS Terraform State Backend

This bootstrap configuration creates the shared AWS resources used for Terraform remote state.

It creates:

- an S3 bucket for Terraform state

Use the S3 backend with `use_lockfile = true` in each environment. That is the current locking model Terraform recommends for the S3 backend.

Do not set `bucket_name` unless you already control a globally unique S3 bucket name. S3 bucket names are shared across all AWS accounts. By default this bootstrap uses `name_prefix` plus a generated random suffix to avoid collisions.
