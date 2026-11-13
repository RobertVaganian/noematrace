export const invoice = Object.freeze({
  id: "INV-2048",
  vendor: "Northline Components",
  vendorId: "SUP-4587",
  currency: "EUR",
  cents: 1248000,
  date: "28 Oct 2026",
  version: "1.0",
  lines: [
    {
      name: "Industrial sensor NX-100",
      qty: 40,
      unit: 24000,
    },
    {
      name: "Mounting kit MK-7",
      qty: 20,
      unit: 12000,
    },
    {
      name: "Freight",
      qty: 1,
      unit: 48000,
    },
  ],
});
export const orders = [
  {
    id: "PO-731",
    vendor: "Northline Components",
    vendorId: "SUP-4587",
    currency: "EUR",
    cents: 124800,
    date: "20 Oct 2026",
    version: "3.2",
    description: "Sensor sample order",
    lines: [
      {
        name: "Industrial sensor NX-100",
        qty: 8,
        unit: 15600,
      },
    ],
  },
  {
    id: "PO-732",
    vendor: "Northline Components",
    vendorId: "SUP-4587",
    currency: "EUR",
    cents: 1248000,
    date: "24 Oct 2026",
    version: "1.4",
    description: "Sensors and mounting kits",
    lines: invoice.lines.map((x) => ({
      ...x,
    })),
  },
  {
    id: "PO-733",
    vendor: "Atlas Parts",
    vendorId: "SUP-9271",
    currency: "EUR",
    cents: 1248000,
    date: "25 Oct 2026",
    version: "1.0",
    description: "Assembly components",
    lines: [
      {
        name: "Assembly component",
        qty: 100,
        unit: 12480,
      },
    ],
  },
];
export const money = (cents) =>
  "EUR " +
  (cents / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function assessOrder(order) {
  return !order
    ? []
    : [
        {
          name: "Supplier",
          pass: order.vendorId === invoice.vendorId,
          detail: order.vendor,
        },
        {
          name: "Currency",
          pass: order.currency === invoice.currency,
          detail: order.currency,
        },
        {
          name: "Total",
          pass: order.cents === invoice.cents,
          detail: money(order.cents),
        },
        {
          name: "Line items",
          pass: JSON.stringify(order.lines) === JSON.stringify(invoice.lines),
          detail: `${order.lines.length} ${order.lines.length === 1 ? "line item" : "line items"}`,
        },
      ];
}
export const baseEvents = [
  {
    time: "10:42:01",
    step: "Extract fields",
    event: "Completed",
    detail: "Extracted 6 fields from invoice PDF",
    actor: "Extraction agent",
  },
  {
    time: "10:42:03",
    step: "Compare totals",
    event: "Mismatch",
    detail: "Invoice EUR 12,480.00 vs order EUR 1,248.00",
    actor: "Total check",
  },
  {
    time: "10:42:03",
    step: "Prepare payment",
    event: "Not started",
    detail: "Waiting for successful total check",
    actor: "Workflow gate",
  },
];
export const people = {
  operator: {
    name: "Robert Vaganian",
    initials: "RV",
    title: "Operations reviewer",
  },
  approver: { name: "Marcus Hale", initials: "MH", title: "Finance approver" },
};
export const initialState = {
  role: "operator",
  candidateId: "",
  reason: "",
  revision: 0,
  draftVersion: 1,
  phase: "idle",
  result: null,
  audit: [],
  error: "",
  proposals: [],
  tests: [],
  sourceEpoch: 0,
  sourceUpdatedAt: "10:42",
  orderGeneration: 0,
  sourceAccess: { invoice: true, order: true },
  decisionDrafts: {},
};
export const latestProposal = (state) => state.proposals.at(-1) || null;
export function currentOrder(state, id) {
  const base = orders.find((order) => order.id === id);
  if (!base) return null;
  if (id !== "PO-732" || state.orderGeneration === 0) return base;
  const changed = state.orderGeneration % 2 === 1;
  const lines = base.lines.map((line) => ({
    ...line,
    unit: line.name === "Freight" && changed ? 96000 : line.unit,
  }));
  return {
    ...base,
    retrievedAt: state.sourceUpdatedAt,
    version: `1.${4 + state.orderGeneration}`,
    lines,
    cents: lines.reduce((sum, line) => sum + line.qty * line.unit, 0),
  };
}
export function evidenceState(state, test) {
  if (!state.sourceAccess.invoice)
    return {
      current: false,
      reason:
        "Invoice source is unavailable. Restore access and run a new test.",
    };
  if (!state.sourceAccess.order)
    return {
      current: false,
      reason:
        "Purchase order source is unavailable. Restore access and run a new test.",
    };
  if (!test || test.sourceEpoch !== state.sourceEpoch)
    return {
      current: false,
      reason:
        "Source evidence changed after this test. A new version and test are required.",
    };
  return { current: true, reason: "Tested source versions are current." };
}
export const proposalLabels = {
  pending: "Awaiting approval",
  approved: "Correction approved",
  changes_requested: "Changes requested",
  outdated: "Evidence outdated",
};
const locked = (state) =>
  state.role !== "operator" ||
  ["requested", "approved", "changes_requested", "outdated"].includes(
    state.phase,
  );
// One validation order for both the reducer and field-level form feedback.
export function testIssue(state) {
  if (locked(state))
    return { field: "role", message: "Only the operations reviewer can test an editable proposal." };
  if (!currentOrder(state, state.candidateId))
    return { field: "order", message: "Choose a purchase order to test." };
  if (!state.sourceAccess.invoice || !state.sourceAccess.order)
    return { field: "access", message: "Both source documents must be available before testing." };
  if (state.reason.trim().length < 8)
    return { field: "reason", message: "Add a brief explanation of what you checked (at least 8 characters)." };
  return null;
}
const event = (
  state,
  step,
  status,
  detail,
  actor = people[state.role].name,
) => ({
  time: new Date(Date.UTC(2026, 9, 31, 10, 44, state.audit.length * 9))
    .toISOString()
    .slice(11, 19),
  step,
  event: status,
  detail,
  actor,
});
function invalidateEvidence(state, changes, detail) {
  const proposals = state.proposals.map((p) =>
    ["pending", "approved"].includes(p.status)
      ? {
          ...p,
          status: "outdated",
          previousStatus: p.status,
          invalidatedReason: detail,
        }
      : p,
  );
  return {
    ...state,
    ...changes,
    sourceEpoch: state.sourceEpoch + 1,
    revision: state.revision + 1,
    result: null,
    proposals,
    error: "",
    phase: ["requested", "approved", "outdated", "changes_requested"].includes(
      state.phase,
    )
      ? "outdated"
      : "idle",
    audit: [
      ...state.audit,
      event(state, "Source evidence", "Changed", detail, "ERP / document sync"),
    ],
  };
}
export function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return {
        ...initialState,
        audit: [],
        proposals: [],
        tests: [],
        sourceAccess: { invoice: true, order: true },
        decisionDrafts: {},
      };
    case "SET_ROLE":
      return people[action.role]
        ? { ...state, role: action.role, error: "" }
        : state;
    case "CANDIDATE":
      return locked(state)
        ? state
        : {
            ...state,
            candidateId: action.id,
            result: null,
            phase: "idle",
            revision: state.revision + 1,
            error: "",
          };
    case "REASON":
      return locked(state)
        ? state
        : {
            ...state,
            reason: action.value,
            result: null,
            phase: "idle",
            revision: state.revision + 1,
            error: "",
          };
    case "BEGIN_TEST": {
      const issue = testIssue(state);
      if (issue) return { ...state, error: issue.message };
      return { ...state, phase: "testing", result: null, error: "" };
    }
    case "COMPLETE_TEST": {
      if (
        state.phase !== "testing" ||
        action.revision !== state.revision ||
        !state.sourceAccess.invoice ||
        !state.sourceAccess.order
      )
        return state;
      const order = currentOrder(state, state.candidateId);
      const checks = assessOrder(order);
      const result = {
        id: `TST-${String(state.tests.length + 1).padStart(3, "0")}`,
        revision: state.revision,
        version: state.draftVersion,
        sourceEpoch: state.sourceEpoch,
        candidateId: state.candidateId,
        invoice: structuredClone(invoice),
        order: structuredClone(order),
        checks,
        testedAt: event(state).time,
        passed: checks.length === 4 && checks.every((x) => x.pass),
      };
      return {
        ...state,
        phase: "tested",
        result,
        tests: [...state.tests, result],
        audit: [
          ...state.audit,
          event(
            state,
            "Test branch",
            result.passed ? "Passed" : "Failed",
            `${result.id} / draft v${state.draftVersion} / ${state.candidateId}; read-only, external actions skipped`,
            people.operator.name,
          ),
        ],
      };
    }
    case "REQUEST_APPROVAL": {
      if (
        state.role !== "operator" ||
        state.phase !== "tested" ||
        !state.result?.passed ||
        state.result.revision !== state.revision ||
        !evidenceState(state, state.result).current
      )
        return {
          ...state,
          error:
            "A current passing test is required before requesting approval.",
        };
      const proposal = {
        id: `PROP-2048-v${state.draftVersion}`,
        version: state.draftVersion,
        candidateId: state.candidateId,
        reason: state.reason.trim(),
        status: "pending",
        submittedBy: people.operator.name,
        submittedAt: event(state).time,
        test: structuredClone(state.result),
        decision: null,
      };
      return {
        ...state,
        phase: "requested",
        error: "",
        proposals: [...state.proposals, proposal],
        audit: [
          ...state.audit,
          event(
            state,
            "Approval request",
            "Pending",
            `Proposal v${proposal.version}, ${proposal.candidateId}, ${proposal.test.id}. Original run unchanged. Payment not started.`,
          ),
        ],
      };
    }
    case "DECISION_NOTE": {
      const proposal = latestProposal(state);
      if (
        state.role !== "approver" ||
        proposal?.id !== action.proposalId ||
        proposal.status !== "pending" ||
        !evidenceState(state, proposal.test).current ||
        typeof action.value !== "string" ||
        action.value.length > 500
      )
        return state;
      return {
        ...state,
        error: "",
        decisionDrafts: {
          ...state.decisionDrafts,
          [proposal.id]: action.value,
        },
      };
    }
    case "DECIDE_PROPOSAL": {
      const proposal = latestProposal(state);
      if (state.role !== "approver")
        return {
          ...state,
          error: "Only a finance approver can record this decision.",
        };
      if (
        !proposal ||
        action.proposalId !== proposal.id ||
        action.testId !== proposal.test.id ||
        proposal.status !== "pending" ||
        !evidenceState(state, proposal.test).current
      )
        return {
          ...state,
          error:
            "This version is no longer eligible for a decision. Review the current proposal and source evidence.",
        };
      if (!["approve", "changes"].includes(action.decision)) return state;
      const note = (action.note || "").trim();
      if (note.length < 8)
        return {
          ...state,
          error: "Add a decision note of at least 8 characters.",
        };
      if (action.decision === "approve" && !action.acknowledged)
        return {
          ...state,
          error: "Confirm that you reviewed the supplier and line items.",
        };
      const status =
        action.decision === "approve" ? "approved" : "changes_requested";
      const decision = {
        status,
        actor: people.approver.name,
        note,
        time: event(state).time,
        proposalId: proposal.id,
        version: proposal.version,
        testId: proposal.test.id,
        sourceEpoch: state.sourceEpoch,
      };
      const decisionDrafts = { ...state.decisionDrafts };
      delete decisionDrafts[proposal.id];
      return {
        ...state,
        phase: status,
        error: "",
        decisionDrafts,
        proposals: state.proposals.map((p) =>
          p.id === proposal.id ? { ...p, status, decision } : p,
        ),
        audit: [
          ...state.audit,
          event(
            state,
            "Finance decision",
            status === "approved" ? "Approved" : "Returned",
            `Proposal v${proposal.version} / ${proposal.test.id}: ${note}${/[.!?…]$/.test(note) ? "" : "."} No payment action authorized or executed.`,
          ),
        ],
      };
    }
    case "REVISE_PROPOSAL": {
      const proposal = latestProposal(state);
      if (
        state.role !== "operator" ||
        !proposal ||
        !["changes_requested", "outdated"].includes(proposal.status)
      )
        return state;
      return {
        ...state,
        draftVersion: proposal.version + 1,
        phase: "idle",
        candidateId: proposal.candidateId,
        reason: proposal.reason,
        result: null,
        revision: state.revision + 1,
        error: "",
        audit: [
          ...state.audit,
          event(
            state,
            "Proposal revision",
            "Started",
            `Draft v${proposal.version + 1} created from v${proposal.version}; a fresh test is required.`,
          ),
        ],
      };
    }
    case "DEMO_UPDATE_ORDER": {
      const generation =
        state.orderGeneration % 2 === 0
          ? state.orderGeneration + 1
          : state.orderGeneration + 2;
      return invalidateEvidence(
        state,
        { orderGeneration: generation, sourceUpdatedAt: event(state).time },
        `PO-732 updated to v1.${4 + generation}; freight changed from EUR 480.00 to EUR 960.00.`,
      );
    }
    case "DEMO_RESTORE_ORDER": {
      const generation =
        state.orderGeneration % 2 === 1
          ? state.orderGeneration + 1
          : state.orderGeneration + 2;
      return invalidateEvidence(
        state,
        { orderGeneration: generation, sourceUpdatedAt: event(state).time },
        `PO-732 restored to invoice-matching values as v1.${4 + generation}; previous test evidence remains invalid.`,
      );
    }
    case "DEMO_SOURCE_ACCESS": {
      if (
        !["invoice", "order"].includes(action.source) ||
        typeof action.available !== "boolean" ||
        state.sourceAccess[action.source] === action.available
      )
        return state;
      return invalidateEvidence(
        state,
        {
          sourceAccess: {
            ...state.sourceAccess,
            [action.source]: action.available,
          },
        },
        `${action.source === "invoice" ? "Invoice" : "Order"} source access ${action.available ? "restored" : "lost"}; a new test is required.`,
      );
    }
    default:
      return state;
  }
}
