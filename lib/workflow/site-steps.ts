export const WORKFLOW_STEP_IDS = ["brief", "layout", "polish", "hosting"] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEP_IDS)[number];

export function isWorkflowStepId(value: string): value is WorkflowStepId {
  return (WORKFLOW_STEP_IDS as readonly string[]).includes(value);
}

/** Maps legacy DB values and old URLs to current step ids. */
export function normalizeStoredWorkflowStep(raw: string): WorkflowStepId {
  switch (raw) {
    case "goals":
      return "brief";
    case "builder":
    case "structure":
      return "layout";
    case "content":
      return "polish";
    case "review":
      return "hosting";
    default:
      break;
  }
  if (isWorkflowStepId(raw)) {
    return raw;
  }
  return "brief";
}

/** Legacy URL segment → current route folder name (same as id for new steps). */
export function normalizeWorkflowPathSegment(segment: string): WorkflowStepId {
  return normalizeStoredWorkflowStep(segment);
}

export const WORKFLOW_STEPS: readonly { id: WorkflowStepId; i18nKey: string }[] = [
  { id: "brief", i18nKey: "brief" },
  { id: "layout", i18nKey: "layout" },
  { id: "polish", i18nKey: "polish" },
  { id: "hosting", i18nKey: "hosting" },
] as const;

export function workflowStepIndex(step: WorkflowStepId): number {
  return WORKFLOW_STEP_IDS.indexOf(step);
}
