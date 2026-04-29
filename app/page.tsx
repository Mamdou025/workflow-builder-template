"use client";

import { useAtom, useSetAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NodeConfigPanel } from "@/components/workflow/node-config-panel";
import { WorkflowStudioShell } from "@/components/workflow/workflow-studio-shell";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createFapiSampleWorkflow,
  LOCAL_WORKFLOW_ID,
  loadLocalWorkflowSnapshotResult,
  saveWorkflowDefinitionSnapshot,
  workflowDefinitionToCanvas,
} from "@/lib/local-fiscal-workflow";
import {
  currentWorkflowIdAtom,
  currentWorkflowNameAtom,
  currentWorkflowVisibilityAtom,
  edgesAtom,
  hasSidebarBeenShownAtom,
  hasUnsavedChangesAtom,
  isPanelAnimatingAtom,
  isSidebarCollapsedAtom,
  isWorkflowOwnerAtom,
  nodesAtom,
  rightPanelWidthAtom,
  selectedEdgeAtom,
  selectedExecutionIdAtom,
  selectedNodeAtom,
  workflowNotFoundAtom,
} from "@/lib/workflow-store";

const LOCAL_PANEL_WIDTH = 34;

const Home = () => {
  const isMobile = useIsMobile();
  const setNodes = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const [workflowName, setCurrentWorkflowName] = useAtom(
    currentWorkflowNameAtom
  );
  const [panelCollapsed, setPanelCollapsed] = useAtom(isSidebarCollapsedAtom);
  const setCurrentWorkflowId = useSetAtom(currentWorkflowIdAtom);
  const setCurrentWorkflowVisibility = useSetAtom(
    currentWorkflowVisibilityAtom
  );
  const setIsWorkflowOwner = useSetAtom(isWorkflowOwnerAtom);
  const setHasUnsavedChanges = useSetAtom(hasUnsavedChangesAtom);
  const setRightPanelWidth = useSetAtom(rightPanelWidthAtom);
  const setHasSidebarBeenShown = useSetAtom(hasSidebarBeenShownAtom);
  const setIsPanelAnimating = useSetAtom(isPanelAnimatingAtom);
  const setWorkflowNotFound = useSetAtom(workflowNotFoundAtom);
  const setSelectedNode = useSetAtom(selectedNodeAtom);
  const setSelectedEdge = useSetAtom(selectedEdgeAtom);
  const setSelectedExecutionId = useSetAtom(selectedExecutionIdAtom);
  const initializedRef = useRef(false);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const loadResult = loadLocalWorkflowSnapshotResult();
    if (loadResult.warning) {
      toast.warning(
        "Saved local workflow could not be loaded. Restored the sample workflow."
      );
    }
    const snapshot = loadResult.snapshot || createFapiSampleWorkflow();
    const canvas = workflowDefinitionToCanvas(snapshot);
    const selectedNode =
      canvas.nodes.find((node) => node.selected) || canvas.nodes[0];
    const nodesWithSelection = canvas.nodes.map((node) => ({
      ...node,
      selected: selectedNode ? node.id === selectedNode.id : false,
      data: {
        ...node.data,
        status: "idle" as const,
      },
    }));

    setNodes(nodesWithSelection);
    setEdges(canvas.edges);
    setCurrentWorkflowId(LOCAL_WORKFLOW_ID);
    setCurrentWorkflowName(snapshot.name);
    setCurrentWorkflowVisibility("private");
    setIsWorkflowOwner(true);
    setHasUnsavedChanges(false);
    setHasSidebarBeenShown(true);
    setWorkflowNotFound(false);
    setSelectedNode(selectedNode?.id ?? null);
    setSelectedEdge(null);
    setSelectedExecutionId(null);
    saveWorkflowDefinitionSnapshot(snapshot);
    initializedRef.current = true;
    setPanelVisible(true);
  }, [
    setCurrentWorkflowId,
    setCurrentWorkflowName,
    setCurrentWorkflowVisibility,
    setEdges,
    setHasSidebarBeenShown,
    setHasUnsavedChanges,
    setIsWorkflowOwner,
    setNodes,
    setSelectedEdge,
    setSelectedExecutionId,
    setSelectedNode,
    setWorkflowNotFound,
  ]);

  useEffect(() => {
    document.title = `${workflowName || "Fiscal Workflow Studio"} - Workflow Studio`;
  }, [workflowName]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    if (isMobile || panelCollapsed) {
      setRightPanelWidth(null);
    } else {
      setRightPanelWidth(`${LOCAL_PANEL_WIDTH}%`);
    }

    return () => {
      setRightPanelWidth(null);
    };
  }, [isMobile, panelCollapsed, setRightPanelWidth]);

  const togglePanel = (collapsed: boolean) => {
    setIsPanelAnimating(true);
    setPanelCollapsed(collapsed);
    setTimeout(() => setIsPanelAnimating(false), 350);
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden">
      <WorkflowStudioShell
        isMobile={isMobile}
        rightPanelCollapsed={panelCollapsed}
        rightPanelWidthPercent={LOCAL_PANEL_WIDTH}
      />

      {!isMobile && panelCollapsed && (
        <Button
          className="-translate-y-1/2 pointer-events-auto absolute top-1/2 right-0 z-20 h-12 w-7 rounded-r-none rounded-l-full border-r-0 bg-background shadow-sm hover:bg-muted"
          onClick={() => togglePanel(false)}
          size="icon"
          title="Open properties"
          variant="secondary"
        >
          <ChevronLeft className="size-4" />
        </Button>
      )}

      {!isMobile && (
        <div
          className="pointer-events-auto absolute inset-y-0 right-0 z-20 border-l bg-background transition-transform duration-300 ease-out"
          style={{
            width: `${LOCAL_PANEL_WIDTH}%`,
            transform:
              panelVisible && !panelCollapsed
                ? "translateX(0)"
                : "translateX(100%)",
          }}
        >
          <Button
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-0 z-10 h-12 w-7 rounded-r-none rounded-l-full bg-background opacity-70 shadow-sm hover:bg-muted hover:opacity-100"
            onClick={() => togglePanel(true)}
            size="icon"
            title="Collapse properties"
            variant="secondary"
          >
            <ChevronRight className="size-4" />
          </Button>
          <NodeConfigPanel />
        </div>
      )}
    </div>
  );
};

export default Home;
