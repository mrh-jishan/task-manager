# Terraform

Bootstrap:

```bash
cd terraform/bootstrap/aws_state_backend
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

Apply an environment:

```bash
cd terraform/environments/aws-stage
cp backend.hcl.example backend.hcl
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform apply
```

Use the root [`README.md`](/Users/robin-hassan/Desktop/task-manager/README.md) for the release flow and GitHub configuration.
