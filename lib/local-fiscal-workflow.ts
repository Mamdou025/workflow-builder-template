import type { WorkflowEdge, WorkflowNode } from "./workflow-store";

export const LOCAL_WORKFLOW_ID = "local-fiscal-studio";
export const LOCAL_WORKFLOW_STORAGE_KEY = "workflow-studio.local-workflow";
export const LOCAL_RUNS_STORAGE_KEY = "workflow-studio.local-runs";

export type FiscalStage =
  | "source"
  | "logic"
  | "review"
  | "validation"
  | "protected"
  | "output";

export type LocalWorkflowSnapshot = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  version: 1;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sampleDataset: typeof LOCAL_SAMPLE_DATASET;
};

export type LocalExecutionLog = {
  id: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: "pending" | "running" | "success" | "error";
  startedAt: Date;
  completedAt: Date | null;
  duration: string | null;
  input?: unknown;
  output?: unknown;
  error: string | null;
};

export type LocalWorkflowExecution = {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "error" | "cancelled";
  startedAt: Date;
  completedAt: Date | null;
  duration: string | null;
  error: string | null;
};

export type LocalRunRecord = {
  execution: LocalWorkflowExecution;
  logs: LocalExecutionLog[];
};

export const LOCAL_SAMPLE_DATASET = {
  period: "FY2025 Q4",
  entity: "FAPI Sample Entity",
  sourceDocuments: [
    "trial-balance.csv",
    "intercompany-ledger.csv",
    "jurisdiction-policy.json",
    "prior-year-review-notes.md",
  ],
  rows: [
    {
      jurisdiction: "Canada",
      revenue: 1_280_000,
      deductibleExpenses: 740_000,
      protectedInput: false,
      taxAttribute: "foreign accrual property income",
    },
    {
      jurisdiction: "United States",
      revenue: 840_000,
      deductibleExpenses: 510_000,
      protectedInput: false,
      taxAttribute: "interest allocation",
    },
    {
      jurisdiction: "United Kingdom",
      revenue: 610_000,
      deductibleExpenses: 455_000,
      protectedInput: true,
      taxAttribute: "withholding reserve",
    },
  ],
};

export const FISCAL_STAGE_OPTIONS: Array<{
  id: string;
  stage: FiscalStage;
  label: string;
  description: string;
}> = [
  {
    id: "preset:source",
    stage: "source",
    label: "Source",
    description: "Immutable truth or reference data",
  },
  {
    id: "preset:logic",
    stage: "logic",
    label: "Logic",
    description: "Transform, calculate, classify, or derive values",
  },
  {
    id: "preset:review-validation",
    stage: "validation",
    label: "Review / Validation",
    description: "Check whether the workflow is trustworthy",
  },
  {
    id: "preset:protected",
    stage: "protected",
    label: "Protected",
    description: "Governed inputs or results",
  },
  {
    id: "preset:output",
    stage: "output",
    label: "Output",
    description: "Generate handoff or export artifacts",
  },
];

export type FiscalVisualPreset = {
  label: string;
  description: string;
  visualLevel: "L1" | "L2" | "L3";
  visualRole:
    | "source"
    | "logic"
    | "review"
    | "validation"
    | "protected"
    | "output";
  config: Record<string, string>;
};

const FISCAL_PRESETS: Record<string, FiscalVisualPreset> = {
  "preset:source": {
    label: "Source: FAPI Package",
    description: "Immutable reference set for the sample fiscal workflow",
    visualLevel: "L3",
    visualRole: "source",
    config: {
      fiscalStage: "source",
      owner: "Tax Operations",
      rulebookRef: "Source records are read-only reference truth.",
      inputs: "trial-balance.csv, intercompany-ledger.csv",
      outputs: "sourceEvidence",
    },
  },
  "preset:logic": {
    label: "Logic: Normalize Attributes",
    description: "Classify rows and derive fiscal attributes",
    visualLevel: "L2",
    visualRole: "logic",
    config: {
      fiscalStage: "logic",
      owner: "Fiscal Systems",
      rulebookRef: "Logic transforms and derives values from source records.",
      inputs: "sourceEvidence",
      outputs: "normalizedTaxAttributes",
    },
  },
  "preset:review-validation": {
    label: "Review / Validation: Trust Checks",
    description: "Check completeness, thresholds, and review evidence",
    visualLevel: "L2",
    visualRole: "validation",
    config: {
      fiscalStage: "validation",
      owner: "Tax Review",
      rulebookRef: "Validation gates decide whether results are trustworthy.",
      inputs: "normalizedTaxAttributes",
      outputs: "reviewFindings",
    },
  },
  "preset:protected": {
    label: "Protected: Governed Results",
    description: "Hold governed values and masked result sets",
    visualLevel: "L2",
    visualRole: "protected",
    config: {
      fiscalStage: "protected",
      owner: "Data Steward",
      rulebookRef: "Protected blocks contain governed inputs or results.",
      inputs: "reviewFindings",
      outputs: "approvedProtectedPacket",
    },
  },
  "preset:output": {
    label: "Output: Review Packet",
    description: "Create handoff artifacts for downstream teams",
    visualLevel: "L2",
    visualRole: "output",
    config: {
      fiscalStage: "output",
      owner: "Tax Delivery",
      rulebookRef: "Outputs generate handoff or export artifacts.",
      inputs: "approvedProtectedPacket",
      outputs: "review_packet.json, taxprep_bridge.csv",
    },
  },
};

