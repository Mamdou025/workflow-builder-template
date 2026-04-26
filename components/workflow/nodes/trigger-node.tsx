"use client";

import type { NodeProps } from "@xyflow/react";
import {
  Check,
  Clock,
  FileText,
  Layers,
  Play,
  Webhook,
  XCircle,
} from "lucide-react";
import { memo } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";

type TriggerNodeProps = NodeProps & {
  data?: WorkflowNodeData;
};

const getVisualLevelClasses = (
  visualLevel: WorkflowNodeData["visualLevel"]
): string => {
  if (visualLevel === "L1") {
    return "h-56 w-64 rounded-3xl border-2 shadow-lg";
  }
  if (visualLevel === "L3") {
    return "h-40 w-44 rounded-2xl border border-dashed bg-card/85";
  }
  return "h-48 w-48";
};

const getVisualBadgeText = (
  visualLevel: WorkflowNodeData["visualLevel"],
  visualRole: WorkflowNodeData["visualRole"]
): string | null => {
  if (!visualLevel) {
    return null;
  }

  let fallbackRole: NonNullable<WorkflowNodeData["visualRole"]> = "step";
  if (visualLevel === "L1") {
    fallbackRole = "stage";
  } else if (visualLevel === "L3") {
    fallbackRole = "source";
  }
  const role = visualRole || fallbackRole;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return `${visualLevel} • ${roleLabel}`;
};

const getTriggerIcon = (
  triggerType: string,
  visualLevel: WorkflowNodeData["visualLevel"]
) => {
  if (visualLevel === "L1") {
    return Layers;
  }
  if (visualLevel === "L3") {
    return FileText;
  }
  if (triggerType === "Schedule") {
    return Clock;
  }
  if (triggerType === "Webhook") {
    return Webhook;
  }
  return Play;
};

const getStatusBadgeClass = (status: WorkflowNodeData["status"]) => {
  if (status === "success") {
    return "bg-green-500/50";
  }
  if (status === "error") {
    return "bg-red-500/50";
  }
  return "";
};

export const TriggerNode = memo(({ data, selected }: TriggerNodeProps) => {
  if (!data) {
    return null;
  }

  const triggerType = (data.config?.triggerType as string) || "Manual";
  const displayTitle = data.label || triggerType;
  const displayDescription = data.description || "Trigger";
  const status = data.status;
  const levelClasses = getVisualLevelClasses(data.visualLevel);
  const visualBadge = getVisualBadgeText(data.visualLevel, data.visualRole);
  const TriggerIcon = getTriggerIcon(triggerType, data.visualLevel);

  return (
    <Node
      className={cn(
        "flex flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        levelClasses,
        selected && "border-primary"
      )}
      handles={{ target: false, source: true }}
      status={status}
    >
      {data.visualLevel === "L1" && (
        <div className="absolute inset-x-0 top-0 h-8 rounded-t-2xl bg-indigo-500/20" />
      )}
      {data.visualLevel === "L2" && (
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-blue-500/60" />
      )}

      {/* Status indicator badge in top right */}
      {status && status !== "idle" && status !== "running" && (
        <div
          className={cn(
            "absolute top-2 right-2 rounded-full p-1",
            getStatusBadgeClass(status)
          )}
        >
          {status === "success" && (
            <Check className="size-3.5 text-white" strokeWidth={2.5} />
          )}
          {status === "error" && (
            <XCircle className="size-3.5 text-white" strokeWidth={2.5} />
          )}
        </div>
      )}

      {/* Visual hierarchy badge */}
      {visualBadge && (
        <div className="-translate-x-1/2 absolute top-2 left-1/2 rounded-full border border-border/60 bg-background/90 px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
          {visualBadge}
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 p-6">
        <TriggerIcon className="size-12 text-blue-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center gap-1 text-center">
          <NodeTitle className="text-base">{displayTitle}</NodeTitle>
          {displayDescription && (
            <NodeDescription className="text-xs">
              {displayDescription}
            </NodeDescription>
          )}
        </div>
      </div>
    </Node>
  );
});

TriggerNode.displayName = "TriggerNode";
