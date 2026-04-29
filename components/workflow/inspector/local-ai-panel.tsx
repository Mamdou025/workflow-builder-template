"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Bot,
  CheckCircle2,
  HelpCircle,
  History,
  Lightbulb,
  PencilLine,
  Send,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createMockAiProposal,
  createMockAskResponse,
  inferMockAiActionId,
  MOCK_AI_ACTIONS,
  type MockAiActionId,
} from "@/lib/local-ai-workflow-assistant";
import type { EdgeStatus } from "@/lib/local-fiscal-workflow";
import {
  type AiProposal,
  createCanvasEdgeFromWorkflowEdge,
  createWorkflowDefinitionFromCanvas,
  createWorkflowEvent,
  createWorkflowNodeFromBlock,
  loadLocalRunRecords,
  loadLocalWorkflowSnapshot,
  type WorkflowEdge as SchemaWorkflowEdge,
  saveWorkflowDefinitionSnapshot,
  WORKFLOW_RELATIONSHIP_LABELS,
  type WorkflowBlock,
  type WorkflowCodeField,
  type WorkflowDefinition,
  type WorkflowFormulaField,
} from "@/lib/local-fiscal-workflow";
import { cn } from "@/lib/utils";
import {
  edgesAtom,
  hasUnsavedChangesAtom,
  localWorkflowRevisionAtom,
  nodesAtom,
  selectedEdgeAtom,
  selectedNodeAtom,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/lib/workflow-store";

type LocalAiPanelProps = {
  disabled?: boolean;
  workflowName: string;
};

type GeneratedFormula = AiProposal["generatedCodeOrFormulas"][number];

const MOCK_PANEL_USER = "mock-ai-panel";

function StatusPill({ status }: { status: AiProposal["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase",
        status === "proposed" &&
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        status === "approved" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "rejected" &&
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
      )}
    >
      {status}
    </span>
  );
}

function TinyPill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}

function getDefinition({
  edges,
  nodes,
  workflowName,
}: {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  workflowName: string;
}) {
  return createWorkflowDefinitionFromCanvas({
    edges,
    existing: loadLocalWorkflowSnapshot(),
    name: workflowName || "Fiscal Workflow Studio",
    nodes,
    status: "draft",
  });
}

function getProposalTitle(proposal: AiProposal) {
  return proposal.title || proposal.interpretedPlan || proposal.originalPrompt;
}

function getBlockLabel(definition: WorkflowDefinition, blockId?: string) {
  return definition.blocks.find((block) => block.id === blockId)?.label;
}

function getAffectedArea(definition: WorkflowDefinition, proposal: AiProposal) {
  const relatedBlock = getBlockLabel(
    definition,
    proposal.relatedSelectedBlockId
  );
  if (relatedBlock) {
    return relatedBlock;
  }

  const relatedEdge = definition.edges.find(
    (edge) => edge.id === proposal.relatedSelectedEdgeId
  );
  if (relatedEdge) {
    return `${getBlockLabel(definition, relatedEdge.sourceBlockId) || relatedEdge.sourceBlockId} -> ${getBlockLabel(definition, relatedEdge.targetBlockId) || relatedEdge.targetBlockId}`;
  }

  return "Workspace";
}

