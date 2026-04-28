"use client";

import type { NodeProps } from "@xyflow/react";
import { Check, Clock, Play, Webhook, XCircle } from "lucide-react";
import { memo } from "react";
import {
  Node,
  NodeDescription,
  NodeTitle,
} from "@/components/ai-elements/node";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-store";
import {
  getVisualBadgeText,
  getVisualLevelStyle,
  resolveVisualLevel,
  VisualLevelDecor,
  VisualLevelIcon,
} from "./visual-level";

type TriggerNodeProps = NodeProps & {
  data?: WorkflowNodeData;
};

const getTriggerIcon = (triggerType: string) => {
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
  const visualLevel = resolveVisualLevel(data);
  const visualStyle = getVisualLevelStyle(visualLevel);
  const visualBadge = getVisualBadgeText(visualLevel, data.visualRole);
  const TriggerIcon = getTriggerIcon(triggerType);

  return (
    <Node
      className={cn(
        "relative flex flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        visualStyle.nodeClassName,
        selected &&
          "ring-2 ring-primary/70 ring-offset-2 ring-offset-background"
      )}
      handles={{ target: false, source: true }}
      status={status}
    >
      <VisualLevelDecor visualLevel={visualLevel} />

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
        <div
          className={cn(
            "-translate-x-1/2 absolute left-1/2 z-10 rounded-full border px-2 py-0.5 font-semibold text-[10px]",
            visualStyle.badgeClassName
          )}
        >
          {visualBadge}
        </div>
      )}

      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center",
          visualStyle.contentClassName
        )}
      >
        {visualLevel ? (
          <VisualLevelIcon visualLevel={visualLevel} />
        ) : (
          <VisualLevelIcon visualLevel={visualLevel}>
            <TriggerIcon className="size-12 text-blue-400" strokeWidth={1.5} />
          </VisualLevelIcon>
        )}
        <div
          className={cn(
            "-translate-x-1/2 absolute top-[calc(100%+0.5rem)] left-1/2 flex flex-col items-center gap-0.5 text-center",
            visualStyle.captionClassName
          )}
        >
          <NodeTitle className="max-w-full truncate text-sm leading-tight">
            {displayTitle}
          </NodeTitle>
          {displayDescription && (
            <NodeDescription className="max-w-full truncate text-[11px] leading-tight">
              {displayDescription}
            </NodeDescription>
          )}
        </div>
      </div>
    </Node>
  );
});

TriggerNode.displayName = "TriggerNode";
