{{- define "task-manager.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager.fullname" -}}
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

{{- define "task-manager.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager.labels" -}}
helm.sh/chart: {{ include "task-manager.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "task-manager.selectorLabels" -}}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "task-manager.frontendName" -}}
{{- printf "%s-frontend" (include "task-manager.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager.backendName" -}}
{{- printf "%s-backend" (include "task-manager.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "task-manager.frontendLabels" -}}
{{ include "task-manager.labels" . }}
app.kubernetes.io/name: {{ include "task-manager.frontendName" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{- define "task-manager.backendLabels" -}}
{{ include "task-manager.labels" . }}
app.kubernetes.io/name: {{ include "task-manager.backendName" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{- define "task-manager.frontendSelectorLabels" -}}
{{ include "task-manager.selectorLabels" . }}
app.kubernetes.io/name: {{ include "task-manager.frontendName" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{- define "task-manager.backendSelectorLabels" -}}
{{ include "task-manager.selectorLabels" . }}
app.kubernetes.io/name: {{ include "task-manager.backendName" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{- define "task-manager.backendSecretName" -}}
{{- if .Values.backend.secret.existingSecret -}}
{{- .Values.backend.secret.existingSecret -}}
{{- else -}}
{{- printf "%s-backend-secret" (include "task-manager.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "task-manager.backendServiceAccountName" -}}
{{- if .Values.backend.serviceAccount.name -}}
{{- .Values.backend.serviceAccount.name -}}
{{- else -}}
{{- include "task-manager.backendName" . -}}
{{- end -}}
{{- end -}}

{{- define "task-manager.backendSecretProviderClassName" -}}
{{- if .Values.backend.secretsStore.secretProviderClassName -}}
{{- .Values.backend.secretsStore.secretProviderClassName -}}
{{- else -}}
{{- printf "%s-db-secrets" (include "task-manager.backendName" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
