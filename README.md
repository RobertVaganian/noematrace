<div align="center">

  <img src="public/brand/logo-animated.gif" alt="NoemaTrace animated mark" width="80" height="80">

  # NoemaTrace

  **A workspace for tracing invoice exceptions**

  Product design & working prototype by **Robert Vaganian**

  [![Checks](https://img.shields.io/github/actions/workflow/status/RobertVaganian/noematrace/checks.yml?branch=main&label=checks&style=flat&labelColor=242831)](https://github.com/RobertVaganian/noematrace/actions/workflows/checks.yml)
  [![Deployment](https://img.shields.io/github/actions/workflow/status/RobertVaganian/noematrace/deploy.yml?branch=main&label=deploy&style=flat&labelColor=242831)](https://github.com/RobertVaganian/noematrace/actions/workflows/deploy.yml)
  [![React 19 and Vite 6](https://img.shields.io/badge/React_19-Vite_6-626e80?style=flat&labelColor=242831)](package.json)
  [![Node.js 22.12 or newer](https://img.shields.io/badge/Node-%E2%89%A522.12-626e80?style=flat&labelColor=242831)](.nvmrc)

  <p>
    <a href="https://robertvaganian.github.io/noematrace/"><strong>Live prototype</strong></a>
    &nbsp; · &nbsp;
    <a href="https://robertvaganian.github.io/noematrace/case-study/"><strong>Case study</strong></a>
  </p>

</div>


---

NoemaTrace is a workspace for reviewing a blocked invoice process. You follow the mismatch, test a corrected purchase order association, and keep the evidence tied to whatever decision gets made.

**The case:** an invoice for **€12,480** is linked to an order for **€1,248**. The workflow stops before payment. Operations investigates what went wrong. Finance reviews the proposed correction and decides whether to approve it.

## Inside the workspace

Six moments from the same review, in light and dark themes. Select a screen to see it at full size.

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>01 · Trace the exception</strong><br><br>
      <a href="docs/screenshots/trace-dark.jpg?v=31"><img src="docs/screenshots/trace-dark.jpg?v=31" alt="The failed check, its source records and the execution log." width="440"></a><br>
      <sub>The failed check, its source records and the execution log.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>02 · Review the association</strong><br><br>
      <a href="docs/screenshots/review-light.jpg?v=31"><img src="docs/screenshots/review-light.jpg?v=31" alt="Inspect supplier, currency, amount and line items together." width="440"></a><br>
      <sub>Inspect supplier, currency, amount and line items together.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>03 · Compare the evidence</strong><br><br>
      <a href="docs/screenshots/comparison-dark.jpg?v=31"><img src="docs/screenshots/comparison-dark.jpg?v=31" alt="Read field-level differences before testing a correction." width="440"></a><br>
      <sub>Read field-level differences before testing a correction.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>04 · Record the decision</strong><br><br>
      <a href="docs/screenshots/finance-light.jpg?v=31"><img src="docs/screenshots/finance-light.jpg?v=31" alt="Finance reviews one proposal and its exact test evidence." width="440"></a><br>
      <sub>Finance reviews one proposal and its exact test evidence.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>05 · Keep the history</strong><br><br>
      <a href="docs/screenshots/history-dark.jpg?v=31"><img src="docs/screenshots/history-dark.jpg?v=31" alt="Returned and approved versions retain separate decisions." width="440"></a><br>
      <sub>Returned and approved versions retain separate decisions.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>06 · Catch source changes</strong><br><br>
      <a href="docs/screenshots/stale-light.jpg?v=31"><img src="docs/screenshots/stale-light.jpg?v=31" alt="Changed records invalidate approval without erasing its history." width="440"></a><br>
      <sub>Changed records invalidate approval without erasing its history.</sub>
    </td>
  </tr>
</table>

## How the review works

**Investigate → Submit → Review → Decide**

Operations traces the failed check from the invoice to the linked order, picks a candidate purchase order, and explains why it fits. A read-only test compares supplier, currency, total and line items. An order with the right amount but the wrong supplier does not pass.

Finance reviews the submitted version with its test results, then either approves the association or returns it with a note. Each revision keeps its own explanation and test output. If source records change later, the earlier snapshot stays in the history but a fresh test is required.

**Approval covers the corrected association only. It does not authorize or execute a payment.**

## Why I designed it this way

I wanted to see whether I could make an exception review feel less like digging through separate screens and more like having the whole context in front of you. The graph keeps the dependency chain visible. The detail panel shows the selected step. The log runs chronologically below. You don't have to reconstruct what happened by opening three tabs.

What also mattered was that a decision should be permanently attached to the version that was actually reviewed. If someone requests changes, the revision becomes a separate version with its own explanation and test results. You can compare them directly instead of guessing what changed between rounds.

And I wanted the interface to be honest about outdated evidence. If the source data changes after approval, the earlier test results still exist in the history. But they are clearly marked as stale, and the reviewer has to test again before a new decision can be made.

The prototype also has a seven-step tour, resizable panels, review persistence, light and dark themes, and an event log with CSV and JSON export.

## Run locally

Requires **Node.js 22.12+** and npm.

```sh
git clone https://github.com/RobertVaganian/noematrace.git
cd noematrace
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm test` | Run the review, evidence, persistence and routing tests |
| `npm run build` | Build for a domain root |
| `npm run build:pages` | Build for GitHub Pages at `/noematrace/` |
| `npm run preview` | Serve the production build locally |

The workspace opens at `/`; the design walkthrough is at `/case-study`. Both also work beneath the GitHub Pages project path. See [deployment notes](docs/deployment.md).

<details>
<summary><strong>Implementation and project structure</strong></summary>

Built with JavaScript, React 19, Vite 6, React Flow and Phosphor icons. Inter and Geist fonts are bundled through Fontsource.

| Area | Entry point |
| --- | --- |
| Workspace and review navigation | [`src/App.jsx`](src/App.jsx) |
| Review rules, synthetic records and state transitions | [`src/model.js`](src/model.js) |
| Versioned review storage and recovery | [`src/persistence.js`](src/persistence.js) |
| Proposal history and Finance review | [`src/ProposalReview.jsx`](src/ProposalReview.jsx) |
| Field-level evidence comparison | [`src/VersionComparison.jsx`](src/VersionComparison.jsx) |
| Event filtering and review exports | [`src/AuditExplorer.jsx`](src/AuditExplorer.jsx) |
| Product design walkthrough | [`src/CaseStudy.jsx`](src/CaseStudy.jsx) |

I added tests to cover the main state transitions and role permissions, so things like stale evidence, interrupted tests and version-specific decisions stay consistent across changes.

</details>

## Scope and credits

An interactive product design concept by **[Robert Vaganian](https://github.com/RobertVaganian)**. It uses synthetic records and simulated roles, with no live ERP, banking integration or server-enforced authorization. Review data is stored in the current browser.

Screens and case-study media show the prototype and its interface iterations. They are not participant research or measured business outcomes.

All rights reserved. See [LICENSE](LICENSE). Dependency and asset notices are included in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt) and the bundled asset directories.
