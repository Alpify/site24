ALTER TABLE "project" ADD COLUMN "workflowStep" text DEFAULT 'goals' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "workflowGoals" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "workflowStructure" text;