CREATE TABLE IF NOT EXISTS "ScheduledPrompt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"promptText" text NOT NULL,
	"cronExpression" varchar(100) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp NOT NULL,
	"lastRunAt" timestamp,
	"nextRunAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ScheduledPrompt" ADD CONSTRAINT "ScheduledPrompt_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
