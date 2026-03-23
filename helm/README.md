# Helm Deployment

This directory contains the Kubernetes Helm chart for deploying the monorepo applications.

## Chart

- `helm/task-manager/`: deploys the Rails backend and React frontend together

## Prerequisites

- A Kubernetes cluster
- Helm 3
- Published container images for:
  - the backend image built from `backend/Dockerfile`
  - the frontend image built from `frontend/Dockerfile`
- On AWS, install the AWS Secrets Store CSI provider before deploying if you are not using the GitHub workflow.

## Usage

Render manifests locally:

```bash
helm template task-manager ./helm/task-manager
```

Install or upgrade:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace
```

Use your own values file for image repositories, tags, ingress hosts, and secrets:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace \
  -f ./helm/task-manager/values.yaml
```

Recommended layered values files:

- `helm/task-manager/values.stage.yaml`: stage sizing defaults
- `helm/task-manager/values.prod.yaml`: production sizing and persistence defaults
- `helm/task-manager/values.aws.yaml`: AWS EKS service defaults

Staging example:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace \
  -f ./helm/task-manager/values.yaml \
  -f ./helm/task-manager/values.stage.yaml \
  -f ./helm/task-manager/values.aws.yaml
```

Production example:

```bash
helm upgrade --install task-manager ./helm/task-manager \
  --namespace task-manager \
  --create-namespace \
  -f ./helm/task-manager/values.yaml \
  -f ./helm/task-manager/values.prod.yaml \
  -f ./helm/task-manager/values.aws.yaml
```

## Notes

- The backend uses a dedicated Kubernetes service account and can mount database credentials directly from AWS Secrets Manager through the Secrets Store CSI driver.
- The chart can either create a `RAILS_MASTER_KEY` secret or reference an existing Kubernetes secret.
- The backend deployment still mounts a persistent volume at `/rails/storage` for app-managed files.
