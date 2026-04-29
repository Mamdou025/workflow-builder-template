import type {
  WorkflowEdge as CanvasWorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
} from "./workflow-store";

export const LOCAL_WORKFLOW_ID = "local-fiscal-studio";
export const LOCAL_WORKFLOW_STORAGE_KEY = "workflow-studio.local-workflow";
export const LOCAL_RUNS_STORAGE_KEY = "workflow-studio.local-runs";
export const LOCAL_WORKFLOW_SCHEMA_VERSION = "workflow-studio.local.v1";

const SYSTEM_USER = "workflow-studio";
const SAMPLE_CREATED_AT = "2026-04-28T12:00:00.000Z";

export type WorkflowDefinitionStatus = "draft" | "published";

export type FiscalStage =
  | "source"
  | "logic"
  | "validation"
  | "protected"
  | "output"
  | "ai-agent";

export type BlockFamily =
  | "Source"
  | "Logic"
  | "Review / Validation"
  | "Protected"
  | "Output"
  | "AI / Agent";

export type BlockSubtype =
  | "Manual Entry"
  | "Excel / Workbook"
  | "PDF / Document"
  | "API / HTTP Request"
  | "Database Query"
  | "Web / URL"
  | "AI Search Result"
  | "Formula"
  | "Aggregation"
  | "Transformation"
  | "Condition"
  | "Script"
  | "Classification / Mapping"
  | "Required Input Check"
  | "Missing Source Check"
  | "Low Confidence Warning"
  | "Manual Override Review"
  | "Approval Gate"
  | "Output Readiness Check"
  | "Protected Input"
  | "Protected Result"
  | "Official Line"
  | "Locked Rate"
  | "Final Reviewed Amount"
  | "CSV Export"
  | "Excel Export"
  | "PDF Report"
  | "Evidence Pack"
  | "Canonical JSON"
  | "Taxprep Handoff"
  | "ONESOURCE Handoff"
  | "AI Search"
  | "AI Mapping Suggestion"
  | "AI Formula Proposal"
  | "AI Workflow Proposal";

export type BlockStatus =
  | "draft"
  | "configured"
  | "needs-review"
  | "approved"
  | "locked"
  | "running"
  | "success"
  | "error";

export type EdgeStatus = "active" | "proposed" | "rejected" | "disabled";

export type BlockRunStatus =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "error"
  | "skipped";

export type WorkflowRelationshipType =
  | "provides_data_to"
  | "extracted_into"
  | "referenced_by"
  | "transforms_into"
  | "aggregates_into"
  | "branches_to"
  | "depends_on"
  | "checked_by"
  | "requires_review_by"
  | "triggers_validation"
  | "approves_for"
  | "blocks_until_resolved"
  | "certifies"
  | "feeds_protected_input"
  | "feeds_protected_result"
  | "feeds_output_input"
  | "included_in_output_preview"
  | "maps_to_output_candidate"
  | "feeds_ai_context"
  | "provides_context_to_ai"
  | "requests_ai_review"
  | "supplies_candidate_data"
  | "maps_to_output"
  | "included_in_handoff"
  | "proposes"
  | "suggests_mapping"
  | "suggests_formula"
  | "suggests_workflow_change";

export type AiProposalStatus = "proposed" | "approved" | "rejected";

export type AiProposalHistoryEntry = {
  id: string;
  action: "created" | "revised" | "approved" | "rejected";
  by: string;
  at: string;
  notes?: string;
};

export type WorkflowPosition = {
  x: number;
  y: number;
};

export type WorkflowCodeField = {
  language: "typescript" | "javascript" | "json" | "sql" | "text";
  body: string;
  entrypoint?: string;
};

export type WorkflowFormulaField = {
  expression: string;
  outputKey: string;
  inputs: string[];
};

export type SourceMetadata = {
  sourceType: Extract<
    BlockSubtype,
    | "Manual Entry"
    | "Excel / Workbook"
    | "PDF / Document"
    | "API / HTTP Request"
    | "Database Query"
    | "Web / URL"
    | "AI Search Result"
  >;
  locator: string;
  valuePreview?: string;
  immutable: true;
  treatedAsEvidence: boolean;
  labelLocked: boolean;
  locatorLocked: boolean;
  valuesLocked: boolean;
};

export type GovernanceMetadata = {
  protected: boolean;
  protectedKind?:
    | "input"
    | "result"
    | "official-line"
    | "locked-rate"
    | "final-reviewed-amount"
    | "summary-result";
  steward: string;
  lockedInRuntime: boolean;
  requiresUnlockToEdit: boolean;
  editIntent?: string;
  approvalState: "draft" | "review-required" | "approved";
};

export type RuntimeVisibility = {
  visible: boolean;
  editableInRuntime: boolean;
  generatedUiLocked: boolean;
  masked: boolean;
  showInRuns: boolean;
  outputKey?: string;
};

export type WorkflowBlock = {
  id: string;
  family: BlockFamily;
  subtype: BlockSubtype;
  label: string;
  description: string;
  status: BlockStatus;
  position: WorkflowPosition;
  config: Record<string, unknown>;
  code?: WorkflowCodeField;
  formula?: WorkflowFormulaField;
  source?: SourceMetadata;
  governance?: GovernanceMetadata;
  runtime: RuntimeVisibility;
  catalogId?: string;
  sample?: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
};

export type WorkflowEdgeHistoryEntry = {
  id: string;
  action:
    | "created"
    | "updated"
    | "approved"
    | "rejected"
    | "disabled"
    | "migrated"
    | "split";
  by: string;
  at: string;
  notes?: string;
};

export type WorkflowEdge = {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  relationshipType: WorkflowRelationshipType;
  reason: string;
  status: EdgeStatus;
  createdBy: string;
  createdAt: string;
  confidence: number;
  notes: string;
  history: WorkflowEdgeHistoryEntry[];
};

export type BlockRun = {
  id: string;
  blockId: string;
  blockLabel: string;
  status: BlockRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  input?: unknown;
  output?: unknown;
  error?: { message: string };
};

export type WorkflowStructure = {
  layout: "canvas-columns";
  entryBlockId?: string;
  blockOrder: string[];
  columns: Array<{
    id: string;
    family: BlockFamily;
    label: string;
    blockIds: string[];
  }>;
};

export type RuntimeUiRow = {
  id: string;
  blockId: string;
  label: string;
  family: BlockFamily;
  subtype: BlockSubtype;
  visible: boolean;
  readOnly: boolean;
  locked: boolean;
  reviewerOnly: boolean;
  advancedOnly: boolean;
  sourceReadOnly: boolean;
  protectedLocked: boolean;
  outputKey?: string;
  allowedActions: string[];
};

export type RuntimeUiSection = {
  id: string;
  label: string;
  family: BlockFamily;
  rows: RuntimeUiRow[];
};

export type RuntimeUiConfig = {
  runtimeConfigId: string;
  sourceWorkflowId: string;
  sourceSnapshotId?: string;
  generatedAt: string;
  sections: RuntimeUiSection[];
  visibleRows: string[];
  hiddenRows: string[];
  reviewerOnlyRows: string[];
  advancedRows: string[];
  allowedActions: string[];
};

export type OutputMappingPreviewItem = {
  outputBlockId: string;
  outputLabel: string;
  outputSubtype: BlockSubtype;
  readinessStatus: "ready" | "missing" | "warning";
  mappedProtectedValues: Array<{
    edgeId: string;
    protectedBlockId: string;
    protectedLabel: string;
    relationshipType: Extract<
      WorkflowRelationshipType,
      "included_in_handoff" | "maps_to_output"
    >;
  }>;
  candidateLogicMappings: Array<{
    edgeId: string;
    logicBlockId: string;
    logicLabel: string;
    relationshipType: Extract<
      WorkflowRelationshipType,
      | "feeds_output_input"
      | "included_in_output_preview"
      | "maps_to_output_candidate"
    >;
  }>;
  governanceWarnings: string[];
  ignoredRelationshipCount: number;
  missingRequirements: string[];
  includedSourceTraceSetting: string;
  mockPayloadPreview: Record<string, unknown>;
};

export type OutputMappingPreview = {
  id: string;
  sourceWorkflowId: string;
  sourceSnapshotId?: string;
  generatedAt: string;
  outputs: OutputMappingPreviewItem[];
};

export type WorkflowVersionSnapshot = {
  id: string;
  schemaVersion: typeof LOCAL_WORKFLOW_SCHEMA_VERSION;
  workflowId: string;
  workflowName: string;
  versionNumber: number;
  label: string;
  status: WorkflowDefinitionStatus;
  createdBy: string;
  createdAt: string;
  changeSummary: string;
  blockCount: number;
  edgeCount: number;
  blockIds: string[];
  edgeIds: string[];
  blocks: WorkflowBlock[];
  edges: WorkflowEdge[];
  structure: WorkflowStructure;
  runtimeUiConfig: RuntimeUiConfig;
  outputMappingPreview: OutputMappingPreview;
  aiProposals: AiProposal[];
  mockRuns: BlockRun[];
  notes?: string;
  validationWarnings: string[];
};

