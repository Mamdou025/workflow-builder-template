# Platform Adaptation Context

## 1. Product Direction

This fork of Vercel Labs' workflow-builder-template is evolving from a generic AI workflow builder into a professional workflow cockpit for evidence-backed business processes.

The long-term product direction is to support:

- Visual workflow design with nodes and edges
- Source-aware workflows that can attach and reference business evidence
- AI-assisted processing steps with controlled adoption of AI outputs
- Human review and approvals embedded in workflow execution
- Strong traceability across execution telemetry and governance history

This is an additive adaptation plan that preserves the existing template strengths while introducing enterprise-grade workflow capabilities over time.

## 2. What We Are Keeping From The Template

The current template already provides a solid foundation and should remain intact as the base platform:

- React Flow visual canvas and interaction model
- Workflow graph representation (nodes and edges stored in the database)
- Workflow execution tracking and run history
- Node-level execution logs
- Integrations and plugin registry architecture
- AI workflow generation flow
- Code preview and code generation capabilities
- Better Auth authentication model
- Drizzle ORM and PostgreSQL data layer
- shadcn/ui and Tailwind UI foundation

## 3. What We Are Adding Over Time

The platform will be expanded incrementally with additive capabilities:

- Organizations and workspaces
- Source document management
- Source references (evidence anchors tied to nodes and runs)
- Audit events (immutable governance history)
- Review tasks and human checkpoints
- Approval steps and approval records
- Workflow versions and publishing states
- AI suggestion records with decision tracking
- Comments and reviewer notes
- Export packages for downstream reporting or delivery
- Premium workspace UX for operations, traceability, and oversight

## 4. Important Design Principle: Execution Logs vs Audit Events

Execution logs and audit events are complementary but not interchangeable.

### Execution Logs (technical runtime telemetry)

Execution logs answer questions such as:

- Did the node run?
- Did it succeed or fail?
- What input, output, error, and duration occurred?

These records are primarily for runtime visibility, troubleshooting, and operational monitoring.

### Audit Events (governance and compliance history)

Audit events answer questions such as:

- Who changed what?
- When did it happen?
- Why did it happen?
- What was the before and after state?
- What source or evidence supported the decision?
- Was AI involved?
- Who approved or rejected the outcome?

These records are primarily for accountability, governance, and auditability.

Both models should coexist: execution logs for system telemetry, audit events for business/compliance traceability.

## 5. Controlled AI Principle

AI should assist workflow users by suggesting, extracting, summarizing, classifying, or drafting. AI should not silently become the source of truth for important business decisions.

Important AI-generated outputs should be:

- Reviewable by users
- Explicitly accepted or rejected when material
- Persisted with decision metadata
- Traceable in audit records

This preserves human accountability while still benefiting from AI acceleration.

## 6. Source-Aware Workflow Principle

Source documents and evidence should become first-class platform objects.

Over time, workflow definitions, node executions, and run histories should be able to reference evidence anchors, including:

- Document files and specific pages
- Excerpts and highlighted spans
- Spreadsheet sheets, ranges, and cells
- Database rows or query snapshots
- Email artifacts and attachments
- Manual notes tied to decisions

The objective is to make workflow outcomes explainable and evidence-backed, not just automated.


## 7. Visual Hierarchy for L1 / L2 / L3 Workflow Elements

### 1. Visual purpose of each level

The layered workflow model should communicate structure at a glance, even before full semantic behavior is implemented.

- **Level 1 (L1)** should feel structural, representing a major stage, section, or layer in the overall process.
- **Level 2 (L2)** should feel operational, representing blocks, internal working steps, or calculation steps inside a stage.
- **Level 3 (L3)** should feel evidentiary, representing source artifacts, evidence items, or supporting inputs.

### 2. Styling direction for each level

#### Level 1 (L1)

Recommended styling direction:

- Largest visual footprint
- Stronger border and shadow treatment than other levels
- Premium header band treatment
- Bold title style and clear stage/section naming
- Stage/section badge
- Rounded-2xl or rounded-3xl silhouette
- Optional wider card proportion than L2/L3 nodes

#### Level 2 (L2)

Recommended styling direction:

- Medium visual footprint
- Operational card appearance
- Left accent rail or top accent bar
- Tighter and more modular structure than L1
- Rounded-xl or rounded-2xl silhouette
- Block/step/calculation badge

#### Level 3 (L3)

Level 3 should represent evidence anchors, not only uploaded files. L3 may represent:

