import { nanoid } from "nanoid";
import {
  type AiProposal,
  type BlockFamily,
  type BlockRun,
  createWorkflowBlockFromCatalog,
  createWorkflowEdgeRecord,
  getAllowedWorkflowRelationshipTypes,
  getWorkflowEdgeDefaults,
  isCandidateOutputRelationshipType,
  isGovernedOutputRelationshipType,
  LOGIC_OUTPUT_GOVERNANCE_WARNING,
  type LocalRunRecord,
  WORKFLOW_RELATIONSHIP_LABELS,
  type WorkflowBlock,
  type WorkflowDefinition,
  type WorkflowEdge,
  type WorkflowRelationshipType,
} from "./local-fiscal-workflow";

const MOCK_AI_USER = "mock-ai-panel";
const SOURCE_EDIT_INTENT_REGEX = /\b(edit|correct|override|annotate)\b/;

export type MockAiActionId =
  | "source_to_logic_mapping"
  | "logic_to_logic_transformation"
  | "logic_to_review_validation"
  | "logic_to_protected_mapping"
  | "logic_to_output_candidate"
  | "logic_to_ai_context"
  | "protected_to_output_mapping"
  | "formula_for_logic"
  | "validation_rule"
  | "protected_formula_config"
  | "output_mapping"
  | "reusable_block_group"
  | "missing_source_support"
  | "fix_edge_relationship"
  | "insert_logic_between_source_and_target";

export type MockAiAction = {
  id: MockAiActionId;
  label: string;
  description: string;
};

export const MOCK_AI_ACTIONS: MockAiAction[] = [
  {
    id: "source_to_logic_mapping",
    label: "Suggest Source to Logic mapping",
    description: "Create downstream Logic from immutable Source evidence.",
  },
  {
    id: "logic_to_logic_transformation",
    label: "Suggest Logic transformation",
    description: "Create a Logic block downstream from another Logic block.",
  },
  {
    id: "logic_to_review_validation",
    label: "Suggest validation check",
    description: "Connect Logic to a Review / Validation check.",
  },
  {
    id: "logic_to_protected_mapping",
    label: "Suggest Protected mapping",
    description: "Map Logic into governed Protected data.",
  },
  {
    id: "logic_to_output_candidate",
    label: "Suggest Output candidate",
    description: "Create a draft Logic to Output candidate mapping.",
  },
  {
    id: "logic_to_ai_context",
    label: "Suggest AI context edge",
    description: "Feed Logic context into an AI / Agent block.",
  },
  {
    id: "protected_to_output_mapping",
    label: "Suggest governed Output",
    description: "Map Protected data to an Output as a governed handoff.",
  },
  {
    id: "formula_for_logic",
    label: "Suggest Logic formula",
    description: "Add or update a local formula on a Logic block.",
  },
  {
    id: "validation_rule",
    label: "Suggest validation rule",
    description: "Add or update a local Review / Validation rule.",
  },
  {
    id: "protected_formula_config",
    label: "Suggest Protected config",
    description: "Propose explicit governed config for a Protected block.",
  },
  {
    id: "output_mapping",
    label: "Suggest Output mapping",
    description: "Choose a governed or candidate mapping into Output.",
  },
  {
    id: "reusable_block_group",
    label: "Suggest reusable group",
    description: "Create a small Source-to-Logic-to-Review group.",
  },
  {
    id: "missing_source_support",
    label: "Suggest missing source support",
    description: "Create a proposed Source candidate and downstream support.",
  },
  {
    id: "fix_edge_relationship",
    label: "Fix selected edge",
    description: "Correct a selected invalid or weak typed relationship.",
  },
  {
    id: "insert_logic_between_source_and_target",
    label: "Insert Logic bridge",
    description: "Route blocked Source mapping through derived Logic.",
  },
];

type AskContext = {
  definition: WorkflowDefinition;
  latestRunRecord?: LocalRunRecord;
  prompt: string;
  selectedBlockId: string | null;
  selectedEdgeId: string | null;
};

type ProposalContext = {
  actionId: MockAiActionId;
  definition: WorkflowDefinition;
  note?: string;
  originalPrompt: string;
  selectedBlockId: string | null;
  selectedEdgeId: string | null;
};

function getBlockMap(definition: WorkflowDefinition) {
  return new Map(definition.blocks.map((block) => [block.id, block]));
}

function getSelectedBlock(
  definition: WorkflowDefinition,
  selectedBlockId: string | null
) {
  return (
    definition.blocks.find((block) => block.id === selectedBlockId) || null
  );
}

function getSelectedEdge(
  definition: WorkflowDefinition,
  selectedEdgeId: string | null
) {
  return definition.edges.find((edge) => edge.id === selectedEdgeId) || null;
}

function getBlocksByFamily(
  definition: WorkflowDefinition,
  family: BlockFamily
) {
  return definition.blocks.filter((block) => block.family === family);
}

function firstBlock(
  definition: WorkflowDefinition,
  family: BlockFamily,
  selectedBlock?: WorkflowBlock | null
) {
  if (selectedBlock?.family === family) {
    return selectedBlock;
  }
  return getBlocksByFamily(definition, family)[0] || null;
}

function getBlockLabel(block: WorkflowBlock | undefined) {
  return block?.label || "Unknown block";
}

function getEdgeLabel(edge: WorkflowEdge) {
  return WORKFLOW_RELATIONSHIP_LABELS[edge.relationshipType];
}

function formatList(items: string[], fallback = "None found.") {
  if (items.length === 0) {
    return fallback;
  }
  return items.join("\n");
}

