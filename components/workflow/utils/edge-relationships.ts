import type {
  EdgeStatus,
  WorkflowRelationshipType,
} from "@/lib/local-fiscal-workflow";
import { WORKFLOW_RELATIONSHIP_LABELS } from "@/lib/local-fiscal-workflow";
import { cn } from "@/lib/utils";

export function formatRelationshipType(type: WorkflowRelationshipType) {
  return WORKFLOW_RELATIONSHIP_LABELS[type] || type.replaceAll("_", " ");
}

export function getEdgeStatusClasses(status: EdgeStatus | undefined) {
  if (status === "proposed") {
    return {
      labelClassName:
        "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      stroke: "rgb(59 130 246)",
      strokeDasharray: "5 4",
    };
  }

  if (status === "disabled") {
    return {
      labelClassName: "border-muted bg-muted/70 text-muted-foreground",
      stroke: "var(--muted-foreground)",
      strokeDasharray: "6 6",
    };
  }

  if (status === "rejected") {
    return {
      labelClassName:
        "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
      stroke: "rgb(239 68 68)",
      strokeDasharray: "2 4",
    };
  }

  return {
    labelClassName:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    stroke: "rgb(248 250 252)",
    strokeDasharray: "5",
  };
}

export function getEdgeLabelClassName(status: EdgeStatus | undefined) {
  return cn(
    "nodrag nopan pointer-events-auto rounded border px-1.5 py-0.5 font-medium text-[10px] shadow-sm backdrop-blur",
    getEdgeStatusClasses(status).labelClassName
  );
}
