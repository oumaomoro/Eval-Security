CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TABLE "clauses" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"compliance_status" text DEFAULT 'compliant' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" integer NOT NULL,
	"role" "workspace_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "risk_threshold" integer DEFAULT 70;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "compliance_focus" text DEFAULT 'KDPA';--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "generated_by" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_comparisons" ADD CONSTRAINT "contract_comparisons_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;