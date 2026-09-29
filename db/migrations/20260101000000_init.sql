-- SplatStudio hosted control-plane schema (PostgreSQL + pgvector).
--
-- The local daemon keeps its own SQLite store; this schema is the hosted
-- control plane used by the web app and deployed daemon on Railway/Vercel.
--
-- Managed with Atlas (https://github.com/ariga/atlas). Apply with:
--   atlas migrate apply --env local --url "$DATABASE_URL"
-- See docs/DATABASE.md.

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "name" text,
  "password_hash" text,
  "stripe_customer_id" text,
  "plan" text NOT NULL DEFAULT 'free',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id"),
  CONSTRAINT "users_plan_check" CHECK ("plan" IN ('free', 'pro', 'studios'))
);

-- ── Sessions (JWT login state) ────────────────────────────────────────
CREATE TABLE "sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "user_agent" text,
  "issued_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  PRIMARY KEY ("id"),
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "sessions_token_hash_key" UNIQUE ("token_hash")
);
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");

-- ── API keys (paid-tier programmatic access) ──────────────────────────
CREATE TABLE "api_keys" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "prefix" text NOT NULL,
  "key_hash" text NOT NULL,
  "last_used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "api_keys_key_hash_key" UNIQUE ("key_hash")
);
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" ("user_id");

-- ── Subscriptions (Stripe) ────────────────────────────────────────────
CREATE TABLE "subscriptions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "stripe_subscription_id" text NOT NULL,
  "stripe_price_id" text,
  "plan" text NOT NULL,
  "status" text NOT NULL,
  "current_period_end" timestamptz,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id"),
  CONSTRAINT "subscriptions_plan_check" CHECK ("plan" IN ('pro', 'studios')),
  CONSTRAINT "subscriptions_status_check" CHECK (
    "status" IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')
  )
);
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" ("user_id");

-- ── Projects (hosted metadata mirror of daemon projects) ──────────────
CREATE TABLE "projects" (
  "id" text NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "archived_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE INDEX "projects_user_id_idx" ON "projects" ("user_id");

-- ── Vector index (pgvector) ───────────────────────────────────────────
-- Semantic index over skills / templates / design systems / docs. The
-- embedding dimension is pinned to 1536 (text-embedding-3-small / ada-002).
CREATE TABLE "skill_embeddings" (
  "id" bigserial NOT NULL,
  "owner_id" uuid,
  "kind" text NOT NULL,
  "ref" text NOT NULL,
  "title" text,
  "content" text NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "skill_embeddings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "skill_embeddings_kind_check" CHECK ("kind" IN ('skill', 'template', 'design_system', 'doc'))
);
CREATE INDEX "skill_embeddings_owner_id_idx" ON "skill_embeddings" ("owner_id");
CREATE INDEX "skill_embeddings_embedding_idx" ON "skill_embeddings" USING hnsw ("embedding" vector_cosine_ops);
