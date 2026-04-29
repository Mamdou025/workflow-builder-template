/**
 * Code generation utilities for workflow step functions
 */

import { AUTO_GENERATED_TEMPLATES } from "@/lib/codegen-registry";
import conditionTemplate from "@/lib/codegen-templates/condition";
import databaseQueryTemplate from "@/lib/codegen-templates/database-query";
import httpRequestTemplate from "@/lib/codegen-templates/http-request";
import { findActionById } from "@/plugins";

const NON_IDENTIFIER_SEGMENT_REGEX = /[^a-zA-Z0-9]+/;

// System action templates (non-plugin actions)
const SYSTEM_ACTION_TEMPLATES: Record<string, string> = {
  "Database Query": databaseQueryTemplate,
  "HTTP Request": httpRequestTemplate,
  Condition: conditionTemplate,
};

const FALLBACK_ACTION_CODE = `async function actionStep(input: Record<string, unknown>) {
  "use step";

  console.log('Executing action');
  return { success: true };
}`;

const FALLBACK_UNKNOWN_CODE = `async function unknownStep(input: Record<string, unknown>) {
  "use step";

  return input;
}`;

function generateFiscalBlockCode(config: NodeConfig | undefined): string {
  const stage = (config?.fiscalStage as string) || "logic";
  const functionStage = stage
    .split(NON_IDENTIFIER_SEGMENT_REGEX)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const outputKey = (config?.outputs as string) || `${stage}Output`;
  const rulebookRef =
    (config?.rulebookRef as string) ||
    "Local prototype block with mock data only.";

  return `async function fiscal${functionStage || "Logic"}Block(input: Record<string, unknown>) {
  "use step";

  return {
    success: true,
    data: {
      stage: ${JSON.stringify(stage)},
      outputKey: ${JSON.stringify(outputKey)},
      rulebookRef: ${JSON.stringify(rulebookRef)},
      mockOnly: true
    }
  };
}`;
}

type NodeConfig = Record<string, unknown>;

function generateTriggerCode(config: NodeConfig | undefined): string {
  const triggerType = (config?.triggerType as string) || "Manual";

  if (triggerType === "Schedule") {
    const cron = (config?.scheduleCron as string) || "0 9 * * *";
    const timezone = (config?.scheduleTimezone as string) || "America/New_York";
    return `{
  "crons": [
    {
      "path": "/api/workflow",
      "schedule": "${cron}",
      "timezone": "${timezone}"
    }
  ]
}`;
  }

  if (triggerType === "Webhook") {
    return `import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Call your workflow function here
  await executeWorkflow(body);
  
  return Response.json({ success: true });
}`;
  }

  return "";
}

function generateActionCode(actionType: string | undefined): string {
  if (!actionType) {
    return FALLBACK_ACTION_CODE;
  }

  // Check system actions first
  if (SYSTEM_ACTION_TEMPLATES[actionType]) {
    return SYSTEM_ACTION_TEMPLATES[actionType];
  }

  // Look up plugin actions in registry
  const action = findActionById(actionType);
  if (action) {
    // Prefer auto-generated templates, fall back to manual templates
    return (
      AUTO_GENERATED_TEMPLATES[action.id] ||
      action.codegenTemplate ||
      FALLBACK_ACTION_CODE
    );
  }

  return FALLBACK_ACTION_CODE;
}

// Generate code snippet for a single node
export const generateNodeCode = (node: {
  id: string;
  data: {
    type: string;
    label: string;
    description?: string;
    config?: NodeConfig;
  };
}): string => {
  if (node.data.type === "trigger") {
    if (node.data.config?.fiscalStage) {
      return generateFiscalBlockCode(node.data.config);
    }
    return generateTriggerCode(node.data.config);
  }

  if (node.data.type === "action") {
    if (node.data.config?.fiscalStage && !node.data.config?.actionType) {
      return generateFiscalBlockCode(node.data.config);
    }
    return generateActionCode(node.data.config?.actionType as string);
  }

  return FALLBACK_UNKNOWN_CODE;
};
