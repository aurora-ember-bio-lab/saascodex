// Atlas configuration for the SaaSCodex control-plane database.
// Docs: https://atlasgo.io/atlas-schema/projects
//
// Usage:
//   atlas migrate hash --dir file://migrations           (after editing SQL)
//   atlas migrate apply --env local --url "$DATABASE_URL"
//   atlas migrate validate --dir file://migrations
//
// The default URL points at the local pgvector service from
// deploy/docker-compose.yml; override it with `--url` or by setting
// DATABASE_URL in the shell.

variable "database_url" {
  type    = string
  default = "postgres://postgres:postgres@localhost:5432/saascodex?sslmode=disable"
}

env "local" {
  url = var.database_url
  migration {
    dir = "file://migrations"
  }
}

// Railway / production. Apply with the platform-provided DATABASE_URL:
//   atlas migrate apply --env production --url "$DATABASE_URL"
env "production" {
  url = var.database_url
  migration {
    dir = "file://migrations"
  }
}