export type AiProposal = {
  id: string;
  title?: string;
  originalPrompt: string;
  interpretedPlan: string;
  selectedTools: string[];
  generatedBlocks: WorkflowBlock[];
  generatedEdges: WorkflowEdge[];
  generatedCodeOrFormulas: Array<{
    blockId: string;
    kind: "code" | "formula";
    value: string;
  }>;
  status: AiProposalStatus;
  approvalResult?: {
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  rejectionResult?: {
    rejectedBy: string;
    rejectedAt: string;
    reason: string;
  };
  createdAt: string;
  createdBy?: string;
  relatedSelectedBlockId?: string;
  relatedSelectedEdgeId?: string;
  confidence?: number;
  notes?: string;
  history?: AiProposalHistoryEntry[];
};

export type WorkflowDefinition = {
  schemaVersion: typeof LOCAL_WORKFLOW_SCHEMA_VERSION;
  id: string;
  name: string;
  description: string;
  status: WorkflowDefinitionStatus;
  metadata: {
    kind: "generic-fiscal-workflow";
    sampleWorkflow?: {
      id: string;
      label: string;
      description: string;
    };
    tags: string[];
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
    notes?: string;
  };
  blocks: WorkflowBlock[];
  edges: WorkflowEdge[];
  structure: WorkflowStructure;
  runtimeUiConfig: RuntimeUiConfig;
  outputMappingPreview: OutputMappingPreview;
  mockRuns: BlockRun[];
  versionSnapshots: WorkflowVersionSnapshot[];
  latestPublishedVersionId?: string;
  publishedVersion?: {
    id: string;
    versionNumber: number;
    createdAt: string;
  };
  aiProposals: AiProposal[];
  events: WorkflowEvent[];
};

export type WorkflowDraft = {
  id: string;
  definition: WorkflowDefinition;
  dirty: boolean;
  selectedBlockId: string | null;
  lastSavedAt: string | null;
};

export type PendingWorkflowConnection = {
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  createdAt: string;
};

export type WorkflowEventType =
  | "ai_proposal_approved"
  | "ai_proposal_created"
  | "ai_proposal_rejected"
  | "export_workflow"
  | "import_workflow"
  | "migration"
  | "publish_snapshot"
  | "reset_sample"
  | "save_draft"
  | "validation_warning";

export type WorkflowEvent = {
  id: string;
  type: WorkflowEventType;
  message: string;
  createdAt: string;
  createdBy: string;
  details?: Record<string, unknown>;
};

export type LocalWorkflowSnapshot = WorkflowDefinition;

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

export const WORKFLOW_RELATIONSHIP_TYPES = [
  "provides_data_to",
  "extracted_into",
  "referenced_by",
  "transforms_into",
  "aggregates_into",
  "branches_to",
  "depends_on",
  "checked_by",
  "requires_review_by",
  "triggers_validation",
  "approves_for",
  "blocks_until_resolved",
  "certifies",
  "feeds_protected_input",
  "feeds_protected_result",
  "feeds_output_input",
  "included_in_output_preview",
  "maps_to_output_candidate",
  "feeds_ai_context",
  "provides_context_to_ai",
  "requests_ai_review",
  "supplies_candidate_data",
  "maps_to_output",
  "included_in_handoff",
  "proposes",
  "suggests_mapping",
  "suggests_formula",
  "suggests_workflow_change",
] as const satisfies readonly WorkflowRelationshipType[];

export const GOVERNED_OUTPUT_RELATIONSHIP_TYPES = [
  "maps_to_output",
  "included_in_handoff",
] as const satisfies readonly WorkflowRelationshipType[];

export const CANDIDATE_OUTPUT_RELATIONSHIP_TYPES = [
  "feeds_output_input",
  "included_in_output_preview",
  "maps_to_output_candidate",
] as const satisfies readonly WorkflowRelationshipType[];

export const OUTPUT_MAPPING_RELATIONSHIP_TYPES = [
  ...GOVERNED_OUTPUT_RELATIONSHIP_TYPES,
  ...CANDIDATE_OUTPUT_RELATIONSHIP_TYPES,
] as const satisfies readonly WorkflowRelationshipType[];

export const LOGIC_OUTPUT_GOVERNANCE_WARNING =
  "Final governed handoffs should usually map from Protected values. This Logic mapping is treated as a draft/candidate mapping.";

const AI_PROPOSAL_RELATIONSHIP_TYPES = [
  "proposes",
  "suggests_mapping",
  "suggests_formula",
  "suggests_workflow_change",
] as const satisfies readonly WorkflowRelationshipType[];

const AI_CONTEXT_RELATIONSHIP_TYPES = [
  "feeds_ai_context",
  "provides_context_to_ai",
  "requests_ai_review",
  "supplies_candidate_data",
] as const satisfies readonly WorkflowRelationshipType[];

const RELATIONSHIP_TYPES_BY_FAMILY_PAIR: Partial<
  Record<
    BlockFamily,
    Partial<Record<BlockFamily, readonly WorkflowRelationshipType[]>>
  >
> = {
  Logic: {
    "AI / Agent": AI_CONTEXT_RELATIONSHIP_TYPES,
    Logic: ["transforms_into", "aggregates_into", "branches_to", "depends_on"],
    Output: CANDIDATE_OUTPUT_RELATIONSHIP_TYPES,
    Protected: ["feeds_protected_input", "feeds_protected_result"],
    "Review / Validation": [
      "checked_by",
      "requires_review_by",
      "triggers_validation",
    ],
  },
  Output: {
    "AI / Agent": AI_CONTEXT_RELATIONSHIP_TYPES,
  },
  Protected: {
    "AI / Agent": AI_CONTEXT_RELATIONSHIP_TYPES,
    Output: GOVERNED_OUTPUT_RELATIONSHIP_TYPES,
  },
  "Review / Validation": {
    "AI / Agent": AI_CONTEXT_RELATIONSHIP_TYPES,
    Protected: ["approves_for", "blocks_until_resolved", "certifies"],
  },
  Source: {
    "AI / Agent": AI_CONTEXT_RELATIONSHIP_TYPES,
    Logic: ["provides_data_to", "extracted_into", "referenced_by"],
  },
};

export const EDGE_STATUS_VALUES = [
  "active",
  "proposed",
  "disabled",
  "rejected",
] as const satisfies readonly EdgeStatus[];

const AI_PROPOSAL_STATUS_VALUES = [
  "proposed",
  "approved",
  "rejected",
] as const satisfies readonly AiProposalStatus[];

const WORKFLOW_EVENT_TYPES = [
  "ai_proposal_approved",
  "ai_proposal_created",
  "ai_proposal_rejected",
  "export_workflow",
  "import_workflow",
  "migration",
  "publish_snapshot",
  "reset_sample",
  "save_draft",
  "validation_warning",
] as const satisfies readonly WorkflowEventType[];

export const WORKFLOW_RELATIONSHIP_LABELS: Record<
  WorkflowRelationshipType,
  string
> = {
  aggregates_into: "Aggregates into",
  approves_for: "Approves for",
  blocks_until_resolved: "Blocks until resolved",
  branches_to: "Branches to",
  certifies: "Certifies",
  checked_by: "Checked by",
  depends_on: "Depends on",
  extracted_into: "Extracted into",
  feeds_ai_context: "Feeds AI context",
  feeds_output_input: "Feeds output input",
  feeds_protected_input: "Feeds protected input",
  feeds_protected_result: "Feeds protected result",
  included_in_output_preview: "Included in output preview",
  included_in_handoff: "Included in handoff",
  maps_to_output: "Maps to output",
  maps_to_output_candidate: "Maps to output candidate",
  proposes: "Proposes",
  provides_context_to_ai: "Provides context to AI",
  provides_data_to: "Provides data to",
  referenced_by: "Referenced by",
  requires_review_by: "Requires review by",
  requests_ai_review: "Requests AI review",
  suggests_formula: "Suggests formula",
  suggests_mapping: "Suggests mapping",
  suggests_workflow_change: "Suggests workflow change",
  supplies_candidate_data: "Supplies candidate data",
  transforms_into: "Transforms into",
  triggers_validation: "Triggers validation",
};

export function isGovernedOutputRelationshipType(
  relationshipType: WorkflowRelationshipType
): relationshipType is (typeof GOVERNED_OUTPUT_RELATIONSHIP_TYPES)[number] {
  return (
    GOVERNED_OUTPUT_RELATIONSHIP_TYPES as readonly WorkflowRelationshipType[]
  ).includes(relationshipType);
}

export function isCandidateOutputRelationshipType(
  relationshipType: WorkflowRelationshipType
): relationshipType is (typeof CANDIDATE_OUTPUT_RELATIONSHIP_TYPES)[number] {
  return (
    CANDIDATE_OUTPUT_RELATIONSHIP_TYPES as readonly WorkflowRelationshipType[]
  ).includes(relationshipType);
}

export function isOutputMappingRelationshipType(
  relationshipType: WorkflowRelationshipType
): relationshipType is (typeof OUTPUT_MAPPING_RELATIONSHIP_TYPES)[number] {
  return (
    OUTPUT_MAPPING_RELATIONSHIP_TYPES as readonly WorkflowRelationshipType[]
  ).includes(relationshipType);
}

export type BlockCatalogItem = {
  id: string;
  family: BlockFamily;
  subtype: BlockSubtype;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
};

export const BLOCK_FAMILY_STAGE: Record<BlockFamily, FiscalStage> = {
  Source: "source",
  Logic: "logic",
  "Review / Validation": "validation",
  Protected: "protected",
  Output: "output",
  "AI / Agent": "ai-agent",
};

export const FISCAL_STAGE_OPTIONS: Array<{
  id: string;
  stage: FiscalStage;
  family: BlockFamily;
  label: string;
  description: string;
}> = [
  {
    id: "preset:source",
    stage: "source",
    family: "Source",
    label: "Source",
    description: "Immutable truth or reference data",
  },
  {
    id: "preset:logic",
    stage: "logic",
    family: "Logic",
    label: "Logic",
    description: "Transform, calculate, classify, or derive values",
  },
  {
    id: "preset:review-validation",
    stage: "validation",
    family: "Review / Validation",
    label: "Review / Validation",
    description: "Check whether the workflow is trustworthy",
  },
  {
    id: "preset:protected",
    stage: "protected",
    family: "Protected",
    label: "Protected",
    description: "Governed inputs, official lines, and protected results",
  },
  {
    id: "preset:output",
    stage: "output",
    family: "Output",
    label: "Output",
    description: "Generate handoff or export artifacts",
  },
  {
    id: "preset:ai-agent",
    stage: "ai-agent",
    family: "AI / Agent",
    label: "AI / Agent",
    description: "Propose searches, mappings, formulas, or workflow changes",
  },
];

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  {
    id: "source:manual-entry",
    family: "Source",
    subtype: "Manual Entry",
    label: "Manual Entry",
    description: "Evidence value entered by a builder or reviewer",
    defaultConfig: {
      owner: "Builder",
      inputs: "manual value",
      outputs: "manualEntry",
      rulebookRef: "Manual source values are locked as evidence.",
      sourceLocator: "manual-entry",
    },
  },
  {
    id: "source:excel-workbook",
    family: "Source",
    subtype: "Excel / Workbook",
    label: "Excel / Workbook",
    description: "Workbook, worksheet, named range, or tabular evidence",
    defaultConfig: {
      owner: "Tax Operations",
      inputs: "workbook",
      outputs: "workbookRows",
      rulebookRef: "Workbook rows are immutable source evidence.",
      sourceLocator: "workbook://sheet/range",
    },
  },
  {
    id: "source:pdf-document",
    family: "Source",
    subtype: "PDF / Document",
    label: "PDF / Document",
    description: "Document, statement, note, schedule, or support package",
    defaultConfig: {
      owner: "Tax Operations",
      inputs: "document",
      outputs: "documentEvidence",
      rulebookRef: "Document facts are referenced, not overwritten.",
      sourceLocator: "document://page/section",
    },
  },
  {
    id: "source:api-http-request",
    family: "Source",
    subtype: "API / HTTP Request",
    label: "API / HTTP Request",
    description: "Reference value fetched from an external API",
    defaultConfig: {
      owner: "Tax Operations",
      inputs: "request",
      outputs: "apiReference",
      rulebookRef: "API responses are stored as reference evidence.",
      sourceLocator: "https://api.example.test/reference",
    },
  },
  {
    id: "source:database-query",
    family: "Source",
    subtype: "Database Query",
    label: "Database Query",
    description: "Read-only query result used as workflow evidence",
    defaultConfig: {
      owner: "Data Operations",
      inputs: "read-only query",
      outputs: "queryRows",
      rulebookRef: "Database source rows are immutable in the builder.",
      sourceLocator: "database://connection/query",
    },
  },
  {
    id: "source:web-url",
    family: "Source",
    subtype: "Web / URL",
    label: "Web / URL",
    description: "Reference page or URL captured as evidence",
    defaultConfig: {
      owner: "Research",
      inputs: "url",
      outputs: "webReference",
      rulebookRef: "Web references are captured as source evidence.",
      sourceLocator: "https://example.test/source",
    },
  },
  {
    id: "source:ai-search-result",
    family: "Source",
    subtype: "AI Search Result",
    label: "AI Search Result",
    description: "Search result proposed by an AI or agent, then reviewed",
    defaultConfig: {
      owner: "Review",
      inputs: "reviewed search result",
      outputs: "aiSearchEvidence",
      rulebookRef: "AI search results require downstream review.",
      sourceLocator: "proposal://ai-search-result",
    },
  },
  {
    id: "logic:formula",
    family: "Logic",
    subtype: "Formula",
    label: "Formula",
    description: "Calculate a derived amount from upstream values",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "upstream values",
      outputs: "formulaResult",
      rulebookRef: "Formula blocks derive values without changing sources.",
    },
  },
  {
    id: "logic:aggregation",
    family: "Logic",
    subtype: "Aggregation",
    label: "Aggregation",
    description: "Group, sum, count, or roll up upstream records",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "classified rows",
      outputs: "aggregateResult",
      rulebookRef: "Aggregation blocks roll up source-derived rows.",
    },
  },
  {
    id: "logic:transformation",
    family: "Logic",
    subtype: "Transformation",
    label: "Transformation",
    description: "Normalize values, units, currency, dates, or formats",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "source values",
      outputs: "normalizedValues",
      rulebookRef: "Transformations create downstream corrected values.",
    },
  },
  {
    id: "logic:condition",
    family: "Logic",
    subtype: "Condition",
    label: "Condition",
    description: "Route workflow paths based on local rules",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "validation state",
      outputs: "routingDecision",
      rulebookRef: "Conditions route review paths and do not mutate evidence.",
    },
  },
  {
    id: "logic:script",
    family: "Logic",
    subtype: "Script",
    label: "Script",
    description: "Local typed script placeholder for custom logic",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "upstream context",
      outputs: "scriptResult",
      rulebookRef: "Scripts are local placeholders in v1.",
    },
  },
  {
    id: "logic:classification-mapping",
    family: "Logic",
    subtype: "Classification / Mapping",
    label: "Classification / Mapping",
    description: "Classify rows or map source values to canonical fields",
    defaultConfig: {
      owner: "Fiscal Systems",
      inputs: "source rows",
      outputs: "mappedRows",
      rulebookRef: "Mappings are downstream annotations, not source edits.",
    },
  },
  {
    id: "review:required-input-check",
    family: "Review / Validation",
    subtype: "Required Input Check",
    label: "Required Input Check",
    description: "Confirm a required input is present",
    defaultConfig: {
      owner: "Tax Review",
      inputs: "required field",
      outputs: "requiredInputFinding",
      rulebookRef: "Required inputs must exist before handoff.",
    },
  },
  {
    id: "review:missing-source-check",
    family: "Review / Validation",
    subtype: "Missing Source Check",
    label: "Missing Source Check",
    description: "Flag values that do not have source support",
    defaultConfig: {
      owner: "Tax Review",
      inputs: "protected values",
      outputs: "sourceSupportFinding",
      rulebookRef: "Protected values must reference support.",
    },
  },
  {
    id: "review:low-confidence-warning",
    family: "Review / Validation",
    subtype: "Low Confidence Warning",
    label: "Low Confidence Warning",
    description: "Surface low-confidence classifications or mappings",
    defaultConfig: {
      owner: "Tax Review",
      inputs: "confidence scores",
      outputs: "confidenceWarning",
      rulebookRef: "Low-confidence items require review.",
    },
  },
  {
    id: "review:manual-override-review",
    family: "Review / Validation",
    subtype: "Manual Override Review",
    label: "Manual Override Review",
    description: "Review downstream corrections or overrides",
    defaultConfig: {
      owner: "Tax Review",
      inputs: "override candidates",
      outputs: "overrideDecision",
      rulebookRef: "Overrides are reviewed downstream from sources.",
    },
  },
  {
    id: "review:approval-gate",
    family: "Review / Validation",
    subtype: "Approval Gate",
    label: "Approval Gate",
    description: "Hold workflow progression until approval",
    defaultConfig: {
      owner: "Approver",
      inputs: "review findings",
      outputs: "approvalState",
      rulebookRef: "Approval is required before protected output handoff.",
    },
  },
  {
    id: "review:output-readiness-check",
    family: "Review / Validation",
    subtype: "Output Readiness Check",
    label: "Output Readiness Check",
    description: "Confirm all output dependencies are ready",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "outputReadiness",
      rulebookRef: "Outputs require approved dependencies.",
    },
  },
  {
    id: "protected:protected-input",
    family: "Protected",
    subtype: "Protected Input",
    label: "Protected Input",
    description: "Governed input editable in drafts and locked at runtime",
    defaultConfig: {
      owner: "Data Steward",
      inputs: "approved source or override",
      outputs: "protectedInput",
      rulebookRef: "Protected inputs require explicit edit intent.",
    },
  },
  {
    id: "protected:protected-result",
    family: "Protected",
    subtype: "Protected Result",
    label: "Protected Result",
    description: "Governed calculated result locked in generated runtime UI",
    defaultConfig: {
      owner: "Data Steward",
      inputs: "approved logic",
      outputs: "protectedResult",
      rulebookRef: "Protected results are locked at runtime.",
    },
  },
  {
    id: "protected:official-line",
    family: "Protected",
    subtype: "Official Line",
    label: "Official Line",
    description: "Official line value for review or handoff",
    defaultConfig: {
      owner: "Data Steward",
      inputs: "approved result",
      outputs: "officialLine",
      rulebookRef: "Official lines are governed protected values.",
    },
  },
  {
    id: "protected:locked-rate",
    family: "Protected",
    subtype: "Locked Rate",
    label: "Locked Rate",
    description: "Rate or factor frozen for review and runtime output",
    defaultConfig: {
      owner: "Data Steward",
      inputs: "approved rate source",
      outputs: "lockedRate",
      rulebookRef: "Locked rates require explicit edit intent.",
    },
  },
  {
    id: "protected:final-reviewed-amount",
    family: "Protected",
    subtype: "Final Reviewed Amount",
    label: "Final Reviewed Amount",
    description: "Final reviewed summary amount",
    defaultConfig: {
      owner: "Data Steward",
      inputs: "approved results",
      outputs: "finalReviewedAmount",
      rulebookRef: "Final amounts are locked in runtime UI.",
    },
  },
  {
    id: "output:csv-export",
    family: "Output",
    subtype: "CSV Export",
    label: "CSV Export",
    description: "Delimited export for downstream review",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "csvExport",
      rulebookRef: "CSV output is generated from approved data.",
    },
  },
  {
    id: "output:excel-export",
    family: "Output",
    subtype: "Excel Export",
    label: "Excel Export",
    description: "Workbook output for review or handoff",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "excelExport",
      rulebookRef: "Excel output is generated from approved data.",
    },
  },
  {
    id: "output:pdf-report",
    family: "Output",
    subtype: "PDF Report",
    label: "PDF Report",
    description: "Review-ready PDF package",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "pdfReport",
      rulebookRef: "PDF reports are generated from approved values.",
    },
  },
  {
    id: "output:evidence-pack",
    family: "Output",
    subtype: "Evidence Pack",
    label: "Evidence Pack",
    description: "Source references, validations, and approvals bundle",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "sources and approvals",
      outputs: "evidencePack",
      rulebookRef: "Evidence packs preserve source support.",
    },
  },
  {
    id: "output:canonical-json",
    family: "Output",
    subtype: "Canonical JSON",
    label: "Canonical JSON",
    description: "Canonical machine-readable workflow output",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved graph state",
      outputs: "canonicalJson",
      rulebookRef: "Canonical JSON is a local v1 export artifact.",
    },
  },
  {
    id: "output:taxprep-handoff",
    family: "Output",
    subtype: "Taxprep Handoff",
    label: "Taxprep Handoff",
    description: "Placeholder handoff artifact for Taxprep",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "taxprepHandoff",
      rulebookRef: "V1 exports a placeholder, not a live integration.",
    },
  },
  {
    id: "output:onesource-handoff",
    family: "Output",
    subtype: "ONESOURCE Handoff",
    label: "ONESOURCE Handoff",
    description: "Placeholder handoff artifact for ONESOURCE",
    defaultConfig: {
      owner: "Tax Delivery",
      inputs: "approved values",
      outputs: "onesourceHandoff",
      rulebookRef: "V1 exports a placeholder, not a live integration.",
    },
  },
  {
    id: "ai:ai-search",
    family: "AI / Agent",
    subtype: "AI Search",
    label: "AI Search",
    description: "Proposal-only AI search block",
    defaultConfig: {
      owner: "Builder",
      inputs: "search prompt",
      outputs: "aiSearchProposal",
      rulebookRef: "AI proposals require approval before changing workflow.",
    },
  },
  {
    id: "ai:ai-mapping-suggestion",
    family: "AI / Agent",
    subtype: "AI Mapping Suggestion",
    label: "AI Mapping Suggestion",
    description: "Proposal-only mapping suggestion",
    defaultConfig: {
      owner: "Builder",
      inputs: "source rows",
      outputs: "aiMappingProposal",
      rulebookRef: "AI mapping suggestions do not mutate the workflow.",
    },
  },
  {
    id: "ai:ai-formula-proposal",
    family: "AI / Agent",
    subtype: "AI Formula Proposal",
    label: "AI Formula Proposal",
    description: "Proposal-only formula candidate",
    defaultConfig: {
      owner: "Builder",
      inputs: "calculation prompt",
      outputs: "aiFormulaProposal",
      rulebookRef: "AI formula proposals require approval.",
    },
  },
  {
    id: "ai:ai-workflow-proposal",
    family: "AI / Agent",
    subtype: "AI Workflow Proposal",
    label: "AI Workflow Proposal",
    description: "Proposal-only workflow change package",
    defaultConfig: {
      owner: "Builder",
      inputs: "workflow prompt",
      outputs: "aiWorkflowProposal",
      rulebookRef: "AI workflow proposals stay separate until approved.",
    },
  },
];

