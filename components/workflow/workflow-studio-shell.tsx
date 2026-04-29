"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  AlertTriangle,
  Blocks,
  Bot,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  ListTree,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { nanoid } from "nanoid";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BLOCK_CATALOG,
  type BlockCatalogItem,
  type BlockFamily,
  type BlockRun,
  createCanvasEdgeFromWorkflowEdge,
  createWorkflowBlockFromCatalog,
  createWorkflowDefinitionFromCanvas,
  createWorkflowEdgeRecord,
  createWorkflowNodeFromBlock,
  getWorkflowEdgeDefaults,
  isCandidateOutputRelationshipType,
  isGovernedOutputRelationshipType,
  isOutputMappingRelationshipType,
  LOCAL_SAMPLE_DATASET,
  LOGIC_OUTPUT_GOVERNANCE_WARNING,
  loadLocalRunRecords,
  loadLocalWorkflowSnapshot,
  type WorkflowEdge as SchemaWorkflowEdge,
  type WorkflowBlock,
  type WorkflowDefinition,
} from "@/lib/local-fiscal-workflow";
import { cn } from "@/lib/utils";
import {
  addNodeAtom,
  autosaveAtom,
  currentWorkflowNameAtom,
  deleteNodeAtom,
  edgesAtom,
  executionLogsAtom,
  hasUnsavedChangesAtom,
  localWorkflowRevisionAtom,
  nodesAtom,
  propertiesPanelActiveTabAtom,
  selectedEdgeAtom,
  selectedNodeAtom,
  updateNodeDataAtom,
  type WorkflowNode,
} from "@/lib/workflow-store";
import { formatRelationshipType } from "./utils/edge-relationships";

type WorkflowStudioShellProps = {
  isMobile: boolean;
  rightPanelCollapsed: boolean;
  rightPanelWidthPercent: number;
};

type PaletteTemplate = {
  id: string;
  label: string;
  description: string;
  family: BlockFamily;
  category: string;
  icon: typeof FileText;
};

function getPaletteCategory(family: BlockFamily) {
  if (family === "Output") {
    return "Outputs";
  }

  if (family === "Source") {
    return "Sources";
  }

  return family;
}

function getPaletteIcon(family: BlockFamily) {
  if (family === "Source") {
    return FileText;
  }

  if (family === "Logic") {
    return Calculator;
  }

  if (family === "Review / Validation") {
    return ShieldCheck;
  }

  if (family === "Protected") {
    return LockKeyhole;
  }

  if (family === "AI / Agent") {
    return Bot;
  }

  return Upload;
}

const CORE_BLOCK_TEMPLATES: PaletteTemplate[] = BLOCK_CATALOG.map(
  (item: BlockCatalogItem) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    family: item.family,
    category: getPaletteCategory(item.family),
    icon: getPaletteIcon(item.family),
  })
);

const FAVORITE_TEMPLATE_IDS = new Set([
  "source:excel-workbook",
  "logic:classification-mapping",
  "review:approval-gate",
]);
const PALETTE_CATEGORIES = [
  "Favorites",
  "Recent",
  "Sources",
  "Logic",
  "Review / Validation",
  "Protected",
  "Outputs",
  "AI / Agent",
];

const DEFAULT_NODE_POSITION = { x: -120, y: 180 };

function getTemplatesForCategory({
  allTemplates,
  category,
  recentIds,
}: {
  allTemplates: PaletteTemplate[];
  category: string;
  recentIds: string[];
}) {
  if (category === "Favorites") {
    return allTemplates.filter((template) =>
      FAVORITE_TEMPLATE_IDS.has(template.id)
    );
  }

  if (category === "Recent") {
    return recentIds
      .map((id) => allTemplates.find((template) => template.id === id))
      .filter((template): template is PaletteTemplate => Boolean(template));
  }

  return allTemplates.filter((template) => template.category === category);
}

function buildNodeFromTemplate(
  template: PaletteTemplate,
  index: number
): WorkflowNode {
  const position = {
    x: DEFAULT_NODE_POSITION.x + index * 28,
    y: DEFAULT_NODE_POSITION.y + index * 28,
  };
  const block = createWorkflowBlockFromCatalog(template.id, {
    id: nanoid(),
    position,
  });

  return createWorkflowNodeFromBlock(block, { selected: true });
}

