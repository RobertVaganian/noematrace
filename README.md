<div align="center">

  <img src="public/brand/logo-animated.gif" alt="NoemaTrace animated mark" width="80" height="80">

  # NoemaTrace

  **Trace the exception. Keep the evidence.**

  Product design & working prototype by **Robert Vaganian**

  [![Checks](https://img.shields.io/github/actions/workflow/status/RobertVaganian/noematrace/checks.yml?branch=main&label=checks&style=flat&labelColor=242831)](https://github.com/RobertVaganian/noematrace/actions/workflows/checks.yml)
  [![Deployment](https://img.shields.io/github/actions/workflow/status/RobertVaganian/noematrace/deploy.yml?branch=main&label=deploy&style=flat&labelColor=242831)](https://github.com/RobertVaganian/noematrace/actions/workflows/deploy.yml)
  [![React 19 and Vite 6](https://img.shields.io/badge/React_19-Vite_6-626e80?style=flat&labelColor=242831)](package.json)
  [![Node.js 22.12 or newer](https://img.shields.io/badge/Node-%E2%89%A522.12-626e80?style=flat&labelColor=242831)](.nvmrc)

  [![On-device AI](https://img.shields.io/badge/AI-on_device-626e80?style=flat&labelColor=242831)](docs/local-order-matching.md)

  <p>
    <a href="https://robertvaganian.github.io/noematrace/"><strong>Live prototype</strong></a>
    &nbsp; · &nbsp;
    <a href="https://robertvaganian.github.io/noematrace/case-study/"><strong>Case study</strong></a>
  </p>

</div>


---

NoemaTrace brings an invoice exception, its source records and the next review action into one workspace. Trace the mismatch, find an order, test the association and keep the decision with the version that was reviewed.

**The case:** an invoice for **€12,480** is linked to an order for **€1,248**. The workflow stops before payment. Operations investigates what went wrong. Finance reviews the proposed correction and decides whether to approve it.

![NoemaTrace workspace with the mismatch, dependency graph and source evidence](docs/screenshots/overview.jpg?v=35)

## Inside the workspace

Six moments from the same review, in light and dark themes. Select a screen to see it at full size.

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>01 · Trace the exception</strong><br><br>
      <a href="docs/screenshots/trace-dark.jpg?v=35"><img src="docs/screenshots/trace-dark.jpg?v=35" alt="The failed check, its source records and the execution log." width="440"></a><br>
      <sub>The failed check, its source records and the execution log.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>02 · Review the association</strong><br><br>
      <a href="docs/screenshots/review-light.jpg?v=35"><img src="docs/screenshots/review-light.jpg?v=35" alt="Inspect supplier, currency, amount and line items together." width="440"></a><br>
      <sub>Inspect supplier, currency, amount and line items together.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>03 · Compare the evidence</strong><br><br>
      <a href="docs/screenshots/comparison-dark.jpg?v=35"><img src="docs/screenshots/comparison-dark.jpg?v=35" alt="Compare the original and proposed orders with the saved test result." width="440"></a><br>
      <sub>Compare the original and proposed orders with the saved test result.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>04 · Record the decision</strong><br><br>
      <a href="docs/screenshots/finance-light.jpg?v=35"><img src="docs/screenshots/finance-light.jpg?v=35" alt="Finance reviews one proposal and its exact test evidence." width="440"></a><br>
      <sub>Finance reviews one proposal and its exact test evidence.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>05 · Keep the history</strong><br><br>
      <a href="docs/screenshots/history-dark.jpg?v=35"><img src="docs/screenshots/history-dark.jpg?v=35" alt="Returned and approved versions retain separate decisions." width="440"></a><br>
      <sub>Returned and approved versions retain separate decisions.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>06 · Catch source changes</strong><br><br>
      <a href="docs/screenshots/stale-light.jpg?v=35"><img src="docs/screenshots/stale-light.jpg?v=35" alt="Changed records invalidate approval without erasing its history." width="440"></a><br>
      <sub>Changed records invalidate approval without erasing its history.</sub>
    </td>
  </tr>
</table>

## On-device AI: match the wording, inspect the source

**“Temperature probes” → “Industrial sensor”. “Delivery and handling” → “Freight”.**

The **AI · Match order** button finds purchase orders by item meaning. Each phrase stays beside the closest original order line. Exact supplier, currency, total and line-item checks sit above the match; a familiar description cannot hide the wrong supplier.

![Local item matching with the original order lines and four source checks](docs/screenshots/order-match-light.jpg?v=35)

Try the alternate wording or enter your own phrases. **Inspect in review** selects the order for your normal review. You still write the explanation, run the read-only test and request a Finance decision.

| Available immediately | Optional local model |
| --- | --- |
| Source-check preview, labelled **no model running** | Real semantic matching in a Web Worker |
| Compare the exact fields of all three orders | Compare different names for the same items |
| No download | About 50 MB on first use, including a 23 MB model |

**No API key or paid inference account.** Descriptions are processed on the visitor’s device. Cancel, unload and remove downloaded model files from the matching window. Unrelated wording can return no close match; changed source records require a new comparison.

[Try order matching →](https://robertvaganian.github.io/noematrace/?match=1&showcase=trace) · [How it works](docs/local-order-matching.md)

## How the review works

**Investigate → Match → Test → Submit → Review → Decide**

Operations selects a candidate and explains the evidence. A read-only test checks supplier, currency, total and ordered line items. Finance approves the submitted association or returns it with a note. Revisions retain their own evidence and decisions; later source changes require a fresh test.

**Approval covers the association correction. It does not authorize or execute a payment.**

## Follow the review without losing its version

The header bell shows unread activity for the current demo role. Operations receives test results, Finance decisions and source changes; Finance receives submitted proposals and source changes. Each event opens the saved test or the exact proposal version.

Read one event or mark the current list read. Read state stays separate for each role and survives a reload in this browser. Opening an event never approves a proposal or restores outdated evidence.

[Explore notifications →](https://robertvaganian.github.io/noematrace/?showcase=notifications) · [Event and storage rules](docs/notifications.md)

## Why I designed it this way

**Keep the context together.** The graph shows the dependency chain, the inspector shows the selected step, and the chronological log explains how the workflow reached the exception.

**Make AI inspectable at the point of use.** Matching belongs beside the missing order reference. Original descriptions and independent field checks give the reviewer something concrete to inspect before selecting a suggestion.

**Attach decisions to versions.** A passing test or approval should not outlive its evidence. Earlier snapshots stay readable after a source change, while a new decision needs current records.

The workspace also includes a seven-step tour, resizable panels, local review recovery, light and dark themes, role-specific notifications, and CSV/JSON event export.

On phones, the navigation starts collapsed to leave room for the workflow. Header actions have equal 44 px touch targets; drag and pinch navigate the graph, and Fit restores all six steps. The event log follows the canvas in the page, without a second scrolling panel.

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
| Local matching and original-source handoff | [`src/OrderMatcher.jsx`](src/OrderMatcher.jsx) |
| Field-level evidence comparison | [`src/VersionComparison.jsx`](src/VersionComparison.jsx) |
| Event-derived notifications and read receipts | [`src/notifications.js`](src/notifications.js) |
| Event filtering and review exports | [`src/AuditExplorer.jsx`](src/AuditExplorer.jsx) |
| Product design walkthrough | [`src/CaseStudy.jsx`](src/CaseStudy.jsx) |

I added tests to cover the main state transitions and role permissions, so things like stale evidence, interrupted tests and version-specific decisions stay consistent across changes.

</details>

## Scope and credits

An interactive product design concept by **[Robert Vaganian](https://github.com/RobertVaganian)**. It uses synthetic records and simulated roles, with no live ERP, banking integration or server-enforced authorization. Review data is stored in the current browser.

Screens and case-study media show the prototype and its interface iterations. They are not participant research or measured business outcomes.

All rights reserved. See [LICENSE](LICENSE). Dependency and asset notices are included in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt) and the bundled asset directories.