export function isLocalWorkflowId(workflowId?: string | null): boolean {
  return workflowId === LOCAL_WORKFLOW_ID;
}

export function getFiscalPreset(
  presetId: string
): FiscalVisualPreset | undefined {
  return FISCAL_PRESETS[presetId];
}

export function getFiscalVisualForStage(stage: FiscalStage): {
  visualLevel: "L1" | "L2" | "L3";
  visualRole:
    | "source"
    | "logic"
    | "review"
    | "validation"
    | "protected"
    | "output";
} {
  if (stage === "source") {
    return { visualLevel: "L3", visualRole: "source" };
  }
  return { visualLevel: "L2", visualRole: stage };
}

export function getFiscalStageLabel(stage: string | undefined): string {
  const option = FISCAL_STAGE_OPTIONS.find((item) => item.stage === stage);
  return option?.label || "Fiscal Block";
}

export function createFapiSampleWorkflow(): LocalWorkflowSnapshot {
  const nodes: WorkflowNode[] = [
    {
      id: "source-fapi-package",
      type: "trigger",
      position: { x: -560, y: -40 },
      selected: true,
      data: {
        label: "Source: FAPI Package",
        description: "Immutable source package for the sample workflow",
        type: "trigger",
        visualLevel: "L3",
        visualRole: "source",
        config: {
          triggerType: "Manual",
          fiscalStage: "source",
          owner: "Tax Operations",
          rulebookRef: "Source records are read-only reference truth.",
          inputs: LOCAL_SAMPLE_DATASET.sourceDocuments.join(", "),
          outputs: "sourceEvidence",
        },
        status: "idle",
      },
    },
    {
      id: "logic-normalize-tax-attributes",
      type: "action",
      position: { x: -280, y: -40 },
      data: {
        label: "Logic: Normalize Attributes",
        description: "Classify rows and derive fiscal attributes",
        type: "action",
        visualLevel: "L2",
        visualRole: "logic",
        config: FISCAL_PRESETS["preset:logic"].config,
        status: "idle",
      },
    },
    {
      id: "validation-trust-checks",
      type: "action",
      position: { x: 0, y: -40 },
      data: {
        label: "Review / Validation: Trust Checks",
        description: "Check completeness, thresholds, and review evidence",
        type: "action",
        visualLevel: "L2",
        visualRole: "validation",
        config: FISCAL_PRESETS["preset:review-validation"].config,
        status: "idle",
      },
    },
    {
      id: "protected-governed-results",
      type: "action",
      position: { x: 280, y: -40 },
      data: {
        label: "Protected: Governed Results",
        description: "Hold governed values and masked result sets",
        type: "action",
        visualLevel: "L2",
        visualRole: "protected",
        config: FISCAL_PRESETS["preset:protected"].config,
        status: "idle",
      },
    },
    {
      id: "output-review-packet",
      type: "action",
      position: { x: 560, y: -40 },
      data: {
        label: "Output: Review Packet",
        description: "Create handoff artifacts for downstream teams",
        type: "action",
        visualLevel: "L2",
        visualRole: "output",
        config: FISCAL_PRESETS["preset:output"].config,
        status: "idle",
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    {
      id: "edge-source-logic",
      source: "source-fapi-package",
      target: "logic-normalize-tax-attributes",
      type: "animated",
    },
    {
      id: "edge-logic-validation",
      source: "logic-normalize-tax-attributes",
      target: "validation-trust-checks",
      type: "animated",
    },
    {
      id: "edge-validation-protected",
      source: "validation-trust-checks",
      target: "protected-governed-results",
      type: "animated",
    },
    {
      id: "edge-protected-output",
      source: "protected-governed-results",
      target: "output-review-packet",
      type: "animated",
    },
  ];

  return {
    id: LOCAL_WORKFLOW_ID,
    name: "Fiscal Workflow Studio - FAPI Sample",
    description: "Local prototype sample for a generic fiscal workflow studio.",
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes,
    edges,
    sampleDataset: LOCAL_SAMPLE_DATASET,
  };
}

export function loadLocalWorkflowSnapshot(): LocalWorkflowSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(LOCAL_WORKFLOW_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return parseLocalWorkflowJson(stored);
  } catch {
    return null;
  }
}

export function saveLocalWorkflowSnapshot({
  edges,
  name,
  nodes,
}: {
  edges: WorkflowEdge[];
  name: string;
  nodes: WorkflowNode[];
}): LocalWorkflowSnapshot {
  const snapshot: LocalWorkflowSnapshot = {
    id: LOCAL_WORKFLOW_ID,
    name: name || "Fiscal Workflow Studio",
    description: "Local prototype workflow stored in this browser.",
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes,
    edges,
    sampleDataset: LOCAL_SAMPLE_DATASET,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      LOCAL_WORKFLOW_STORAGE_KEY,
      JSON.stringify(snapshot, null, 2)
    );
  }

  return snapshot;
}