function parseInputList(value: unknown) {
  return String(value || "upstreamValue")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyGeneratedFieldToBlock({
  block,
  generated,
  now,
}: {
  block: WorkflowBlock;
  generated: GeneratedFormula;
  now: string;
}): WorkflowBlock {
  const config: Record<string, unknown> =
    generated.kind === "formula"
      ? {
          ...block.config,
          formula: generated.value,
          protectedEditIntent:
            block.family === "Protected"
              ? block.config.protectedEditIntent ||
                `AI proposal approved ${now}`
              : block.config.protectedEditIntent,
        }
      : {
          ...block.config,
          generatedRule: generated.value,
          code: generated.value,
        };
  const formula: WorkflowFormulaField | undefined =
    generated.kind === "formula"
      ? {
          expression: generated.value,
          inputs: parseInputList(config.inputs),
          outputKey: String(config.outputs || block.runtime.outputKey),
        }
      : block.formula;
  const code: WorkflowCodeField | undefined =
    generated.kind === "code"
      ? {
          body: generated.value,
          entrypoint:
            block.family === "Review / Validation"
              ? "validate"
              : "runProposalCode",
          language: "typescript",
        }
      : block.code;

  return {
    ...block,
    code,
    config,
    formula,
    status: block.status === "locked" ? "locked" : "configured",
    updatedAt: now,
    updatedBy: MOCK_PANEL_USER,
  };
}

function applyGeneratedFieldsToNodes({
  generatedFields,
  nodes,
  now,
}: {
  generatedFields: GeneratedFormula[];
  nodes: WorkflowNode[];
  now: string;
}) {
  if (generatedFields.length === 0) {
    return nodes;
  }

  return nodes.map((node) => {
    const block = node.data.block;
    if (!block) {
      return node;
    }

    const fieldsForBlock = generatedFields.filter(
      (generated) => generated.blockId === block.id
    );
    if (fieldsForBlock.length === 0) {
      return node;
    }

    const updatedBlock = fieldsForBlock.reduce(
      (currentBlock, generated) =>
        applyGeneratedFieldToBlock({
          block: currentBlock,
          generated,
          now,
        }),
      block
    );

    return {
      ...node,
      data: {
        ...node.data,
        block: updatedBlock,
        config: updatedBlock.config,
        description: updatedBlock.description,
        label: updatedBlock.label,
      },
    };
  });
}

function approveGeneratedEdge(edge: SchemaWorkflowEdge, now: string) {
  const status: EdgeStatus = edge.status === "disabled" ? "disabled" : "active";
  return {
    ...edge,
    status,
    history: [
      ...edge.history,
      {
        id: `${edge.id}-approved-${Date.now()}`,
        action: status === "disabled" ? "disabled" : "approved",
        by: MOCK_PANEL_USER,
        at: now,
        notes:
          status === "disabled"
            ? "Disabled by approved AI proposal."
            : "Activated by approved AI proposal.",
      },
    ],
  } satisfies SchemaWorkflowEdge;
}

function applyProposalToCanvas({
  edges,
  nodes,
  proposal,
}: {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  proposal: AiProposal;
}) {
  const now = new Date().toISOString();
  const existingNodeIds = new Set(nodes.map((node) => node.id));
  const newNodes = proposal.generatedBlocks
    .filter((block) => !existingNodeIds.has(block.id))
    .map((block) =>
      createWorkflowNodeFromBlock(
        {
          ...block,
          status: block.status === "draft" ? "configured" : block.status,
          updatedAt: now,
          updatedBy: MOCK_PANEL_USER,
        },
        { selected: false }
      )
    );
  const nodesWithBlocks = [...nodes, ...newNodes];
  const nextNodes = applyGeneratedFieldsToNodes({
    generatedFields: proposal.generatedCodeOrFormulas,
    nodes: nodesWithBlocks,
    now,
  });
  const nextEdges = [...edges];

  for (const generatedEdge of proposal.generatedEdges) {
    const approvedEdge = approveGeneratedEdge(generatedEdge, now);
    const canvasEdge = createCanvasEdgeFromWorkflowEdge(approvedEdge);
    const existingIndex = nextEdges.findIndex(
      (edge) => edge.id === generatedEdge.id
    );

    if (existingIndex >= 0) {
      nextEdges[existingIndex] = {
        ...nextEdges[existingIndex],
        ...canvasEdge,
        selected: false,
      };
    } else {
      nextEdges.push(canvasEdge);
    }
  }

  return {
    edges: nextEdges.map((edge) => ({ ...edge, selected: false })),
    nodes: nextNodes.map((node) => ({ ...node, selected: false })),
  };
}

function updateProposal(
  proposals: AiProposal[],
  proposalId: string,
  updater: (proposal: AiProposal) => AiProposal
) {
  return proposals.map((proposal) =>
    proposal.id === proposalId ? updater(proposal) : proposal
  );
}

function ProposalCard({
  definition,
  disabled,
  note,
  onApprove,
  onAskWhy,
  onNoteChange,
  onReject,
  onRevise,
  proposal,
}: {
  definition: WorkflowDefinition;
  disabled?: boolean;
  note: string;
  onApprove: (proposal: AiProposal) => void;
  onAskWhy: (proposal: AiProposal) => void;
  onNoteChange: (proposalId: string, value: string) => void;
  onReject: (proposal: AiProposal) => void;
  onRevise: (proposal: AiProposal) => void;
  proposal: AiProposal;
}) {
  const relationLabels = proposal.generatedEdges.map((edge) => ({
    id: edge.id,
    label: WORKFLOW_RELATIONSHIP_LABELS[edge.relationshipType],
  }));
  const canAct = !(disabled || proposal.status !== "proposed");

  return (
    <div className="space-y-3 rounded-md border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm">
            {getProposalTitle(proposal)}
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {proposal.createdAt}
          </div>
        </div>
        <StatusPill status={proposal.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Prompt: </span>
          {proposal.originalPrompt}
        </div>
        <div>
          <span className="font-medium">Plan: </span>
          {proposal.interpretedPlan}
        </div>
        <div>
          <span className="font-medium">Affected area: </span>
          {getAffectedArea(definition, proposal)}
        </div>
        {typeof proposal.confidence === "number" && (
          <div>
            <span className="font-medium">Confidence: </span>
            {Math.round(proposal.confidence * 100)}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {proposal.selectedTools.map((tool) => (
          <TinyPill key={tool}>{tool}</TinyPill>
        ))}
      </div>

      <div className="grid gap-2 text-xs">
        <div className="rounded-md border bg-muted/20 p-2">
          <div className="mb-1 font-medium">Proposed blocks</div>
          {proposal.generatedBlocks.length === 0
            ? "None"
            : proposal.generatedBlocks
                .map(
                  (block) =>
                    `${block.family} / ${block.subtype}: ${block.label}`
                )
                .join("\n")}
        </div>
        <div className="rounded-md border bg-muted/20 p-2">
          <div className="mb-1 font-medium">Proposed edges</div>
          {proposal.generatedEdges.length === 0
            ? "None"
            : proposal.generatedEdges
                .map(
                  (edge) =>
                    `${edge.sourceBlockId} -> ${edge.targetBlockId}: ${WORKFLOW_RELATIONSHIP_LABELS[edge.relationshipType]} (${edge.status})`
                )
                .join("\n")}
        </div>
        <div className="rounded-md border bg-muted/20 p-2">
          <div className="mb-1 font-medium">Proposed formulas/code</div>
          {proposal.generatedCodeOrFormulas.length === 0
            ? "None"
            : proposal.generatedCodeOrFormulas
                .map((item) => `${item.blockId} ${item.kind}: ${item.value}`)
                .join("\n")}
        </div>
      </div>

      {relationLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {relationLabels.map((item) => (
            <TinyPill key={item.id}>{item.label}</TinyPill>
          ))}
        </div>
      )}

      {proposal.notes && (
        <div className="rounded-md border bg-muted/20 p-2 text-muted-foreground text-xs">
          {proposal.notes}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`proposal-note-${proposal.id}`}>
          Note before approve/reject
        </Label>
        <Input
          disabled={!canAct}
          id={`proposal-note-${proposal.id}`}
          onChange={(event) => onNoteChange(proposal.id, event.target.value)}
          placeholder="Optional local note"
          value={note}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!canAct}
          onClick={() => onApprove(proposal)}
          size="sm"
        >
          <CheckCircle2 className="mr-2 size-4" />
          Approve
        </Button>
        <Button
          disabled={!canAct}
          onClick={() => onReject(proposal)}
          size="sm"
          variant="secondary"
        >
          <XCircle className="mr-2 size-4" />
          Reject
        </Button>
        <Button
          disabled={!canAct}
          onClick={() => onRevise(proposal)}
          size="sm"
          variant="outline"
        >
          <History className="mr-2 size-4" />
          Revise note
        </Button>
        <Button onClick={() => onAskWhy(proposal)} size="sm" variant="ghost">
          <HelpCircle className="mr-2 size-4" />
          Ask why
        </Button>
      </div>
    </div>
  );
}

export function LocalAiPanel({ disabled, workflowName }: LocalAiPanelProps) {
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const selectedBlockId = useAtomValue(selectedNodeAtom);
  const selectedEdgeId = useAtomValue(selectedEdgeAtom);
  useAtomValue(localWorkflowRevisionAtom);
  const bumpLocalWorkflowRevision = useSetAtom(localWorkflowRevisionAtom);
  const setHasUnsavedChanges = useSetAtom(hasUnsavedChangesAtom);
  const [mode, setMode] = useState<"ask" | "act">("ask");
  const [askPrompt, setAskPrompt] = useState("What does this workflow do?");
  const [askAnswer, setAskAnswer] = useState("");
  const [actPrompt, setActPrompt] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [selectedActionId, setSelectedActionId] = useState<MockAiActionId>(
    "source_to_logic_mapping"
  );
  const [proposalNotes, setProposalNotes] = useState<Record<string, string>>(
    {}
  );
  const definition = getDefinition({ edges, nodes, workflowName });
  const latestRunRecord = loadLocalRunRecords()[0];
  const sortedProposals = [...definition.aiProposals].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const inferredActionId = inferMockAiActionId({
    definition,
    prompt: actPrompt,
    selectedBlockId,
    selectedEdgeId,
  });

  const saveDefinition = ({
    eventMessage,
    eventType,
    nextEdges = edges,
    nextNodes = nodes,
    proposals,
  }: {
    eventMessage: string;
    eventType:
      | "ai_proposal_approved"
      | "ai_proposal_created"
      | "ai_proposal_rejected";
    nextEdges?: WorkflowEdge[];
    nextNodes?: WorkflowNode[];
    proposals: AiProposal[];
  }) => {
    const snapshot = getDefinition({
      edges: nextEdges,
      nodes: nextNodes,
      workflowName,
    });
    const nextSnapshot = {
      ...snapshot,
      aiProposals: proposals,
      events: [
        createWorkflowEvent({
          details: { proposalCount: proposals.length },
          message: eventMessage,
          type: eventType,
        }),
        ...snapshot.events,
      ].slice(0, 50),
    };
    saveWorkflowDefinitionSnapshot(nextSnapshot);
    bumpLocalWorkflowRevision((value) => value + 1);
    setHasUnsavedChanges(false);
  };

  const handleAsk = () => {
    setAskAnswer(
      createMockAskResponse({
        definition,
        latestRunRecord,
        prompt: askPrompt,
        selectedBlockId,
        selectedEdgeId,
      })
    );
  };

  const handleCreateProposal = () => {
    const actionId = actPrompt.trim() ? inferredActionId : selectedActionId;
    const result = createMockAiProposal({
      actionId,
      definition,
      note: proposalNote,
      originalPrompt:
        actPrompt.trim() ||
        MOCK_AI_ACTIONS.find((action) => action.id === actionId)?.label ||
        "Local mock proposal",
      selectedBlockId,
      selectedEdgeId,
    });

    if (!result) {
      toast.warning(
        "Mock Act could not create that proposal from the current local selection."
      );
      return;
    }

    const proposals = [result.proposal, ...definition.aiProposals];
    saveDefinition({
      eventMessage: `AI proposal created: ${getProposalTitle(result.proposal)}.`,
      eventType: "ai_proposal_created",
      proposals,
    });
    setActPrompt("");
    setProposalNote("");
    toast.success("AI proposal created");
    if (result.warning) {
      toast.info(result.warning);
    }
  };

  const handleApproveProposal = (proposal: AiProposal) => {
    if (proposal.status !== "proposed") {
      return;
    }

    const note = proposalNotes[proposal.id];
    const now = new Date().toISOString();
    const applied = applyProposalToCanvas({ edges, nodes, proposal });
    const proposals = updateProposal(
      definition.aiProposals,
      proposal.id,
      (current) => ({
        ...current,
        approvalResult: {
          approvedAt: now,
          approvedBy: MOCK_PANEL_USER,
          notes: note,
        },
        history: [
          ...(current.history || []),
          {
            id: `${current.id}-approved-${Date.now()}`,
            action: "approved",
            at: now,
            by: MOCK_PANEL_USER,
            notes: note || "Approved from the local AI panel.",
          },
        ],
        status: "approved",
      })
    );

    setNodes(applied.nodes);
    setEdges(applied.edges);
    saveDefinition({
      eventMessage: `AI proposal approved: ${getProposalTitle(proposal)}.`,
      eventType: "ai_proposal_approved",
      nextEdges: applied.edges,
      nextNodes: applied.nodes,
      proposals,
    });
    toast.success("Proposal approved and applied to the draft");
  };

  const handleRejectProposal = (proposal: AiProposal) => {
    if (proposal.status !== "proposed") {
      return;
    }

    const reason =
      proposalNotes[proposal.id] || "Rejected from the local AI panel.";
    const now = new Date().toISOString();
    const proposals = updateProposal(
      definition.aiProposals,
      proposal.id,
      (current) => ({
        ...current,
        history: [
          ...(current.history || []),
          {
            id: `${current.id}-rejected-${Date.now()}`,
            action: "rejected",
            at: now,
            by: MOCK_PANEL_USER,
            notes: reason,
          },
        ],
        rejectionResult: {
          reason,
          rejectedAt: now,
          rejectedBy: MOCK_PANEL_USER,
        },
        status: "rejected",
      })
    );

    saveDefinition({
      eventMessage: `AI proposal rejected: ${getProposalTitle(proposal)}.`,
      eventType: "ai_proposal_rejected",
      proposals,
    });
    toast.success("Proposal rejected");
  };

  const handleReviseNote = (proposal: AiProposal) => {
    const note = proposalNotes[proposal.id]?.trim();
    if (!note) {
      toast.warning("Add a local note before revising.");
      return;
    }

    const now = new Date().toISOString();
    const proposals = updateProposal(
      definition.aiProposals,
      proposal.id,
      (current) => ({
        ...current,
        history: [
          ...(current.history || []),
          {
            id: `${current.id}-revised-${Date.now()}`,
            action: "revised",
            at: now,
            by: MOCK_PANEL_USER,
            notes: note,
          },
        ],
        notes: [current.notes, `Local revision note: ${note}`]
          .filter(Boolean)
          .join("\n"),
      })
    );

    saveDefinition({
      eventMessage: `AI proposal note revised: ${getProposalTitle(proposal)}.`,
      eventType: "ai_proposal_created",
      proposals,
    });
    toast.success("Proposal note saved");
  };

  const handleAskWhy = (proposal: AiProposal) => {
    setMode("ask");
    setAskPrompt(`Why suggested: ${getProposalTitle(proposal)}`);
    setAskAnswer(
      [
        proposal.notes || "No local reason was stored.",
        proposal.interpretedPlan,
        "The proposal is deterministic and uses only the local workflow state.",
      ].join("\n")
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <div>
            <div className="font-semibold text-sm">Local AI Panel</div>
            <div className="text-muted-foreground text-xs">
              Deterministic mock Ask and Act. No AI service calls.
            </div>
          </div>
        </div>
      </div>

      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        onValueChange={(value) => setMode(value as "ask" | "act")}
        value={mode}
      >
        <TabsList className="mx-4 mt-3 grid h-9 shrink-0 grid-cols-2">
          <TabsTrigger value="ask">Ask</TabsTrigger>
          <TabsTrigger value="act">Act</TabsTrigger>
        </TabsList>

        <TabsContent
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
          value="ask"
        >
          <div className="space-y-2">
            <Label htmlFor="mock-ai-ask">Question</Label>
            <div className="flex gap-2">
              <Input
                disabled={disabled}
                id="mock-ai-ask"
                onChange={(event) => setAskPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAsk();
                  }
                }}
                value={askPrompt}
              />
              <Button disabled={disabled} onClick={handleAsk} size="icon">
                <Send className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              "What is selected?",
              "Which AI edges are incoming context vs outgoing proposals?",
              "What is missing before publish?",
            ].map((prompt) => (
              <Button
                className="justify-start"
                disabled={disabled}
                key={prompt}
                onClick={() => {
                  setAskPrompt(prompt);
                  setAskAnswer(
                    createMockAskResponse({
                      definition,
                      latestRunRecord,
                      prompt,
                      selectedBlockId,
                      selectedEdgeId,
                    })
                  );
                }}
                size="sm"
                variant="secondary"
              >
                <HelpCircle className="mr-2 size-3.5" />
                {prompt}
              </Button>
            ))}
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              <Lightbulb className="size-4 text-muted-foreground" />
              Answer
            </div>
            <pre className="whitespace-pre-wrap text-sm">
              {askAnswer ||
                "Ask mode explains selected blocks, edges, mappings, source lineage, output readiness, mock runs, and proposal state without mutating the workflow."}
            </pre>
          </div>
        </TabsContent>

        <TabsContent
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
          value="act"
        >
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            Act mode creates proposal cards only. Approval is required before
            blocks, edges, formulas, or config changes are applied.
          </div>

          <div className="space-y-2">
            <Label htmlFor="mock-ai-action">Action</Label>
            <Select
              disabled={disabled}
              onValueChange={(value) =>
                setSelectedActionId(value as MockAiActionId)
              }
              value={selectedActionId}
            >
              <SelectTrigger id="mock-ai-action">
                <SelectValue placeholder="Choose local mock action" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_AI_ACTIONS.map((action) => (
                  <SelectItem key={action.id} value={action.id}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Prompt inference would pick{" "}
              {MOCK_AI_ACTIONS.find((action) => action.id === inferredActionId)
                ?.label || "a local action"}
              .
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mock-ai-act-prompt">Prompt</Label>
            <Input
              disabled={disabled}
              id="mock-ai-act-prompt"
              onChange={(event) => setActPrompt(event.target.value)}
              placeholder="Suggest one local workflow change"
              value={actPrompt}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mock-ai-note">Local note/edit</Label>
            <textarea
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              id="mock-ai-note"
              onChange={(event) => setProposalNote(event.target.value)}
              placeholder="Optional note stored with the proposal"
              value={proposalNote}
            />
          </div>

          <Button disabled={disabled} onClick={handleCreateProposal}>
            <PencilLine className="mr-2 size-4" />
            Create Proposal
          </Button>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm">Proposal Cards</div>
              <TinyPill>{`${definition.aiProposals.length} total`}</TinyPill>
            </div>

            {sortedProposals.length === 0 ? (
              <div className="rounded-md border bg-muted/20 p-3 text-muted-foreground text-sm">
                No proposals yet.
              </div>
            ) : (
              sortedProposals.map((proposal) => (
                <ProposalCard
                  definition={definition}
                  disabled={disabled}
                  key={proposal.id}
                  note={proposalNotes[proposal.id] || ""}
                  onApprove={handleApproveProposal}
                  onAskWhy={handleAskWhy}
                  onNoteChange={(proposalId, value) =>
                    setProposalNotes((current) => ({
                      ...current,
                      [proposalId]: value,
                    }))
                  }
                  onReject={handleRejectProposal}
                  onRevise={handleReviseNote}
                  proposal={proposal}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