function describeEdge(
  edge: WorkflowEdge,
  definition: WorkflowDefinition
): string {
  const blockMap = getBlockMap(definition);
  const source = blockMap.get(edge.sourceBlockId);
  const target = blockMap.get(edge.targetBlockId);
  const parts = [
    `${getBlockLabel(source)} -> ${getBlockLabel(target)}`,
    `Relationship: ${getEdgeLabel(edge)} (${edge.relationshipType})`,
    `Status: ${edge.status}`,
    `Reason: ${edge.reason}`,
  ];

  if (target?.family === "AI / Agent") {
    parts.push(
      "AI semantics: this incoming AI edge provides context/data to the AI block."
    );
  }

  if (source?.family === "AI / Agent") {
    parts.push(
      "AI semantics: this outgoing AI edge is a proposal/suggestion. It does not silently mutate the target block."
    );
  }

  if (
    source?.family === "Logic" &&
    target?.family === "Output" &&
    isCandidateOutputRelationshipType(edge.relationshipType)
  ) {
    parts.push(LOGIC_OUTPUT_GOVERNANCE_WARNING);
  }

  if (
    source?.family === "Protected" &&
    target?.family === "Output" &&
    isGovernedOutputRelationshipType(edge.relationshipType)
  ) {
    parts.push("This is treated as a governed/final mapping candidate.");
  }

  return parts.join("\n");
}

function getIncomingEdges(definition: WorkflowDefinition, blockId: string) {
  return definition.edges.filter((edge) => edge.targetBlockId === blockId);
}

function getOutgoingEdges(definition: WorkflowDefinition, blockId: string) {
  return definition.edges.filter((edge) => edge.sourceBlockId === blockId);
}

function collectSourceLineage(
  definition: WorkflowDefinition,
  block: WorkflowBlock
) {
  const blockMap = getBlockMap(definition);
  const paths: string[] = [];

  function visit(current: WorkflowBlock, path: WorkflowBlock[]) {
    if (current.family === "Source") {
      paths.push(
        [...path, current]
          .reverse()
          .map((item) => item.label)
          .join(" -> ")
      );
      return;
    }

    for (const edge of getIncomingEdges(definition, current.id)) {
      const source = blockMap.get(edge.sourceBlockId);
      if (source && !path.some((item) => item.id === source.id)) {
        visit(source, [...path, current]);
      }
    }
  }

  visit(block, []);
  return paths;
}

function summarizeWorkflow(definition: WorkflowDefinition) {
  const counts = new Map<BlockFamily, number>();
  for (const block of definition.blocks) {
    counts.set(block.family, (counts.get(block.family) || 0) + 1);
  }
  const outputs = getBlocksByFamily(definition, "Output")
    .slice(0, 5)
    .map((block) => block.label);
  const activeEdges = definition.edges.filter(
    (edge) => edge.status === "active"
  ).length;
  const proposalCounts = {
    approved: definition.aiProposals.filter(
      (proposal) => proposal.status === "approved"
    ).length,
    proposed: definition.aiProposals.filter(
      (proposal) => proposal.status === "proposed"
    ).length,
    rejected: definition.aiProposals.filter(
      (proposal) => proposal.status === "rejected"
    ).length,
  };

  return [
    `${definition.name} is a local generic fiscal workflow prototype.`,
    `It has ${definition.blocks.length} typed blocks and ${definition.edges.length} typed relationships (${activeEdges} active).`,
    `Families: ${Array.from(counts.entries())
      .map(([family, count]) => `${family}: ${count}`)
      .join(", ")}.`,
    `Outputs represented: ${outputs.length > 0 ? outputs.join(", ") : "none"}.`,
    `AI proposals: ${proposalCounts.proposed} proposed, ${proposalCounts.approved} approved, ${proposalCounts.rejected} rejected.`,
    "No real AI, OCR, backend, Taxprep, or ONESOURCE integration is called in v1.",
  ].join("\n");
}

