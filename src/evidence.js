import { invoice, currentOrder, money } from "./model.js";

export function invoiceFieldEvidence(state) {
  if (!state.sourceAccess.invoice) return { available: false };
  return {
    available: true,
    version: invoice.version,
    fields: [
      { name: "Invoice number", value: invoice.id },
      { name: "Supplier", value: invoice.vendor },
      { name: "Supplier ID", value: invoice.vendorId },
      { name: "Invoice date", value: invoice.date },
      { name: "Currency", value: invoice.currency },
      { name: "Total", value: money(invoice.cents), cents: invoice.cents },
    ],
  };
}

export function evidenceDocument(state, test, source, view) {
  if (!["invoice", "order"].includes(source) || !state.sourceAccess[source])
    return { available: false };
  const record =
    view === "current"
      ? source === "invoice"
        ? invoice
        : currentOrder(state, test.candidateId)
      : test[source];
  return record ? { available: true, record } : { available: false };
}