export const LOCAL_SAMPLE_DATASET = {
  period: "FY2025 Q4",
  entity: "FAPI Sample Entity",
  sourceDocuments: [
    "trial-balance.xlsx",
    "financial-statements.pdf",
    "notes-to-financial-statements.pdf",
    "fx-rate-source.json",
    "review-overrides.json",
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
    label: "Source: Reference Evidence",
    description: "Immutable reference set for a fiscal workflow",
    visualLevel: "L3",
    visualRole: "source",
    config: {
      fiscalStage: "source",
      blockFamily: "Source",
      blockSubtype: "Excel / Workbook",
      catalogId: "source:excel-workbook",
      owner: "Tax Operations",
      rulebookRef: "Source records are read-only reference truth.",
      inputs: "source package",
      outputs: "sourceEvidence",
    },
  },
  "preset:logic": {
    label: "Logic: Transform Values",
    description: "Classify, transform, calculate, or derive values",
    visualLevel: "L2",
    visualRole: "logic",
    config: {
      fiscalStage: "logic",
      blockFamily: "Logic",
      blockSubtype: "Transformation",
      catalogId: "logic:transformation",
      owner: "Fiscal Systems",
      rulebookRef: "Logic transforms and derives values from source records.",
      inputs: "sourceEvidence",
      outputs: "derivedValues",
    },
  },
  "preset:review-validation": {
    label: "Review / Validation: Trust Checks",
    description: "Check completeness, thresholds, and review evidence",
    visualLevel: "L2",
    visualRole: "validation",
    config: {
      fiscalStage: "validation",
      blockFamily: "Review / Validation",
      blockSubtype: "Output Readiness Check",
      catalogId: "review:output-readiness-check",
      owner: "Tax Review",
      rulebookRef: "Validation gates decide whether results are trustworthy.",
      inputs: "derivedValues",
      outputs: "reviewFindings",
    },
  },
  "preset:protected": {
    label: "Protected: Governed Value",
    description: "Hold governed inputs, official lines, or result sets",
    visualLevel: "L2",
    visualRole: "protected",
    config: {
      fiscalStage: "protected",
      blockFamily: "Protected",
      blockSubtype: "Protected Result",
      catalogId: "protected:protected-result",
      owner: "Data Steward",
      rulebookRef: "Protected blocks contain governed inputs or results.",
      inputs: "reviewFindings",
      outputs: "protectedValue",
    },
  },
  "preset:output": {
    label: "Output: Review Artifact",
    description: "Create handoff artifacts for downstream teams",
    visualLevel: "L2",
    visualRole: "output",
    config: {
      fiscalStage: "output",
      blockFamily: "Output",
      blockSubtype: "Evidence Pack",
      catalogId: "output:evidence-pack",
      owner: "Tax Delivery",
      rulebookRef: "Outputs generate handoff or export artifacts.",
      inputs: "approvedProtectedPacket",
      outputs: "reviewPacket",
    },
  },
};

const BLOCK_SUBTYPE_SET = new Set<BlockSubtype>(
  BLOCK_CATALOG.map((item) => item.subtype)
);

export function isLocalWorkflowId(workflowId?: string | null): boolean {
  return workflowId === LOCAL_WORKFLOW_ID;
}

export function getFiscalPreset(
  presetId: string
): FiscalVisualPreset | undefined {
  return FISCAL_PRESETS[presetId];
}

export function getBlockCatalogItem(
  catalogId: string
): BlockCatalogItem | undefined {
  return BLOCK_CATALOG.find((item) => item.id === catalogId);
}

export function getBlockCatalogItemBySubtype(
  subtype: string | undefined
): BlockCatalogItem | undefined {
  if (!subtype) {
    return;
  }
  return BLOCK_CATALOG.find((item) => item.subtype === subtype);
}

export function getFiscalVisualForFamily(family: BlockFamily): {
  visualLevel: "L1" | "L2" | "L3";
  visualRole:
    | "source"
    | "logic"
    | "review"
    | "validation"
    | "protected"
    | "output";
} {
  if (family === "Source") {
    return { visualLevel: "L3", visualRole: "source" };
  }
  if (family === "Review / Validation") {
    return { visualLevel: "L2", visualRole: "validation" };
  }
  if (family === "Protected") {
    return { visualLevel: "L2", visualRole: "protected" };
  }
  if (family === "Output") {
    return { visualLevel: "L2", visualRole: "output" };
  }
  return { visualLevel: "L2", visualRole: "logic" };
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
  const option = FISCAL_STAGE_OPTIONS.find((item) => item.stage === stage);
  return getFiscalVisualForFamily(option?.family || "Logic");
}

export function getFiscalStageLabel(stage: string | undefined): string {
  if (stage === "review") {
    return "Review / Validation";
  }
  const option = FISCAL_STAGE_OPTIONS.find((item) => item.stage === stage);
  return option?.label || "Fiscal Block";
}

export function getFamilyForStage(stage: string | undefined): BlockFamily {
  const option = FISCAL_STAGE_OPTIONS.find((item) => item.stage === stage);
  return option?.family || "Logic";
}

function isBlockSubtype(value: string | undefined): value is BlockSubtype {
  return Boolean(value && BLOCK_SUBTYPE_SET.has(value as BlockSubtype));
}

function getSubtypeFromValue(
  value: string | undefined,
  fallback: BlockSubtype
): BlockSubtype {
  return isBlockSubtype(value) ? value : fallback;
}

function getDefaultCatalogItemForFamily(family: BlockFamily): BlockCatalogItem {
  return (
    BLOCK_CATALOG.find((item) => item.family === family) || BLOCK_CATALOG[0]
  );
}

function getProtectedKind(
  subtype: BlockSubtype
): NonNullable<GovernanceMetadata["protectedKind"]> {
  if (subtype === "Protected Input") {
    return "input";
  }
  if (subtype === "Official Line") {
    return "official-line";
  }
  if (subtype === "Locked Rate") {
    return "locked-rate";
  }
  if (subtype === "Final Reviewed Amount") {
    return "final-reviewed-amount";
  }
  return "result";
}

function getRuntimeDefaults(
  family: BlockFamily,
  outputKey: string
): RuntimeVisibility {
  return {
    visible: true,
    editableInRuntime: false,
    generatedUiLocked: family === "Protected" || family === "Source",
    masked: family === "Protected",
    showInRuns: true,
    outputKey,
  };
}

function getSourceMetadata(
  item: BlockCatalogItem,
  config: Record<string, unknown>
): SourceMetadata | undefined {
  if (item.family !== "Source") {
    return;
  }

  return {
    sourceType: item.subtype as SourceMetadata["sourceType"],
    locator: String(config.sourceLocator || item.defaultConfig.sourceLocator),
    valuePreview:
      typeof config.valuePreview === "string" ? config.valuePreview : undefined,
    immutable: true,
    treatedAsEvidence: true,
    labelLocked: true,
    locatorLocked: true,
    valuesLocked: true,
  };
}

function getGovernanceMetadata(
  item: BlockCatalogItem,
  config: Record<string, unknown>
): GovernanceMetadata | undefined {
  if (item.family !== "Protected") {
    return;
  }

  return {
    protected: true,
    protectedKind: getProtectedKind(item.subtype),
    steward: String(config.owner || "Data Steward"),
    lockedInRuntime: true,
    requiresUnlockToEdit: true,
    editIntent:
      typeof config.protectedEditIntent === "string"
        ? config.protectedEditIntent
        : undefined,
    approvalState: "review-required",
  };
}

