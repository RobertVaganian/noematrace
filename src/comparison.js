const row = (key, label, before, after, extra = {}) => ({
  key,
  label,
  before,
  after,
  changed: before !== after,
  ...extra,
});

export function compareRecords(before, after, prefix = "record") {
  const fields = [
    ["id", "Document"],
    ["vendor", "Supplier"],
    ["vendorId", "Supplier ID"],
    ["currency", "Currency"],
  ];
  const rows = fields.map(([field, label]) =>
    row(
      `${prefix}.${field}`,
      label,
      before?.[field] ?? null,
      after?.[field] ?? null,
    ),
  );
  const money = {
    kind: "money",
    beforeCurrency: before?.currency,
    afterCurrency: after?.currency,
  };
  rows.push(
    row(
      `${prefix}.total`,
      "Total",
      before?.cents ?? null,
      after?.cents ?? null,
      money,
    ),
  );
  const count = Math.max(before?.lines.length ?? 0, after?.lines.length ?? 0);
  for (let index = 0; index < count; index++) {
    const a = before?.lines[index],
      b = after?.lines[index];
    const label = `Line ${index + 1} · ${b?.name || a?.name}`;
    for (const [field, name] of [
      ["name", "Description"],
      ["qty", "Quantity"],
      ["unit", "Unit price"],
    ]) {
      rows.push(
        row(
          `${prefix}.line.${index}.${field}`,
          `${label} / ${name}`,
          a?.[field] ?? null,
          b?.[field] ?? null,
          field === "unit" ? money : {},
        ),
      );
    }
  }
  return rows;
}

// Document identifiers are deliberately different across an invoice and order.
// Compare only evidence fields; never return restricted values to the UI.
export function compareInvoiceOrder(invoice, order, access) {
  if (!access.invoice || !access.order || !invoice || !order)
    return { available: false, rows: [], mismatches: 0 };
  const rows = compareRecords(invoice, order, "association").filter(
    (field) => field.key !== "association.id",
  );
  return {
    available: true,
    rows,
    mismatches: rows.filter((field) => field.changed).length,
  };
}

export function compareProposals(before, after, access) {
  const groups = [
    {
      name: "Proposal",
      available: true,
      rows: [
        row(
          "association",
          "Linked order",
          before.candidateId,
          after.candidateId,
        ),
        row("reason", "Reviewer's explanation", before.reason, after.reason),
      ],
    },
  ];
  for (const [key, name] of [
    ["invoice", "Invoice evidence"],
    ["order", "Order evidence"],
  ]) {
    groups.push({
      name,
      available: access[key],
      rows: access[key]
        ? compareRecords(before.test[key], after.test[key], key)
        : [],
    });
  }
  return groups;
}

// Group ordered line evidence without dropping fields, keys or absent values.
export function groupComparisonRows(rows) {
  const result = [];
  let previous = null;
  for (const row of rows) {
    const split = row.label.lastIndexOf(" / ");
    const group = row.key.includes(".line.") && split >= 0 ? row.label.slice(0, split) : null;
    if (group && group !== previous) result.push({ group: true, key: `group:${row.key}`, label: group });
    result.push(group ? { ...row, fullLabel: row.label, label: row.label.slice(split + 3) } : row);
    previous = group;
  }
  return result;
}
