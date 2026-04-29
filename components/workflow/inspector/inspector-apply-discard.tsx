"use client";

import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type InspectorApplyDiscardProps = {
  disabled?: boolean;
  dirty: boolean;
  onApply: () => void;
  onDiscard: () => void;
};

export function InspectorApplyDiscard({
  dirty,
  disabled,
  onApply,
  onDiscard,
}: InspectorApplyDiscardProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-4 py-2">
      <div className="text-muted-foreground text-xs">
        {dirty ? "Pending inspector edits" : "No pending edits"}
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={disabled || !dirty}
          onClick={onDiscard}
          size="sm"
          type="button"
          variant="ghost"
        >
          <RotateCcw className="mr-2 size-3.5" />
          Discard
        </Button>
        <Button
          disabled={disabled || !dirty}
          onClick={onApply}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Save className="mr-2 size-3.5" />
          Apply
        </Button>
      </div>
    </div>
  );
}
