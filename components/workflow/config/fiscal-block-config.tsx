"use client";

import {
  FileText,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Workflow,
} from "lucide-react";
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

  const handleStageChange = (value: string) => {
    const nextStage = value as FiscalStage;
    onUpdateConfig("fiscalStage", nextStage);
    onUpdateStage?.(nextStage);
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-3">
      <div className="space-y-2">
        <Label className="ml-1" htmlFor="fiscalStage">
          Fiscal Stage
        </Label>
        <Select
          disabled={disabled}
          onValueChange={handleStageChange}
          value={stage}
        >
          <SelectTrigger id="fiscalStage">
            <SelectValue placeholder="Select fiscal stage" />
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="ml-1" htmlFor="owner">
            Owner
          </Label>
          <Input
            disabled={disabled}
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
            disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
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
