import {
  Archive,
  BadgeCheck,
  Bot,
  Braces,
  Calculator,
  CheckCircle2,
  Code2,
  Database,
  Download,
  FileJson,
  FileLock2,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe,
  LockKeyhole,
  type LucideIcon,
  PencilLine,
  Search,
  ShieldCheck,
  Shuffle,
  Sigma,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  BlockFamily,
  BlockSubtype,
  WorkflowBlock,
} from "@/lib/local-fiscal-workflow";
import type { WorkflowNodeData } from "@/lib/workflow-store";

type CanvasFamily = BlockFamily | "Generic";

type FamilyNodeStyle = {
  badgeClassName: string;
  captionClassName: string;
  contentClassName: string;
  nodeClassName: string;
};

const TRAILING_TYPE_WORDS: Partial<Record<BlockSubtype, string[]>> = {
  "Approval Gate": ["gate"],
  "CSV Export": ["export"],
  "Excel Export": ["export"],
  "Evidence Pack": ["pack"],
  "Low Confidence Warning": ["warning"],
  "Manual Override Review": ["review"],
  "Missing Source Check": ["check"],
  "ONESOURCE Handoff": ["handoff"],
  "Output Readiness Check": ["check"],
  "Required Input Check": ["check"],
  "Taxprep Handoff": ["handoff"],
};

const FAMILY_NODE_STYLES: Record<BlockFamily, FamilyNodeStyle> = {
  "AI / Agent": {
    badgeClassName: "top-1 border-fuchsia-400/70 bg-[#211f28] text-fuchsia-200",
    captionClassName: "w-44",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "size-28 overflow-visible rounded-full border-0 bg-transparent p-0 shadow-none",
  },
  Logic: {
    badgeClassName: "top-1 border-emerald-400/70 bg-[#211f28] text-emerald-200",
    captionClassName: "w-44",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "size-24 overflow-visible rounded-sm border-0 bg-transparent p-0 shadow-none",
  },
  Output: {
    badgeClassName: "top-1 border-indigo-400/70 bg-[#211f28] text-indigo-200",
    captionClassName: "w-48",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "h-28 w-24 overflow-visible rounded-md border-0 bg-transparent p-0 shadow-none",
  },
  Protected: {
    badgeClassName: "top-1 border-violet-400/70 bg-[#211f28] text-violet-200",
    captionClassName: "w-64",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "h-24 w-56 overflow-visible rounded-sm border-0 bg-transparent p-0 shadow-none",
  },
  "Review / Validation": {
    badgeClassName: "top-1 border-amber-400/70 bg-[#211f28] text-amber-200",
    captionClassName: "w-48",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "size-28 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none",
  },
  Source: {
    badgeClassName: "top-1 border-sky-400/70 bg-[#211f28] text-sky-200",
    captionClassName: "w-48",
    contentClassName: "h-full w-full p-0",
    nodeClassName:
      "h-28 w-28 overflow-visible rounded-md border-0 bg-transparent p-0 shadow-none",
  },
};

function getFamilyFromRole(role: WorkflowNodeData["visualRole"]): CanvasFamily {
  if (role === "source" || role === "evidence") {
    return "Source";
  }
  if (role === "logic" || role === "calculation" || role === "step") {
    return "Logic";
  }
  if (role === "review" || role === "validation") {
    return "Review / Validation";
  }
  if (role === "protected") {
    return "Protected";
  }
  if (role === "output") {
    return "Output";
  }
  return "Generic";
}

export function resolveCanvasFamily(data: WorkflowNodeData): CanvasFamily {
  const configFamily = data.config?.blockFamily as BlockFamily | undefined;
  return (
    data.block?.family || configFamily || getFamilyFromRole(data.visualRole)
  );
}

export function getFamilyNodeStyle(
  data: WorkflowNodeData
): FamilyNodeStyle | null {
  const family = resolveCanvasFamily(data);
  return family === "Generic" ? null : FAMILY_NODE_STYLES[family];
}