function LeftRail({
  paletteOpen,
  setPaletteOpen,
}: {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}) {
  const railItems = [
    { label: "Palette", icon: Blocks, active: paletteOpen },
    { label: "Structure", icon: ListTree },
    { label: "Favorites", icon: Star },
    { label: "Recent", icon: Clock },
    { label: "Search", icon: Search },
  ];

  return (
    <div className="pointer-events-auto absolute top-16 bottom-4 left-3 z-20 flex w-12 flex-col items-center gap-2 rounded-md border bg-background/95 p-1.5 shadow-sm backdrop-blur">
      {railItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            className={cn(item.active && "bg-muted")}
            key={item.label}
            onClick={() => {
              if (item.label === "Palette") {
                setPaletteOpen(!paletteOpen);
              } else {
                setPaletteOpen(true);
              }
            }}
            size="icon"
            title={item.label}
            variant="ghost"
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
    </div>
  );
}

function PalettePanel({
  open,
  recentIds,
  search,
  setOpen,
  setRecentIds,
  setSearch,
}: {
  open: boolean;
  recentIds: string[];
  search: string;
  setOpen: (open: boolean) => void;
  setRecentIds: (ids: string[]) => void;
  setSearch: (value: string) => void;
}) {
  const addNode = useSetAtom(addNodeAtom);
  const setSelectedNode = useSetAtom(selectedNodeAtom);
  const setActiveTab = useSetAtom(propertiesPanelActiveTabAtom);
  const nodes = useAtomValue(nodesAtom);
  const allTemplates = useMemo(() => CORE_BLOCK_TEMPLATES, []);
  const searchTerm = search.trim().toLowerCase();

  const templatesByCategory = PALETTE_CATEGORIES.map((category) => {
    let templates = getTemplatesForCategory({
      allTemplates,
      category,
      recentIds,
    });

    if (searchTerm) {
      templates = templates.filter(
        (template) =>
          template.label.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.category.toLowerCase().includes(searchTerm)
      );
    }

    return { category, templates };
  }).filter((group) => group.templates.length > 0);

  const handleAddTemplate = (template: PaletteTemplate) => {
    const newNode = buildNodeFromTemplate(template, nodes.length);
    addNode(newNode);
    setSelectedNode(newNode.id);
    setActiveTab("properties");
    setRecentIds(
      [
        template.id,
        ...recentIds.filter((recentId) => recentId !== template.id),
      ].slice(0, 5)
    );
  };

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "pointer-events-auto absolute top-16 bottom-4 left-[4.5rem] z-20 flex w-64 flex-col rounded-md border bg-background/95 shadow-sm backdrop-blur transition-[transform,opacity] duration-300 ease-out will-change-transform",
        open
          ? "translate-x-0 opacity-100"
          : "-translate-x-[calc(100%+1rem)] pointer-events-none opacity-0"
      )}
    >
      <Button
        className="-translate-y-1/2 absolute top-1/2 right-0 z-20 h-12 w-7 translate-x-1/2 rounded-r-full rounded-l-none border bg-background shadow-sm hover:bg-muted"
        onClick={() => setOpen(false)}
        size="icon"
        title="Collapse palette"
        variant="secondary"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <Blocks className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Block Palette</h2>
        </div>
      </div>
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search blocks"
            value={search}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {templatesByCategory.map((group) => (
          <div className="mb-3" key={group.category}>
            <div className="mb-1 flex items-center gap-2 px-2 py-1 font-medium text-muted-foreground text-xs uppercase">
              <ChevronDown className="size-3" />
              {group.category}
            </div>
            <div className="space-y-1">
              {group.templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
                    key={`${group.category}-${template.id}`}
                    onClick={() => handleAddTemplate(template)}
                    type="button"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-sm">
                        {template.label}
                      </span>
                      <span className="line-clamp-2 text-muted-foreground text-xs">
                        {template.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

type StructureTreeRow = {
  block: WorkflowBlock;
  children: StructureTreeRow[];
  edge?: SchemaWorkflowEdge;
  inferred?: boolean;
};

type SourceTrace = {
  edges: SchemaWorkflowEdge[];
  source: WorkflowBlock;
  path: WorkflowBlock[];
};

type BottomPanelActions = {
  addChildLogic: (parentId: string) => void;
  createSourceLogic: (
    sourceId: string,
    variant: "annotation" | "correction" | "derived"
  ) => void;
  deleteBlock: (blockId: string) => void;
  renameBlock: (blockId: string, label: string) => void;
  selectBlock: (blockId: string) => void;
  toggleRuntimeVisibility: (blockId: string) => void;
};

const FAMILY_ORDER: BlockFamily[] = [
  "Output",
  "Protected",
  "Review / Validation",
  "Logic",
  "AI / Agent",
  "Source",
];

function getBlockMap(definition: WorkflowDefinition) {
  return new Map(definition.blocks.map((block) => [block.id, block]));
}

function getIncomingEdges(definition: WorkflowDefinition) {
  const incoming = new Map<string, SchemaWorkflowEdge[]>();
  for (const edge of definition.edges) {
    const current = incoming.get(edge.targetBlockId) || [];
    current.push(edge);
    incoming.set(edge.targetBlockId, current);
  }
  return incoming;
}

function sortBlocksForWorksheet(blocks: WorkflowBlock[]) {
  return [...blocks].sort((a, b) => {
    const familyDelta =
      FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
    if (familyDelta !== 0) {
      return familyDelta;
    }
    return a.position.y - b.position.y || a.position.x - b.position.x;
  });
}

function buildUpstreamRows({
  block,
  blockMap,
  depth = 0,
  incoming,
  visited,
}: {
  block: WorkflowBlock;
  blockMap: Map<string, WorkflowBlock>;
  depth?: number;
  incoming: Map<string, SchemaWorkflowEdge[]>;
  visited: Set<string>;
}): StructureTreeRow[] {
  if (depth > 7 || visited.has(block.id)) {
    return [];
  }

  const nextVisited = new Set(visited).add(block.id);
  const upstream = incoming
    .get(block.id)
    ?.map((edge) => ({
      edge,
      block: blockMap.get(edge.sourceBlockId),
    }))
    .filter(
      (item): item is { block: WorkflowBlock; edge: SchemaWorkflowEdge } =>
        Boolean(item.block)
    );

  return sortBlocksForWorksheet(upstream?.map((item) => item.block) || []).map(
    (childBlock) => {
      const edge = upstream?.find(
        (item) => item.block.id === childBlock.id
      )?.edge;
      return {
        block: childBlock,
        edge,
        children:
          childBlock.family === "Source"
            ? []
            : buildUpstreamRows({
                block: childBlock,
                blockMap,
                depth: depth + 1,
                incoming,
                visited: nextVisited,
              }),
      };
    }
  );
}

function buildStructureTree(
  definition: WorkflowDefinition
): StructureTreeRow[] {
  const blockMap = getBlockMap(definition);
  const incoming = getIncomingEdges(definition);
  const outputs = sortBlocksForWorksheet(
    definition.blocks.filter((block) => block.family === "Output")
  );
  const protectedSummary = sortBlocksForWorksheet(
    definition.blocks.filter(
      (block) =>
        block.family === "Protected" &&
        (block.subtype === "Final Reviewed Amount" ||
          block.subtype === "Protected Result")
    )
  );
  let roots = outputs;
  if (roots.length === 0) {
    roots =
      protectedSummary.length > 0
        ? protectedSummary
        : sortBlocksForWorksheet(
            definition.blocks.filter((block) => block.family !== "Source")
          );
  }

  return roots.map((root) => {
    const upstreamRows = buildUpstreamRows({
      block: root,
      blockMap,
      incoming,
      visited: new Set(),
    });
    const protectedChildren =
      root.family === "Output"
        ? protectedSummary.map((block) => ({
            block,
            children: buildUpstreamRows({
              block,
              blockMap,
              incoming,
              visited: new Set([root.id]),
            }),
            inferred: true,
          }))
        : [];

    return {
      block: root,
      children: [...protectedChildren, ...upstreamRows],
    };
  });
}

function collectSourceTraces(
  definition: WorkflowDefinition,
  block: WorkflowBlock
): SourceTrace[] {
  const blockMap = getBlockMap(definition);
  const incoming = getIncomingEdges(definition);
  const traces: SourceTrace[] = [];

  function visit(
    current: WorkflowBlock,
    path: WorkflowBlock[],
    edgePath: SchemaWorkflowEdge[]
  ) {
    if (current.family === "Source") {
      traces.push({ edges: edgePath, source: current, path });
      return;
    }

    for (const edge of incoming.get(current.id) || []) {
      const source = blockMap.get(edge.sourceBlockId);
      if (source && !path.some((item) => item.id === source.id)) {
        visit(source, [...path, source], [...edgePath, edge]);
      }
    }
  }

  visit(block, [block], []);
  return traces;
}

function getSelectedBlock(
  definition: WorkflowDefinition,
  selectedBlockId: string | null
): WorkflowBlock | null {
  return (
    definition.blocks.find((block) => block.id === selectedBlockId) ||
    definition.blocks[0] ||
    null
  );
}

function getBlockIcon(block: WorkflowBlock) {
  if (block.family === "Source") {
    return FileText;
  }
  if (block.family === "Logic") {
    return Calculator;
  }
  if (block.family === "Review / Validation") {
    return ShieldCheck;
  }
  if (block.family === "Protected") {
    return LockKeyhole;
  }
  if (block.family === "AI / Agent") {
    return Bot;
  }
  return Download;
}

function getProtectedBlocks(definition: WorkflowDefinition) {
  return sortBlocksForWorksheet(
    definition.blocks.filter((block) => block.family === "Protected")
  );
}

function getBlockRuns(
  definition: WorkflowDefinition,
  blockId: string | undefined
): BlockRun[] {
  if (!blockId) {
    return definition.mockRuns;
  }
  return definition.mockRuns.filter((run) => run.blockId === blockId);
}

function CompactJson({ value }: { value: unknown }) {
  return (
    <pre className="max-h-32 overflow-auto rounded border bg-background/70 p-2 text-[11px]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function StatusPill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "danger" | "muted" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase",
        tone === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        tone === "danger" &&
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
        tone === "muted" && "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This row owns the small tree UI and contextual actions for each block family.
function StructureRow({
  actions,
  depth,
  row,
  selectedBlockId,
}: {
  actions: BottomPanelActions;
  depth: number;
  row: StructureTreeRow;
  selectedBlockId: string | null;
}) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = getBlockIcon(row.block);
  const isSelected = selectedBlockId === row.block.id;
  const isSource = row.block.family === "Source";
  const editable = !isSource;

  return (
    <div className={cn(depth > 0 && "border-border/60 border-l pl-3")}>
      <div
        className={cn(
          "group rounded-md border border-transparent px-2 py-1.5",
          isSelected && "border-primary/40 bg-primary/5",
          !isSelected && "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-2">
          <button
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
            disabled={row.children.length === 0}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {row.children.length > 0 ? (
              open ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )
            ) : (
              <span className="size-1 rounded-full bg-muted-foreground/50" />
            )}
          </button>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => actions.selectBlock(row.block.id)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium text-sm">
                {row.block.label}
              </span>
              {row.inferred && <StatusPill>mapped</StatusPill>}
              {row.edge && (
                <span className="text-[10px] text-muted-foreground">
                  {formatRelationshipType(row.edge.relationshipType)}
                </span>
              )}
              {row.block.governance?.protected && (
                <StatusPill tone="warning">governed</StatusPill>
              )}
              {row.block.runtime.visible ? (
                <StatusPill tone="success">runtime</StatusPill>
              ) : (
                <StatusPill>hidden</StatusPill>
              )}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
              {row.block.family} / {row.block.subtype}
              {row.block.governance?.requiresUnlockToEdit && (
                <span>explicit edit intent</span>
              )}
              {row.block.governance?.lockedInRuntime && (
                <span>runtime locked</span>
              )}
              {isSource && <span>read-only evidence</span>}
              {row.edge?.reason && <span>{row.edge.reason}</span>}
            </span>
          </button>
          <Button
            onClick={() => actions.selectBlock(row.block.id)}
            size="sm"
            variant="ghost"
          >
            Open
          </Button>
        </div>

        {isSelected && (
          <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
            {editable ? (
              <Input
                className="h-8 w-60"
                onChange={(event) =>
                  actions.renameBlock(row.block.id, event.target.value)
                }
                value={row.block.label}
              />
            ) : (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-700 text-xs dark:text-amber-300">
                Source rows are read-only. Create downstream Logic to correct or
                reinterpret evidence.
              </div>
            )}
            {row.block.governance && (
              <div className="flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1 text-xs">
                <LockKeyhole className="size-3.5 text-muted-foreground" />
                <span>
                  Draft editable:{" "}
                  {row.block.governance.requiresUnlockToEdit
                    ? "unlock intent required"
                    : "yes"}
                </span>
                <span className="text-muted-foreground">
                  Runtime:{" "}
                  {row.block.governance.lockedInRuntime ? "locked" : "editable"}
                </span>
                {row.block.governance.editIntent && (
                  <span className="text-muted-foreground">
                    Intent: {row.block.governance.editIntent}
                  </span>
                )}
              </div>
            )}
            <Button
              disabled={isSource}
              onClick={() => actions.addChildLogic(row.block.id)}
              size="sm"
              variant="secondary"
            >
              <Plus className="mr-1 size-3.5" />
              Add child
            </Button>
            <Button
              disabled={isSource}
              onClick={() => actions.toggleRuntimeVisibility(row.block.id)}
              size="sm"
              variant="secondary"
            >
              {row.block.runtime.visible ? (
                <Eye className="mr-1 size-3.5" />
              ) : (
                <EyeOff className="mr-1 size-3.5" />
              )}
              Runtime
            </Button>
            <Button
              disabled={isSource || depth === 0}
              onClick={() => actions.deleteBlock(row.block.id)}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete child
            </Button>
            {isSource && (
              <>
                <Button
                  onClick={() =>
                    toast.warning(
                      "Source evidence is locked. Add downstream Logic instead."
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Edit source value
                </Button>
                <Button
                  onClick={() =>
                    actions.createSourceLogic(row.block.id, "derived")
                  }
                  size="sm"
                  variant="secondary"
                >
                  Create derived Logic
                </Button>
                <Button
                  onClick={() =>
                    actions.createSourceLogic(row.block.id, "correction")
                  }
                  size="sm"
                  variant="secondary"
                >
                  Create correction Logic
                </Button>
                <Button
                  onClick={() =>
                    actions.createSourceLogic(row.block.id, "annotation")
                  }
                  size="sm"
                  variant="secondary"
                >
                  Create annotation Logic
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {open && row.children.length > 0 && (
        <div className="mt-1 space-y-1 pl-4">
          {row.children.map((child) => (
            <StructureRow
              actions={actions}
              depth={depth + 1}
              key={`${row.block.id}-${child.block.id}-${child.edge?.id || "inferred"}`}
              row={child}
              selectedBlockId={selectedBlockId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StructurePreview({
  actions,
  definition,
  selectedBlockId,
}: {
  actions: BottomPanelActions;
  definition: WorkflowDefinition;
  selectedBlockId: string | null;
}) {
  const tree = useMemo(() => buildStructureTree(definition), [definition]);

  // TODO: Add drag reorder once structure parent/child semantics stabilize.
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <GitBranch className="size-4 text-muted-foreground" />
            Generated worksheet/runtime preview
          </h3>
          <p className="text-muted-foreground text-xs">
            Structured from typed blocks and schema edges. Reorder is
            intentionally light in v1.
          </p>
          <p className="text-muted-foreground text-xs">
            Runtime config: {definition.runtimeUiConfig.runtimeConfigId} -
            generated {definition.runtimeUiConfig.generatedAt}
          </p>
        </div>
        <StatusPill>{definition.structure.blockOrder.length} rows</StatusPill>
      </div>
      <div className="space-y-1">
        {tree.map((row) => (
          <StructureRow
            actions={actions}
            depth={0}
            key={row.block.id}
            row={row}
            selectedBlockId={selectedBlockId}
          />
        ))}
      </div>
    </div>
  );
}

function SourceEvidenceCard({
  actions,
  block,
}: {
  actions: BottomPanelActions;
  block: WorkflowBlock;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-md border bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{block.label}</h3>
          <StatusPill>read-only</StatusPill>
        </div>
        <div className="mb-2 text-muted-foreground text-xs">
          Runtime config marks Source evidence as read-only.
        </div>
        <div className="space-y-1 text-sm">
          <div>Subtype: {block.subtype}</div>
          <div className="text-muted-foreground">
            Locator: {block.source?.locator || "mock://source"}
          </div>
          <div className="text-muted-foreground">
            Preview: {block.source?.valuePreview || block.runtime.outputKey}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => actions.createSourceLogic(block.id, "derived")}
            size="sm"
            variant="secondary"
          >
            Create derived Logic
          </Button>
          <Button
            onClick={() => actions.createSourceLogic(block.id, "correction")}
            size="sm"
            variant="secondary"
          >
            Create correction Logic
          </Button>
          <Button
            onClick={() => actions.createSourceLogic(block.id, "annotation")}
            size="sm"
            variant="secondary"
          >
            Create annotation Logic
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-muted/20 p-3">
        <h3 className="mb-2 font-semibold text-sm">Mock Extracted Data</h3>
        <CompactJson
          value={{
            extractionLogs: [
              "Source captured locally",
              "Locator locked as evidence",
              "No OCR or external extraction in v1",
            ],
            rows: LOCAL_SAMPLE_DATASET.rows,
            sourceDocuments: LOCAL_SAMPLE_DATASET.sourceDocuments,
          }}
        />
      </div>
    </div>
  );
}

function TraceList({ traces }: { traces: SourceTrace[] }) {
  if (traces.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 p-3 text-muted-foreground text-sm">
        No upstream source trace is linked yet.
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {traces.map((trace) => (
        <div
          className="rounded-md border bg-muted/20 p-3 text-sm"
          key={`${trace.source.id}-${trace.path.map((item) => item.id).join("-")}`}
        >
          <div className="mb-1 flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">{trace.source.label}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {trace.path.map((item) => item.label).join(" -> ")}
          </div>
          {trace.edges.length > 0 && (
            <div className="mt-2 space-y-1 text-[11px]">
              {trace.edges.map((edge) => (
                <div
                  className="rounded border bg-background/60 px-2 py-1"
                  key={edge.id}
                >
                  <span className="font-medium">
                    {formatRelationshipType(edge.relationshipType)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    - {edge.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            {trace.source.source?.locator || trace.source.runtime.outputKey}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourcesPreview({
  actions,
  definition,
  selectedBlock,
}: {
  actions: BottomPanelActions;
  definition: WorkflowDefinition;
  selectedBlock: WorkflowBlock | null;
}) {
  if (!selectedBlock) {
    const sources = sortBlocksForWorksheet(
      definition.blocks.filter((block) => block.family === "Source")
    );

    return (
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((block) => (
          <button
            className="rounded-md border bg-muted/20 p-3 text-left text-sm"
            key={block.id}
            onClick={() => actions.selectBlock(block.id)}
            type="button"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium">{block.label}</span>
              <StatusPill>read-only</StatusPill>
            </div>
            <div className="truncate text-muted-foreground text-xs">
              {block.source?.locator || block.runtime.outputKey}
            </div>
          </button>
        ))}
      </div>
    );
  }

  const traces = collectSourceTraces(definition, selectedBlock);
  const incoming = getIncomingEdges(definition);
  const blockMap = getBlockMap(definition);
  const checkedBlocks = (incoming.get(selectedBlock.id) || [])
    .map((edge) => blockMap.get(edge.sourceBlockId))
    .filter((block): block is WorkflowBlock => Boolean(block));

  if (selectedBlock.family === "Source") {
    return <SourceEvidenceCard actions={actions} block={selectedBlock} />;
  }

  if (selectedBlock.family === "Review / Validation") {
    return (
      <div className="space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          {checkedBlocks.map((block) => (
            <button
              className="rounded-md border bg-muted/20 p-3 text-left text-sm"
              key={block.id}
              onClick={() => actions.selectBlock(block.id)}
              type="button"
            >
              <div className="font-medium">{block.label}</div>
              <div className="text-muted-foreground text-xs">
                {block.family} / {block.subtype}
              </div>
            </button>
          ))}
        </div>
        <CompactJson
          value={{
            warnings: ["Low confidence rows require review"],
            validationEvidence: traces.map((trace) => trace.source.label),
            mockOnly: true,
          }}
        />
      </div>
    );
  }

  if (selectedBlock.family === "AI / Agent") {
    if (definition.aiProposals.length === 0) {
      return (
        <div className="rounded-md border bg-muted/20 p-3 text-muted-foreground text-sm">
          No local AI proposals have been saved. AI blocks remain proposal-only
          in this prototype.
        </div>
      );
    }

    return (
      <div className="grid gap-2 md:grid-cols-2">
        {definition.aiProposals.map((proposal) => (
          <div className="rounded-md border bg-muted/20 p-3" key={proposal.id}>
            <div className="font-medium text-sm">
              {proposal.interpretedPlan}
            </div>
            <div className="mt-1 text-muted-foreground text-xs">
              {proposal.status} - {proposal.selectedTools.join(", ")}
            </div>
            <CompactJson value={proposal.generatedCodeOrFormulas} />
          </div>
        ))}
      </div>
    );
  }

  if (selectedBlock.family === "Output") {
    const outputRelationshipEdges = definition.edges.filter(
      (edge) =>
        edge.targetBlockId === selectedBlock.id &&
        isOutputMappingRelationshipType(edge.relationshipType)
    );
    const mappedProtectedBlocks = outputRelationshipEdges
      .filter((edge) => isGovernedOutputRelationshipType(edge.relationshipType))
      .map((edge) =>
        definition.blocks.find((block) => block.id === edge.sourceBlockId)
      )
      .filter((block): block is WorkflowBlock => block?.family === "Protected");
    const candidateLogicBlocks = outputRelationshipEdges
      .filter((edge) =>
        isCandidateOutputRelationshipType(edge.relationshipType)
      )
      .map((edge) =>
        definition.blocks.find((block) => block.id === edge.sourceBlockId)
      )
      .filter((block): block is WorkflowBlock => block?.family === "Logic");

    return (
      <div className="space-y-3">
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="font-medium">Protected values included</div>
          <div className="mt-2 grid gap-1 md:grid-cols-3">
            {mappedProtectedBlocks.slice(0, 12).map((block) => (
              <button
                className="truncate rounded border bg-background/60 px-2 py-1 text-left text-xs"
                key={block.id}
                onClick={() => actions.selectBlock(block.id)}
                type="button"
              >
                {block.label}
              </button>
            ))}
          </div>
          {candidateLogicBlocks.length > 0 && (
            <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-amber-800 text-xs dark:text-amber-200">
              <div>{LOGIC_OUTPUT_GOVERNANCE_WARNING}</div>
              <div className="mt-1">
                Candidate logic inputs:{" "}
                {candidateLogicBlocks
                  .slice(0, 5)
                  .map((block) => block.label)
                  .join(", ")}
              </div>
            </div>
          )}
        </div>
        <TraceList traces={traces} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/20 p-3">
        <h3 className="font-semibold text-sm">
          Source trace for {selectedBlock.label}
        </h3>
        <p className="text-muted-foreground text-xs">
          Upstream source evidence is grouped by schema relationship.
        </p>
      </div>
      <TraceList traces={traces} />
    </div>
  );
}

function OutputsPreview({
  definition,
  selectedBlock,
}: {
  definition: WorkflowDefinition;
  selectedBlock: WorkflowBlock | null;
}) {
  const outputBlocks = sortBlocksForWorksheet(
    definition.blocks.filter((block) => block.family === "Output")
  );
  const protectedBlocks = getProtectedBlocks(definition);
  const outputPreviewById = new Map(
    definition.outputMappingPreview.outputs.map((output) => [
      output.outputBlockId,
      output,
    ])
  );

  if (outputBlocks.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 p-3 text-muted-foreground text-sm">
        No output blocks are present yet. Add an Output block from the palette
        to preview local export readiness.
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {outputBlocks.map((block) => {
        const preview = outputPreviewById.get(block.id);
        const mappedEdges = definition.edges.filter(
          (edge) =>
            edge.targetBlockId === block.id &&
            isOutputMappingRelationshipType(edge.relationshipType)
        );
        const mappedProtectedBlocks = mappedEdges
          .filter((edge) =>
            isGovernedOutputRelationshipType(edge.relationshipType)
          )
          .map((edge) =>
            protectedBlocks.find(
              (protectedBlock) => protectedBlock.id === edge.sourceBlockId
            )
          )
          .filter((item): item is WorkflowBlock => Boolean(item));
        const candidateLogicBlocks = mappedEdges
          .filter((edge) =>
            isCandidateOutputRelationshipType(edge.relationshipType)
          )
          .map((edge) =>
            definition.blocks.find((item) => item.id === edge.sourceBlockId)
          )
          .filter((item): item is WorkflowBlock => item?.family === "Logic");
        const missing = [
          mappedEdges.length === 0 ? "No output mapping relationship" : "",
          mappedProtectedBlocks.length === 0
            ? "No protected values mapped"
            : "",
        ].filter(Boolean);
        const ready = missing.length === 0;
        const statusReady = preview
          ? preview.readinessStatus === "ready"
          : ready;

        return (
          <div
            className={cn(
              "rounded-md border bg-muted/20 p-3",
              selectedBlock?.id === block.id && "border-primary/40 bg-primary/5"
            )}
            key={block.id}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm">{block.label}</div>
                <div className="text-muted-foreground text-xs">
                  {block.subtype}
                </div>
              </div>
              <StatusPill tone={statusReady ? "success" : "warning"}>
                {statusReady ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    missing
                  </span>
                )}
              </StatusPill>
            </div>
            <div className="space-y-1 text-xs">
              <div>Mapped protected values: {mappedProtectedBlocks.length}</div>
              {preview && (
                <div>
                  Published/draft preview: {preview.readinessStatus} (
                  {preview.mappedProtectedValues.length} governed,{" "}
                  {preview.candidateLogicMappings.length} candidate)
                </div>
              )}
              {candidateLogicBlocks.length > 0 && (
                <div>Candidate logic inputs: {candidateLogicBlocks.length}</div>
              )}
              <div className="line-clamp-2 text-muted-foreground">
                {mappedProtectedBlocks
                  .slice(0, 5)
                  .map((protectedBlock) => protectedBlock.label)
                  .join(", ")}
              </div>
              {mappedEdges.slice(0, 3).map((edge) => (
                <div className="text-muted-foreground" key={edge.id}>
                  {formatRelationshipType(edge.relationshipType)}: {edge.reason}
                </div>
              ))}
              {preview?.governanceWarnings.map((warning) => (
                <div
                  className="text-amber-700 dark:text-amber-300"
                  key={warning}
                >
                  {warning}
                </div>
              ))}
              <div>Mock export readiness: local JSON only</div>
              {preview?.mockPayloadPreview && (
                <CompactJson value={preview.mockPayloadPreview} />
              )}
              {missing.length > 0 && (
                <div className="text-amber-700 dark:text-amber-300">
                  {missing.join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunsPreview({
  definition,
  selectedBlock,
}: {
  definition: WorkflowDefinition;
  selectedBlock: WorkflowBlock | null;
}) {
  const executionLogs = useAtomValue(executionLogsAtom);
  const records = loadLocalRunRecords();
  const selectedRuns = getBlockRuns(definition, selectedBlock?.id);
  const selectedExecutionLog = selectedBlock
    ? executionLogs[selectedBlock.id]
    : undefined;
  const selectedBlockEdges = selectedBlock
    ? definition.edges.filter(
        (edge) =>
          edge.sourceBlockId === selectedBlock.id ||
          edge.targetBlockId === selectedBlock.id
      )
    : [];
  const lastRecord = records[0];
  const selectedLog = selectedBlock
    ? lastRecord?.logs.find((log) => log.nodeId === selectedBlock.id)
    : undefined;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="font-medium text-sm">Workflow mock run history</div>
          <div className="mt-2 space-y-1 text-sm">
            {records.length === 0 ? (
              <div className="text-muted-foreground">
                No toolbar run has been executed yet.
              </div>
            ) : (
              records.slice(0, 4).map((record) => (
                <div
                  className="flex items-center justify-between gap-3"
                  key={record.execution.id}
                >
                  <span>
                    {record.execution.id.replace("local-run-", "Run ")}
                  </span>
                  <StatusPill tone="success">
                    {record.execution.status}
                  </StatusPill>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="font-medium text-sm">Local workflow events</div>
          <div className="mt-2 space-y-1 text-sm">
            {definition.events.length === 0 ? (
              <div className="text-muted-foreground">
                No local save/import/export/publish events recorded yet.
              </div>
            ) : (
              definition.events.slice(0, 5).map((event) => (
                <div
                  className="rounded border bg-background/60 p-2"
                  key={event.id}
                >
                  <div className="font-medium">{event.message}</div>
                  <div className="text-muted-foreground text-xs">
                    {event.type} - {event.createdAt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="font-medium text-sm">Definition mock runs</div>
          <div className="mt-2 grid gap-1 md:grid-cols-2">
            {definition.mockRuns.slice(0, 8).map((run) => (
              <div
                className="rounded border bg-background/60 p-2 text-xs"
                key={run.id}
              >
                <div className="font-medium">{run.blockLabel}</div>
                <div className="text-muted-foreground">{run.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-medium text-sm">
              Selected block run: {selectedBlock?.label || "Workflow"}
            </div>
            <StatusPill tone={selectedExecutionLog ? "success" : "muted"}>
              {selectedExecutionLog?.status ||
                selectedRuns[0]?.status ||
                "mock"}
            </StatusPill>
          </div>
          <CompactJson
            value={{
              definitionRuns: selectedRuns,
              lastExecutionOutput: selectedExecutionLog?.output,
              sampleInput: selectedLog?.input || {
                workflowRun: lastRecord?.execution.id,
                blockCount: definition.blocks.length,
              },
              sampleOutput: selectedLog?.output || lastRecord?.execution,
              relationshipNotes: selectedBlockEdges.map((edge) => ({
                relationship: formatRelationshipType(edge.relationshipType),
                reason: edge.reason,
                notes: edge.notes,
                status: edge.status,
              })),
              warnings:
                selectedRuns[0]?.status === "warning"
                  ? ["Mock warning retained from sample definition"]
                  : [],
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DebugPreview({
  definition,
  selectedBlockId,
  selectedEdgeId,
}: {
  definition: WorkflowDefinition;
  selectedBlockId: string | null;
  selectedEdgeId: string | null;
}) {
  const countsByFamily: Record<string, number> = {};
  for (const block of definition.blocks) {
    countsByFamily[block.family] = (countsByFamily[block.family] || 0) + 1;
  }
  const edgeCountByStatus: Record<string, number> = {};
  for (const edge of definition.edges) {
    edgeCountByStatus[edge.status] = (edgeCountByStatus[edge.status] || 0) + 1;
  }
  const selectedEdge = definition.edges.find(
    (edge) => edge.id === selectedEdgeId
  );

  return (
    <CompactJson
      value={{
        aiProposalCount: definition.aiProposals.length,
        countsByFamily,
        edgeCount: definition.edges.length,
        edgeCountByStatus,
        latestPublishedVersionId: definition.latestPublishedVersionId,
        mockRunCount: definition.mockRuns.length,
        outputMappingPreviewCount:
          definition.outputMappingPreview.outputs.length,
        publishedVersion: definition.publishedVersion,
        publishedSnapshotCount: definition.versionSnapshots.filter(
          (snapshot) => snapshot.status === "published"
        ).length,
        runtimeConfigGeneratedAt: definition.runtimeUiConfig.generatedAt,
        runtimeConfigId: definition.runtimeUiConfig.runtimeConfigId,
        schemaVersion: definition.schemaVersion,
        selectedBlockId,
        selectedEdgeId,
        selectedEdgeRelationship: selectedEdge
          ? {
              reason: selectedEdge.reason,
              relationshipType: selectedEdge.relationshipType,
              status: selectedEdge.status,
            }
          : null,
        workflowId: definition.id,
      }}
    />
  );
}

function BottomPanel({
  isMobile,
  paletteOpen,
  rightPanelCollapsed,
  rightPanelWidthPercent,
}: WorkflowStudioShellProps & { paletteOpen: boolean }) {
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges, setEdges] = useAtom(edgesAtom);
  const workflowName = useAtomValue(currentWorkflowNameAtom);
  useAtomValue(localWorkflowRevisionAtom);
  const selectedBlockId = useAtomValue(selectedNodeAtom);
  const selectedEdgeId = useAtomValue(selectedEdgeAtom);
  const setSelectedBlockId = useSetAtom(selectedNodeAtom);
  const setSelectedEdgeId = useSetAtom(selectedEdgeAtom);
  const setActiveInspectorTab = useSetAtom(propertiesPanelActiveTabAtom);
  const addNode = useSetAtom(addNodeAtom);
  const deleteNode = useSetAtom(deleteNodeAtom);
  const updateNodeData = useSetAtom(updateNodeDataAtom);
  const setHasUnsavedChanges = useSetAtom(hasUnsavedChangesAtom);
  const triggerAutosave = useSetAtom(autosaveAtom);
  const [expanded, setExpanded] = useState(true);
  const leftOffset = paletteOpen && !isMobile ? "21rem" : "4.75rem";
  const rightOffset =
    isMobile || rightPanelCollapsed
      ? "0.75rem"
      : `calc(${rightPanelWidthPercent}% + 0.75rem)`;
  const definition = createWorkflowDefinitionFromCanvas({
    name: workflowName || "Fiscal Workflow Studio",
    nodes,
    edges,
    existing: loadLocalWorkflowSnapshot(),
  });
  const selectedBlock = getSelectedBlock(definition, selectedBlockId);

  const selectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    setSelectedEdgeId(null);
    setActiveInspectorTab("properties");
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, selected: node.id === blockId }))
    );
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({ ...edge, selected: false }))
    );
  };

  const addSchemaEdge = ({
    reason,
    relationshipType,
    sourceBlock: sourceBlockOverride,
    sourceBlockId,
    targetBlock: targetBlockOverride,
    targetBlockId,
  }: Pick<SchemaWorkflowEdge, "sourceBlockId" | "targetBlockId"> &
    Partial<Pick<SchemaWorkflowEdge, "reason" | "relationshipType">> & {
      sourceBlock?: WorkflowBlock;
      targetBlock?: WorkflowBlock;
    }) => {
    const sourceBlock =
      sourceBlockOverride ||
      nodes.find((node) => node.id === sourceBlockId)?.data.block;
    const targetBlock =
      targetBlockOverride ||
      nodes.find((node) => node.id === targetBlockId)?.data.block;
    const defaults =
      sourceBlock && targetBlock
        ? getWorkflowEdgeDefaults({ sourceBlock, targetBlock })
        : null;
    const finalRelationshipType =
      relationshipType || defaults?.relationshipType;

    if (!finalRelationshipType) {
      toast.warning("That typed relationship is not supported in Structure.");
      return;
    }

    const workflowEdge = createWorkflowEdgeRecord({
      id: `edge-${sourceBlockId}-${targetBlockId}-${nanoid(6)}`,
      sourceBlockId,
      targetBlockId,
      relationshipType: finalRelationshipType,
      reason: reason || defaults?.reason || "Structure relationship created.",
      confidence: 0.95,
    });
    const canvasEdge = createCanvasEdgeFromWorkflowEdge(workflowEdge);
    setEdges((currentEdges) => [...currentEdges, canvasEdge]);
    setHasUnsavedChanges(true);
    triggerAutosave({ immediate: true });
  };

  const addChildLogic = (parentId: string) => {
    const parentNode = nodes.find((node) => node.id === parentId);
    const parentBlock = parentNode?.data.block;
    if (!(parentNode && parentBlock) || parentBlock.family === "Source") {
      toast.warning(
        "Source rows are read-only. Create downstream Logic instead."
      );
      return;
    }

    const childId = nanoid();
    const childBlock = createWorkflowBlockFromCatalog("logic:transformation", {
      id: childId,
      label: `Child Logic for ${parentBlock.label}`,
      description: "Draft logic row added from Structure.",
      position: {
        x: parentNode.position.x - 260,
        y: parentNode.position.y + 90 + (nodes.length % 3) * 36,
      },
      config: {
        inputs: parentBlock.runtime.outputKey || parentBlock.label,
        outputs: `derived${nodes.length + 1}`,
      },
      status: "draft",
    });
    const childNode = createWorkflowNodeFromBlock(childBlock, {
      selected: true,
    });
    addNode(childNode);
    addSchemaEdge({
      sourceBlock: childBlock,
      sourceBlockId: childBlock.id,
      targetBlock: parentBlock,
      targetBlockId: parentBlock.id,
      reason: `${childBlock.label} is a child logic row for ${parentBlock.label}.`,
    });
    setActiveInspectorTab("properties");
    toast.success("Child Logic added to Structure.");
  };

  const createSourceLogic = (
    sourceId: string,
    variant: "annotation" | "correction" | "derived"
  ) => {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const sourceBlock = sourceNode?.data.block;
    if (!(sourceNode && sourceBlock) || sourceBlock.family !== "Source") {
      return;
    }

    const labelByVariant = {
      annotation: `Annotation Logic for ${sourceBlock.label}`,
      correction: `Correction Logic for ${sourceBlock.label}`,
      derived: `Derived Logic from ${sourceBlock.label}`,
    };
    const newBlockId = nanoid();
    const logicBlock = createWorkflowBlockFromCatalog(
      variant === "annotation"
        ? "logic:classification-mapping"
        : "logic:transformation",
      {
        id: newBlockId,
        label: labelByVariant[variant],
        description: "Downstream Logic created from immutable source evidence.",
        position: {
          x: sourceNode.position.x + 300,
          y: sourceNode.position.y + 60 + (nodes.length % 4) * 34,
        },
        config: {
          inputs: sourceBlock.runtime.outputKey || sourceBlock.label,
          outputs: `${variant}Logic${nodes.length + 1}`,
          sourceEvidenceId: sourceBlock.id,
        },
        status: "draft",
      }
    );
    addNode(createWorkflowNodeFromBlock(logicBlock, { selected: true }));
    addSchemaEdge({
      sourceBlock,
      sourceBlockId: sourceBlock.id,
      targetBlock: logicBlock,
      targetBlockId: logicBlock.id,
      reason: `${sourceBlock.label} remains immutable evidence for downstream ${variant} logic.`,
    });
    setActiveInspectorTab("properties");
    toast.success(`${labelByVariant[variant]} created.`);
  };

  const deleteBlock = (blockId: string) => {
    const node = nodes.find((item) => item.id === blockId);
    if (node?.data.block?.family === "Source") {
      toast.warning("Source evidence leaves cannot be deleted from Structure.");
      return;
    }
    deleteNode(blockId);
  };

  const renameBlock = (blockId: string, label: string) => {
    const node = nodes.find((item) => item.id === blockId);
    if (node?.data.block?.family === "Source") {
      toast.warning("Source labels are locked once treated as evidence.");
      return;
    }
    updateNodeData({ id: blockId, data: { label } });
  };

  const toggleRuntimeVisibility = (blockId: string) => {
    const node = nodes.find((item) => item.id === blockId);
    const block = node?.data.block;
    if (!(node && block) || block.family === "Source") {
      toast.warning(
        "Source evidence visibility is controlled by evidence policy."
      );
      return;
    }

    const visible = !block.runtime.visible;
    updateNodeData({
      id: blockId,
      data: {
        block: {
          ...block,
          runtime: { ...block.runtime, visible },
          updatedAt: new Date().toISOString(),
        },
        config: { ...node.data.config, runtimeVisible: visible },
      },
    });
  };

  const actions: BottomPanelActions = {
    addChildLogic,
    createSourceLogic,
    deleteBlock,
    renameBlock,
    selectBlock,
    toggleRuntimeVisibility,
  };

  return (
    <section
      className="pointer-events-auto absolute z-20 rounded-md border bg-background/95 shadow-sm backdrop-blur"
      style={{
        bottom: "0.75rem",
        left: isMobile ? "0.75rem" : leftOffset,
        right: isMobile ? "0.75rem" : rightOffset,
      }}
    >
      <div className="flex h-11 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <ListTree className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Runtime Preview</h2>
        </div>
        <Button
          onClick={() => setExpanded(!expanded)}
          size="icon"
          title={
            expanded ? "Collapse runtime preview" : "Expand runtime preview"
          }
          variant="ghost"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <Tabs className="flex h-80 flex-col gap-0" defaultValue="structure">
          <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent px-3 py-1">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="runs">Runs / Logs</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <TabsContent className="mt-0" value="structure">
              <StructurePreview
                actions={actions}
                definition={definition}
                selectedBlockId={selectedBlockId}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="sources">
              <SourcesPreview
                actions={actions}
                definition={definition}
                selectedBlock={selectedBlock}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="outputs">
              <OutputsPreview
                definition={definition}
                selectedBlock={selectedBlock}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="runs">
              <RunsPreview
                definition={definition}
                selectedBlock={selectedBlock}
              />
            </TabsContent>
            <TabsContent className="mt-0" value="debug">
              <DebugPreview
                definition={definition}
                selectedBlockId={selectedBlockId}
                selectedEdgeId={selectedEdgeId}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </section>
  );
}

export function WorkflowStudioShell({
  isMobile,
  rightPanelCollapsed,
  rightPanelWidthPercent,
}: WorkflowStudioShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);

  if (isMobile) {
    return (
      <BottomPanel
        isMobile={isMobile}
        paletteOpen={false}
        rightPanelCollapsed={rightPanelCollapsed}
        rightPanelWidthPercent={rightPanelWidthPercent}
      />
    );
  }

  return (
    <>
      <LeftRail paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen} />
      {!paletteOpen && (
        <Button
          className="-translate-y-1/2 pointer-events-auto absolute top-1/2 left-[4.5rem] z-20 h-12 w-7 rounded-r-full rounded-l-none border border-l-0 bg-background shadow-sm hover:bg-muted"
          onClick={() => setPaletteOpen(true)}
          size="icon"
          title="Open palette"
          variant="secondary"
        >
          <ChevronRight className="size-4" />
        </Button>
      )}
      <PalettePanel
        open={paletteOpen}
        recentIds={recentIds}
        search={search}
        setOpen={setPaletteOpen}
        setRecentIds={setRecentIds}
        setSearch={setSearch}
      />
      <BottomPanel
        isMobile={isMobile}
        paletteOpen={paletteOpen}
        rightPanelCollapsed={rightPanelCollapsed}
        rightPanelWidthPercent={rightPanelWidthPercent}
      />
    </>
  );
}