export function parseLocalWorkflowJson(text: string): LocalWorkflowSnapshot {
  const parsed = JSON.parse(text) as Partial<LocalWorkflowSnapshot>;

  if (!(Array.isArray(parsed.nodes) && Array.isArray(parsed.edges))) {
    throw new Error("Imported JSON must include nodes and edges arrays.");
  }

  return {
    id: LOCAL_WORKFLOW_ID,
    name: parsed.name || "Imported Fiscal Workflow",
    description: parsed.description || "Imported local workflow.",
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: parsed.nodes as WorkflowNode[],
    edges: parsed.edges as WorkflowEdge[],
    sampleDataset: parsed.sampleDataset || LOCAL_SAMPLE_DATASET,
  };
}

export function loadLocalRunRecords(): LocalRunRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(LOCAL_RUNS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const records = JSON.parse(stored) as LocalRunRecord[];
    return records.map((record) => ({
      execution: {
        ...record.execution,
        startedAt: new Date(record.execution.startedAt),
        completedAt: record.execution.completedAt
          ? new Date(record.execution.completedAt)
          : null,
      },
      logs: record.logs.map((log) => ({
        ...log,
        startedAt: new Date(log.startedAt),
        completedAt: log.completedAt ? new Date(log.completedAt) : null,
      })),
    }));
  } catch {
    return [];
  }
}

export function saveLocalRunRecord(record: LocalRunRecord): LocalRunRecord[] {
  const records = [record, ...loadLocalRunRecords()].slice(0, 12);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      LOCAL_RUNS_STORAGE_KEY,
      JSON.stringify(records, null, 2)
    );
  }
  return records;
}

export function clearLocalRunRecords() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCAL_RUNS_STORAGE_KEY);
  }
}

function getFiscalOutputForStage(
  stage: string | undefined,
  nodeLabel: string
): Record<string, unknown> {
  switch (stage) {
    case "source":
      return {
        dataset: LOCAL_SAMPLE_DATASET.entity,
        period: LOCAL_SAMPLE_DATASET.period,
        immutable: true,
        sourceDocuments: LOCAL_SAMPLE_DATASET.sourceDocuments,
        rowCount: LOCAL_SAMPLE_DATASET.rows.length,
      };
    case "logic":
      return {
        derivedFields: [
          "jurisdictionClassification",
          "provisionalTaxBase",
          "protectedInputFlag",
        ],
        provisionalTaxBase: LOCAL_SAMPLE_DATASET.rows.reduce(
          (total, row) => total + row.revenue - row.deductibleExpenses,
          0
        ),
        method: "local mock calculation",
      };
    case "review":
    case "validation":
      return {
        checksPassed: 5,
        checksWarned: 1,
        warnings: ["UK withholding reserve requires reviewer signoff"],
        trustworthy: true,
      };
    case "protected":
      return {
        governedFields: ["protectedInput", "reviewerNotes", "reserveMemo"],
        maskingApplied: true,
        retention: "local prototype only",
      };
    case "output":
      return {
        artifacts: ["review_packet.json", "taxprep_bridge.csv"],
        handoffReady: true,
        destination: "download/export only",
      };
    default:
      return {
        block: nodeLabel,
        status: "completed by local mock runner",
      };
  }
}

export function createLocalRunRecord(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LocalRunRecord {
  const startedAt = new Date();
  const completedAt = new Date(startedAt.getTime() + 640);
  const executionId = `local-run-${startedAt.getTime()}`;
  const orderedNodes = nodes.filter((node) => node.type !== "add");

  const logs = orderedNodes.map((node, index) => {
    const stage =
      (node.data.config?.fiscalStage as string | undefined) ||
      node.data.visualRole ||
      node.data.type;
    const stepStartedAt = new Date(startedAt.getTime() + index * 110);
    const stepCompletedAt = new Date(stepStartedAt.getTime() + 95);
    const nodeLabel = node.data.label || getFiscalStageLabel(stage);

    return {
      id: `${executionId}-${node.id}`,
      executionId,
      nodeId: node.id,
      nodeName: nodeLabel,
      nodeType: getFiscalStageLabel(stage),
      status: "success" as const,
      startedAt: stepStartedAt,
      completedAt: stepCompletedAt,
      duration: "95",
      input: {
        upstreamEdges: edges.filter((edge) => edge.target === node.id).length,
        stage,
      },
      output: getFiscalOutputForStage(stage, nodeLabel),
      error: null,
    };
  });

  return {
    execution: {
      id: executionId,
      workflowId: LOCAL_WORKFLOW_ID,
      status: "success",
      startedAt,
      completedAt,
      duration: String(completedAt.getTime() - startedAt.getTime()),
      error: null,
    },
    logs,
  };
}
