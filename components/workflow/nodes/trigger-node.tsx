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
  FamilyNodeShape,
  getFamilyCanvasTitle,
  getFamilyNodeStyle,
} from "./family-node-shape";
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

function TriggerStatusBadge({
  status,
}: {
  status: WorkflowNodeData["status"];
}) {
  if (!status || status === "idle" || status === "running") {
    return null;
  }

  return (
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
  );
}

export const TriggerNode = memo(({ data, selected }: TriggerNodeProps) => {
  if (!data) {
    return null;
  }

  const triggerType = (data.config?.triggerType as string) || "Manual";
  const rawDisplayTitle = data.label || triggerType;
  const status = data.status;
  const visualLevel = resolveVisualLevel(data);
  const visualStyle = getVisualLevelStyle(visualLevel);
  const familyStyle = getFamilyNodeStyle(data);
  const nodeStyle = familyStyle || visualStyle;
  const visualBadge = familyStyle
    ? null
    : getVisualBadgeText(visualLevel, data.visualRole);
  const displayTitle = familyStyle
    ? getFamilyCanvasTitle(data, rawDisplayTitle)
    : rawDisplayTitle;
  const displayDescription = familyStyle ? null : data.description || "Trigger";
  const TriggerIcon = getTriggerIcon(triggerType);
  let triggerIconNode = (
    <VisualLevelIcon visualLevel={visualLevel}>
      <TriggerIcon className="size-12 text-blue-400" strokeWidth={1.5} />
    </VisualLevelIcon>
  );
  if (visualLevel) {
    triggerIconNode = <VisualLevelIcon visualLevel={visualLevel} />;
  }
  if (familyStyle) {
    triggerIconNode = <FamilyNodeShape data={data} />;
  }

  return (
    <Node
      className={cn(
        "relative flex flex-col items-center justify-center shadow-none transition-all duration-150 ease-out",
        nodeStyle.nodeClassName,
        selected &&
          "ring-2 ring-primary/70 ring-offset-2 ring-offset-background"
      )}
      handles={{ target: false, source: true }}
      status={status}
    >
      {!familyStyle && <VisualLevelDecor visualLevel={visualLevel} />}

      <TriggerStatusBadge status={status} />

      {/* Visual hierarchy badge */}
      {visualBadge && (
        <div
          className={cn(
            "-translate-x-1/2 absolute left-1/2 z-10 rounded-full border px-2 py-0.5 font-semibold text-[10px]",
            nodeStyle.badgeClassName
          )}
        >
          {visualBadge}
        </div>
      )}

      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center",
          nodeStyle.contentClassName
        )}
      >
        {triggerIconNode}
        <div
          className={cn(
            "-translate-x-1/2 absolute top-[calc(100%+0.5rem)] left-1/2 flex flex-col items-center gap-0.5 text-center",
            nodeStyle.captionClassName
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
