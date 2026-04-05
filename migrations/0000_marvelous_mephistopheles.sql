CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"details" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_rulesets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"standard" text NOT NULL,
	"rules" jsonb NOT NULL,
	"is_custom" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "billing_telemetry" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"metric_type" text NOT NULL,
	"value" double precision NOT NULL,
	"cost" double precision,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clause_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"clause_name" text NOT NULL,
	"clause_category" text NOT NULL,
	"standard_language" text NOT NULL,
	"jurisdiction" text,
	"applicable_standards" jsonb,
	"risk_level_if_missing" text,
	"is_mandatory" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"industry" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"annual_budget" double precision,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contract_id" integer,
	"audit_id" integer,
	"content" text NOT NULL,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer,
	"ruleset_id" integer,
	"audit_name" text NOT NULL,
	"audit_type" text NOT NULL,
	"scope" jsonb,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"overall_compliance_score" double precision,
	"findings" jsonb,
	"compliance_by_standard" jsonb,
	"systemic_issues" jsonb,
	"executive_summary" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"comparison_type" text NOT NULL,
	"overall_score" integer,
	"clause_analysis" jsonb,
	"missing_clauses" jsonb,
	"key_recommendations" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_name" text NOT NULL,
	"product_service" text NOT NULL,
	"category" text NOT NULL,
	"annual_cost" double precision,
	"monthly_cost" double precision,
	"contract_start_date" date,
	"renewal_date" date,
	"contract_term_months" integer,
	"license_count" integer,
	"auto_renewal" boolean DEFAULT false,
	"payment_frequency" text,
	"file_url" text,
	"status" text DEFAULT 'active',
	"ai_analysis" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "infrastructure_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"component" text NOT NULL,
	"event" text NOT NULL,
	"status" text DEFAULT 'detected' NOT NULL,
	"action_taken" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"rules" jsonb NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "regulatory_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard" text NOT NULL,
	"alert_title" text NOT NULL,
	"alert_description" text NOT NULL,
	"published_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending_rescan' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remediation_suggestions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" integer NOT NULL,
	"original_clause" text NOT NULL,
	"suggested_clause" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"regulatory_body" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"content" jsonb,
	"format" text DEFAULT 'pdf' NOT NULL,
	"file_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"risk_title" text NOT NULL,
	"risk_category" text NOT NULL,
	"risk_description" text,
	"severity" text NOT NULL,
	"likelihood" text NOT NULL,
	"impact" text NOT NULL,
	"risk_score" integer,
	"mitigation_status" text DEFAULT 'identified' NOT NULL,
	"mitigation_strategies" jsonb,
	"financial_exposure_min" double precision,
	"financial_exposure_max" double precision,
	"ai_confidence" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "savings_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"estimated_savings" double precision,
	"status" text DEFAULT 'identified',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_playbooks" (
	"user_id" text NOT NULL,
	"playbook_id" integer NOT NULL,
	"activated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_scorecards" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"vendor_name" text NOT NULL,
	"compliance_score" integer,
	"risk_score" integer,
	"security_score" integer,
	"sla_performance" integer,
	"overall_grade" text,
	"last_assessment_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'enterprise' NOT NULL,
	"webhook_url" text,
	"webhook_enabled" boolean DEFAULT false,
	"api_usage_count" integer DEFAULT 0,
	"api_usage_reset_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"client_id" integer,
	"role" varchar DEFAULT 'analyst',
	"profile_image_url" varchar,
	"webauthn_id" varchar,
	"webauthn_credential" text,
	"mfa_enabled" boolean DEFAULT false,
	"subscription_tier" varchar DEFAULT 'starter',
	"contracts_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_telemetry" ADD CONSTRAINT "billing_telemetry_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_audit_id_compliance_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."compliance_audits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audits" ADD CONSTRAINT "compliance_audits_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audits" ADD CONSTRAINT "compliance_audits_ruleset_id_audit_rulesets_id_fk" FOREIGN KEY ("ruleset_id") REFERENCES "public"."audit_rulesets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediation_suggestions" ADD CONSTRAINT "remediation_suggestions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_opportunities" ADD CONSTRAINT "savings_opportunities_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playbooks" ADD CONSTRAINT "user_playbooks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playbooks" ADD CONSTRAINT "user_playbooks_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_scorecards" ADD CONSTRAINT "vendor_scorecards_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");