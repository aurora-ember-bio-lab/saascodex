{{- /*
Open Design Helm chart helpers. Spec §15.5.

Names:
  splatstudio.name        chart-name (`splatstudio`)
  splatstudio.fullname    release-prefixed name (truncated to 63 chars)
  splatstudio.labels      common label set
  splatstudio.selectorLabels   selector subset
*/ -}}

{{- define "splatstudio.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "splatstudio.fullname" -}}
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

{{- define "splatstudio.labels" -}}
app.kubernetes.io/name: {{ include "splatstudio.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "splatstudio.selectorLabels" -}}
app.kubernetes.io/name: {{ include "splatstudio.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
