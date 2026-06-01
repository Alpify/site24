import { parseBriefPayload } from "@/lib/workflow/brief-questions";
import { parseLayoutPayload } from "@/lib/workflow/layout-proposals";
import {
  WORKFLOW_STEP_IDS,
  normalizeStoredWorkflowStep,
  workflowStepIndex,
  type WorkflowStepId,
} from "@/lib/workflow/site-steps";

export type StepAccess = "complete" | "current" | "available" | "locked";

export type WorkflowProgress = {
  currentStep: WorkflowStepId;
  steps: Record<WorkflowStepId, StepAccess>;
  briefComplete: boolean;
  layoutComplete: boolean;
  polishComplete: boolean;
};

export function computeWorkflowProgress(opts: {
  workflowStep: string;
  workflowBriefJson: string | null;
  workflowBuilderJson: string | null;
  draftsWithBody: number;
}): WorkflowProgress {
  const currentStep = normalizeStoredWorkflowStep(opts.workflowStep);
  const briefComplete = parseBriefPayload(opts.workflowBriefJson) !== null;
  const layoutComplete =
    parseLayoutPayload(opts.workflowBuilderJson) !== null || opts.draftsWithBody > 0;
  const polishComplete = opts.draftsWithBody > 0;

  const completion: Record<WorkflowStepId, boolean> = {
    brief: briefComplete,
    layout: layoutComplete,
    polish: polishComplete,
    hosting: polishComplete,
  };

  const steps = {} as Record<WorkflowStepId, StepAccess>;
  for (const id of WORKFLOW_STEP_IDS) {
    const idx = workflowStepIndex(id);
    const currentIdx = workflowStepIndex(currentStep);
    if (completion[id]) {
      steps[id] = id === currentStep ? "current" : "complete";
    } else if (id === currentStep) {
      steps[id] = "current";
    } else if (idx <= currentIdx) {
      steps[id] = "available";
    } else if (idx === 0 || completion[WORKFLOW_STEP_IDS[idx - 1]!]) {
      steps[id] = "available";
    } else {
      steps[id] = "locked";
    }
  }

  return {
    currentStep,
    steps,
    briefComplete,
    layoutComplete,
    polishComplete,
  };
}

export function canAccessWorkflowStep(
  progress: WorkflowProgress,
  step: WorkflowStepId,
): boolean {
  const access = progress.steps[step];
  return access !== "locked";
}

export function firstIncompleteStep(progress: WorkflowProgress): WorkflowStepId {
  if (!progress.briefComplete) return "brief";
  if (!progress.layoutComplete) return "layout";
  if (!progress.polishComplete) return "polish";
  return "hosting";
}
