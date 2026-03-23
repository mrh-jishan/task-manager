# AWS Terraform State Backend

This bootstrap configuration creates the shared AWS resources used for Terraform remote state.

It creates:

- an S3 bucket for Terraform state

Use the S3 backend with `use_lockfile = true` in each environment. That is the current locking model Terraform recommends for the S3 backend.
