{{- define "task-manager-backend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager-backend.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "task-manager-backend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager-backend.labels" -}}
helm.sh/chart: {{ include "task-manager-backend.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/name: {{ include "task-manager-backend.fullname" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{- define "task-manager-backend.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/name: {{ include "task-manager-backend.fullname" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{- define "task-manager-backend.secretName" -}}
{{- if .Values.secret.existingSecret -}}
{{- .Values.secret.existingSecret -}}
{{- else -}}
{{- printf "%s-secret" (include "task-manager-backend.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "task-manager-backend.serviceAccountName" -}}
{{- if .Values.serviceAccount.name -}}
{{- .Values.serviceAccount.name -}}
{{- else -}}
{{- include "task-manager-backend.fullname" . -}}
{{- end -}}
{{- end -}}

{{- define "task-manager-backend.secretProviderClassName" -}}
{{- if .Values.secretsStore.secretProviderClassName -}}
{{- .Values.secretsStore.secretProviderClassName -}}
{{- else -}}
{{- printf "%s-db-secrets" (include "task-manager-backend.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