function stripLeadingType(title: string, typeName: string): string {
  const trimmedTitle = title.trim();
  const trimmedType = typeName.trim();
  const lowerTitle = trimmedTitle.toLowerCase();
  const lowerType = trimmedType.toLowerCase();

  if (lowerTitle === lowerType) {
    return trimmedTitle;
  }

  for (const separator of [": ", " - ", " / ", " "]) {
    const prefix = `${lowerType}${separator}`;
    if (lowerTitle.startsWith(prefix)) {
      return trimmedTitle.slice(trimmedType.length + separator.length).trim();
    }
  }

  return trimmedTitle;
}

function stripTrailingTypeWord(title: string, typeWord: string): string {
  const trimmedTitle = title.trim();
  const suffix = ` ${typeWord.toLowerCase()}`;

  if (trimmedTitle.toLowerCase().endsWith(suffix)) {
    return trimmedTitle.slice(0, -suffix.length).trim();
  }

  return trimmedTitle;
}

export function getFamilyCanvasTitle(
  data: WorkflowNodeData,
  fallbackTitle: string
): string {
  const block = data.block;
  let title = (block?.label || data.label || fallbackTitle).trim();

  if (!block) {
    return title || fallbackTitle;
  }

  for (const typeName of [block.family, block.subtype]) {
    title = stripLeadingType(title, typeName);
  }

  if (block.family === "Source") {
    title = stripTrailingTypeWord(title, "source");
  }

  for (const word of TRAILING_TYPE_WORDS[block.subtype] || []) {
    title = stripTrailingTypeWord(title, word);
  }

  return title || fallbackTitle;
}

function getSubtypeIcon(subtype: BlockSubtype | undefined): LucideIcon {
  switch (subtype) {
    case "Manual Entry":
      return PencilLine;
    case "Excel / Workbook":
    case "Excel Export":
      return FileSpreadsheet;
    case "PDF / Document":
    case "PDF Report":
      return FileText;
    case "API / HTTP Request":
      return Braces;
    case "Database Query":
      return Database;
    case "Web / URL":
      return Globe;
    case "AI Search Result":
    case "AI Search":
      return Search;
    case "Formula":
      return Calculator;
    case "Aggregation":
      return Sigma;
    case "Transformation":
      return Shuffle;
    case "Condition":
      return GitBranch;
    case "Script":
      return Code2;
    case "Classification / Mapping":
      return GitBranch;
    case "Required Input Check":
    case "Output Readiness Check":
      return CheckCircle2;
    case "Missing Source Check":
    case "Low Confidence Warning":
      return TriangleAlert;
    case "Manual Override Review":
    case "Approval Gate":
      return ShieldCheck;
    case "Protected Input":
    case "Locked Rate":
      return LockKeyhole;
    case "Protected Result":
    case "Official Line":
    case "Final Reviewed Amount":
      return FileLock2;
    case "CSV Export":
      return Download;
    case "Evidence Pack":
      return Archive;
    case "Canonical JSON":
      return FileJson;
    case "Taxprep Handoff":
    case "ONESOURCE Handoff":
      return BadgeCheck;
    case "AI Mapping Suggestion":
    case "AI Formula Proposal":
    case "AI Workflow Proposal":
      return Sparkles;
    default:
      return Bot;
  }
}

function getIconForBlock(
  block: WorkflowBlock | undefined,
  fallback?: ReactNode
) {
  if (fallback) {
    return fallback;
  }
  const Icon = getSubtypeIcon(block?.subtype);
  return <Icon className="size-9" strokeWidth={1.7} />;
}

