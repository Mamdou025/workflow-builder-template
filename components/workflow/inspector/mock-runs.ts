import type { Edge as CanvasEdge } from "@xyflow/react";
import {
  LOCAL_WORKFLOW_ID,
  type LocalRunRecord,
} from "@/lib/local-fiscal-workflow";
import type { WorkflowNode, WorkflowNodeData } from "@/lib/workflow-store";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Mock output branches mirror the local block families.
function getFamilyOutput(data: WorkflowNodeData): Record<string, unknown> {
  const block = data.block;
  const config = data.config || {};

  if (!block) {
    return { result: "Local mock run completed." };
  }

  if (block.family === "Source") {
    return {
      immutable: true,
      locator: block.source?.locator || config.sourceLocator,
      payloadPreview:
        block.source?.valuePreview || config.valuePreview || "mock rows",
      sourceSubtype: block.subtype,
    };
  }

  if (block.family === "Logic") {
    const mode = config.logicMode || block.subtype;
    return {
      mode,
      resultKey: config.outputs || block.runtime.outputKey,
      mockCalculatedOutput:
        mode === "Formula" ? "formula preview = 1284.42" : "mock transform ok",
      warnings: [],
    };
  }

  if (block.family === "Review / Validation") {
    return {
      checkStatus:
        config.validationSeverity === "blocking" ? "warning" : "pass",
      checkedInputs: config.inputs || "upstream blocks",
      reviewerNotes: "Mock reviewer note retained locally.",
    };
  }

  if (block.family === "Protected") {
    return {
      lockedInRuntime: block.governance?.lockedInRuntime ?? true,
      editIntent: config.protectedEditIntent || block.governance?.editIntent,
      mockValue: config.currentValue || block.runtime.outputKey || "governed",
      validationStatus: "mock certified",
    };
  }

  if (block.family === "Output") {
    return {
      ready: true,
      subtype: block.subtype,
      mappedProtectedValues: config.mappedProtectedValues || "local preview",
      mockDownloadOnly: true,
    };
  }

  return {
    proposalOnly: true,
    directMutation: false,
    proposalStatus: config.proposalStatus || "proposed",
    mockResponse: "AI proposal retained for explicit approval.",
  };
}

export function createInspectorLocalRunRecord({
  data,
  edges,
  node,
}: {
  data: WorkflowNodeData;
  edges: CanvasEdge[];
  node: WorkflowNode;
}): LocalRunRecord {
  const startedAt = new Date();
  const completedAt = new Date(startedAt.getTime() + 120);
  const executionId = `inspector-run-${node.id}-${startedAt.getTime()}`;
  const upstreamEdges = edges.filter((edge) => edge.target === node.id).length;
  const downstreamEdges = edges.filter(
    (edge) => edge.source === node.id
  ).length;
  const block = data.block;

  return {
    execution: {
      completedAt,
      duration: String(completedAt.getTime() - startedAt.getTime()),
      error: null,
      id: executionId,
      startedAt,
      status: "success",
      workflowId: LOCAL_WORKFLOW_ID,
    },
    logs: [
      {
        completedAt,
        duration: "120",
        error: null,
        executionId,
        id: `${executionId}-${node.id}`,
        input: {
          downstreamEdges,
          sampleData: true,
          upstreamEdges,
        },
        nodeId: node.id,
        nodeName: data.label,
        nodeType: block ? `${block.family} / ${block.subtype}` : data.type,
        output: getFamilyOutput(data),
        startedAt,
        status: "success",
      },
    ],
  };
}
