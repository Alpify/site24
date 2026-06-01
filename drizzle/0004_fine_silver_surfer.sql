ALTER TABLE "project" ADD COLUMN "workflowBuilderJson" text;
UPDATE "project" SET "workflowStep" = 'builder' WHERE "workflowStep" = 'structure';