export function FamilyNodeShape({
  data,
  fallback,
}: {
  data: WorkflowNodeData;
  fallback?: ReactNode;
}) {
  const family = resolveCanvasFamily(data);
  const icon = getIconForBlock(data.block, fallback);

  if (family === "Source") {
    return (
      <div
        className="pointer-events-none relative flex h-24 w-28 items-center justify-center border-2 border-sky-300/55 bg-[#252b2e] text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_18px_40px_-24px_rgba(34,211,238,0.85)]"
        style={{ borderRadius: "3rem 0.85rem 0.85rem 3rem" }}
      >
        <div
          className="absolute inset-2 border border-cyan-200/5"
          style={{ borderRadius: "2.5rem 0.55rem 0.55rem 2.5rem" }}
        />
        <div className="-translate-y-1/2 absolute top-1/2 right-[-0.65rem] h-5 w-3 rounded-r-full border-2 border-cyan-200/40 border-l-0 bg-[#252b2e]" />
        <div className="relative z-10">{icon}</div>
      </div>
    );
  }

  if (family === "Logic") {
    return (
      <div className="pointer-events-none relative flex size-24 items-center justify-center rounded-sm border-2 border-emerald-400/75 bg-[#1f2825] text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_18px_40px_-24px_rgba(16,185,129,0.9)]">
        <div className="-translate-x-1/2 absolute top-0 left-1/2 h-1 w-16 rounded-full bg-emerald-300/85" />
        <div className="absolute inset-3 rounded-[3px] border border-emerald-300/15" />
        <div className="relative z-10">{icon}</div>
      </div>
    );
  }

  if (family === "Review / Validation") {
    return (
      <div className="pointer-events-none relative flex size-28 items-center justify-center">
        <div className="absolute size-20 rotate-45 rounded-sm border-2 border-amber-400/80 bg-[#2b251c] shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_40px_-24px_rgba(245,158,11,0.9)]" />
        <div className="absolute size-12 rotate-45 border border-amber-300/20" />
        <div className="relative z-10 text-amber-200">{icon}</div>
      </div>
    );
  }

  if (family === "Protected") {
    return (
      <div className="pointer-events-none relative flex h-16 w-52 items-center justify-center rounded-sm border-2 border-violet-400/75 bg-[#241f2e] text-violet-200 shadow-[0_0_0_1px_rgba(167,139,250,0.18),0_18px_40px_-24px_rgba(139,92,246,0.9)]">
        <div className="absolute inset-y-0 left-0 flex w-9 items-center justify-center border-violet-300/30 border-r bg-violet-300/10">
          <LockKeyhole className="size-4" />
        </div>
        <div className="absolute top-2 right-2 rounded-full border border-violet-300/40 px-1.5 py-0.5 font-semibold text-[9px] uppercase">
          locked
        </div>
        <div className="relative z-10">{icon}</div>
      </div>
    );
  }

  if (family === "Output") {
    return (
      <div className="pointer-events-none relative flex h-24 w-20 items-center justify-center rounded-md border-2 border-indigo-400/75 bg-[#202235] text-indigo-200 shadow-[0_0_0_1px_rgba(129,140,248,0.18),0_18px_40px_-24px_rgba(99,102,241,0.9)]">
        <div className="absolute top-0 right-0 size-7 rounded-bl-md border-indigo-300/35 border-b border-l bg-indigo-300/15 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
        <div className="absolute right-2 bottom-3 left-2 h-1 rounded-full bg-indigo-300/30" />
        <div className="relative z-10">{icon}</div>
      </div>
    );
  }

  if (family === "AI / Agent") {
    return (
      <div className="pointer-events-none relative flex size-24 items-center justify-center rounded-full border-2 border-fuchsia-400/80 bg-[#291f2e] text-fuchsia-200 shadow-[0_0_0_1px_rgba(217,70,239,0.18),0_18px_40px_-24px_rgba(192,38,211,0.9)]">
        <div className="absolute inset-3 rounded-full border border-fuchsia-300/35 border-dashed" />
        <div className="absolute top-3 right-5 size-2 rounded-full bg-fuchsia-300/80" />
        <div className="relative z-10">{icon}</div>
      </div>
    );
  }

  return null;
}
