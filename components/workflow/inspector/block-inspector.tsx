"use client";

import {
  Bot,
  FileLock2,
  FileText,
  GitBranch,
  LockKeyhole,
  Play,
  ShieldCheck,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeEditor } from "@/components/ui/code-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LocalRunRecord,
  WorkflowBlock,
} from "@/lib/local-fiscal-workflow";
import type {
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from "@/lib/workflow-store";

type InspectorTab = "code" | "properties" | "runs";
type SourceLogicVariant = "annotation" | "correction" | "derived" | "override";

type BlockInspectorProps = {
  disabled?: boolean;
  draftData: WorkflowNodeData;
  edges: WorkflowEdge[];
  lastRun?: LocalRunRecord;
  nodes: WorkflowNode[];
  onCreateSourceLogic: (variant: SourceLogicVariant) => void;
  onRunMockTest: () => void;
  setDraftData: Dispatch<SetStateAction<WorkflowNodeData | null>>;
  tab: InspectorTab;
};

const SOURCE_IMMUTABLE_MESSAGE =
  "Source evidence, locators, raw text, and extracted values are immutable. Create downstream Logic to correct, annotate, override, or reinterpret them.";

const LOGIC_MODES = [
  "Formula",
  "Script",
  "Condition",
  "Aggregation",
  "Transformation",
  "AI-assisted logic",
  "Classification / Mapping",
];

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getUpstreamBlocks({
  block,
  edges,
  nodes,
}: {
  block: WorkflowBlock;
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
}) {
  return edges
    .filter((edge) => edge.target === block.id)
    .map((edge) => nodes.find((node) => node.id === edge.source)?.data.block)
    .filter((item): item is WorkflowBlock => Boolean(item));
}

function getDownstreamBlocks({
  block,
  edges,
  nodes,
}: {
  block: WorkflowBlock;
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
}) {
  return edges
    .filter((edge) => edge.source === block.id)
    .map((edge) => nodes.find((node) => node.id === edge.target)?.data.block)
    .filter((item): item is WorkflowBlock => Boolean(item));
}

function Field({
  disabled,
  label,
  onChange,
  onReadOnlyAttempt,
  placeholder,
  readOnly,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange?: (value: string) => void;
  onReadOnlyAttempt?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="ml-1">{label}</Label>
      <Input
        disabled={disabled}
        onChange={(event) => {
          if (readOnly) {
            onReadOnlyAttempt?.();
            return;
          }
          onChange?.(event.target.value);
        }}
        onFocus={() => {
          if (readOnly) {
            onReadOnlyAttempt?.();
          }
        }}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
      />
    </div>
  );
}

function TextPreview({ data, title }: { data: unknown; title: string }) {
  return (
    <div className="space-y-2">
      <Label className="ml-1">{title}</Label>
      <pre className="max-h-56 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function RuntimeVisibilityEditor({
  block,
  disabled,
  setRuntimeValue,
}: {
  block: WorkflowBlock;
  disabled?: boolean;
  setRuntimeValue: (
    key: keyof WorkflowBlock["runtime"],
    value: boolean | string
  ) => void;
}) {
  const items: Array<{
    key: keyof WorkflowBlock["runtime"];
    label: string;
    value: boolean;
  }> = [
    {
      key: "visible",
      label: "Visible in generated runtime UI",
      value: block.runtime.visible,
    },
    {
      key: "editableInRuntime",
      label: "Editable in generated runtime UI",
      value: block.runtime.editableInRuntime,
    },
    {
      key: "generatedUiLocked",
      label: "Locked in generated runtime UI",
      value: block.runtime.generatedUiLocked,
    },
    {
      key: "masked",
      label: "Masked in runtime",
      value: block.runtime.masked,
    },
    {
      key: "showInRuns",
      label: "Show in Runs / Logs",
      value: block.runtime.showInRuns,
    },
  ];

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="font-medium text-sm">Runtime visibility</div>
      {items.map((item) => {
        const checkboxId = `runtime-${String(item.key)}`;
        return (
          <div
            className="flex items-center gap-2 text-sm"
            key={String(item.key)}
          >
            <Checkbox
              checked={item.value}
              disabled={disabled}
              id={checkboxId}
              onCheckedChange={(checked) =>
                setRuntimeValue(item.key, checked === true)
              }
            />
            <Label className="font-normal" htmlFor={checkboxId}>
              {item.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Family-specific inspector branches keep the v1 prototype UI colocated.
export function BlockInspector({
  disabled,
  draftData,
  edges,
  lastRun,
  nodes,
  onCreateSourceLogic,
  onRunMockTest,
  setDraftData,
  tab,
}: BlockInspectorProps) {
  const block = draftData.block;

  if (!block) {
    return null;
  }

  const config = draftData.config || {};
  const sourceLocked = Boolean(
    block.source?.treatedAsEvidence && block.source.immutable
  );
  const protectedBlock = block.family === "Protected";
  const protectedUnlocked = Boolean(
    config.protectedEditIntent || block.governance?.editIntent
  );
  const protectedFieldsDisabled =
    disabled ||
    (protectedBlock &&
      block.governance?.requiresUnlockToEdit &&
      !protectedUnlocked);
  const upstreamBlocks = getUpstreamBlocks({ block, edges, nodes });
  const downstreamBlocks = getDownstreamBlocks({ block, edges, nodes });

  const updateDraft = (next: Partial<WorkflowNodeData>) => {
    setDraftData((current) => (current ? { ...current, ...next } : current));
  };

  const updateBlock = (nextBlock: WorkflowBlock) => {
    setDraftData((current) =>
      current
        ? {
            ...current,
            block: nextBlock,
            config: nextBlock.config,
          }
        : current
    );
  };

  const setConfigValue = (key: string, value: unknown) => {
    const nextConfig = { ...config, [key]: value };
    updateDraft({
      config: nextConfig,
      block: { ...block, config: nextConfig },
    });
  };

  const setBlockValue = <Key extends keyof WorkflowBlock>(
    key: Key,
    value: WorkflowBlock[Key]
  ) => {
    updateBlock({ ...block, [key]: value });
  };

  const setRuntimeValue = (
    key: keyof WorkflowBlock["runtime"],
    value: boolean | string
  ) => {
    setBlockValue("runtime", { ...block.runtime, [key]: value });
  };

  const setGovernanceValue = (
    key: keyof NonNullable<WorkflowBlock["governance"]>,
    value: string | boolean
  ) => {
    if (!block.governance) {
      return;
    }
    setBlockValue("governance", { ...block.governance, [key]: value });
    if (key === "editIntent") {
      setConfigValue("protectedEditIntent", value);
    }
  };

  const showImmutableMessage = () => toast.warning(SOURCE_IMMUTABLE_MESSAGE);

  if (tab === "properties") {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 font-semibold text-sm">
            {block.family === "Source" && <FileText className="size-4" />}
            {block.family === "Logic" && <GitBranch className="size-4" />}
            {block.family === "Review / Validation" && (
              <ShieldCheck className="size-4" />
            )}
            {block.family === "Protected" && <LockKeyhole className="size-4" />}
            {block.family === "Output" && <FileLock2 className="size-4" />}
            {block.family === "AI / Agent" && <Bot className="size-4" />}
            {block.family}
          </div>
          <div className="text-muted-foreground text-xs">{block.subtype}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field disabled label="Family" value={block.family} />
          <Field disabled label="Subtype" value={block.subtype} />
        </div>

        <Field
          disabled={disabled}
          label="Label"
          onChange={(value) => {
            if (sourceLocked) {
              showImmutableMessage();
              return;
            }
            updateDraft({ label: value });
            setBlockValue("label", value);
          }}
          onReadOnlyAttempt={showImmutableMessage}
          readOnly={sourceLocked}
          value={draftData.label}
        />

        <Field
          disabled={disabled}
          label="Description"
          onChange={(value) => {
            updateDraft({ description: value });
            setBlockValue("description", value);
          }}
          value={draftData.description || ""}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            disabled={protectedFieldsDisabled || sourceLocked}
            label="Inputs"
            onChange={(value) => setConfigValue("inputs", value)}
            placeholder="Upstream output keys"
            value={getString(config.inputs)}
          />
          <Field
            disabled={protectedFieldsDisabled || sourceLocked}
            label="Outputs"
            onChange={(value) => {
              setConfigValue("outputs", value);
              setRuntimeValue("outputKey", value);
            }}
            placeholder="Output key"
            value={getString(config.outputs || block.runtime.outputKey)}
          />
        </div>

        {block.family === "Source" && (
          <div className="space-y-3 rounded-md border border-sky-500/30 bg-sky-500/10 p-3">
            <div className="font-medium text-sky-700 text-sm dark:text-sky-300">
              Immutable source evidence
            </div>
            <p className="text-muted-foreground text-xs">
              {SOURCE_IMMUTABLE_MESSAGE}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                disabled={disabled}
                label="Connection method"
                onChange={(value) => setConfigValue("connectionMethod", value)}
                value={getString(config.connectionMethod, block.subtype)}
              />
              <Field
                disabled={disabled}
                label="Allowed file/source types"
                onChange={(value) =>
                  setConfigValue("allowedSourceTypes", value)
                }
                value={getString(config.allowedSourceTypes, block.subtype)}
              />
              <Field
                disabled={disabled}
                label="Extraction mode"
                onChange={(value) => setConfigValue("extractionMode", value)}
                value={getString(config.extractionMode, "Mock local preview")}
              />
              <Field
                disabled={disabled}
                label="Refresh behavior"
                onChange={(value) => setConfigValue("refreshBehavior", value)}
                value={getString(config.refreshBehavior, "Manual refresh")}
              />
              <Field
                disabled={disabled}
                label="Mapping target"
                onChange={(value) => setConfigValue("mappingTarget", value)}
                value={getString(config.mappingTarget)}
              />
              <Field
                disabled={disabled}
                label="Source locator"
                onChange={showImmutableMessage}
                onReadOnlyAttempt={showImmutableMessage}
                readOnly={sourceLocked}
                value={block.source?.locator || getString(config.sourceLocator)}
              />
            </div>
            <TextPreview
              data={{
                locator: block.source?.locator,
                preview: block.source?.valuePreview || config.valuePreview,
                treatedAsEvidence: block.source?.treatedAsEvidence,
                valuesLocked: block.source?.valuesLocked,
              }}
              title="Mock extracted value / payload preview"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={disabled}
                onClick={() => onCreateSourceLogic("derived")}
                size="sm"
                type="button"
                variant="secondary"
              >
                Create derived Logic
              </Button>
              <Button
                disabled={disabled}
                onClick={() => onCreateSourceLogic("correction")}
                size="sm"
                type="button"
                variant="secondary"
              >
                Create correction Logic
              </Button>
              <Button
                disabled={disabled}
                onClick={() => onCreateSourceLogic("annotation")}
                size="sm"
                type="button"
                variant="secondary"
              >
                Create annotation Logic
              </Button>
              <Button
                disabled={disabled}
                onClick={() => onCreateSourceLogic("override")}
                size="sm"
                type="button"
                variant="secondary"
              >
                Create override Logic
              </Button>
            </div>
          </div>
        )}

        {block.family === "Logic" && (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <div className="font-medium text-sm">Logic configuration</div>
            <div className="space-y-2">
              <Label className="ml-1">Logic mode</Label>
              <Select
                disabled={disabled}
                onValueChange={(value) => setConfigValue("logicMode", value)}
                value={getString(config.logicMode, block.subtype)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Logic mode" />
                </SelectTrigger>
                <SelectContent>
                  {LOGIC_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              disabled={disabled}
              label="Owner"
              onChange={(value) => setConfigValue("owner", value)}
              value={getString(config.owner)}
            />
          </div>
        )}

        {block.family === "Review / Validation" && (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <div>
              <div className="font-medium text-sm">
                Review / Validation settings
              </div>
              <p className="text-muted-foreground text-xs">
                Judges completeness, trust, approval, or readiness without
                transforming source values.
              </p>
            </div>
            <TextPreview
              data={upstreamBlocks.map((item) => ({
                family: item.family,
                id: item.id,
                label: item.label,
              }))}
              title="Checked upstream blocks"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                disabled={disabled}
                label="Severity"
                onChange={(value) =>
                  setConfigValue("validationSeverity", value)
                }
                value={getString(config.validationSeverity, "warning")}
              />
              <Field
                disabled={disabled}
                label="Blocking behavior"
                onChange={(value) => setConfigValue("blockingBehavior", value)}
                value={getString(config.blockingBehavior, "non-blocking")}
              />
              <Field
                disabled={disabled}
                label="Readiness requirement"
                onChange={(value) =>
                  setConfigValue("readinessRequirement", value)
                }
                value={getString(config.readinessRequirement)}
              />
              <Field
                disabled={disabled}
                label="Reviewer / sign-off"
                onChange={(value) => setConfigValue("reviewer", value)}
                value={getString(config.reviewer)}
              />
            </div>
          </div>
        )}

        {block.family === "Protected" && (
          <div className="space-y-3 rounded-md border border-violet-500/30 bg-violet-500/10 p-3">
            <div className="flex items-center gap-2 font-medium text-sm text-violet-700 dark:text-violet-300">
              <LockKeyhole className="size-4" />
              Governed protected field
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                disabled
                label="Runtime locked"
                value={String(block.governance?.lockedInRuntime ?? true)}
              />
              <Field
                disabled
                label="Builder draft editable"
                value={String(!protectedFieldsDisabled)}
              />
              <Field
                disabled
                label="Governed field type"
                value={block.governance?.protectedKind || block.subtype}
              />
              <Field
                disabled={protectedFieldsDisabled}
                label="Current value / summary"
                onChange={(value) => setConfigValue("currentValue", value)}
                value={getString(
                  config.currentValue || block.runtime.outputKey
                )}
              />
            </div>
            {protectedUnlocked ? (
              <Field
                disabled={disabled}
                label="Unlock / edit intent"
                onChange={(value) => setGovernanceValue("editIntent", value)}
                value={getString(
                  config.protectedEditIntent || block.governance?.editIntent
                )}
              />
            ) : (
              <Button
                disabled={disabled}
                onClick={() =>
                  setGovernanceValue(
                    "editIntent",
                    `Draft edit unlocked ${new Date().toISOString()}`
                  )
                }
                size="sm"
                type="button"
                variant="secondary"
              >
                Unlock for draft edit
              </Button>
            )}
            <TextPreview
              data={{
                downstreamOutputs: downstreamBlocks
                  .filter((item) => item.family === "Output")
                  .map((item) => item.label),
                upstreamTrace: upstreamBlocks.map((item) => item.label),
              }}
              title="Source / logic trace and output mappings"
            />
          </div>
        )}

        {block.family === "Output" && (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <div className="font-medium text-sm">Output preview settings</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                disabled={disabled}
                label="Target format/system"
                onChange={(value) => setConfigValue("targetFormat", value)}
                value={getString(config.targetFormat, block.subtype)}
              />
              <Field
                disabled={disabled}
                label="Readiness requirements"
                onChange={(value) =>
                  setConfigValue("outputReadinessRequirements", value)
                }
                value={getString(config.outputReadinessRequirements)}
              />
              <Field
                disabled={disabled}
                label="Included source trace"
                onChange={(value) =>
                  setConfigValue("sourceTraceSetting", value)
                }
                value={getString(config.sourceTraceSetting, "include summary")}
              />
              <Field
                disabled
                label="Mock download/export"
                value="Local preview only"
              />
            </div>
            <TextPreview
              data={{
                candidateLogicInputs: upstreamBlocks
                  .filter((item) => item.family === "Logic")
                  .map((item) => item.label),
                mappedProtectedValues: upstreamBlocks
                  .filter((item) => item.family === "Protected")
                  .map((item) => item.label),
                missingFields:
                  getString(config.missingFields) || "No local blockers",
              }}
              title="Mapped values, candidate Logic inputs, and missing requirements"
            />
          </div>
        )}

        {block.family === "AI / Agent" && (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <div className="font-medium text-sm">AI proposal behavior</div>
            <Field
              disabled={disabled}
              label="Prompt / config"
              onChange={(value) => setConfigValue("aiPrompt", value)}
              value={getString(config.aiPrompt || config.prompt)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                disabled={disabled}
                label="Allowed actions"
                onChange={(value) => setConfigValue("allowedActions", value)}
                value={getString(config.allowedActions, "propose only")}
              />
              <Field
                disabled={disabled}
                label="Selected tools"
                onChange={(value) => setConfigValue("selectedTools", value)}
                value={getString(config.selectedTools, "local catalog")}
              />
              <Field
                disabled={disabled}
                label="Proposal status"
                onChange={(value) => setConfigValue("proposalStatus", value)}
                value={getString(config.proposalStatus, "proposed")}
              />
              <Field
                disabled={disabled}
                label="Runtime availability"
                onChange={(value) =>
                  setConfigValue("runtimeAvailability", value)
                }
                value={getString(config.runtimeAvailability, "builder only")}
              />
            </div>
            <div className="rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 p-3 text-muted-foreground text-xs">
              AI / Agent blocks propose changes only. They do not directly
              mutate the workflow without explicit approval.
            </div>
          </div>
        )}

        <RuntimeVisibilityEditor
          block={block}
          disabled={disabled}
          setRuntimeValue={setRuntimeValue}
        />
      </div>
    );
  }

  if (tab === "code") {
    const logicMode = getString(config.logicMode, block.subtype);
    const generatedRuntimeLockConfig = {
      editableInRuntime: block.runtime.editableInRuntime,
      generatedUiLocked: block.runtime.generatedUiLocked,
      lockedInRuntime: block.governance?.lockedInRuntime,
      outputKey: block.runtime.outputKey,
    };

    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {block.family === "Logic" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="ml-1">Logic mode</Label>
              <Select
                disabled={disabled}
                onValueChange={(value) => setConfigValue("logicMode", value)}
                value={logicMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Logic mode" />
                </SelectTrigger>
                <SelectContent>
                  {LOGIC_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {logicMode === "Formula" && (
              <>
                <Field
                  disabled={disabled}
                  label="Formula"
                  onChange={(value) => setConfigValue("formula", value)}
                  value={getString(config.formula || block.formula?.expression)}
                />
                <TextPreview
                  data={{
                    availableVariables: getString(config.inputs)
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    formulaValidation: "local syntax placeholder",
                    previewResult: "1284.42",
                  }}
                  title="Formula preview"
                />
              </>
            )}

            {logicMode === "Script" && (
              <>
                <div className="h-72 overflow-hidden rounded-md border">
                  <CodeEditor
                    language="typescript"
                    onChange={(value) => setConfigValue("scriptBody", value)}
                    options={{ minimap: { enabled: false } }}
                    value={getString(
                      config.scriptBody || block.code?.body,
                      "return { success: true, data: input };"
                    )}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    disabled={disabled}
                    label="Input schema"
                    onChange={(value) => setConfigValue("inputSchema", value)}
                    value={getString(config.inputSchema, "{ value: number }")}
                  />
                  <Field
                    disabled={disabled}
                    label="Output schema"
                    onChange={(value) => setConfigValue("outputSchema", value)}
                    value={getString(config.outputSchema, "{ result: number }")}
                  />
                </div>
              </>
            )}

            {logicMode === "Condition" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  disabled={disabled}
                  label="Condition expression"
                  onChange={(value) =>
                    setConfigValue("conditionExpression", value)
                  }
                  value={getString(config.conditionExpression, "value != null")}
                />
                <Field
                  disabled={disabled}
                  label="True path"
                  onChange={(value) => setConfigValue("truePath", value)}
                  value={getString(config.truePath)}
                />
                <Field
                  disabled={disabled}
                  label="False path"
                  onChange={(value) => setConfigValue("falsePath", value)}
                  value={getString(config.falsePath)}
                />
                <Field disabled label="Sample evaluation" value="true" />
              </div>
            )}

            {logicMode === "Aggregation" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  disabled={disabled}
                  label="Aggregation method"
                  onChange={(value) =>
                    setConfigValue("aggregationMethod", value)
                  }
                  value={getString(config.aggregationMethod, "sum")}
                />
                <Field
                  disabled={disabled}
                  label="Grouped inputs"
                  onChange={(value) => setConfigValue("groupedInputs", value)}
                  value={getString(config.groupedInputs)}
                />
                <Field
                  disabled={disabled}
                  label="Include / exclude rules"
                  onChange={(value) =>
                    setConfigValue("includeExcludeRules", value)
                  }
                  value={getString(config.includeExcludeRules)}
                />
                <Field
                  disabled
                  label="Subtotal preview"
                  value="local mock subtotal"
                />
              </div>
            )}

            {logicMode === "Transformation" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  disabled={disabled}
                  label="Transformation type"
                  onChange={(value) =>
                    setConfigValue("transformationType", value)
                  }
                  value={getString(config.transformationType, "normalization")}
                />
                <Field
                  disabled={disabled}
                  label="Normalization rules"
                  onChange={(value) =>
                    setConfigValue("normalizationRules", value)
                  }
                  value={getString(config.normalizationRules)}
                />
                <Field
                  disabled={disabled}
                  label="Conversion rules"
                  onChange={(value) => setConfigValue("conversionRules", value)}
                  value={getString(config.conversionRules)}
                />
                <Field
                  disabled
                  label="Before / after preview"
                  value="mock before -> after"
                />
              </div>
            )}

            {logicMode === "Classification / Mapping" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  disabled={disabled}
                  label="Classification target"
                  onChange={(value) =>
                    setConfigValue("classificationTarget", value)
                  }
                  value={getString(config.classificationTarget)}
                />
                <Field
                  disabled={disabled}
                  label="Mapping rules"
                  onChange={(value) => setConfigValue("mappingRules", value)}
                  value={getString(config.mappingRules)}
                />
                <Field
                  disabled={disabled}
                  label="Confidence threshold"
                  onChange={(value) =>
                    setConfigValue("confidenceThreshold", value)
                  }
                  value={getString(config.confidenceThreshold, "0.8")}
                />
                <Field
                  disabled={disabled}
                  label="Unmatched handling"
                  onChange={(value) =>
                    setConfigValue("unmatchedHandling", value)
                  }
                  value={getString(config.unmatchedHandling, "send to review")}
                />
              </div>
            )}

            {logicMode === "AI-assisted logic" && (
              <div className="space-y-3">
                <Field
                  disabled={disabled}
                  label="Prompt / config"
                  onChange={(value) => setConfigValue("aiLogicPrompt", value)}
                  value={getString(config.aiLogicPrompt)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    disabled={disabled}
                    label="Allowed tools"
                    onChange={(value) => setConfigValue("allowedTools", value)}
                    value={getString(config.allowedTools, "local catalog")}
                  />
                  <Field
                    disabled={disabled}
                    label="Structured output schema"
                    onChange={(value) =>
                      setConfigValue("structuredOutputSchema", value)
                    }
                    value={getString(config.structuredOutputSchema)}
                  />
                  <Field
                    disabled={disabled}
                    label="Guardrails"
                    onChange={(value) => setConfigValue("guardrails", value)}
                    value={getString(config.guardrails, "proposal only")}
                  />
                  <Field
                    disabled
                    label="Sample response"
                    value="mock proposal"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {block.family === "Source" && (
          <div className="space-y-4">
            <TextPreview
              data={{
                apiRequestConfig: config.apiRequestConfig,
                extractionMode: config.extractionMode,
                immutableTruth: block.source,
                parserSettings: config.parserSettings,
              }}
              title="Extraction config JSON"
            />
            <Field
              disabled={disabled}
              label="Parser settings"
              onChange={(value) => setConfigValue("parserSettings", value)}
              value={getString(config.parserSettings, "mock parser")}
            />
            <Field
              disabled={disabled || block.subtype !== "API / HTTP Request"}
              label="API request config"
              onChange={(value) => setConfigValue("apiRequestConfig", value)}
              value={getString(config.apiRequestConfig)}
            />
            <Field
              disabled={disabled}
              label="Advanced transformation hook"
              onChange={(value) =>
                setConfigValue("advancedTransformationHook", value)
              }
              value={getString(config.advancedTransformationHook)}
            />
          </div>
        )}

        {block.family === "Review / Validation" && (
          <div className="space-y-4">
            <Field
              disabled={disabled}
              label="Validation expression"
              onChange={(value) =>
                setConfigValue("validationExpression", value)
              }
              value={getString(config.validationExpression)}
            />
            <TextPreview
              data={{
                ruleConfig: config.ruleConfig,
                thresholdConfig: config.thresholdConfig,
                validationSubtype: block.subtype,
              }}
              title="Rule config JSON"
            />
          </div>
        )}

        {block.family === "Protected" && (
          <div className="space-y-4">
            <TextPreview
              data={{
                derivedLogicReferences: upstreamBlocks.map((item) => item.id),
                formulaSummary: config.formula || block.formula,
                governance: block.governance,
              }}
              title="Protected config"
            />
            <TextPreview
              data={generatedRuntimeLockConfig}
              title="Generated runtime lock config preview"
            />
          </div>
        )}

        {block.family === "Output" && (
          <div className="space-y-4">
            <TextPreview
              data={{
                handoffPayloadPreview: {
                  mockOnly: true,
                  subtype: block.subtype,
                },
                mappingJson: config.mappingJson,
                outputSchema: config.outputSchema,
              }}
              title="Output mapping and schema"
            />
            <Field
              disabled={disabled}
              label="Mapping JSON"
              onChange={(value) => setConfigValue("mappingJson", value)}
              value={getString(config.mappingJson)}
            />
          </div>
        )}

        {block.family === "AI / Agent" && (
          <div className="space-y-4">
            <TextPreview
              data={{
                generatedCodeOrConfig: config.generatedCodeOrConfig,
                mockResponsePayload: config.mockResponsePayload,
                proposalDiffPreview: config.proposalDiffPreview,
                structuredOutputSchema: config.structuredOutputSchema,
              }}
              title="AI proposal payload"
            />
            <Field
              disabled={disabled}
              label="Structured output schema"
              onChange={(value) =>
                setConfigValue("structuredOutputSchema", value)
              }
              value={getString(config.structuredOutputSchema)}
            />
          </div>
        )}
      </div>
    );
  }

  const selectedLog = lastRun?.logs.find((log) => log.nodeId === block.id);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
        <div>
          <div className="font-medium text-sm">Local sample test</div>
          <div className="text-muted-foreground text-xs">
            Runs deterministic mock behavior only.
          </div>
        </div>
        <Button
          disabled={disabled}
          onClick={onRunMockTest}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Play className="mr-2 size-3.5" />
          Run local test
        </Button>
      </div>

      <TextPreview
        data={{
          family: block.family,
          inputs: config.inputs,
          sampleDataset: true,
          subtype: block.subtype,
        }}
        title="Sample input preview"
      />
      <TextPreview
        data={
          selectedLog?.output || {
            message: "Run a local test to update the mock output preview.",
          }
        }
        title="Sample output / last execution result"
      />
      <TextPreview
        data={{
          errors: selectedLog?.error ? [selectedLog.error] : [],
          logs: selectedLog
            ? [`${selectedLog.nodeName} completed in ${selectedLog.duration}ms`]
            : ["No local run has been recorded for this block yet."],
          status: selectedLog?.status || "not-run",
        }}
        title="Errors, warnings, and logs"
      />
    </div>
  );
}
