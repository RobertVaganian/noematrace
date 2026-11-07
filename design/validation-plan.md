# NoemaTrace — planned usability sessions

Status: optional future plan. Participant access is currently unavailable. No sessions or participant results are claimed. Current evaluation consists of interface inspection, technical tests and browser walkthroughs. Participant sessions are still pending. User comprehension remains unvalidated.

## Participants and setup

Aim to recruit three people who work with operational exceptions or invoice processing and two people who review financial changes. Record relevant experience; label adjacent participants separately. Use synthetic documents only. Run 30–40 minute sessions on the same prototype version and preserve notes with consent.

Before tasks, explain that the environment is simulated and will not move money. Do not explain which order is correct or how the source-freshness behavior works.

## Neutral tasks

1. A run has stopped. Explain why and identify the evidence you would inspect before taking action.
2. Prepare a correction you would be comfortable sending for review. Explain the evidence you used.
3. As the financial reviewer, inspect the submitted correction and record your decision.
4. The correction has been returned with a request for clarification. Prepare another submission and explain what remains available from the earlier version.
5. The ERP record has updated after the earlier review. Decide what can safely happen next.
6. A source document is unavailable. Explain what you can establish and what you would need before proceeding.
7. Explain what has happened to the original run and whether any payment has started.

Use the source-update and access controls between tasks; do not ask participants to operate the test harness themselves. Counterbalance the misleading-order and source-update examples where possible. Record facilitator assistance.

## Observations to record

| Question | Evidence |
| --- | --- |
| Can the participant explain the mismatch? | Their explanation and documents inspected |
| Is the selected association justified? | Supplier, currency, amount and line evidence used |
| Are role boundaries understood? | Attempted self-approval, uncertainty and handoff behavior |
| Are versions and tests distinguished? | Version opened, test identified, interpretation of previous notes |
| Is stale evidence recognized? | Action attempted after the ERP update and explanation |
| Is recovery understandable? | Steps after source loss and after access returns |
| Is the execution boundary clear? | Whether the participant believes approval created or authorized payment |

Record task completion, errors, hesitations, time to a correct explanation and confidence in the next action. Treat times as descriptive observations for this small sample; do not turn them into population or business improvement claims.

## Triggers for another design iteration

- A participant interprets a passing test or correction approval as payment execution.
- A participant relies on an outdated snapshot as current evidence.
- A participant cannot distinguish the returned version from the new draft.
- A participant approves based only on the matching amount.
- A participant cannot find the next action after a source becomes unavailable.

Revise the affected interaction and repeat those tasks. Keep actual observations, changes and unresolved questions in the eventual portfolio case.
