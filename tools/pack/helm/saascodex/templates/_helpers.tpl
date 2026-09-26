{{- /*
Open Design Helm chart helpers. Spec §15.5.

Names:
  saascodex.name        chart-name (`saascodex`)
  saascodex.fullname    release-prefixed name (truncated to 63 chars)
  saascodex.labels      common label set
  saascodex.selectorLabels   selector subset
*/ -}}

{{- define "saascodex.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "saascodex.fullname" -}}
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

{{- define "saascodex.labels" -}}
app.kubernetes.io/name: {{ include "saascodex.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "saascodex.selectorLabels" -}}
app.kubernetes.io/name: {{ include "saascodex.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