function answerSelected(context: AskContext) {
  const selectedEdge = getSelectedEdge(
    context.definition,
    context.selectedEdgeId
  );
  if (selectedEdge) {
    return describeEdge(selectedEdge, context.definition);
  }

  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  if (!selectedBlock) {
    return "No block or edge is selected. Ask mode is looking at the workspace.";
  }

  const incoming = getIncomingEdges(context.definition, selectedBlock.id);
  const outgoing = getOutgoingEdges(context.definition, selectedBlock.id);
  return [
    `${selectedBlock.label} is a ${selectedBlock.family} / ${selectedBlock.subtype} block.`,
    selectedBlock.description,
    `Status: ${selectedBlock.status}. Runtime visible: ${selectedBlock.runtime.visible ? "yes" : "no"}.`,
    `Incoming relationships: ${incoming.length}. Outgoing relationships: ${outgoing.length}.`,
    selectedBlock.source?.immutable
      ? "Source evidence is immutable; corrections belong in downstream Logic."
      : "",
    selectedBlock.governance?.protected
      ? "Protected governance is enabled; edits require explicit intent and runtime remains locked."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function answerSourcesForSelection(context: AskContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  if (!selectedBlock) {
    return "Select a block to inspect source lineage.";
  }

  const paths = collectSourceLineage(context.definition, selectedBlock);
  return formatList(
    paths.map((path) => `- ${path}`),
    "No Source lineage reaches the selected block yet."
  );
}

function answerLogicFeedsProtected(context: AskContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const protectedBlocks =
    selectedBlock?.family === "Protected"
      ? [selectedBlock]
      : getBlocksByFamily(context.definition, "Protected");
  const blockMap = getBlockMap(context.definition);
  const rows = protectedBlocks.flatMap((protectedBlock) =>
    getIncomingEdges(context.definition, protectedBlock.id)
      .map((edge) => ({
        block: protectedBlock,
        edge,
        source: blockMap.get(edge.sourceBlockId),
      }))
      .filter(
        (
          item
        ): item is {
          block: WorkflowBlock;
          edge: WorkflowEdge;
          source: WorkflowBlock;
        } => item.source?.family === "Logic"
      )
      .map(
        ({ block: targetBlock, edge, source }) =>
          `- ${source.label} feeds ${targetBlock.label} as ${getEdgeLabel(edge)}.`
      )
  );

  return formatList(rows, "No Logic to Protected mappings were found.");
}

function answerOutputsForProtected(context: AskContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const protectedBlocks =
    selectedBlock?.family === "Protected"
      ? [selectedBlock]
      : getBlocksByFamily(context.definition, "Protected");
  const blockMap = getBlockMap(context.definition);
  const protectedIds = new Set(protectedBlocks.map((block) => block.id));
  const rows = context.definition.edges
    .filter(
      (edge) =>
        protectedIds.has(edge.sourceBlockId) &&
        blockMap.get(edge.targetBlockId)?.family === "Output"
    )
    .map((edge) => {
      const source = blockMap.get(edge.sourceBlockId);
      const target = blockMap.get(edge.targetBlockId);
      return `- ${getBlockLabel(source)} maps to ${getBlockLabel(target)} as ${getEdgeLabel(edge)}.`;
    });

  return formatList(rows, "No Protected to Output governed mappings found.");
}

function answerMappingGovernance(definition: WorkflowDefinition) {
  const governed = definition.outputMappingPreview.outputs.flatMap((output) =>
    output.mappedProtectedValues.map(
      (mapping) =>
        `- Governed: ${mapping.protectedLabel} -> ${output.outputLabel} (${WORKFLOW_RELATIONSHIP_LABELS[mapping.relationshipType]}).`
    )
  );
  const candidates = definition.outputMappingPreview.outputs.flatMap((output) =>
    output.candidateLogicMappings.map(
      (mapping) =>
        `- Draft candidate: ${mapping.logicLabel} -> ${output.outputLabel} (${WORKFLOW_RELATIONSHIP_LABELS[mapping.relationshipType]}).`
    )
  );

  return [
    ...governed,
    ...candidates,
    candidates.length > 0
      ? `- Governance note: ${LOGIC_OUTPUT_GOVERNANCE_WARNING}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function answerAiEdges(definition: WorkflowDefinition) {
  const blockMap = getBlockMap(definition);
  const rows = definition.edges
    .filter((edge) => {
      const source = blockMap.get(edge.sourceBlockId);
      const target = blockMap.get(edge.targetBlockId);
      return source?.family === "AI / Agent" || target?.family === "AI / Agent";
    })
    .map((edge) => {
      const source = blockMap.get(edge.sourceBlockId);
      const target = blockMap.get(edge.targetBlockId);
      const direction =
        target?.family === "AI / Agent"
          ? "incoming context/data to AI"
          : "outgoing proposal/suggestion from AI";
      return `- ${getBlockLabel(source)} -> ${getBlockLabel(target)}: ${direction}; ${getEdgeLabel(edge)}.`;
    });

  return formatList(rows, "No AI / Agent edges are active in the graph.");
}

function answerLatestRun({
  definition,
  latestRunRecord,
}: Pick<AskContext, "definition" | "latestRunRecord">) {
  if (latestRunRecord) {
    const changedLogs = latestRunRecord.logs.slice(-5).map((log) => {
      const output =
        typeof log.output === "object" && log.output !== null
          ? Object.keys(log.output as Record<string, unknown>).join(", ")
          : "mock output";
      return `- ${log.nodeName}: ${log.status}; output fields: ${output || "none"}.`;
    });
    return [
      `Latest toolbar run: ${latestRunRecord.execution.id} (${latestRunRecord.execution.status}).`,
      ...changedLogs,
    ].join("\n");
  }

  const latestBlockRun = definition.mockRuns[0];
  if (!latestBlockRun) {
    return "No mock run data is available yet.";
  }

  return describeBlockRun(latestBlockRun);
}

function describeBlockRun(run: BlockRun) {
  return [
    `Latest definition mock run: ${run.blockLabel}.`,
    `Status: ${run.status}. Duration: ${run.durationMs ?? "mock"} ms.`,
    `Output: ${JSON.stringify(run.output || {}, null, 2)}`,
  ].join("\n");
}

function answerMissingBeforePublish(definition: WorkflowDefinition) {
  const outputWarnings = definition.outputMappingPreview.outputs.flatMap(
    (output) => [
      ...output.missingRequirements.map(
        (requirement) => `- ${output.outputLabel}: ${requirement}`
      ),
      ...output.governanceWarnings.map(
        (warning) => `- ${output.outputLabel}: ${warning}`
      ),
    ]
  );
  const proposedOutputEdges = definition.edges.filter(
    (edge) =>
      edge.status !== "active" &&
      (edge.relationshipType === "maps_to_output" ||
        edge.relationshipType === "included_in_handoff" ||
        edge.relationshipType === "feeds_output_input" ||
        edge.relationshipType === "maps_to_output_candidate")
  );
  const warnings = [
    definition.blocks.length === 0 ? "- Workflow has no typed blocks." : "",
    getBlocksByFamily(definition, "Output").length === 0
      ? "- No Output blocks are represented."
      : "",
    proposedOutputEdges.length > 0
      ? `- ${proposedOutputEdges.length} proposed/rejected/disabled output mapping relationship(s) are excluded from readiness.`
      : "",
    ...outputWarnings,
  ].filter(Boolean);

  return formatList(warnings, "No obvious local publish blockers were found.");
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Deterministic local prompt router covers the supported v1 Ask questions.
export function createMockAskResponse(context: AskContext): string {
  const prompt = context.prompt.trim().toLowerCase();
  if (!prompt || prompt.includes("what does this workflow do")) {
    return summarizeWorkflow(context.definition);
  }
  if (prompt.includes("what is selected") || prompt.includes("selected")) {
    return answerSelected(context);
  }
  if (prompt.includes("source") && prompt.includes("feed")) {
    return answerSourcesForSelection(context);
  }
  if (prompt.includes("logic") && prompt.includes("protected")) {
    return answerLogicFeedsProtected(context);
  }
  if (prompt.includes("output") && prompt.includes("protected")) {
    return answerOutputsForProtected(context);
  }
  if (prompt.includes("edge") || prompt.includes("relationship")) {
    const selectedEdge = getSelectedEdge(
      context.definition,
      context.selectedEdgeId
    );
    if (selectedEdge) {
      return describeEdge(selectedEdge, context.definition);
    }
  }
  if (prompt.includes("difference") && prompt.includes("source")) {
    return "Source blocks preserve immutable evidence such as workbooks, documents, APIs, database reads, URLs, manual entries, or reviewed research results. Logic blocks derive, correct, classify, aggregate, or reinterpret that evidence without changing the Source.";
  }
  if (prompt.includes("immutable")) {
    return "Source evidence remains immutable so lineage stays auditable. If a value is wrong or needs interpretation, v1 creates downstream Logic to correct or reinterpret it instead of mutating the Source.";
  }
  if (prompt.includes("govern") || prompt.includes("draft")) {
    return answerMappingGovernance(context.definition);
  }
  if (prompt.includes("ai edge") || prompt.includes("ai edges")) {
    return answerAiEdges(context.definition);
  }
  if (prompt.includes("latest") && prompt.includes("run")) {
    return answerLatestRun(context);
  }
  if (prompt.includes("missing") && prompt.includes("publish")) {
    return answerMissingBeforePublish(context.definition);
  }

  return "Mock Ask can only explain the current local workflow state in v1.";
}

function proposalPositionFrom(
  block: WorkflowBlock | null,
  offsetX = 320,
  offsetY = 80
) {
  return {
    x: (block?.position.x || 0) + offsetX,
    y: (block?.position.y || 0) + offsetY,
  };
}

function createProposedEdge({
  confidence = 0.78,
  reason,
  relationshipType,
  sourceBlock,
  targetBlock,
}: {
  confidence?: number;
  reason: string;
  relationshipType?: WorkflowRelationshipType;
  sourceBlock: WorkflowBlock;
  targetBlock: WorkflowBlock;
}) {
  const defaults = getWorkflowEdgeDefaults({ sourceBlock, targetBlock });
  return createWorkflowEdgeRecord({
    id: `proposal-edge-${sourceBlock.id}-${targetBlock.id}-${nanoid(5)}`,
    sourceBlockId: sourceBlock.id,
    targetBlockId: targetBlock.id,
    relationshipType: relationshipType || defaults?.relationshipType,
    reason,
    status: "proposed",
    confidence,
    createdBy: MOCK_AI_USER,
  });
}

function getProtectedRelationship(targetBlock: WorkflowBlock) {
  return targetBlock.subtype === "Protected Input" ||
    targetBlock.subtype === "Locked Rate"
    ? "feeds_protected_input"
    : "feeds_protected_result";
}

function isDirectSourceToGovernedTarget(
  sourceBlock?: WorkflowBlock,
  targetBlock?: WorkflowBlock
) {
  return (
    sourceBlock?.family === "Source" &&
    (targetBlock?.family === "Protected" || targetBlock?.family === "Output")
  );
}

function createSourceToLogicProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const sourceBlock = firstBlock(context.definition, "Source", selectedBlock);
  if (!sourceBlock) {
    return null;
  }

  const logicBlock = createWorkflowBlockFromCatalog(
    "logic:classification-mapping",
    {
      id: `ai-logic-map-${nanoid(8)}`,
      label: `Draft mapping from ${sourceBlock.label}`,
      description:
        "Mock AI proposal for downstream mapping from immutable source evidence.",
      position: proposalPositionFrom(sourceBlock),
      config: {
        inputs: sourceBlock.runtime.outputKey || sourceBlock.label,
        outputs: `mapped${sourceBlock.label.replace(/[^a-zA-Z0-9]/g, "")}`,
        sourceEvidenceId: sourceBlock.id,
      },
      status: "draft",
      createdBy: MOCK_AI_USER,
    }
  );
  const edge = createProposedEdge({
    sourceBlock,
    targetBlock: logicBlock,
    relationshipType: "extracted_into",
    reason: `${sourceBlock.label} remains immutable evidence and is extracted into downstream Logic.`,
  });

  return {
    blocks: [logicBlock],
    codeOrFormulas: [
      {
        blockId: logicBlock.id,
        kind: "formula" as const,
        value: `map(${sourceBlock.runtime.outputKey || sourceBlock.label})`,
      },
    ],
    edges: [edge],
    plan: "Create downstream Logic to map or reinterpret the selected Source without changing source evidence.",
    title: "Source evidence to Logic mapping",
    why: "Source evidence remains immutable. This proposal creates Logic to correct or reinterpret it.",
  };
}

function createLogicToLogicProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  if (!logicBlock) {
    return null;
  }

  const downstreamLogic = createWorkflowBlockFromCatalog(
    "logic:transformation",
    {
      id: `ai-logic-transform-${nanoid(8)}`,
      label: `Transform ${logicBlock.label}`,
      description: "Mock AI proposal for a downstream Logic transformation.",
      position: proposalPositionFrom(logicBlock),
      config: {
        inputs: logicBlock.runtime.outputKey || logicBlock.label,
        outputs: `transformed${logicBlock.label.replace(/[^a-zA-Z0-9]/g, "")}`,
      },
      status: "draft",
      createdBy: MOCK_AI_USER,
    }
  );

  return {
    blocks: [downstreamLogic],
    codeOrFormulas: [
      {
        blockId: downstreamLogic.id,
        kind: "formula" as const,
        value: `normalize(${logicBlock.runtime.outputKey || logicBlock.label})`,
      },
    ],
    edges: [
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: downstreamLogic,
        relationshipType: "transforms_into",
        reason: `${logicBlock.label} transforms into proposed downstream Logic.`,
      }),
    ],
    plan: "Create a downstream Logic block and connect it as a typed transformation.",
    title: "Logic transformation",
    why: "The selected Logic can feed another Logic block under the current relationship model.",
  };
}

function createLogicToReviewProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  if (!logicBlock) {
    return null;
  }

  const reviewBlock = createWorkflowBlockFromCatalog(
    "review:required-input-check",
    {
      id: `ai-review-check-${nanoid(8)}`,
      label: `Check ${logicBlock.label}`,
      description: "Mock AI proposal for a local validation check.",
      position: proposalPositionFrom(logicBlock),
      config: {
        inputs: logicBlock.runtime.outputKey || logicBlock.label,
        outputs: `check${logicBlock.label.replace(/[^a-zA-Z0-9]/g, "")}`,
        validationRule: "required upstream value exists",
      },
      status: "draft",
      createdBy: MOCK_AI_USER,
    }
  );

  return {
    blocks: [reviewBlock],
    codeOrFormulas: [
      {
        blockId: reviewBlock.id,
        kind: "code" as const,
        value:
          "return { success: Boolean(input.value), data: { check: 'required input present' } };",
      },
    ],
    edges: [
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: reviewBlock,
        relationshipType: "checked_by",
        reason: `${logicBlock.label} is checked by the proposed validation block.`,
      }),
    ],
    plan: "Create a Review / Validation check downstream from Logic.",
    title: "Logic validation check",
    why: "Logic can feed Review / Validation for local deterministic checks.",
  };
}

function createLogicToProtectedProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  const protectedBlock =
    firstBlock(context.definition, "Protected", selectedBlock) ||
    getBlocksByFamily(context.definition, "Protected")[0];
  if (!(logicBlock && protectedBlock)) {
    return null;
  }

  return {
    blocks: [],
    codeOrFormulas: [],
    edges: [
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: protectedBlock,
        relationshipType: getProtectedRelationship(protectedBlock),
        reason: `${logicBlock.label} feeds governed protected value ${protectedBlock.label}.`,
      }),
    ],
    plan: "Create a proposed Logic to Protected governed mapping.",
    title: "Logic to Protected mapping",
    why: "Protected edit intent remains explicit and the proposal must be approved before it affects the draft.",
  };
}

function createLogicToOutputProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  const outputBlock =
    firstBlock(context.definition, "Output", selectedBlock) ||
    getBlocksByFamily(context.definition, "Output")[0];
  if (!(logicBlock && outputBlock)) {
    return null;
  }

  return {
    blocks: [],
    codeOrFormulas: [],
    edges: [
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: outputBlock,
        relationshipType: "maps_to_output_candidate",
        reason: `${logicBlock.label} is proposed as a draft output input for ${outputBlock.label}.`,
      }),
    ],
    plan: "Create a draft/candidate Logic to Output mapping.",
    title: "Draft Output candidate mapping",
    why: LOGIC_OUTPUT_GOVERNANCE_WARNING,
  };
}

function createLogicToAiContextProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  if (!logicBlock) {
    return null;
  }
  const existingAiBlock = getBlocksByFamily(
    context.definition,
    "AI / Agent"
  )[0];
  const aiBlock =
    existingAiBlock ||
    createWorkflowBlockFromCatalog("ai:ai-mapping-suggestion", {
      id: `ai-agent-context-${nanoid(8)}`,
      label: `AI context for ${logicBlock.label}`,
      description: "Mock proposal-only AI / Agent block.",
      position: proposalPositionFrom(logicBlock),
      status: "draft",
      createdBy: MOCK_AI_USER,
    });

  return {
    blocks: existingAiBlock ? [] : [aiBlock],
    codeOrFormulas: [],
    edges: [
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: aiBlock,
        relationshipType: "feeds_ai_context",
        reason: `${logicBlock.label} provides context/data to the AI / Agent block.`,
      }),
    ],
    plan: existingAiBlock
      ? "Connect Logic context into the existing AI / Agent block."
      : "Create an AI / Agent block through this proposal action and feed it Logic context.",
    title: "Logic to AI context edge",
    why: "Any block to AI / Agent means the AI receives context/data; it does not mutate the workflow.",
  };
}

function createProtectedToOutputProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const protectedBlock = firstBlock(
    context.definition,
    "Protected",
    selectedBlock
  );
  const outputBlock =
    firstBlock(context.definition, "Output", selectedBlock) ||
    getBlocksByFamily(context.definition, "Output")[0];
  if (!(protectedBlock && outputBlock)) {
    return null;
  }

  return {
    blocks: [],
    codeOrFormulas: [],
    edges: [
      createProposedEdge({
        sourceBlock: protectedBlock,
        targetBlock: outputBlock,
        relationshipType: outputBlock.subtype.includes("Handoff")
          ? "included_in_handoff"
          : "maps_to_output",
        reason: `${protectedBlock.label} maps to ${outputBlock.label} as a governed output candidate.`,
      }),
    ],
    plan: "Create a governed Protected to Output mapping candidate.",
    title: "Governed Output mapping",
    why: "Final governed handoffs usually map from Protected values.",
  };
}

function createFormulaProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const logicBlock = firstBlock(context.definition, "Logic", selectedBlock);
  if (!logicBlock) {
    return null;
  }

  return {
    blocks: [],
    codeOrFormulas: [
      {
        blockId: logicBlock.id,
        kind: "formula" as const,
        value: `coalesce(${logicBlock.config.inputs || "upstreamValue"}, 0)`,
      },
    ],
    edges: [],
    plan: `Add a deterministic local formula suggestion to ${logicBlock.label}.`,
    title: "Logic formula suggestion",
    why: "Formula proposals stay separate until approved and do not call an AI service.",
  };
}

function createValidationRuleProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const reviewBlock = firstBlock(
    context.definition,
    "Review / Validation",
    selectedBlock
  );
  if (!reviewBlock) {
    return createLogicToReviewProposal(context);
  }

  return {
    blocks: [],
    codeOrFormulas: [
      {
        blockId: reviewBlock.id,
        kind: "code" as const,
        value:
          "return { success: Boolean(input.value), data: { severity: 'review', finding: 'required evidence present' } };",
      },
    ],
    edges: [],
    plan: `Add a local validation rule to ${reviewBlock.label}.`,
    title: "Validation rule suggestion",
    why: "Review / Validation rules are deterministic local checks in v1.",
  };
}

function createProtectedConfigProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const protectedBlock = firstBlock(
    context.definition,
    "Protected",
    selectedBlock
  );
  if (!protectedBlock) {
    return null;
  }

  return {
    blocks: [],
    codeOrFormulas: [
      {
        blockId: protectedBlock.id,
        kind: "formula" as const,
        value: `governed(${protectedBlock.config.inputs || protectedBlock.label})`,
      },
    ],
    edges: [],
    plan: `Add explicit governed formula/config intent to ${protectedBlock.label}.`,
    title: "Protected config suggestion",
    why: "Protected changes remain proposed until approval and preserve runtime lock metadata.",
  };
}

function createReusableBlockGroupProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const anchor =
    selectedBlock || getBlocksByFamily(context.definition, "Logic")[0] || null;
  const sourceBlock = createWorkflowBlockFromCatalog("source:manual-entry", {
    id: `ai-source-support-${nanoid(8)}`,
    label: "Proposed support source",
    description: "Mock proposed source candidate for a reusable group.",
    position: proposalPositionFrom(anchor, 280, -90),
    config: {
      outputs: "supportSource",
      sourceLocator: "proposal://support-source",
      valuePreview: "mock support value",
    },
    status: "draft",
    createdBy: MOCK_AI_USER,
  });
  const logicBlock = createWorkflowBlockFromCatalog("logic:transformation", {
    id: `ai-logic-support-${nanoid(8)}`,
    label: "Reusable support transform",
    description: "Mock reusable Logic transform proposed as one group.",
    position: proposalPositionFrom(sourceBlock),
    config: { inputs: "supportSource", outputs: "supportTransform" },
    status: "draft",
    createdBy: MOCK_AI_USER,
  });
  const reviewBlock = createWorkflowBlockFromCatalog(
    "review:missing-source-check",
    {
      id: `ai-review-support-${nanoid(8)}`,
      label: "Support completeness check",
      description: "Mock reusable Review / Validation block.",
      position: proposalPositionFrom(logicBlock),
      config: { inputs: "supportTransform", outputs: "supportFinding" },
      status: "draft",
      createdBy: MOCK_AI_USER,
    }
  );

  return {
    blocks: [sourceBlock, logicBlock, reviewBlock],
    codeOrFormulas: [
      {
        blockId: logicBlock.id,
        kind: "formula" as const,
        value: "normalize(supportSource)",
      },
      {
        blockId: reviewBlock.id,
        kind: "code" as const,
        value:
          "return { success: Boolean(input.supportTransform), data: { complete: true } };",
      },
    ],
    edges: [
      createProposedEdge({
        sourceBlock,
        targetBlock: logicBlock,
        relationshipType: "provides_data_to",
        reason: "Proposed support source provides data to reusable Logic.",
      }),
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: reviewBlock,
        relationshipType: "checked_by",
        reason: "Reusable Logic is checked for support completeness.",
      }),
    ],
    plan: "Create a small reusable Source to Logic to Review group as one atomic proposal.",
    title: "Reusable support block group",
    why: "The group is proposed together because the blocks are only useful as one local support pattern.",
  };
}

function createMissingSourceSupportProposal(context: ProposalContext) {
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const sourceCandidate = createWorkflowBlockFromCatalog(
    "source:ai-search-result",
    {
      id: `ai-source-candidate-${nanoid(8)}`,
      label: "Proposed research source candidate",
      description:
        "Mock research output proposed as Source evidence. It becomes immutable only after approval.",
      position: proposalPositionFrom(selectedBlock, -340, 90),
      config: {
        outputs: "researchSourceCandidate",
        sourceLocator: "proposal://mock-research-result",
        valuePreview: "mock research support candidate",
      },
      status: "draft",
      createdBy: MOCK_AI_USER,
    }
  );
  const targetIsLogic = selectedBlock?.family === "Logic";
  const logicBlock =
    targetIsLogic && selectedBlock
      ? selectedBlock
      : createWorkflowBlockFromCatalog("logic:classification-mapping", {
          id: `ai-logic-research-support-${nanoid(8)}`,
          label: "Interpret research support",
          description:
            "Downstream Logic interprets the proposed research Source candidate.",
          position: proposalPositionFrom(sourceCandidate),
          config: {
            inputs: "researchSourceCandidate",
            outputs: "interpretedResearchSupport",
          },
          status: "draft",
          createdBy: MOCK_AI_USER,
        });
  const edges = [
    createProposedEdge({
      sourceBlock: sourceCandidate,
      targetBlock: logicBlock,
      relationshipType: "referenced_by",
      reason:
        "The proposed research result is a Source candidate referenced by downstream Logic.",
    }),
  ];

  if (
    selectedBlock &&
    selectedBlock.family !== "Logic" &&
    selectedBlock.family !== "Source" &&
    getAllowedWorkflowRelationshipTypes(logicBlock.family, selectedBlock.family)
      .length > 0
  ) {
    edges.push(
      createProposedEdge({
        sourceBlock: logicBlock,
        targetBlock: selectedBlock,
        relationshipType:
          selectedBlock.family === "Protected"
            ? getProtectedRelationship(selectedBlock)
            : undefined,
        reason:
          "Interpreted research support feeds the selected downstream block.",
      })
    );
  }

  return {
    blocks: targetIsLogic ? [sourceCandidate] : [sourceCandidate, logicBlock],
    codeOrFormulas: [
      {
        blockId: logicBlock.id,
        kind: "formula" as const,
        value: "interpret(researchSourceCandidate)",
      },
    ],
    edges,
    plan: "Create a proposed research Source candidate and route interpretation through downstream Logic.",
    title: "Missing source support candidate",
    why: "Research outputs are Source candidates in v1. Approval is required before the Source becomes active and immutable.",
  };
}

function createEdgeFixProposal(context: ProposalContext) {
  const selectedEdge = getSelectedEdge(
    context.definition,
    context.selectedEdgeId
  );
  if (!selectedEdge) {
    return null;
  }

  const blockMap = getBlockMap(context.definition);
  const sourceBlock = blockMap.get(selectedEdge.sourceBlockId);
  const targetBlock = blockMap.get(selectedEdge.targetBlockId);
  if (!(sourceBlock && targetBlock)) {
    return null;
  }

  if (isDirectSourceToGovernedTarget(sourceBlock, targetBlock)) {
    return createInsertLogicBetweenSourceAndTargetProposal(context);
  }

  const defaults = getWorkflowEdgeDefaults({ sourceBlock, targetBlock });
  if (!defaults) {
    return createInsertLogicBetweenSourceAndTargetProposal(context);
  }

  const replacementEdge = createWorkflowEdgeRecord({
    id: selectedEdge.id,
    sourceBlockId: sourceBlock.id,
    targetBlockId: targetBlock.id,
    relationshipType: defaults.relationshipType,
    reason: `Relationship corrected locally. ${defaults.reason}`,
    status: "proposed",
    confidence: 0.83,
    createdBy: MOCK_AI_USER,
    history: selectedEdge.history,
  });

  return {
    blocks: [],
    codeOrFormulas: [],
    edges: [replacementEdge],
    plan: "Update the selected edge to the default valid typed relationship.",
    title: "Typed relationship correction",
    why: "The selected relationship can be strengthened without changing connected blocks.",
  };
}

function createInsertLogicBetweenSourceAndTargetProposal(
  context: ProposalContext
) {
  const selectedEdge = getSelectedEdge(
    context.definition,
    context.selectedEdgeId
  );
  const blockMap = getBlockMap(context.definition);
  const selectedBlock = getSelectedBlock(
    context.definition,
    context.selectedBlockId
  );
  const sourceBlock =
    (selectedEdge && blockMap.get(selectedEdge.sourceBlockId)) ||
    firstBlock(context.definition, "Source", selectedBlock);
  const targetBlock =
    (selectedEdge && blockMap.get(selectedEdge.targetBlockId)) ||
    firstBlock(context.definition, "Protected", selectedBlock) ||
    firstBlock(context.definition, "Output", selectedBlock);
  if (!(sourceBlock && targetBlock)) {
    return null;
  }

  const logicBlock = createWorkflowBlockFromCatalog("logic:transformation", {
    id: `ai-logic-bridge-${nanoid(8)}`,
    label: `Derived Logic for ${targetBlock.label}`,
    description:
      "Logic bridge proposed because direct Source to Protected/Output mapping is blocked.",
    position: {
      x: (sourceBlock.position.x + targetBlock.position.x) / 2,
      y: (sourceBlock.position.y + targetBlock.position.y) / 2,
    },
    config: {
      inputs: sourceBlock.runtime.outputKey || sourceBlock.label,
      outputs: `derived${targetBlock.label.replace(/[^a-zA-Z0-9]/g, "")}`,
    },
    status: "draft",
    createdBy: MOCK_AI_USER,
  });
  const edges = [
    createProposedEdge({
      sourceBlock,
      targetBlock: logicBlock,
      relationshipType: "provides_data_to",
      reason: `${sourceBlock.label} provides immutable evidence to derived Logic.`,
    }),
    createProposedEdge({
      sourceBlock: logicBlock,
      targetBlock,
      relationshipType:
        targetBlock.family === "Protected"
          ? getProtectedRelationship(targetBlock)
          : "maps_to_output_candidate",
      reason: `${logicBlock.label} feeds the downstream ${targetBlock.family} block.`,
    }),
  ];

  if (selectedEdge) {
    edges.unshift(
      createWorkflowEdgeRecord({
        id: selectedEdge.id,
        sourceBlockId: selectedEdge.sourceBlockId,
        targetBlockId: selectedEdge.targetBlockId,
        relationshipType: selectedEdge.relationshipType,
        reason:
          "Original direct Source relationship disabled by approved AI bridge proposal.",
        status: "disabled",
        confidence: selectedEdge.confidence,
        createdBy: MOCK_AI_USER,
        history: selectedEdge.history,
      })
    );
  }

  return {
    blocks: [logicBlock],
    codeOrFormulas: [
      {
        blockId: logicBlock.id,
        kind: "formula" as const,
        value: `derive(${sourceBlock.runtime.outputKey || sourceBlock.label})`,
      },
    ],
    edges,
    plan: "Insert a Logic bridge between Source evidence and the downstream governed or output block.",
    title: "Source mapping Logic bridge",
    why: "Source evidence remains immutable. This proposal creates Logic to correct or reinterpret it.",
  };
}

function getProposalParts(context: ProposalContext) {
  if (
    SOURCE_EDIT_INTENT_REGEX.test(context.originalPrompt.toLowerCase()) &&
    getSelectedBlock(context.definition, context.selectedBlockId)?.family ===
      "Source"
  ) {
    return createSourceToLogicProposal(context);
  }

  switch (context.actionId) {
    case "source_to_logic_mapping":
      return createSourceToLogicProposal(context);
    case "logic_to_logic_transformation":
      return createLogicToLogicProposal(context);
    case "logic_to_review_validation":
      return createLogicToReviewProposal(context);
    case "logic_to_protected_mapping":
      return createLogicToProtectedProposal(context);
    case "logic_to_output_candidate":
      return createLogicToOutputProposal(context);
    case "logic_to_ai_context":
      return createLogicToAiContextProposal(context);
    case "protected_to_output_mapping":
      return createProtectedToOutputProposal(context);
    case "formula_for_logic":
      return createFormulaProposal(context);
    case "validation_rule":
      return createValidationRuleProposal(context);
    case "protected_formula_config":
      return createProtectedConfigProposal(context);
    case "output_mapping":
      return (
        createProtectedToOutputProposal(context) ||
        createLogicToOutputProposal(context)
      );
    case "reusable_block_group":
      return createReusableBlockGroupProposal(context);
    case "missing_source_support":
      return createMissingSourceSupportProposal(context);
    case "fix_edge_relationship":
      return createEdgeFixProposal(context);
    case "insert_logic_between_source_and_target":
      return createInsertLogicBetweenSourceAndTargetProposal(context);
    default:
      return null;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Deterministic prompt inference maps v1 phrases to allowed local mock actions.
export function inferMockAiActionId({
  definition,
  prompt,
  selectedBlockId,
  selectedEdgeId,
}: {
  definition: WorkflowDefinition;
  prompt: string;
  selectedBlockId: string | null;
  selectedEdgeId: string | null;
}): MockAiActionId {
  const normalizedPrompt = prompt.toLowerCase();
  const selectedBlock = getSelectedBlock(definition, selectedBlockId);

  if (selectedEdgeId && normalizedPrompt.includes("fix")) {
    return "fix_edge_relationship";
  }
  if (
    normalizedPrompt.includes("bridge") ||
    normalizedPrompt.includes("between")
  ) {
    return "insert_logic_between_source_and_target";
  }
  if (
    SOURCE_EDIT_INTENT_REGEX.test(normalizedPrompt) &&
    selectedBlock?.family === "Source"
  ) {
    return "source_to_logic_mapping";
  }
  if (
    normalizedPrompt.includes("source support") ||
    normalizedPrompt.includes("research")
  ) {
    return "missing_source_support";
  }
  if (
    normalizedPrompt.includes("reusable") ||
    normalizedPrompt.includes("group")
  ) {
    return "reusable_block_group";
  }
  if (normalizedPrompt.includes("formula")) {
    return "formula_for_logic";
  }
  if (
    normalizedPrompt.includes("validation") ||
    normalizedPrompt.includes("check")
  ) {
    return "logic_to_review_validation";
  }
  if (normalizedPrompt.includes("ai") && normalizedPrompt.includes("context")) {
    return "logic_to_ai_context";
  }
  if (normalizedPrompt.includes("protected")) {
    return selectedBlock?.family === "Protected"
      ? "protected_formula_config"
      : "logic_to_protected_mapping";
  }
  if (
    normalizedPrompt.includes("output") ||
    normalizedPrompt.includes("handoff")
  ) {
    return selectedBlock?.family === "Protected"
      ? "protected_to_output_mapping"
      : "logic_to_output_candidate";
  }
  if (selectedBlock?.family === "Source") {
    return "source_to_logic_mapping";
  }
  if (selectedBlock?.family === "Protected") {
    return "protected_to_output_mapping";
  }
  if (selectedBlock?.family === "Output") {
    return "output_mapping";
  }
  return "logic_to_logic_transformation";
}

export function createMockAiProposal(
  context: ProposalContext
): { proposal: AiProposal; warning?: string } | null {
  const parts = getProposalParts(context);
  if (!parts) {
    return null;
  }

  const now = new Date().toISOString();
  const action = MOCK_AI_ACTIONS.find((item) => item.id === context.actionId);
  const originalPrompt =
    context.originalPrompt.trim() || action?.label || "Local mock AI action";
  const id = `ai-proposal-${nanoid(10)}`;
  const noteLines = [
    parts.why,
    context.note ? `Local note: ${context.note}` : "",
  ].filter(Boolean);

  return {
    proposal: {
      id,
      title: parts.title,
      originalPrompt,
      interpretedPlan: parts.plan,
      selectedTools: [
        "local workflow state",
        "typed relationship rules",
        action?.label || "mock proposal action",
      ],
      generatedBlocks: parts.blocks,
      generatedEdges: parts.edges,
      generatedCodeOrFormulas: parts.codeOrFormulas,
      status: "proposed",
      createdAt: now,
      createdBy: MOCK_AI_USER,
      relatedSelectedBlockId: context.selectedBlockId || undefined,
      relatedSelectedEdgeId: context.selectedEdgeId || undefined,
      confidence: 0.78,
      notes: noteLines.join("\n"),
      history: [
        {
          id: `${id}-created`,
          action: "created",
          by: MOCK_AI_USER,
          at: now,
          notes: parts.why,
        },
      ],
    },
    warning: parts.why.includes("immutable") ? parts.why : undefined,
  };
}
