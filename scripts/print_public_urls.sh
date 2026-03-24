#!/usr/bin/env bash

set -euo pipefail

environment="${1:-}"

if [[ "${environment}" != "stage" && "${environment}" != "prod" ]]; then
  echo "Usage: $0 <stage|prod>" >&2
  exit 1
fi

context="task-manager-${environment}-eks"
namespace="${environment}"

frontend_release="task-manager-frontend-${namespace}"
backend_release="task-manager-backend-${namespace}"

frontend_ingress_host="$(
  kubectl --context "${context}" get ingress "${frontend_release}" -n "${namespace}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true
)"
frontend_service_host="$(
  kubectl --context "${context}" get svc "${frontend_release}" -n "${namespace}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true
)"
backend_ingress_host="$(
  kubectl --context "${context}" get ingress "${backend_release}" -n "${namespace}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true
)"

echo "Environment: ${environment}"
echo "Context: ${context}"

if [[ -n "${frontend_ingress_host}" ]]; then
  echo "Frontend URL: http://${frontend_ingress_host}/"
elif [[ -n "${frontend_service_host}" ]]; then
  echo "Frontend URL: http://${frontend_service_host}/"
else
  echo "Frontend URL: not assigned yet"
fi

if [[ -n "${backend_ingress_host}" ]]; then
  echo "Backend URL: http://${backend_ingress_host}/api"
else
  echo "Backend URL: not assigned yet"
fi
