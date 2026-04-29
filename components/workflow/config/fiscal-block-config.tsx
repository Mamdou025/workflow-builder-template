"use client";

import {
  FileText,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Workflow,
} from "lucide-react";
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
  FISCAL_STAGE_OPTIONS,
  type FiscalStage,
  getFiscalStageLabel,
} from "@/lib/local-fiscal-workflow";

type FiscalBlockConfigProps = {
  config: Record<string, unknown>;
  disabled: boolean;
  onUpdateConfig: (key: string, value: string) => void;
  onUpdateStage?: (stage: FiscalStage) => void;
  visualRole?: string;
};

function StageIcon({ stage }: { stage: FiscalStage }) {
  if (stage === "source") {
    return <FileText className="size-4 text-sky-500" />;
  }
  if (stage === "logic") {
    return <Workflow className="size-4 text-emerald-500" />;
  }
  if (stage === "protected") {
    return <LockKeyhole className="size-4 text-violet-500" />;
  }
  if (stage === "output") {
    return <Scale className="size-4 text-indigo-500" />;
  }
  return <ShieldCheck className="size-4 text-amber-500" />;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Governance and source state share one compact editor.
export function FiscalBlockConfig({
  config,
  disabled,
  onUpdateConfig,
  onUpdateStage,
  visualRole,
}: FiscalBlockConfigProps) {
  const stage = ((config.fiscalStage as string | undefined) ||
    visualRole ||
    "logic") as FiscalStage;
  const blockFamily = config.blockFamily as string | undefined;
  const isSourceEvidence =
    blockFamily === "Source" || stage === "source" || visualRole === "source";
  const isProtectedBlock =
    blockFamily === "Protected" ||
    stage === "protected" ||
    visualRole === "protected";
  const protectedEditIntent = config.protectedEditIntent as string | undefined;
  const protectedNeedsUnlock = isProtectedBlock && !protectedEditIntent;
  const fieldsDisabled = disabled || isSourceEvidence || protectedNeedsUnlock;

  const handleStageChange = (value: string) => {
    const nextStage = value as FiscalStage;
    onUpdateConfig("fiscalStage", nextStage);
    onUpdateStage?.(nextStage);
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-3">
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="fiscalStage">
          Workflow Family
        </Label>
        <Select
          disabled={fieldsDisabled}
          onValueChange={handleStageChange}
          value={stage}
        >
          <SelectTrigger id="fiscalStage">
            <SelectValue placeholder="Select workflow family" />
          </SelectTrigger>
          <SelectContent>
            {FISCAL_STAGE_OPTIONS.map((option) => (
              <SelectItem key={option.stage} value={option.stage}>
                <span className="flex items-center gap-2">
                  <StageIcon stage={option.stage} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isSourceEvidence && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-3 text-sm">
          <div className="font-medium text-sky-700 dark:text-sky-300">
            Immutable source evidence
          </div>
          <p className="mt-1 text-muted-foreground">
            Source labels, locators, raw text, extracted evidence, and values
            are locked. Corrections, annotations, overrides, and transformations
            belong in downstream Logic blocks.
          </p>
        </div>
      )}

      {isProtectedBlock && (
        <div className="rounded-md border border-violet-500/30 bg-violet-500/10 p-3 text-sm">
          <div className="font-medium text-violet-700 dark:text-violet-300">
            Governed protected block
          </div>
          <p className="mt-1 text-muted-foreground">
            Builder drafts can edit protected values after explicit unlock
            intent. Generated runtime UI remains locked.
          </p>
          {protectedNeedsUnlock ? (
            <Button
              className="mt-3"
              disabled={disabled}
              onClick={() =>
                onUpdateConfig(
                  "protectedEditIntent",
                  `Builder edit intent ${new Date().toISOString()}`
                )
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              Unlock governed edit
            </Button>
          ) : (
            <div className="mt-3 space-y-2">
              <Label className="ml-1" htmlFor="protectedEditIntent">
                Unlock Intent
              </Label>
              <Input
                disabled={disabled}
                id="protectedEditIntent"
                onChange={(event) =>
                  onUpdateConfig("protectedEditIntent", event.target.value)
                }
                value={protectedEditIntent || ""}
              />
            </div>
          )}
        </div>
      )}

      {config.sourceLocator ? (
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="sourceLocator">
            Source Locator
          </Label>
          <Input
            disabled={isSourceEvidence || disabled}
            id="sourceLocator"
            onChange={(event) =>
              onUpdateConfig("sourceLocator", event.target.value)
            }
            value={(config.sourceLocator as string | undefined) || ""}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="owner">
            Owner
          </Label>
          <Input
            disabled={fieldsDisabled}
            id="owner"
            onChange={(event) => onUpdateConfig("owner", event.target.value)}
            placeholder="Team or reviewer"
            value={(config.owner as string | undefined) || ""}
          />
        </div>
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="outputs">
            Output Key
          </Label>
          <Input
            disabled={fieldsDisabled}
            id="outputs"
            onChange={(event) => onUpdateConfig("outputs", event.target.value)}
            placeholder={`${getFiscalStageLabel(stage)} output`}
            value={(config.outputs as string | undefined) || ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="ml-1" htmlFor="inputs">
          Inputs
        </Label>
        <Input
          disabled={fieldsDisabled}
          id="inputs"
          onChange={(event) => onUpdateConfig("inputs", event.target.value)}
          placeholder="Source keys or upstream outputs"
          value={(config.inputs as string | undefined) || ""}
        />
      </div>

      <div className="space-y-2">
        <Label className="ml-1" htmlFor="rulebookRef">
          Rulebook Alignment
        </Label>
        <Input
          disabled={fieldsDisabled}
          id="rulebookRef"
          onChange={(event) =>
            onUpdateConfig("rulebookRef", event.target.value)
          }
          placeholder="Fiscal control or governance note"
          value={(config.rulebookRef as string | undefined) || ""}
        />
      </div>
    </div>
  );
}
