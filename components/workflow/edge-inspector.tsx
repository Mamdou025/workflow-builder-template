"use client";

import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOCK_CATALOG,
  EDGE_STATUS_VALUES,
  type EdgeStatus,
  getAllowedWorkflowRelationshipTypes,
  type WorkflowEdge as SchemaWorkflowEdge,
  WORKFLOW_RELATIONSHIP_TYPES,
  type WorkflowBlock,
  type WorkflowRelationshipType,
} from "@/lib/local-fiscal-workflow";
import type { WorkflowEdge } from "@/lib/workflow-store";
import { formatRelationshipType } from "./utils/edge-relationships";

type EdgeInspectorProps = {
  disabled?: boolean;
  edge: WorkflowEdge;
  onDelete: () => void;
  onInsertBlockBetween: (catalogId: string) => void;
  onUpdate: (
    updates: Partial<
      Pick<
        SchemaWorkflowEdge,
        "confidence" | "notes" | "reason" | "relationshipType" | "status"
      >
    >
  ) => void;
  sourceBlock?: WorkflowBlock;
  targetBlock?: WorkflowBlock;
};

function getWorkflowEdge(edge: WorkflowEdge): SchemaWorkflowEdge | undefined {
  return edge.data?.workflowEdge;
}

function getRelationshipOptions({
  currentRelationship,
  sourceBlock,
  targetBlock,
}: {
  currentRelationship?: WorkflowRelationshipType;
  sourceBlock?: WorkflowBlock;
  targetBlock?: WorkflowBlock;
}) {
  const allowedOptions =
    sourceBlock && targetBlock
      ? getAllowedWorkflowRelationshipTypes(
          sourceBlock.family,
          targetBlock.family
        )
      : [...WORKFLOW_RELATIONSHIP_TYPES];
  const options =
    allowedOptions.length > 0
      ? allowedOptions
      : [...WORKFLOW_RELATIONSHIP_TYPES];

  if (currentRelationship && !options.includes(currentRelationship)) {
    return [currentRelationship, ...options];
  }

  return options;
}

export function EdgeInspector({
  disabled,
  edge,
  onDelete,
  onInsertBlockBetween,
  onUpdate,
  sourceBlock,
  targetBlock,
}: EdgeInspectorProps) {
  const workflowEdge = getWorkflowEdge(edge);
  const currentRelationship =
    workflowEdge?.relationshipType || edge.data?.relationshipType;
  const [insertCatalogId, setInsertCatalogId] = useState(
    "logic:transformation"
  );
  const relationshipOptions = getRelationshipOptions({
    currentRelationship,
    sourceBlock,
    targetBlock,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
          <GitBranch className="size-4 text-muted-foreground" />
          Workflow relationship
        </div>
        <p className="text-muted-foreground text-xs">
          This connection stores schema metadata for how one workflow block
          relates to another.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edge-source">Source block</Label>
          <Input
            disabled
            id="edge-source"
            value={sourceBlock?.label || edge.source}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edge-target">Target block</Label>
          <Input
            disabled
            id="edge-target"
            value={targetBlock?.label || edge.target}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edge-relationship">Relationship type</Label>
        <Select
          disabled={disabled}
          onValueChange={(value) =>
            onUpdate({
              relationshipType: value as WorkflowRelationshipType,
            })
          }
          value={currentRelationship}
        >
          <SelectTrigger id="edge-relationship">
            <SelectValue placeholder="Choose relationship" />
          </SelectTrigger>
          <SelectContent>
            {relationshipOptions.map((relationship) => (
              <SelectItem key={relationship} value={relationship}>
                {formatRelationshipType(relationship)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edge-reason">Reason</Label>
        <Input
          disabled={disabled}
          id="edge-reason"
          onChange={(event) => onUpdate({ reason: event.target.value })}
          value={workflowEdge?.reason || ""}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edge-status">Status</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => onUpdate({ status: value as EdgeStatus })}
            value={workflowEdge?.status || "active"}
          >
            <SelectTrigger id="edge-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {EDGE_STATUS_VALUES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edge-confidence">Confidence</Label>
          <Input
            disabled={disabled}
            id="edge-confidence"
            max={1}
            min={0}
            onChange={(event) =>
              onUpdate({ confidence: Number(event.target.value) })
            }
            step={0.01}
            type="number"
            value={workflowEdge?.confidence ?? 1}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edge-created-by">Created by</Label>
          <Input
            disabled
            id="edge-created-by"
            value={workflowEdge?.createdBy || "workflow-studio"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edge-created-at">Created at</Label>
          <Input
            disabled
            id="edge-created-at"
            value={workflowEdge?.createdAt || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edge-notes">Notes</Label>
        <Input
          disabled={disabled}
          id="edge-notes"
          onChange={(event) => onUpdate({ notes: event.target.value })}
          placeholder="Optional relationship notes"
          value={workflowEdge?.notes || ""}
        />
      </div>

      <div className="space-y-2 rounded-md border bg-muted/20 p-3">
        <Label htmlFor="edge-insert-block">Insert block between</Label>
        <div className="flex gap-2">
          <Select
            disabled={disabled}
            onValueChange={setInsertCatalogId}
            value={insertCatalogId}
          >
            <SelectTrigger className="min-w-0 flex-1" id="edge-insert-block">
              <SelectValue placeholder="Choose block" />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_CATALOG.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.family} / {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={disabled}
            onClick={() => onInsertBlockBetween(insertCatalogId)}
            size="sm"
            variant="secondary"
          >
            <Plus className="mr-1 size-3.5" />
            Insert
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          The original edge is replaced by two typed relationships and its
          history is copied forward.
        </p>
      </div>

      {workflowEdge?.history && workflowEdge.history.length > 0 && (
        <div className="space-y-2">
          <Label>History</Label>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border bg-background/70 p-2">
            {workflowEdge.history.slice(-4).map((entry) => (
              <div className="text-xs" key={entry.id}>
                <span className="font-medium">{entry.action}</span>{" "}
                <span className="text-muted-foreground">{entry.notes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        className="text-muted-foreground"
        disabled={disabled}
        onClick={onDelete}
        size="sm"
        variant="ghost"
      >
        <Trash2 className="mr-2 size-4" />
        Delete relationship
      </Button>
    </div>
  );
}