- An uploaded PDF
- A page inside a PDF
- An Excel workbook
- A worksheet
- A spreadsheet cell or range
- An email or attachment
- A contract
- An invoice
- A highlighted excerpt
- A database row
- A query snapshot
- A manual note tied to a decision

Recommended styling direction:

- Smallest and most compact footprint
- Source/evidence visual language that suggests cited supporting material
- Document or file icon treatment
- Dashed border or subtle paper-card surface treatment
- Metadata line for source type, origin, or anchor descriptor
- Folded-corner or attachment-like visual metaphor
- Source/evidence badge

### 3. Shape differentiation

Different shapes should reinforce the three levels before deeper semantics exist:

- **L1:** large rounded stage card with panel-like emphasis
- **L2:** compact process block with modular card treatment
- **L3:** document-shaped card or evidence-chip style element

This can be introduced through CSS variants, custom React Flow node renderers, visual wrappers, and node style tokens without changing execution behavior.

### 4. Edge and connector styling

Connection styles should also encode hierarchy:

- L1 to L2 edges should feel structural and primary
- L2 to L3 edges should feel lighter and support-oriented, indicating evidence linkage
- Human review and approval paths can later use distinct line treatments
- AI-assisted links can later include subtle visual indicators

### 5. Node badges and status language

Use lightweight and consistent badge language to reinforce intent:

- `L1 • Stage`
- `L2 • Step`
- `L2 • Calculation`
- `L3 • Source`
- `AI-assisted`
- `Human-reviewed`
- `Approved`
- `Evidence-linked`

### 6. Minimal implementation philosophy

The first pass for L1/L2/L3 should remain additive and low-risk:

- No deep behavioral changes are required initially
- Styling-only or metadata-driven visual differentiation is sufficient for the first increment
- The immediate goal is visual hierarchy now; richer semantics and behavior can be layered in later phases

### 7. Likely front-end touch points

Likely UI areas to evolve for L1/L2/L3 hierarchy:

- Custom React Flow node components
- Node renderer and node type mapping
- Workflow canvas presentation layer
- Inspector side panel presentation
- Legend and node palette
- Status badge rendering
- Tailwind component style variants

If code changes are introduced in a later implementation step, preferred direction remains additive and minimal:

- Do not rewrite the canvas
- Do not rewrite the executor
- Start with presentational node variants or visual wrappers for L1/L2/L3
- Preserve existing behavior while improving hierarchy and visual polish

## 8. Initial Roadmap

### Phase 1
Document current architecture and adaptation context.

### Phase 2
Add source document model and source APIs.

### Phase 3
Add styling-only L1/L2/L3 visual node variants.

### Phase 4
Add immutable audit event model.

### Phase 5
Add source references linked to executions, logs, and audit events.

### Phase 6
Add human review and approval nodes.

### Phase 7
Add workflow versioning and publishing.

### Phase 8
Add AI suggestion records and accept/reject flows.

### Phase 9
Add organization/workspace RBAC.

### Phase 10
Premium workspace refinements: source drawer, audit drawer, run timeline, node badges, version history.

## 9. Near-Term Constraint

The first implementation should avoid rewriting the existing workflow executor.

Near-term technical changes should stay additive and minimal:

- Documentation and architecture context
- Schema extensions (new tables/relations only)
- Simple source document APIs
- Append-only audit event model
- UI entry points that do not disturb the existing canvas behavior

This constraint reduces risk and preserves existing template stability.

## 10. Files Likely To Matter Later

Likely future touch points for iterative adaptation:

- `lib/db/schema.ts`
- `app/api/workflows/*`
- `app/api/workflow/[workflowId]/execute`
- `app/api/workflows/[workflowId]/executions`
- `app/api/workflows/executions/[executionId]/logs`
- `components/workflow/*`
- `lib/workflow-executor.workflow.ts`
- Plugin registry files
- `app/api/sources/*` (new)
- `app/api/audit/*` (new)
- `app/api/reviews/*` (new)

## 11. Implementation Posture

This fork follows an additive product adaptation plan, not a rewrite plan.

The visual builder, execution engine, integrations model, and current template architecture remain foundational. New capabilities should layer on top in controlled phases, with backward compatibility and incremental delivery as default engineering practice.

Implementation guardrails:

- Additive changes only
- No rewrite of the canvas
- No rewrite of the executor
- L1/L2/L3 hierarchy can start as metadata-driven visual variants
- Deeper source/evidence semantics can be layered in over later phases
