import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  getSimpleBezierPath,
  type InternalNode,
  type Node,
  Position,
  useInternalNode,
} from "@xyflow/react";
import type { WorkflowEdge as SchemaWorkflowEdge } from "@/lib/local-fiscal-workflow";
import {
  formatRelationshipType,
  getEdgeLabelClassName,
  getEdgeStatusClasses,
} from "@/components/workflow/utils/edge-relationships";

const EDGE_SELECTED_STROKE = "rgb(103 232 249)";
const EDGE_SELECTED_GLOW = "rgba(34, 211, 238, 0.75)";
const EDGE_TEMPORARY_STROKE = "rgb(248 250 252)";

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) => {
  const [edgePath] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {selected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.9))",
            opacity: 0.5,
            stroke: EDGE_SELECTED_GLOW,
            strokeDasharray: "5, 5",
            strokeWidth: 7,
          }}
        />
      )}
      <BaseEdge
        className="stroke-1"
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? EDGE_SELECTED_STROKE : EDGE_TEMPORARY_STROKE,
          strokeDasharray: "5, 5",
          strokeWidth: selected ? 3.5 : 2.75,
        }}
      />
    </>
  );
};

const getHandleCoordsByPosition = (
  node: InternalNode<Node>,
  handlePosition: Position
) => {
  // Choose the handle type based on position - Left is for target, Right is for source
  const handleType = handlePosition === Position.Left ? "target" : "source";

  const handle = node.internals.handleBounds?.[handleType]?.find(
    (h) => h.position === handlePosition
  );

  if (!handle) {
    return [0, 0] as const;
  }

  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  // this is a tiny detail to make the markerEnd of an edge visible.
  // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
  // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
    default:
      throw new Error(`Invalid handle position: ${handlePosition}`);
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;

  return [x, y] as const;
};

const getEdgeParams = (
  source: InternalNode<Node>,
  target: InternalNode<Node>
) => {
  const sourcePos = Position.Right;
  const [sx, sy] = getHandleCoordsByPosition(source, sourcePos);
  const targetPos = Position.Left;
  const [tx, ty] = getHandleCoordsByPosition(target, targetPos);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
};

const Animated = ({
  data,
  id,
  selected,
  source,
  style,
  target,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!(sourceNode && targetNode)) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });
  const workflowEdge = data?.workflowEdge as SchemaWorkflowEdge | undefined;
  const statusClasses = getEdgeStatusClasses(workflowEdge?.status);
  const showLabel = Boolean(
    workflowEdge && (selected || workflowEdge.status !== "active")
  );
  const relationshipLabel = workflowEdge
    ? formatRelationshipType(workflowEdge.relationshipType)
    : "";
  const labelX = (sx + tx) / 2;
  const labelY = (sy + ty) / 2;

  return (
    <>
      {selected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            filter: "drop-shadow(0 0 12px rgba(34, 211, 238, 0.95))",
            opacity: 0.55,
            stroke: EDGE_SELECTED_GLOW,
            strokeDasharray: statusClasses.strokeDasharray,
            strokeWidth: 10,
          }}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          opacity: workflowEdge?.status === "disabled" ? 0.55 : 1,
          stroke: selected ? EDGE_SELECTED_STROKE : statusClasses.stroke,
          strokeDasharray: statusClasses.strokeDasharray,
          strokeWidth: selected ? 5.25 : 3.75,
        }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={getEdgeLabelClassName(workflowEdge?.status)}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            title={workflowEdge?.reason}
          >
            {relationshipLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const Edge = {
  Temporary,
  Animated,
};