function getFormulaForSubtype(
  subtype: BlockSubtype,
  config: Record<string, unknown>
): WorkflowFormulaField | undefined {
  if (subtype !== "Formula") {
    return;
  }

  return {
    expression: String(config.formula || "upstreamValue"),
    outputKey: String(config.outputs || "formulaResult"),
    inputs: String(config.inputs || "upstreamValue")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function getCodeForSubtype(
  subtype: BlockSubtype,
  config: Record<string, unknown>
): WorkflowCodeField | undefined {
  if (subtype !== "Script" && subtype !== "Condition") {
    return;
  }

  return {
    language: "typescript",
    body: String(
      config.code ||
        (subtype === "Condition"
          ? "return Boolean(input.ready);"
          : "return input;")
    ),
    entrypoint: subtype === "Condition" ? "evaluateCondition" : "runScript",
  };
}

export function createWorkflowBlockFromCatalog(
  catalogId: string,
  options: {
    id?: string;
    label?: string;
    description?: string;
    position?: WorkflowPosition;
    config?: Record<string, unknown>;
    status?: BlockStatus;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    sample?: boolean;
  } = {}
): WorkflowBlock {
  const item =
    getBlockCatalogItem(catalogId) || getDefaultCatalogItemForFamily("Logic");
  const stage = BLOCK_FAMILY_STAGE[item.family];
  const config: Record<string, unknown> = {
    ...item.defaultConfig,
    ...options.config,
    fiscalStage: stage,
    blockFamily: item.family,
    blockSubtype: item.subtype,
    catalogId: item.id,
  };
  const outputKey = String(config.outputs || item.defaultConfig.outputs);

  return {
    id: options.id || item.id.replace(":", "-"),
    family: item.family,
    subtype: item.subtype,
    label: options.label || item.label,
    description: options.description || item.description,
    status: options.status || "configured",
    position: options.position || { x: 0, y: 0 },
    config,
    code: getCodeForSubtype(item.subtype, config),
    formula: getFormulaForSubtype(item.subtype, config),
    source: getSourceMetadata(item, config),
    governance: getGovernanceMetadata(item, config),
    runtime: getRuntimeDefaults(item.family, outputKey),
    catalogId: item.id,
    sample: options.sample,
    createdBy: options.createdBy || SYSTEM_USER,
    createdAt: options.createdAt || new Date().toISOString(),
    updatedBy: options.updatedBy || options.createdBy || SYSTEM_USER,
    updatedAt: options.updatedAt || new Date().toISOString(),
  };
}

export function createWorkflowNodeFromBlock(
  block: WorkflowBlock,
  options: { selected?: boolean; type?: WorkflowNodeType } = {}
): WorkflowNode {
  const visual = getFiscalVisualForFamily(block.family);
  const nodeType =
    options.type ||
    ((block.config.canvasNodeType as WorkflowNodeType | undefined) ?? "action");

  return {
    id: block.id,
    type: nodeType,
    position: block.position,
    selected: options.selected,
    data: {
      label: block.label,
      description: block.description,
      type: nodeType,
      visualLevel: visual.visualLevel,
      visualRole: visual.visualRole,
      config: block.config,
      status: block.status === "running" ? "running" : "idle",
      block,
    },
  };
}

export function createDefaultWorkflowBlockCandidate({
  id,
  pendingConnection,
  position,
}: {
  id: string;
  pendingConnection?: PendingWorkflowConnection;
  position: WorkflowPosition;
}): WorkflowNode {
  return {
    id,
    type: "action",
    position,
    data: {
      label: "New Block",
      description: "Choose a typed block from the catalog",
      type: "action",
      config: {
        blockCandidate: true,
        pendingConnection,
      },
      status: "idle",
    },
    selected: true,
  };
}

export function createPendingWorkflowConnection({
  sourceBlockId,
  sourceHandle,
  targetBlockId,
  targetHandle,
}: Omit<PendingWorkflowConnection, "createdAt">): PendingWorkflowConnection {
  return {
    sourceBlockId,
    targetBlockId,
    sourceHandle,
    targetHandle,
    createdAt: new Date().toISOString(),
  };
}

export function getPendingWorkflowConnection(
  value: unknown
): PendingWorkflowConnection | null {
  if (!(typeof value === "object" && value !== null)) {
    return null;
  }

  const pending = value as Partial<PendingWorkflowConnection>;
  if (
    typeof pending.sourceBlockId !== "string" ||
    typeof pending.targetBlockId !== "string" ||
    typeof pending.createdAt !== "string"
  ) {
    return null;
  }

  return {
    sourceBlockId: pending.sourceBlockId,
    targetBlockId: pending.targetBlockId,
    sourceHandle:
      typeof pending.sourceHandle === "string" ? pending.sourceHandle : null,
    targetHandle:
      typeof pending.targetHandle === "string" ? pending.targetHandle : null,
    createdAt: pending.createdAt,
  };
}

function isWorkflowRelationshipType(
  value: unknown
): value is WorkflowRelationshipType {
  return (
    typeof value === "string" &&
    WORKFLOW_RELATIONSHIP_TYPES.includes(value as WorkflowRelationshipType)
  );
}

function getEdgeStatusFromValue(value: unknown): EdgeStatus {
  return EDGE_STATUS_VALUES.includes(value as EdgeStatus)
    ? (value as EdgeStatus)
    : "active";
}

function getAiProposalStatusFromValue(value: unknown): AiProposalStatus {
  return AI_PROPOSAL_STATUS_VALUES.includes(value as AiProposalStatus)
    ? (value as AiProposalStatus)
    : "proposed";
}

export function getAllowedWorkflowRelationshipTypes(
  sourceFamily: BlockFamily,
  targetFamily: BlockFamily
): WorkflowRelationshipType[] {
  if (sourceFamily === "AI / Agent") {
    return [...AI_PROPOSAL_RELATIONSHIP_TYPES];
  }

  return [
    ...(RELATIONSHIP_TYPES_BY_FAMILY_PAIR[sourceFamily]?.[targetFamily] || []),
  ];
}

function getDefaultLogicRelationshipType(
  targetBlock: WorkflowBlock
): WorkflowRelationshipType | null {
  if (targetBlock.family === "Logic") {
    if (targetBlock.subtype === "Aggregation") {
      return "aggregates_into";
    }
    if (targetBlock.subtype === "Condition") {
      return "branches_to";
    }
    return "transforms_into";
  }

  if (targetBlock.family === "Protected") {
    return targetBlock.subtype === "Protected Input" ||
      targetBlock.subtype === "Locked Rate"
      ? "feeds_protected_input"
      : "feeds_protected_result";
  }

  return targetBlock.family === "Output" ? "feeds_output_input" : null;
}

export function getDefaultWorkflowRelationshipType({
  sourceBlock,
  targetBlock,
}: {
  sourceBlock: WorkflowBlock;
  targetBlock: WorkflowBlock;
}): WorkflowRelationshipType | null {
  if (sourceBlock.family === "AI / Agent") {
    return "proposes";
  }

  if (targetBlock.family === "AI / Agent") {
    return sourceBlock.family === "Logic"
      ? "feeds_ai_context"
      : "provides_context_to_ai";
  }

  if (sourceBlock.family === "Logic") {
    return (
      getDefaultLogicRelationshipType(targetBlock) ||
      getAllowedWorkflowRelationshipTypes(
        sourceBlock.family,
        targetBlock.family
      )[0] ||
      null
    );
  }

  return (
    getAllowedWorkflowRelationshipTypes(
      sourceBlock.family,
      targetBlock.family
    )[0] || null
  );
}

export function getWorkflowRelationshipForValue({
  sourceBlock,
  targetBlock,
  value,
}: {
  sourceBlock?: WorkflowBlock;
  targetBlock?: WorkflowBlock;
  value: unknown;
}): WorkflowRelationshipType {
  if (isWorkflowRelationshipType(value)) {
    return value;
  }

  const defaultType =
    sourceBlock && targetBlock
      ? getDefaultWorkflowRelationshipType({ sourceBlock, targetBlock })
      : null;

  if (defaultType) {
    return defaultType;
  }

  switch (value) {
    case "feeds":
      return "provides_data_to";
    case "supports":
      return "referenced_by";
    case "validates":
      return "checked_by";
    case "routes":
      return "branches_to";
    case "protects":
      return "approves_for";
    case "summarizes":
      return "depends_on";
    case "feeds_output":
    case "output_preview":
      return "feeds_output_input";
    case "ai_context":
      return "feeds_ai_context";
    case "exports":
      return "maps_to_output";
    case "proposes":
      return "proposes";
    default:
      return "provides_data_to";
  }
}

export function getWorkflowEdgeDefaults({
  sourceBlock,
  targetBlock,
}: {
  sourceBlock: WorkflowBlock;
  targetBlock: WorkflowBlock;
}): { reason: string; relationshipType: WorkflowRelationshipType } | null {
  const relationshipType = getDefaultWorkflowRelationshipType({
    sourceBlock,
    targetBlock,
  });

  if (!relationshipType) {
    return null;
  }

  return {
    relationshipType,
    reason: `${sourceBlock.label} ${WORKFLOW_RELATIONSHIP_LABELS[
      relationshipType
    ].toLowerCase()} ${targetBlock.label}.`,
  };
}

export function getUnsupportedWorkflowRelationshipMessage({
  sourceBlock,
  targetBlock,
}: {
  sourceBlock?: WorkflowBlock;
  targetBlock?: WorkflowBlock;
}): string {
  if (!(sourceBlock && targetBlock)) {
    return "Both blocks need typed workflow metadata before a relationship can be created.";
  }

  if (sourceBlock.family === "Source" && targetBlock.family !== "Logic") {
    return "Source evidence is immutable. Create downstream Logic to correct, reinterpret, or map it before connecting it to this block.";
  }

  if (targetBlock.family === "Source") {
    return "Source blocks are immutable evidence. Preserve lineage with Source to Logic relationships instead of writing relationships back into a Source.";
  }

  return `${sourceBlock.family} blocks cannot directly connect to ${targetBlock.family} blocks in the typed workflow model. Add a compatible downstream block first.`;
}

export function createWorkflowEdgeRecord({
  confidence = 1,
  createdAt = new Date().toISOString(),
  createdBy = SYSTEM_USER,
  id,
  history,
  notes = "",
  reason,
  relationshipType = "provides_data_to",
  sourceBlockId,
  status = "active",
  targetBlockId,
}: {
  id?: string;
  sourceBlockId: string;
  targetBlockId: string;
  relationshipType?: WorkflowRelationshipType;
  reason: string;
  status?: EdgeStatus;
  createdBy?: string;
  createdAt?: string;
  confidence?: number;
  history?: WorkflowEdgeHistoryEntry[];
  notes?: string;
}): WorkflowEdge {
  const edgeId = id || `edge-${sourceBlockId}-${targetBlockId}`;
  return {
    id: edgeId,
    sourceBlockId,
    targetBlockId,
    relationshipType,
    reason,
    status,
    createdBy,
    createdAt,
    confidence,
    notes,
    history:
      history && history.length > 0
        ? history
        : [
            {
              id: `${edgeId}-created`,
              action: "created",
              by: createdBy,
              at: createdAt,
              notes: reason,
            },
          ],
  };
}

export function updateWorkflowEdgeRecord(
  edge: WorkflowEdge,
  updates: Partial<
    Pick<
      WorkflowEdge,
      "confidence" | "notes" | "reason" | "relationshipType" | "status"
    >
  >,
  historyNote = "Relationship metadata updated."
): WorkflowEdge {
  const now = new Date().toISOString();
  const nextStatus = updates.status || edge.status;
  let historyAction: WorkflowEdgeHistoryEntry["action"] = "updated";
  if (nextStatus === "rejected") {
    historyAction = "rejected";
  } else if (nextStatus === "disabled") {
    historyAction = "disabled";
  }

  return {
    ...edge,
    ...updates,
    history: [
      ...edge.history,
      {
        id: `${edge.id}-history-${Date.now()}`,
        action: historyAction,
        by: SYSTEM_USER,
        at: now,
        notes: historyNote,
      },
    ],
  };
}

export function createSplitWorkflowEdgeRecords({
  insertedBlock,
  originalEdge,
}: {
  insertedBlock: WorkflowBlock;
  originalEdge: WorkflowEdge;
}): [WorkflowEdge, WorkflowEdge] {
  const now = new Date().toISOString();
  const splitHistory: WorkflowEdgeHistoryEntry = {
    id: `${originalEdge.id}-split-${Date.now()}`,
    action: "split",
    by: SYSTEM_USER,
    at: now,
    notes: `Split by inserting ${insertedBlock.label}. Original relationship: ${originalEdge.reason}`,
  };
  const sourceToInserted = createWorkflowEdgeRecord({
    id: `${originalEdge.id}-to-${insertedBlock.id}`,
    sourceBlockId: originalEdge.sourceBlockId,
    targetBlockId: insertedBlock.id,
    relationshipType: originalEdge.relationshipType,
    reason: originalEdge.reason,
    status: originalEdge.status,
    confidence: originalEdge.confidence,
    notes: originalEdge.notes,
    createdAt: now,
    history: [...originalEdge.history, splitHistory],
  });
  const insertedToTarget = createWorkflowEdgeRecord({
    id: `${insertedBlock.id}-to-${originalEdge.targetBlockId}`,
    sourceBlockId: insertedBlock.id,
    targetBlockId: originalEdge.targetBlockId,
    relationshipType: "transforms_into",
    reason: `${insertedBlock.label} continues the split relationship into the original target.`,
    status: originalEdge.status,
    confidence: originalEdge.confidence,
    notes: originalEdge.notes,
    createdAt: now,
    history: [...originalEdge.history, splitHistory],
  });

  return [sourceToInserted, insertedToTarget];
}

export function createCanvasEdgeFromWorkflowEdge(
  edge: WorkflowEdge
): CanvasWorkflowEdge {
  return {
    id: edge.id,
    source: edge.sourceBlockId,
    target: edge.targetBlockId,
    type: "animated",
    data: {
      workflowEdge: edge,
      relationshipType: edge.relationshipType,
      status: edge.status,
      confidence: edge.confidence,
      label: WORKFLOW_RELATIONSHIP_LABELS[edge.relationshipType],
    },
  };
}

export function workflowDefinitionToCanvas(definition: WorkflowDefinition): {
  nodes: WorkflowNode[];
  edges: CanvasWorkflowEdge[];
} {
  const entryBlockId =
    definition.structure.entryBlockId || definition.blocks[0]?.id;

  return {
    nodes: definition.blocks.map((block, index) =>
      createWorkflowNodeFromBlock(block, {
        selected: index === 0,
        type:
          block.id === entryBlockId || block.config.canvasNodeType === "trigger"
            ? "trigger"
            : "action",
      })
    ),
    edges: definition.edges.map(createCanvasEdgeFromWorkflowEdge),
  };
}

function getWorkflowStructure(blocks: WorkflowBlock[]): WorkflowStructure {
  const columns = FISCAL_STAGE_OPTIONS.map((option) => ({
    id: option.stage,
    family: option.family,
    label: option.label,
    blockIds: blocks
      .filter((block) => block.family === option.family)
      .map((block) => block.id),
  })).filter((column) => column.blockIds.length > 0);

  return {
    layout: "canvas-columns",
    entryBlockId: blocks[0]?.id,
    blockOrder: blocks.map((block) => block.id),
    columns,
  };
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createWorkflowEvent({
  createdAt = new Date().toISOString(),
  createdBy = SYSTEM_USER,
  details,
  message,
  type,
}: Omit<WorkflowEvent, "createdAt" | "createdBy" | "id"> &
  Partial<Pick<WorkflowEvent, "createdAt" | "createdBy">>): WorkflowEvent {
  return {
    id: `event-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
    createdAt,
    createdBy,
    details,
  };
}

function appendWorkflowEvent(
  definition: WorkflowDefinition,
  event?: WorkflowEvent
): WorkflowEvent[] {
  if (!event) {
    return definition.events || [];
  }
  return [event, ...(definition.events || [])].slice(0, 50);
}

function getRuntimeAudience(block: WorkflowBlock) {
  return String(block.config.runtimeAudience || block.config.visibility || "");
}

function getAllowedRuntimeActions(block: WorkflowBlock): string[] {
  if (block.family === "Source") {
    return ["view_source_trace", "create_downstream_logic"];
  }
  if (block.family === "Protected") {
    return ["view_trace", "request_draft_unlock"];
  }
  if (block.family === "Output") {
    return ["preview_output", "mock_download"];
  }
  if (block.family === "Review / Validation") {
    return ["view_check_result", "mock_sign_off"];
  }
  if (block.family === "AI / Agent") {
    return ["view_proposal"];
  }
  return ["view_result"];
}

function createRuntimeUiRow(block: WorkflowBlock): RuntimeUiRow {
  const audience = getRuntimeAudience(block);
  const sourceReadOnly = block.family === "Source";
  const protectedLocked = Boolean(
    block.family === "Protected" &&
      (block.governance?.lockedInRuntime || block.runtime.generatedUiLocked)
  );

  return {
    id: `runtime-row-${block.id}`,
    blockId: block.id,
    label: block.label,
    family: block.family,
    subtype: block.subtype,
    visible: block.runtime.visible,
    readOnly:
      sourceReadOnly ||
      protectedLocked ||
      !block.runtime.editableInRuntime ||
      block.family === "Logic",
    locked: protectedLocked || block.runtime.generatedUiLocked,
    reviewerOnly: audience === "reviewer-only",
    advancedOnly: audience === "advanced-only",
    sourceReadOnly,
    protectedLocked,
    outputKey: block.runtime.outputKey,
    allowedActions: getAllowedRuntimeActions(block),
  };
}

function generateRuntimeUiConfigFromParts({
  blocks,
  generatedAt = new Date().toISOString(),
  sourceSnapshotId,
  sourceWorkflowId,
  structure,
}: {
  blocks: WorkflowBlock[];
  generatedAt?: string;
  sourceSnapshotId?: string;
  sourceWorkflowId: string;
  structure: WorkflowStructure;
}): RuntimeUiConfig {
  const blockMap = new Map(blocks.map((block) => [block.id, block]));
  const sections = structure.columns.map((column) => ({
    id: `runtime-section-${column.id}`,
    label: column.label,
    family: column.family,
    rows: column.blockIds
      .map((blockId) => blockMap.get(blockId))
      .filter((block): block is WorkflowBlock => Boolean(block))
      .map(createRuntimeUiRow),
  }));
  const rows = sections.flatMap((section) => section.rows);

  return {
    runtimeConfigId: `runtime-config-${sourceSnapshotId || sourceWorkflowId}`,
    sourceWorkflowId,
    sourceSnapshotId,
    generatedAt,
    sections,
    visibleRows: rows.filter((row) => row.visible).map((row) => row.blockId),
    hiddenRows: rows.filter((row) => !row.visible).map((row) => row.blockId),
    reviewerOnlyRows: rows
      .filter((row) => row.reviewerOnly)
      .map((row) => row.blockId),
    advancedRows: rows
      .filter((row) => row.advancedOnly)
      .map((row) => row.blockId),
    allowedActions: [
      "view_read_only_sources",
      "view_locked_protected_fields",
      "preview_outputs",
      "run_mock_only",
    ],
  };
}

export function generateRuntimeUiConfig(
  definition: WorkflowDefinition,
  sourceSnapshotId?: string
): RuntimeUiConfig {
  return generateRuntimeUiConfigFromParts({
    blocks: definition.blocks,
    sourceSnapshotId,
    sourceWorkflowId: definition.id,
    structure: definition.structure,
  });
}

function getActiveGovernedOutputMappings(
  outputEdges: WorkflowEdge[],
  blockMap: Map<string, WorkflowBlock>
): OutputMappingPreviewItem["mappedProtectedValues"] {
  return outputEdges
    .filter((edge) => edge.status === "active")
    .map((edge) => {
      const protectedBlock = blockMap.get(edge.sourceBlockId);
      if (
        protectedBlock?.family !== "Protected" ||
        !isGovernedOutputRelationshipType(edge.relationshipType)
      ) {
        return null;
      }

      return {
        edgeId: edge.id,
        protectedBlockId: protectedBlock.id,
        protectedLabel: protectedBlock.label,
        relationshipType: edge.relationshipType,
      };
    })
    .filter(
      (
        item
      ): item is OutputMappingPreviewItem["mappedProtectedValues"][number] =>
        Boolean(item)
    );
}

function getActiveCandidateOutputMappings(
  outputEdges: WorkflowEdge[],
  blockMap: Map<string, WorkflowBlock>
): OutputMappingPreviewItem["candidateLogicMappings"] {
  return outputEdges
    .filter((edge) => edge.status === "active")
    .map((edge) => {
      const logicBlock = blockMap.get(edge.sourceBlockId);
      if (
        logicBlock?.family !== "Logic" ||
        !isCandidateOutputRelationshipType(edge.relationshipType)
      ) {
        return null;
      }

      return {
        edgeId: edge.id,
        logicBlockId: logicBlock.id,
        logicLabel: logicBlock.label,
        relationshipType: edge.relationshipType,
      };
    })
    .filter(
      (
        item
      ): item is OutputMappingPreviewItem["candidateLogicMappings"][number] =>
        Boolean(item)
    );
}

function getOutputReadinessStatus({
  candidateMappingCount,
  governedMappingCount,
  ignoredRelationshipCount,
}: {
  governedMappingCount: number;
  candidateMappingCount: number;
  ignoredRelationshipCount: number;
}): OutputMappingPreviewItem["readinessStatus"] {
  if (governedMappingCount > 0 && candidateMappingCount === 0) {
    return ignoredRelationshipCount === 0 ? "ready" : "warning";
  }

  if (governedMappingCount > 0 || candidateMappingCount > 0) {
    return "warning";
  }

  return ignoredRelationshipCount > 0 ? "warning" : "missing";
}

function generateOutputMappingPreviewFromParts({
  blocks,
  edges,
  generatedAt = new Date().toISOString(),
  sourceSnapshotId,
  sourceWorkflowId,
}: {
  blocks: WorkflowBlock[];
  edges: WorkflowEdge[];
  generatedAt?: string;
  sourceSnapshotId?: string;
  sourceWorkflowId: string;
}): OutputMappingPreview {
  const blockMap = new Map(blocks.map((block) => [block.id, block]));
  const outputBlocks = blocks.filter((block) => block.family === "Output");
  const outputs = outputBlocks.map((outputBlock) => {
    const outputEdges = edges.filter(
      (edge) =>
        edge.targetBlockId === outputBlock.id &&
        isOutputMappingRelationshipType(edge.relationshipType)
    );
    const activeGovernedMappings = getActiveGovernedOutputMappings(
      outputEdges,
      blockMap
    );
    const activeCandidateMappings = getActiveCandidateOutputMappings(
      outputEdges,
      blockMap
    );

    const ignoredRelationshipCount =
      outputEdges.length -
      activeGovernedMappings.length -
      activeCandidateMappings.length;
    const governanceWarnings =
      activeCandidateMappings.length > 0
        ? [LOGIC_OUTPUT_GOVERNANCE_WARNING]
        : [];
    const missingRequirements = [
      outputEdges.length === 0 ? "No output mapping relationship" : "",
      activeGovernedMappings.length === 0
        ? "No active Protected value mapping"
        : "",
      activeGovernedMappings.length === 0 &&
      activeCandidateMappings.length === 0
        ? "No active output input mapping"
        : "",
    ].filter(Boolean);
    const readinessStatus = getOutputReadinessStatus({
      candidateMappingCount: activeCandidateMappings.length,
      governedMappingCount: activeGovernedMappings.length,
      ignoredRelationshipCount,
    });

    return {
      outputBlockId: outputBlock.id,
      outputLabel: outputBlock.label,
      outputSubtype: outputBlock.subtype,
      readinessStatus,
      mappedProtectedValues: activeGovernedMappings,
      candidateLogicMappings: activeCandidateMappings,
      governanceWarnings,
      ignoredRelationshipCount,
      missingRequirements,
      includedSourceTraceSetting: String(
        outputBlock.config.sourceTraceSetting || "include summary"
      ),
      mockPayloadPreview: {
        mockOnly: true,
        outputSubtype: outputBlock.subtype,
        mappedValues: activeGovernedMappings.map(
          (mapping) => mapping.protectedLabel
        ),
        candidateLogicInputs: activeCandidateMappings.map(
          (mapping) => mapping.logicLabel
        ),
        noLiveExport: true,
      },
    };
  });

  return {
    id: `output-mapping-${sourceSnapshotId || sourceWorkflowId}`,
    sourceWorkflowId,
    sourceSnapshotId,
    generatedAt,
    outputs,
  };
}

export function generateOutputMappingPreview(
  definition: WorkflowDefinition,
  sourceSnapshotId?: string
): OutputMappingPreview {
  return generateOutputMappingPreviewFromParts({
    blocks: definition.blocks,
    edges: definition.edges,
    sourceSnapshotId,
    sourceWorkflowId: definition.id,
  });
}

function resolveCatalogItemForNode(node: WorkflowNode): BlockCatalogItem {
  const config = node.data.config || {};
  const existingCatalogId =
    (node.data.block?.catalogId as string | undefined) ||
    (config.catalogId as string | undefined);
  const existingCatalogItem = existingCatalogId
    ? getBlockCatalogItem(existingCatalogId)
    : undefined;
  if (existingCatalogItem) {
    return existingCatalogItem;
  }

  const family =
    node.data.block?.family ||
    ((config.blockFamily as BlockFamily | undefined) ??
      getFamilyForStage(config.fiscalStage as string | undefined));
  const subtype = getSubtypeFromValue(
    config.blockSubtype as string | undefined,
    getDefaultCatalogItemForFamily(family).subtype
  );
  return (
    getBlockCatalogItemBySubtype(subtype) ||
    getDefaultCatalogItemForFamily(family)
  );
}

function canvasNodeToWorkflowBlock(
  node: WorkflowNode,
  index: number
): WorkflowBlock {
  const item = resolveCatalogItemForNode(node);
  const existingBlock = node.data.block;
  const label = node.data.label || existingBlock?.label || item.label;
  const config: Record<string, unknown> = {
    ...item.defaultConfig,
    ...existingBlock?.config,
    ...node.data.config,
    fiscalStage: BLOCK_FAMILY_STAGE[item.family],
    blockFamily: item.family,
    blockSubtype: item.subtype,
    catalogId: item.id,
    canvasNodeType: node.data.type,
  };

  const block = createWorkflowBlockFromCatalog(item.id, {
    id: node.id,
    label,
    description:
      node.data.description || existingBlock?.description || item.description,
    position: node.position,
    config,
    status: existingBlock?.status || (index === 0 ? "configured" : "draft"),
    createdAt: existingBlock?.createdAt,
    updatedAt: new Date().toISOString(),
    createdBy: existingBlock?.createdBy,
    updatedBy: SYSTEM_USER,
    sample: existingBlock?.sample,
  });

  return {
    ...block,
    source: existingBlock?.source || block.source,
    governance: existingBlock?.governance
      ? {
          ...existingBlock.governance,
          editIntent:
            typeof config.protectedEditIntent === "string"
              ? config.protectedEditIntent
              : existingBlock.governance.editIntent,
        }
      : block.governance,
    runtime: { ...block.runtime, ...existingBlock?.runtime },
  };
}

function normalizeWorkflowEdgeRecord({
  edge,
  sourceBlock,
  targetBlock,
}: {
  edge: WorkflowEdge;
  sourceBlock?: WorkflowBlock;
  targetBlock?: WorkflowBlock;
}): WorkflowEdge {
  return {
    ...edge,
    relationshipType: getWorkflowRelationshipForValue({
      sourceBlock,
      targetBlock,
      value: edge.relationshipType,
    }),
    status: getEdgeStatusFromValue(edge.status),
    confidence: typeof edge.confidence === "number" ? edge.confidence : 1,
    notes: edge.notes || "",
    history: Array.isArray(edge.history) ? edge.history : [],
  };
}

function canvasEdgeToWorkflowEdge(
  edge: CanvasWorkflowEdge,
  blockMap: Map<string, WorkflowBlock>
): WorkflowEdge {
  const sourceBlock = blockMap.get(edge.source);
  const targetBlock = blockMap.get(edge.target);
  const existing = edge.data?.workflowEdge;
  if (existing) {
    return normalizeWorkflowEdgeRecord({
      edge: {
        ...existing,
        id: edge.id,
        sourceBlockId: edge.source,
        targetBlockId: edge.target,
      },
      sourceBlock,
      targetBlock,
    });
  }

  const defaults =
    sourceBlock && targetBlock
      ? getWorkflowEdgeDefaults({ sourceBlock, targetBlock })
      : null;

  return createWorkflowEdgeRecord({
    id: edge.id,
    sourceBlockId: edge.source,
    targetBlockId: edge.target,
    relationshipType: defaults?.relationshipType || "provides_data_to",
    reason: defaults?.reason || "Canvas connection created by builder",
    confidence: 1,
  });
}

export function createWorkflowDefinitionFromCanvas({
  description,
  edges,
  existing,
  name,
  nodes,
  status,
}: {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: CanvasWorkflowEdge[];
  status?: WorkflowDefinitionStatus;
  existing?: WorkflowDefinition | null;
}): WorkflowDefinition {
  const now = new Date().toISOString();
  const blocks = nodes
    .filter(
      (node) =>
        node.type !== "add" &&
        Boolean(node.data.block) &&
        !node.data.config?.blockCandidate
    )
    .map(canvasNodeToWorkflowBlock);
  const blockMap = new Map(blocks.map((block) => [block.id, block]));
  const workflowEdges = edges
    .filter((edge) => blockMap.has(edge.source) && blockMap.has(edge.target))
    .map((edge) => canvasEdgeToWorkflowEdge(edge, blockMap));
  const structure = getWorkflowStructure(blocks);
  const runtimeUiConfig = generateRuntimeUiConfigFromParts({
    blocks,
    sourceWorkflowId: LOCAL_WORKFLOW_ID,
    structure,
  });
  const outputMappingPreview = generateOutputMappingPreviewFromParts({
    blocks,
    edges: workflowEdges,
    sourceWorkflowId: LOCAL_WORKFLOW_ID,
  });

  return {
    schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
    id: LOCAL_WORKFLOW_ID,
    name: name || existing?.name || "Fiscal Workflow Studio",
    description:
      description ||
      existing?.description ||
      "Local prototype workflow stored in this browser.",
    status: status || existing?.status || "draft",
    metadata: {
      kind: "generic-fiscal-workflow",
      sampleWorkflow: existing?.metadata.sampleWorkflow,
      tags: existing?.metadata.tags || ["local", "prototype"],
      createdBy: existing?.metadata.createdBy || SYSTEM_USER,
      createdAt: existing?.metadata.createdAt || now,
      updatedBy: SYSTEM_USER,
      updatedAt: now,
      notes: existing?.metadata.notes,
    },
    blocks,
    edges: workflowEdges,
    structure,
    runtimeUiConfig,
    outputMappingPreview,
    mockRuns: existing?.mockRuns || [],
    versionSnapshots: existing?.versionSnapshots || [],
    latestPublishedVersionId: existing?.latestPublishedVersionId,
    publishedVersion: existing?.publishedVersion,
    aiProposals: existing?.aiProposals || [],
    events: existing?.events || [],
  };
}

function getTypedEdgeFromUnknown(
  value: unknown,
  blockMap?: Map<string, WorkflowBlock>
): WorkflowEdge | null {
  if (!(typeof value === "object" && value !== null)) {
    return null;
  }
  const edge = value as Partial<WorkflowEdge>;
  if (!(edge.sourceBlockId && edge.targetBlockId)) {
    return null;
  }

  const sourceBlock = blockMap?.get(edge.sourceBlockId);
  const targetBlock = blockMap?.get(edge.targetBlockId);
  const migratedMetadata = !(
    edge.relationshipType &&
    edge.status &&
    edge.createdAt &&
    edge.createdBy &&
    Array.isArray(edge.history) &&
    edge.history.length > 0
  );
  const edgeId = edge.id || `edge-${edge.sourceBlockId}-${edge.targetBlockId}`;
  const createdAt = edge.createdAt || new Date().toISOString();
  return normalizeWorkflowEdgeRecord({
    edge: {
      id: edgeId,
      sourceBlockId: edge.sourceBlockId,
      targetBlockId: edge.targetBlockId,
      relationshipType: getWorkflowRelationshipForValue({
        sourceBlock,
        targetBlock,
        value: edge.relationshipType,
      }),
      reason: edge.reason || "Imported relationship",
      status: getEdgeStatusFromValue(edge.status),
      createdBy: edge.createdBy || SYSTEM_USER,
      createdAt,
      confidence: typeof edge.confidence === "number" ? edge.confidence : 1,
      notes: edge.notes || "",
      history:
        Array.isArray(edge.history) && edge.history.length > 0
          ? edge.history
          : [
              {
                id: `${edgeId}-metadata-migrated`,
                action: "migrated",
                by: SYSTEM_USER,
                at: createdAt,
                notes: migratedMetadata
                  ? "Imported edge metadata was completed with local defaults."
                  : "Imported edge normalized for local Workflow Studio.",
              },
            ],
    },
    sourceBlock,
    targetBlock,
  });
}

function normalizeAiGeneratedBlock(
  value: unknown,
  index: number
): WorkflowBlock | null {
  if (!(typeof value === "object" && value !== null)) {
    return null;
  }

  const block = value as Partial<WorkflowBlock>;
  const family = block.family || "Logic";
  const item =
    (block.catalogId ? getBlockCatalogItem(block.catalogId) : undefined) ||
    getBlockCatalogItemBySubtype(block.subtype) ||
    getDefaultCatalogItemForFamily(family);
  const createdBlock = createWorkflowBlockFromCatalog(item.id, {
    id: block.id || `ai-proposed-block-${index + 1}`,
    label: block.label || item.label,
    description: block.description || item.description,
    position: block.position || { x: index * 260, y: 0 },
    config: block.config,
    status: block.status,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
    createdBy: block.createdBy,
    updatedBy: block.updatedBy,
    sample: block.sample,
  });

  return {
    ...createdBlock,
    ...block,
    config: { ...createdBlock.config, ...block.config },
    runtime: { ...createdBlock.runtime, ...block.runtime },
    source: block.source || createdBlock.source,
    governance: block.governance || createdBlock.governance,
  };
}

function normalizeAiProposalHistory(
  proposalId: string,
  value: unknown,
  createdAt: string,
  createdBy: string
): AiProposalHistoryEntry[] {
  if (Array.isArray(value)) {
    const entries = value
      .map((entry): AiProposalHistoryEntry | null => {
        if (!(typeof entry === "object" && entry !== null)) {
          return null;
        }
        const item = entry as Partial<AiProposalHistoryEntry>;
        if (
          !(
            item.action &&
            ["created", "revised", "approved", "rejected"].includes(item.action)
          )
        ) {
          return null;
        }

        return {
          id: item.id || `${proposalId}-history-${Date.now()}`,
          action: item.action,
          by: item.by || createdBy,
          at: item.at || createdAt,
          notes: item.notes,
        };
      })
      .filter((entry): entry is AiProposalHistoryEntry => entry !== null);

    if (entries.length > 0) {
      return entries;
    }
  }

  return [
    {
      id: `${proposalId}-created`,
      action: "created",
      by: createdBy,
      at: createdAt,
      notes: "Imported AI proposal history was completed locally.",
    },
  ];
}

function normalizeGeneratedCodeOrFormulas(
  value: unknown
): AiProposal["generatedCodeOrFormulas"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!(typeof item === "object" && item !== null)) {
        return null;
      }
      const generated = item as Partial<
        AiProposal["generatedCodeOrFormulas"][number]
      >;
      if (
        !(
          generated.blockId &&
          generated.value &&
          (generated.kind === "code" || generated.kind === "formula")
        )
      ) {
        return null;
      }

      return {
        blockId: generated.blockId,
        kind: generated.kind,
        value: generated.value,
      };
    })
    .filter(
      (item): item is AiProposal["generatedCodeOrFormulas"][number] =>
        item !== null
    );
}

function normalizeAiProposal(
  value: unknown,
  index: number,
  blockMap?: Map<string, WorkflowBlock>
): AiProposal | null {
  if (!(typeof value === "object" && value !== null)) {
    return null;
  }

  const proposal = value as Partial<AiProposal>;
  const createdAt = proposal.createdAt || new Date().toISOString();
  const createdBy = proposal.createdBy || SYSTEM_USER;
  const id = proposal.id || `ai-proposal-imported-${index + 1}-${Date.now()}`;
  const generatedBlocks = Array.isArray(proposal.generatedBlocks)
    ? proposal.generatedBlocks
        .map((block, blockIndex) =>
          normalizeAiGeneratedBlock(block, blockIndex)
        )
        .filter((block): block is WorkflowBlock => Boolean(block))
    : [];
  const proposalBlockMap = new Map(blockMap);
  for (const block of generatedBlocks) {
    proposalBlockMap.set(block.id, block);
  }
  const generatedEdges = Array.isArray(proposal.generatedEdges)
    ? proposal.generatedEdges
        .map((edge) => getTypedEdgeFromUnknown(edge, proposalBlockMap))
        .filter((edge): edge is WorkflowEdge => Boolean(edge))
    : [];

  return {
    id,
    title: proposal.title || `AI proposal ${index + 1}`,
    originalPrompt: proposal.originalPrompt || "Imported local AI proposal.",
    interpretedPlan:
      proposal.interpretedPlan ||
      "Review imported proposal details before approval.",
    selectedTools: Array.isArray(proposal.selectedTools)
      ? proposal.selectedTools.filter(
          (tool): tool is string => typeof tool === "string"
        )
      : ["local mock assistant"],
    generatedBlocks,
    generatedEdges,
    generatedCodeOrFormulas: normalizeGeneratedCodeOrFormulas(
      proposal.generatedCodeOrFormulas
    ),
    status: getAiProposalStatusFromValue(proposal.status),
    approvalResult: proposal.approvalResult,
    rejectionResult: proposal.rejectionResult,
    createdAt,
    createdBy,
    relatedSelectedBlockId: proposal.relatedSelectedBlockId,
    relatedSelectedEdgeId: proposal.relatedSelectedEdgeId,
    confidence:
      typeof proposal.confidence === "number" ? proposal.confidence : undefined,
    notes: proposal.notes,
    history: normalizeAiProposalHistory(
      id,
      proposal.history,
      createdAt,
      createdBy
    ),
  };
}

function normalizeWorkflowEvent(value: unknown): WorkflowEvent | null {
  if (!(typeof value === "object" && value !== null)) {
    return null;
  }

  const event = value as Partial<WorkflowEvent>;
  if (
    !(
      event.type &&
      WORKFLOW_EVENT_TYPES.includes(event.type as WorkflowEventType) &&
      event.message
    )
  ) {
    return null;
  }

  return {
    id: event.id || `event-imported-${Date.now()}`,
    type: event.type as WorkflowEventType,
    message: event.message,
    createdAt: event.createdAt || new Date().toISOString(),
    createdBy: event.createdBy || SYSTEM_USER,
    details: event.details,
  };
}

function getPublishedVersionReference(
  snapshots: WorkflowVersionSnapshot[]
): WorkflowDefinition["publishedVersion"] {
  const latest = snapshots
    .filter((snapshot) => snapshot.status === "published")
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];

  if (!latest) {
    return;
  }

  return {
    id: latest.id,
    versionNumber: latest.versionNumber,
    createdAt: latest.createdAt,
  };
}

function normalizeVersionSnapshots({
  aiProposals,
  blocks,
  edges,
  mockRuns,
  snapshots,
  structure,
  workflowId,
  workflowName,
}: {
  aiProposals: AiProposal[];
  blocks: WorkflowBlock[];
  edges: WorkflowEdge[];
  mockRuns: BlockRun[];
  snapshots: Partial<WorkflowVersionSnapshot>[] | undefined;
  structure: WorkflowStructure;
  workflowId: string;
  workflowName: string;
}): WorkflowVersionSnapshot[] {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Snapshot migration fills many optional v1 fields from older local exports.
  return (snapshots || []).map((snapshot, index) => {
    const versionNumber = snapshot.versionNumber || index + 1;
    const snapshotId =
      snapshot.id || `snapshot-imported-v${versionNumber}-${Date.now()}`;
    const snapshotBlocks = snapshot.blocks || blocks;
    const snapshotEdges = snapshot.edges || edges;
    const snapshotStructure = snapshot.structure || structure;
    const runtimeUiConfig =
      snapshot.runtimeUiConfig ||
      generateRuntimeUiConfigFromParts({
        blocks: snapshotBlocks,
        sourceSnapshotId: snapshotId,
        sourceWorkflowId: workflowId,
        structure: snapshotStructure,
      });
    const outputMappingPreview = generateOutputMappingPreviewFromParts({
      blocks: snapshotBlocks,
      edges: snapshotEdges,
      generatedAt:
        snapshot.outputMappingPreview?.generatedAt ||
        snapshot.createdAt ||
        new Date().toISOString(),
      sourceSnapshotId: snapshotId,
      sourceWorkflowId: workflowId,
    });
    const snapshotBlockMap = new Map<string, WorkflowBlock>(
      snapshotBlocks.map((block) => [block.id, block])
    );
    const snapshotAiProposals = (
      (snapshot.aiProposals as unknown[] | undefined) || aiProposals
    )
      .map((proposal, proposalIndex) =>
        normalizeAiProposal(proposal, proposalIndex, snapshotBlockMap)
      )
      .filter((proposal): proposal is AiProposal => Boolean(proposal));

    return {
      id: snapshotId,
      schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
      workflowId: snapshot.workflowId || workflowId,
      workflowName: snapshot.workflowName || workflowName,
      versionNumber,
      label: snapshot.label || `Imported version ${versionNumber}`,
      status: snapshot.status || "draft",
      createdBy: snapshot.createdBy || SYSTEM_USER,
      createdAt: snapshot.createdAt || new Date().toISOString(),
      changeSummary: snapshot.changeSummary || "Imported version snapshot.",
      blockCount: snapshot.blockCount || snapshotBlocks.length,
      edgeCount: snapshot.edgeCount || snapshotEdges.length,
      blockIds: snapshot.blockIds || snapshotBlocks.map((block) => block.id),
      edgeIds: snapshot.edgeIds || snapshotEdges.map((edge) => edge.id),
      blocks: cloneJson(snapshotBlocks),
      edges: cloneJson(snapshotEdges),
      structure: cloneJson(snapshotStructure),
      runtimeUiConfig: cloneJson(runtimeUiConfig),
      outputMappingPreview: cloneJson(outputMappingPreview),
      aiProposals: cloneJson(snapshotAiProposals),
      mockRuns: cloneJson(snapshot.mockRuns || mockRuns),
      notes: snapshot.notes,
      validationWarnings: snapshot.validationWarnings || [],
    };
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Local import migration intentionally handles typed and older partial schemas together.
function normalizeWorkflowDefinition(
  parsed: Partial<WorkflowDefinition>
): WorkflowDefinition {
  const now = new Date().toISOString();
  const blocks = (parsed.blocks || []).map((block, index) => {
    const family = block.family || "Logic";
    const item =
      (block.catalogId ? getBlockCatalogItem(block.catalogId) : undefined) ||
      getBlockCatalogItemBySubtype(block.subtype) ||
      getDefaultCatalogItemForFamily(family);
    const createdBlock = createWorkflowBlockFromCatalog(item.id, {
      id: block.id || `block-${index + 1}`,
      label: block.label || item.label,
      description: block.description || item.description,
      position: block.position || { x: index * 260, y: 0 },
      config: block.config,
      status: block.status,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt || now,
      createdBy: block.createdBy,
      updatedBy: block.updatedBy,
      sample: block.sample,
    });

    return {
      ...createdBlock,
      ...block,
      config: { ...createdBlock.config, ...block.config },
      runtime: { ...createdBlock.runtime, ...block.runtime },
      source: block.source || createdBlock.source,
      governance: block.governance || createdBlock.governance,
    };
  });
  const blockMap = new Map(blocks.map((block) => [block.id, block]));
  const edges = (parsed.edges || [])
    .map((edge) => getTypedEdgeFromUnknown(edge, blockMap))
    .filter((edge): edge is WorkflowEdge => Boolean(edge));
  const structure = parsed.structure || getWorkflowStructure(blocks);
  const runtimeUiConfig =
    parsed.runtimeUiConfig ||
    generateRuntimeUiConfigFromParts({
      blocks,
      sourceWorkflowId: LOCAL_WORKFLOW_ID,
      structure,
    });
  const outputMappingPreview = generateOutputMappingPreviewFromParts({
    blocks,
    edges,
    generatedAt: parsed.outputMappingPreview?.generatedAt,
    sourceWorkflowId: LOCAL_WORKFLOW_ID,
  });
  const aiProposals = ((parsed.aiProposals as unknown[] | undefined) || [])
    .map((proposal, index) => normalizeAiProposal(proposal, index, blockMap))
    .filter((proposal): proposal is AiProposal => Boolean(proposal));
  const mockRuns = parsed.mockRuns || [];
  const versionSnapshots = normalizeVersionSnapshots({
    aiProposals,
    blocks,
    edges,
    mockRuns,
    snapshots: parsed.versionSnapshots,
    structure,
    workflowId: LOCAL_WORKFLOW_ID,
    workflowName: parsed.name || "Imported Fiscal Workflow",
  });
  const publishedVersion =
    parsed.publishedVersion || getPublishedVersionReference(versionSnapshots);

  return {
    schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
    id: LOCAL_WORKFLOW_ID,
    name: parsed.name || "Imported Fiscal Workflow",
    description: parsed.description || "Imported local workflow.",
    status: parsed.status || "draft",
    metadata: {
      kind: "generic-fiscal-workflow",
      sampleWorkflow: parsed.metadata?.sampleWorkflow,
      tags: parsed.metadata?.tags || ["imported", "local"],
      createdBy: parsed.metadata?.createdBy || SYSTEM_USER,
      createdAt: parsed.metadata?.createdAt || now,
      updatedBy: SYSTEM_USER,
      updatedAt: now,
      notes: parsed.metadata?.notes,
    },
    blocks,
    edges,
    structure,
    runtimeUiConfig,
    outputMappingPreview,
    mockRuns,
    versionSnapshots,
    latestPublishedVersionId:
      parsed.latestPublishedVersionId || publishedVersion?.id,
    publishedVersion,
    aiProposals,
    events: [
      ...((parsed.events || [])
        .map(normalizeWorkflowEvent)
        .filter((event): event is WorkflowEvent => Boolean(event)) || []),
      ...(parsed.schemaVersion !== LOCAL_WORKFLOW_SCHEMA_VERSION
        ? [
            createWorkflowEvent({
              type: "migration",
              message: "Imported workflow was migrated to the local v1 schema.",
            }),
          ]
        : []),
    ],
  };
}

export type LocalWorkflowLoadResult = {
  snapshot: LocalWorkflowSnapshot | null;
  warning?: string;
};

function readStoredWorkflowDefinitionResult(): LocalWorkflowLoadResult {
  if (typeof window === "undefined") {
    return { snapshot: null };
  }

  const stored = window.localStorage.getItem(LOCAL_WORKFLOW_STORAGE_KEY);
  if (!stored) {
    return { snapshot: null };
  }

  try {
    return { snapshot: parseLocalWorkflowJson(stored) };
  } catch (error) {
    return {
      snapshot: null,
      warning:
        error instanceof Error
          ? error.message
          : "Saved local workflow could not be loaded.",
    };
  }
}

function readStoredWorkflowDefinition(): WorkflowDefinition | null {
  return readStoredWorkflowDefinitionResult().snapshot;
}

export function createFapiSampleWorkflow(): LocalWorkflowSnapshot {
  const blockSpecs = getFapiSampleBlockSpecs();
  const blocks = blockSpecs.map((spec) =>
    createWorkflowBlockFromCatalog(spec.catalogId, {
      id: spec.id,
      label: spec.label,
      description: spec.description,
      position: spec.position,
      config: spec.config,
      status: spec.status || "configured",
      createdAt: SAMPLE_CREATED_AT,
      updatedAt: SAMPLE_CREATED_AT,
      sample: true,
    })
  );
  const edges = getFapiSampleEdges();
  const proposalBlock = createWorkflowBlockFromCatalog(
    "ai:ai-workflow-proposal",
    {
      id: "proposal-ai-review-pack-improvements",
      label: "AI Proposal: Evidence Pack Improvements",
      description:
        "Proposal object only. Approval would be required before mutating the graph.",
      position: { x: 1420, y: 740 },
      createdAt: SAMPLE_CREATED_AT,
      updatedAt: SAMPLE_CREATED_AT,
      sample: true,
    }
  );
  const proposalEdge = createWorkflowEdgeRecord({
    id: "proposal-edge-mapping-suggestion",
    sourceBlockId: proposalBlock.id,
    targetBlockId: "logic-classify-source-rows",
    relationshipType: "suggests_mapping",
    reason: "AI proposal suggests a mapping refinement for classified rows.",
    status: "proposed",
    confidence: 0.72,
    createdAt: SAMPLE_CREATED_AT,
  });
  const structure = getWorkflowStructure(blocks);
  const runtimeUiConfig = generateRuntimeUiConfigFromParts({
    blocks,
    generatedAt: SAMPLE_CREATED_AT,
    sourceWorkflowId: LOCAL_WORKFLOW_ID,
    structure,
  });
  const outputMappingPreview = generateOutputMappingPreviewFromParts({
    blocks,
    edges,
    generatedAt: SAMPLE_CREATED_AT,
    sourceWorkflowId: LOCAL_WORKFLOW_ID,
  });
  const mockRuns = getSampleBlockRuns(blocks);
  const aiProposals: AiProposal[] = [
    {
      id: "ai-proposal-fapi-review-pack",
      title: "Evidence pack refinement",
      originalPrompt:
        "Suggest a stronger review pack for the FAPI sample workflow.",
      interpretedPlan:
        "Add a proposal-only evidence pack refinement after output readiness.",
      selectedTools: ["local block catalog", "mock proposal writer"],
      generatedBlocks: [proposalBlock],
      generatedEdges: [proposalEdge],
      generatedCodeOrFormulas: [
        {
          blockId: proposalBlock.id,
          kind: "code",
          value:
            "return { success: true, data: { proposedArtifact: 'enhancedEvidencePack' } };",
        },
      ],
      status: "proposed",
      createdAt: SAMPLE_CREATED_AT,
      createdBy: "mock-ai-panel",
      confidence: 0.72,
      notes:
        "Sample proposal object only. Approval is required before graph changes.",
      history: [
        {
          id: "ai-proposal-fapi-review-pack-created",
          action: "created",
          by: "mock-ai-panel",
          at: SAMPLE_CREATED_AT,
          notes: "Seeded sample proposal.",
        },
      ],
    },
  ];
  const initialSnapshot: WorkflowVersionSnapshot = {
    id: "version-fapi-sample-v1",
    schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
    workflowId: LOCAL_WORKFLOW_ID,
    workflowName: "Fiscal Workflow Studio - FAPI Sample",
    versionNumber: 1,
    label: "Initial FAPI-inspired sample",
    status: "draft",
    createdBy: SYSTEM_USER,
    createdAt: SAMPLE_CREATED_AT,
    changeSummary:
      "Initial schema-driven sample with source, logic, validation, protected, output, and AI proposal objects.",
    blockCount: blocks.length,
    edgeCount: edges.length,
    blockIds: blocks.map((block) => block.id),
    edgeIds: edges.map((edge) => edge.id),
    blocks: cloneJson(blocks),
    edges: cloneJson(edges),
    structure: cloneJson(structure),
    runtimeUiConfig: cloneJson(runtimeUiConfig),
    outputMappingPreview: cloneJson(outputMappingPreview),
    aiProposals: cloneJson(aiProposals),
    mockRuns: cloneJson(mockRuns),
    notes: "Original local sample workflow.",
    validationWarnings: [],
  };

  return {
    schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
    id: LOCAL_WORKFLOW_ID,
    name: "Fiscal Workflow Studio - FAPI Sample",
    description:
      "Schema-driven local prototype sample for a generic fiscal workflow studio.",
    status: "draft",
    metadata: {
      kind: "generic-fiscal-workflow",
      sampleWorkflow: {
        id: "fapi-inspired-sample",
        label: "FAPI-inspired sample",
        description:
          "First sample workflow only. The studio model remains generic.",
      },
      tags: ["local", "prototype", "sample", "fapi-inspired"],
      createdBy: SYSTEM_USER,
      createdAt: SAMPLE_CREATED_AT,
      updatedBy: SYSTEM_USER,
      updatedAt: new Date().toISOString(),
      notes:
        "No live OCR, AI, Taxprep, ONESOURCE, or backend integration is included.",
    },
    blocks,
    edges,
    structure,
    runtimeUiConfig,
    outputMappingPreview,
    mockRuns,
    versionSnapshots: [initialSnapshot],
    aiProposals,
    events: [
      createWorkflowEvent({
        type: "reset_sample",
        message: "FAPI-inspired sample workflow initialized locally.",
        createdAt: SAMPLE_CREATED_AT,
      }),
    ],
  };
}

export function loadLocalWorkflowSnapshot(): LocalWorkflowSnapshot | null {
  return readStoredWorkflowDefinition();
}

export function loadLocalWorkflowSnapshotResult(): LocalWorkflowLoadResult {
  return readStoredWorkflowDefinitionResult();
}

export function saveLocalWorkflowSnapshot({
  description,
  edges,
  event,
  name,
  nodes,
  status,
}: {
  description?: string;
  edges: CanvasWorkflowEdge[];
  event?: WorkflowEvent;
  name: string;
  nodes: WorkflowNode[];
  status?: WorkflowDefinitionStatus;
}): LocalWorkflowSnapshot {
  const existing = readStoredWorkflowDefinition();
  const snapshot = createWorkflowDefinitionFromCanvas({
    description,
    edges,
    existing,
    name,
    nodes,
    status: status || existing?.status || "draft",
  });
  snapshot.events = appendWorkflowEvent(snapshot, event);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      LOCAL_WORKFLOW_STORAGE_KEY,
      JSON.stringify(snapshot, null, 2)
    );
  }

  return snapshot;
}

export function saveWorkflowDefinitionSnapshot(
  snapshot: WorkflowDefinition
): WorkflowDefinition {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      LOCAL_WORKFLOW_STORAGE_KEY,
      JSON.stringify(snapshot, null, 2)
    );
  }

  return snapshot;
}

function lockProtectedBlocksForRuntime(
  blocks: WorkflowBlock[]
): WorkflowBlock[] {
  const now = new Date().toISOString();
  return blocks.map((block) => {
    if (block.family !== "Protected") {
      return block;
    }

    return {
      ...block,
      governance: block.governance
        ? {
            ...block.governance,
            lockedInRuntime: true,
          }
        : block.governance,
      runtime: {
        ...block.runtime,
        editableInRuntime: false,
        generatedUiLocked: true,
      },
      updatedBy: SYSTEM_USER,
      updatedAt: now,
    };
  });
}

function validateLocalPublish({
  definition,
  outputMappingPreview,
}: {
  definition: WorkflowDefinition;
  outputMappingPreview: OutputMappingPreview;
}): string[] {
  const warnings: string[] = [];
  if (definition.blocks.length === 0) {
    warnings.push("Workflow has no typed blocks.");
  }

  const outputBlocks = definition.blocks.filter(
    (block) => block.family === "Output"
  );
  if (outputBlocks.length === 0) {
    warnings.push("No Output blocks are represented in the workflow.");
  }

  const protectedWithoutRuntimeLock = definition.blocks.filter(
    (block) =>
      block.family === "Protected" &&
      !(block.governance?.lockedInRuntime || block.runtime.generatedUiLocked)
  );
  if (protectedWithoutRuntimeLock.length > 0) {
    warnings.push("Some Protected blocks were missing runtime lock metadata.");
  }

  const blockIds = new Set(definition.blocks.map((block) => block.id));
  const invalidEdges = definition.edges.filter(
    (edge) =>
      !(blockIds.has(edge.sourceBlockId) && blockIds.has(edge.targetBlockId))
  );
  if (invalidEdges.length > 0) {
    warnings.push(
      `${invalidEdges.length} relationship(s) reference missing blocks.`
    );
  }

  const proposedOutputEdges = definition.edges.filter(
    (edge) =>
      edge.status !== "active" &&
      isOutputMappingRelationshipType(edge.relationshipType)
  );
  if (proposedOutputEdges.length > 0) {
    warnings.push(
      "Proposed, rejected, or disabled output mapping relationships were excluded from readiness."
    );
  }

  const candidateLogicOutputEdges = definition.edges.filter(
    (edge) =>
      edge.status === "active" &&
      isCandidateOutputRelationshipType(edge.relationshipType)
  );
  if (candidateLogicOutputEdges.length > 0) {
    warnings.push(LOGIC_OUTPUT_GOVERNANCE_WARNING);
  }

  for (const output of outputMappingPreview.outputs) {
    if (output.readinessStatus !== "ready") {
      warnings.push(
        `${output.outputLabel} is ${output.readinessStatus}: ${output.missingRequirements.join(", ")}`
      );
    }
  }

  return warnings;
}

export function publishWorkflowDefinition(
  definition: WorkflowDefinition,
  options: { notes?: string } = {}
): {
  snapshot: WorkflowVersionSnapshot;
  workflow: WorkflowDefinition;
  warnings: string[];
} {
  const now = new Date().toISOString();
  const lockedBlocks = lockProtectedBlocksForRuntime(definition.blocks);
  const structure = getWorkflowStructure(lockedBlocks);
  const nextVersionNumber =
    Math.max(
      0,
      ...definition.versionSnapshots.map((item) => item.versionNumber)
    ) + 1;
  const snapshotId = `version-${definition.id}-v${nextVersionNumber}-${Date.now()}`;
  const runtimeUiConfig = generateRuntimeUiConfigFromParts({
    blocks: lockedBlocks,
    generatedAt: now,
    sourceSnapshotId: snapshotId,
    sourceWorkflowId: definition.id,
    structure,
  });
  const outputMappingPreview = generateOutputMappingPreviewFromParts({
    blocks: lockedBlocks,
    edges: definition.edges,
    generatedAt: now,
    sourceSnapshotId: snapshotId,
    sourceWorkflowId: definition.id,
  });
  const workflowForValidation: WorkflowDefinition = {
    ...definition,
    blocks: lockedBlocks,
    outputMappingPreview,
    runtimeUiConfig,
    status: "published",
    structure,
  };
  const warnings = validateLocalPublish({
    definition: workflowForValidation,
    outputMappingPreview,
  });
  const snapshot: WorkflowVersionSnapshot = {
    id: snapshotId,
    schemaVersion: LOCAL_WORKFLOW_SCHEMA_VERSION,
    workflowId: definition.id,
    workflowName: definition.name,
    versionNumber: nextVersionNumber,
    label: `Published v${nextVersionNumber}`,
    status: "published",
    createdBy: SYSTEM_USER,
    createdAt: now,
    changeSummary:
      options.notes ||
      `Local publish frozen with ${lockedBlocks.length} blocks and ${definition.edges.length} relationships.`,
    blockCount: lockedBlocks.length,
    edgeCount: definition.edges.length,
    blockIds: lockedBlocks.map((block) => block.id),
    edgeIds: definition.edges.map((edge) => edge.id),
    blocks: cloneJson(lockedBlocks),
    edges: cloneJson(definition.edges),
    structure: cloneJson(structure),
    runtimeUiConfig: cloneJson(runtimeUiConfig),
    outputMappingPreview: cloneJson(outputMappingPreview),
    aiProposals: cloneJson(definition.aiProposals),
    mockRuns: cloneJson(definition.mockRuns),
    notes: options.notes,
    validationWarnings: warnings,
  };
  const workflow: WorkflowDefinition = {
    ...workflowForValidation,
    metadata: {
      ...definition.metadata,
      updatedBy: SYSTEM_USER,
      updatedAt: now,
    },
    versionSnapshots: [...definition.versionSnapshots, snapshot],
    latestPublishedVersionId: snapshot.id,
    publishedVersion: {
      id: snapshot.id,
      versionNumber: snapshot.versionNumber,
      createdAt: snapshot.createdAt,
    },
    events: appendWorkflowEvent(
      definition,
      createWorkflowEvent({
        type: "publish_snapshot",
        message: `Published local version ${snapshot.versionNumber}.`,
        createdAt: now,
        details: {
          outputPreviewCount: outputMappingPreview.outputs.length,
          runtimeSectionCount: runtimeUiConfig.sections.length,
          validationWarnings: warnings,
        },
      })
    ),
  };

  return { snapshot, workflow, warnings };
}

export function publishLocalWorkflowSnapshot({
  description,
  edges,
  name,
  nodes,
  notes,
}: {
  description?: string;
  edges: CanvasWorkflowEdge[];
  name: string;
  nodes: WorkflowNode[];
  notes?: string;
}): {
  snapshot: WorkflowVersionSnapshot;
  workflow: WorkflowDefinition;
  warnings: string[];
} {
  const draft = createWorkflowDefinitionFromCanvas({
    description,
    edges,
    existing: readStoredWorkflowDefinition(),
    name,
    nodes,
    status: "published",
  });
  const result = publishWorkflowDefinition(draft, { notes });
  saveWorkflowDefinitionSnapshot(result.workflow);
  return result;
}

export function parseLocalWorkflowJson(text: string): LocalWorkflowSnapshot {
  const parsed = JSON.parse(text) as Partial<
    LocalWorkflowSnapshot & {
      nodes?: WorkflowNode[];
      edges?: Array<CanvasWorkflowEdge | WorkflowEdge>;
      sampleDataset?: typeof LOCAL_SAMPLE_DATASET;
      version?: number;
    }
  >;

  if (Array.isArray(parsed.blocks)) {
    return normalizeWorkflowDefinition(parsed);
  }

  if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
    const canvasEdges = (parsed.edges as CanvasWorkflowEdge[]).map((edge) => ({
      ...edge,
      type: edge.type || "animated",
    }));
    return createWorkflowDefinitionFromCanvas({
      name: parsed.name || "Imported Fiscal Workflow",
      description: parsed.description || "Imported local workflow.",
      nodes: parsed.nodes,
      edges: canvasEdges,
      status: parsed.status || "draft",
    });
  }

  throw new Error("Imported JSON must include typed blocks or legacy nodes.");
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
  nodeLabel: string,
  block?: WorkflowBlock
): Record<string, unknown> {
  if (block?.source) {
    return {
      block: block.label,
      family: block.family,
      subtype: block.subtype,
      immutable: block.source.immutable,
      treatedAsEvidence: block.source.treatedAsEvidence,
      locator: block.source.locator,
      valuesLocked: block.source.valuesLocked,
    };
  }

  if (block?.governance) {
    return {
      block: block.label,
      family: block.family,
      protectedKind: block.governance.protectedKind,
      lockedInRuntime: block.governance.lockedInRuntime,
      requiresUnlockToEdit: block.governance.requiresUnlockToEdit,
      outputKey: block.runtime.outputKey,
    };
  }

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
    case "output":
      return {
        artifacts: ["review_packet.json", "taxprep_bridge.csv"],
        handoffReady: true,
        destination: "download/export only",
      };
    case "ai-agent":
      return {
        proposalOnly: true,
        directMutation: false,
        status: "proposal retained for approval",
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
  edges: CanvasWorkflowEdge[]
): LocalRunRecord {
  const startedAt = new Date();
  const completedAt = new Date(startedAt.getTime() + 640);
  const executionId = `local-run-${startedAt.getTime()}`;
  const orderedNodes = nodes.filter((node) => node.type !== "add");

  const logs = orderedNodes.map((node, index) => {
    const block = node.data.block;
    const stage =
      (node.data.config?.fiscalStage as string | undefined) ||
      (block ? BLOCK_FAMILY_STAGE[block.family] : undefined) ||
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
      nodeType: block
        ? `${block.family} / ${block.subtype}`
        : getFiscalStageLabel(stage),
      status: "success" as const,
      startedAt: stepStartedAt,
      completedAt: stepCompletedAt,
      duration: "95",
      input: {
        upstreamEdges: edges.filter((edge) => edge.target === node.id).length,
        stage,
      },
      output: getFiscalOutputForStage(stage, nodeLabel, block),
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

function getSampleBlockRuns(blocks: WorkflowBlock[]): BlockRun[] {
  return blocks.slice(0, 8).map((block, index) => ({
    id: `sample-run-${block.id}`,
    blockId: block.id,
    blockLabel: block.label,
    status: index === 2 ? "warning" : "success",
    startedAt: SAMPLE_CREATED_AT,
    completedAt: SAMPLE_CREATED_AT,
    durationMs: 95,
    input: { mock: true },
    output: { outputKey: block.runtime.outputKey, mockOnly: true },
  }));
}

function getFapiSampleBlockSpecs(): Array<{
  catalogId: string;
  id: string;
  label: string;
  description: string;
  position: WorkflowPosition;
  config?: Record<string, unknown>;
  status?: BlockStatus;
}> {
  const x = {
    source: -980,
    logic: -620,
    review: -260,
    protectedInput: 100,
    official: 460,
    summary: 820,
    output: 1180,
  };
  const y = (row: number) => -520 + row * 150;

  return [
    {
      catalogId: "source:excel-workbook",
      id: "source-trial-balance",
      label: "Trial balance",
      description: "Excel / Workbook source for the FAPI sample",
      position: { x: x.source, y: y(1) },
      config: {
        outputs: "trialBalanceRows",
        sourceLocator: "trial-balance.xlsx#TB!A:K",
        canvasNodeType: "trigger",
      },
    },
    {
      catalogId: "source:pdf-document",
      id: "source-financial-statements-notes",
      label: "Financial statements and notes",
      description: "PDF / Document support for statements and notes",
      position: { x: x.source, y: y(2) },
      config: {
        outputs: "financialStatementEvidence",
        sourceLocator: "financial-statements.pdf#notes",
      },
    },
    {
      catalogId: "source:manual-entry",
      id: "source-fx-rate-override",
      label: "FX rate source or override",
      description: "Manual Entry source for reviewed FX override",
      position: { x: x.source, y: y(3) },
      config: {
        outputs: "fxRateOverride",
        sourceLocator: "manual-entry://fx-rate-override",
        valuePreview: "1.3500 CAD/USD",
      },
    },
    {
      catalogId: "source:manual-entry",
      id: "source-inclusion-rate-constant",
      label: "Inclusion rate constant",
      description: "Manual Entry source for inclusion rate or constant",
      position: { x: x.source, y: y(4) },
      config: {
        outputs: "inclusionRateConstant",
        sourceLocator: "manual-entry://inclusion-rate",
        valuePreview: "50%",
      },
    },
    {
      catalogId: "source:api-http-request",
      id: "source-fx-rate-api",
      label: "FX rate API source",
      description: "API / HTTP Request source for FX rates",
      position: { x: x.source, y: y(5) },
      config: {
        outputs: "fxRateApiResponse",
        sourceLocator: "https://rates.example.test/fx/CAD/USD",
      },
    },
    {
      catalogId: "logic:classification-mapping",
      id: "logic-classify-source-rows",
      label: "Classify source rows",
      description: "Classification / Mapping for source trial balance rows",
      position: { x: x.logic, y: y(0) },
      config: {
        inputs: "trialBalanceRows, financialStatementEvidence",
        outputs: "classifiedRows",
      },
    },
    {
      catalogId: "logic:aggregation",
      id: "logic-property-income",
      label: "Property income aggregation",
      description: "Aggregation of property income rows",
      position: { x: x.logic, y: y(1) },
      config: { inputs: "classifiedRows", outputs: "propertyIncome" },
    },
    {
      catalogId: "logic:aggregation",
      id: "logic-capital-gains-losses",
      label: "Capital gains / losses aggregation",
      description: "Aggregation of capital gains and losses",
      position: { x: x.logic, y: y(2) },
      config: { inputs: "classifiedRows", outputs: "capitalGainsLosses" },
    },
    {
      catalogId: "logic:aggregation",
      id: "logic-expenses-deductions",
      label: "Expenses and deductions aggregation",
      description: "Aggregation of expense and deduction rows",
      position: { x: x.logic, y: y(3) },
      config: { inputs: "classifiedRows", outputs: "expensesDeductions" },
    },
    {
      catalogId: "logic:formula",
      id: "logic-taxable-capital-gains",
      label: "Taxable capital gains calculation",
      description: "Formula for taxable capital gains",
      position: { x: x.logic, y: y(4) },
      config: {
        formula: "capitalGainsLosses * inclusionRateConstant",
        inputs: "capitalGainsLosses, inclusionRateConstant",
        outputs: "taxableCapitalGains",
      },
    },
    {
      catalogId: "logic:formula",
      id: "logic-fat-deduction",
      label: "FAT deduction calculation",
      description: "Formula for foreign accrual tax deduction",
      position: { x: x.logic, y: y(5) },
      config: {
        formula: "fatPaid * rtf",
        inputs: "fatPaid, relevantTaxFactor",
        outputs: "fatDeduction",
      },
    },
    {
      catalogId: "logic:transformation",
      id: "logic-fx-conversion",
      label: "FX conversion and normalization",
      description: "Transformation for FX conversion or normalization",
      position: { x: x.logic, y: y(6) },
      config: {
        inputs: "fxRateApiResponse, fxRateOverride, documentCurrency",
        outputs: "normalizedAmounts",
      },
    },
    {
      catalogId: "logic:condition",
      id: "logic-missing-source-routing",
      label: "Missing source review routing",
      description: "Condition for missing source or review path routing",
      position: { x: x.logic, y: y(7) },
      config: {
        inputs: "sourceSupportFinding, confidenceWarning",
        outputs: "reviewRoute",
      },
    },
    {
      catalogId: "review:required-input-check",
      id: "review-required-fx-rate",
      label: "FX rate exists",
      description: "Required Input Check for FX rate existence",
      position: { x: x.review, y: y(1) },
      config: { inputs: "fxRateApiResponse, fxRateOverride" },
    },
    {
      catalogId: "review:missing-source-check",
      id: "review-protected-support",
      label: "Protected values have support",
      description: "Missing Source Check for protected values",
      position: { x: x.review, y: y(2) },
    },
    {
      catalogId: "review:low-confidence-warning",
      id: "review-low-confidence",
      label: "Low confidence warning",
      description: "Warning for low-confidence classifications",
      position: { x: x.review, y: y(3) },
    },
    {
      catalogId: "review:manual-override-review",
      id: "review-manual-override",
      label: "Manual override review",
      description: "Review manual override values",
      position: { x: x.review, y: y(4) },
    },
    {
      catalogId: "review:approval-gate",
      id: "review-approval-gate",
      label: "Approval gate",
      description: "Approval Gate before governed outputs",
      position: { x: x.review, y: y(5) },
    },
    {
      catalogId: "review:output-readiness-check",
      id: "review-output-readiness",
      label: "Output readiness check",
      description: "Output Readiness Check for handoff artifacts",
      position: { x: x.review, y: y(6) },
    },
    ...[
      ["protected-input-fx-rate", "Locked Rate", "FX Rate", "fxRate"],
      [
        "protected-input-reporting-currency",
        "Protected Input",
        "Reporting Currency",
        "reportingCurrency",
      ],
      [
        "protected-input-document-currency",
        "Protected Input",
        "Document Currency",
        "documentCurrency",
      ],
      [
        "protected-input-fapi-year",
        "Protected Input",
        "FAPI Year / Fiscal Period",
        "fapiFiscalPeriod",
      ],
      [
        "protected-input-inclusion-rate",
        "Locked Rate",
        "Inclusion Rate",
        "inclusionRate",
      ],
      [
        "protected-input-rtf",
        "Locked Rate",
        "RTF / relevant tax factor",
        "relevantTaxFactor",
      ],
      [
        "protected-input-fat-paid",
        "Protected Input",
        "FAT Paid / Foreign Accrual Tax input",
        "fatPaid",
      ],
    ].map(([id, subtype, label, output], index) => ({
      catalogId:
        subtype === "Locked Rate"
          ? "protected:locked-rate"
          : "protected:protected-input",
      id,
      label,
      description: `Protected Input: ${label}`,
      position: { x: x.protectedInput, y: y(index) },
      config: { outputs: output },
    })),
    ...["A", "A.1", "A.2", "B", "C", "D", "E", "F", "F.1", "G", "H"].map(
      (line, index) => ({
        catalogId: "protected:official-line",
        id: `protected-line-${line.toLowerCase().replace(".", "-")}`,
        label: `Official Line ${line}`,
        description: `Protected official line ${line}`,
        position: { x: x.official, y: y(index - 1) },
        config: { outputs: `officialLine${line.replace(".", "_")}` },
      })
    ),
    ...[
      ["protected-summary-gross", "Gross", "gross"],
      ["protected-summary-deductions", "Deductions", "deductions"],
      ["protected-summary-fapi-brut", "FAPI Brut", "fapiBrut"],
      ["protected-summary-fat-deduction", "FAT Deduction", "fatDeduction"],
      ["protected-summary-net-fapi", "Net FAPI", "netFapi"],
      ["protected-summary-fapl-loss", "FAPL / loss result", "faplLossResult"],
    ].map(([id, label, output], index) => ({
      catalogId: "protected:final-reviewed-amount",
      id,
      label,
      description: `Protected summary result: ${label}`,
      position: { x: x.summary, y: y(index + 1) },
      config: { outputs: output },
    })),
    ...[
      ["output-csv-export", "output:csv-export", "CSV Export"],
      ["output-excel-export", "output:excel-export", "Excel Export"],
      ["output-pdf-review-pack", "output:pdf-report", "PDF Review Pack"],
      ["output-evidence-pack", "output:evidence-pack", "Evidence Pack"],
      ["output-canonical-json", "output:canonical-json", "Canonical JSON"],
      ["output-taxprep-handoff", "output:taxprep-handoff", "Taxprep Handoff"],
      [
        "output-onesource-handoff",
        "output:onesource-handoff",
        "ONESOURCE Handoff",
      ],
    ].map(([id, catalogId, label], index) => ({
      catalogId,
      id,
      label,
      description: `${label} output artifact`,
      position: { x: x.output, y: y(index) },
      config: { inputs: "approvedProtectedPacket" },
    })),
  ];
}

function getFapiSampleEdges(): WorkflowEdge[] {
  // biome-ignore lint/nursery/useMaxParams: Compact sample-edge DSL keeps the graph readable.
  const edge = (
    sourceBlockId: string,
    targetBlockId: string,
    relationshipType: WorkflowRelationshipType,
    reason: string,
    confidence = 1
  ) =>
    createWorkflowEdgeRecord({
      id: `edge-${sourceBlockId}-${targetBlockId}`,
      sourceBlockId,
      targetBlockId,
      relationshipType,
      reason,
      confidence,
      createdAt: SAMPLE_CREATED_AT,
    });

  const edges: WorkflowEdge[] = [
    edge(
      "source-trial-balance",
      "logic-classify-source-rows",
      "extracted_into",
      "Trial balance rows are extracted into classification logic."
    ),
    edge(
      "source-financial-statements-notes",
      "logic-classify-source-rows",
      "referenced_by",
      "Statements and notes are referenced by source row classification."
    ),
    edge(
      "source-inclusion-rate-constant",
      "logic-taxable-capital-gains",
      "provides_data_to",
      "Inclusion rate provides data to taxable capital gains formula."
    ),
    edge(
      "logic-classify-source-rows",
      "logic-property-income",
      "aggregates_into",
      "Classified rows aggregate into property income."
    ),
    edge(
      "logic-classify-source-rows",
      "logic-capital-gains-losses",
      "aggregates_into",
      "Classified rows aggregate into capital gains and losses."
    ),
    edge(
      "logic-classify-source-rows",
      "logic-expenses-deductions",
      "aggregates_into",
      "Classified rows aggregate into expenses and deductions."
    ),
    edge(
      "logic-capital-gains-losses",
      "logic-taxable-capital-gains",
      "transforms_into",
      "Capital gains aggregation transforms into taxable capital gains."
    ),
    edge(
      "logic-expenses-deductions",
      "logic-fat-deduction",
      "transforms_into",
      "Deduction aggregation transforms into FAT deduction calculation."
    ),
    edge(
      "source-fx-rate-api",
      "logic-fx-conversion",
      "provides_data_to",
      "API FX source provides data to conversion logic."
    ),
    edge(
      "source-fx-rate-override",
      "logic-fx-conversion",
      "referenced_by",
      "Manual FX override is referenced by conversion logic."
    ),
    edge(
      "logic-fx-conversion",
      "review-required-fx-rate",
      "checked_by",
      "FX conversion is checked for required rate availability."
    ),
    edge(
      "logic-classify-source-rows",
      "review-low-confidence",
      "requires_review_by",
      "Classification confidence requires low-confidence review."
    ),
    edge(
      "logic-missing-source-routing",
      "review-protected-support",
      "triggers_validation",
      "Missing source routing triggers source support validation."
    ),
    edge(
      "logic-missing-source-routing",
      "review-manual-override",
      "requires_review_by",
      "Routing logic requires manual override review when needed."
    ),
    edge(
      "logic-missing-source-routing",
      "review-approval-gate",
      "triggers_validation",
      "Routing logic triggers approval gate validation."
    ),
    edge(
      "logic-missing-source-routing",
      "review-output-readiness",
      "triggers_validation",
      "Routing logic triggers output readiness validation."
    ),
    edge(
      "review-required-fx-rate",
      "protected-input-fx-rate",
      "certifies",
      "Required FX rate check certifies the protected FX Rate input."
    ),
    edge(
      "review-protected-support",
      "protected-summary-gross",
      "certifies",
      "Source support check certifies the protected gross summary."
    ),
    edge(
      "review-manual-override",
      "protected-input-fx-rate",
      "approves_for",
      "Manual override review approves the protected FX Rate input."
    ),
    edge(
      "review-output-readiness",
      "protected-summary-net-fapi",
      "certifies",
      "Output readiness certifies the protected Net FAPI summary."
    ),
  ];

  for (const [source, target] of [
    ["logic-fx-conversion", "protected-input-fx-rate"],
    ["logic-fx-conversion", "protected-input-reporting-currency"],
    ["logic-fx-conversion", "protected-input-document-currency"],
    ["logic-taxable-capital-gains", "protected-input-inclusion-rate"],
    ["logic-fat-deduction", "protected-input-rtf"],
    ["logic-fat-deduction", "protected-input-fat-paid"],
  ]) {
    edges.push(
      edge(
        source,
        target,
        "feeds_protected_input",
        "Logic feeds a governed protected input."
      )
    );
  }

  edges.push(
    edge(
      "logic-taxable-capital-gains",
      "protected-input-fapi-year",
      "feeds_protected_input",
      "Taxable capital gains calculation references the governed fiscal period."
    )
  );

  for (const target of [
    "protected-input-fx-rate",
    "protected-input-reporting-currency",
    "protected-input-document-currency",
    "protected-input-fapi-year",
    "protected-input-inclusion-rate",
    "protected-input-rtf",
    "protected-input-fat-paid",
  ]) {
    edges.push(
      edge(
        "review-approval-gate",
        target,
        "approves_for",
        "Approval gate approves the governed input."
      )
    );
  }

  for (const target of [
    "protected-line-a",
    "protected-line-a-1",
    "protected-line-a-2",
    "protected-line-b",
    "protected-line-c",
    "protected-line-d",
    "protected-line-e",
    "protected-line-f",
    "protected-line-f-1",
    "protected-line-g",
    "protected-line-h",
  ]) {
    edges.push(
      edge(
        "review-approval-gate",
        target,
        "approves_for",
        "Approval gate approves the official line."
      )
    );
  }

  for (const [source, target] of [
    ["logic-property-income", "protected-line-a"],
    ["logic-capital-gains-losses", "protected-line-a-1"],
    ["logic-taxable-capital-gains", "protected-line-a-2"],
    ["logic-expenses-deductions", "protected-line-b"],
    ["logic-fat-deduction", "protected-line-c"],
    ["logic-fx-conversion", "protected-line-d"],
    ["logic-fat-deduction", "protected-line-e"],
    ["logic-taxable-capital-gains", "protected-line-f"],
    ["logic-fx-conversion", "protected-line-f-1"],
    ["logic-capital-gains-losses", "protected-line-g"],
    ["logic-expenses-deductions", "protected-line-h"],
    ["logic-property-income", "protected-summary-gross"],
    ["logic-expenses-deductions", "protected-summary-deductions"],
    ["logic-taxable-capital-gains", "protected-summary-fapi-brut"],
    ["logic-fat-deduction", "protected-summary-fat-deduction"],
    ["logic-taxable-capital-gains", "protected-summary-net-fapi"],
    ["logic-capital-gains-losses", "protected-summary-fapl-loss"],
  ]) {
    edges.push(
      edge(
        source,
        target,
        "feeds_protected_result",
        "Logic feeds a governed protected result."
      )
    );
  }

  for (const [source, target] of [
    ["protected-summary-gross", "output-csv-export"],
    ["protected-summary-deductions", "output-excel-export"],
    ["protected-summary-fapi-brut", "output-pdf-review-pack"],
    ["protected-summary-fat-deduction", "output-evidence-pack"],
    ["protected-summary-net-fapi", "output-canonical-json"],
    ["protected-summary-net-fapi", "output-taxprep-handoff"],
    ["protected-summary-fapl-loss", "output-onesource-handoff"],
  ]) {
    edges.push(
      edge(
        source,
        target,
        target.includes("handoff") ? "included_in_handoff" : "maps_to_output",
        "Protected summary maps to the local output preview."
      )
    );
  }

  return edges;
}
