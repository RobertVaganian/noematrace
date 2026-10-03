import { ArrowRightIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { Modal } from "./components.jsx";
import { nextReviewAction } from "./review-guide.js";
import { tourStepCount } from "./onboarding.js";

const steps = [
  ["01", "Inspect", "Compare the invoice and order. Check the supplier and line items, as well as the amount."],
  ["02", "Test", "Operations proposes an association and tests a read-only branch. All four checks must pass."],
  ["03", "Submit", "A proposal preserves the explanation, test ID and exact document versions."],
  ["04", "Decide", "Finance approves the correction or requests changes with a note. Changed evidence requires a fresh test."],
];

export function ReviewGuide({ state, onClose, onContinue, onTour }) {
  const next = nextReviewAction(state);
  return (
    <Modal
      title="Review a blocked workflow"
      eyebrow="NoemaTrace / Review guide"
      onClose={onClose}
      className="review-guide-modal"
    >
      <p className="guide-intro">
        A workspace for understanding why an automated invoice process stopped
        and checking a correction before a human decision.
      </p>
      <div className="guide-tour-entry">
        <button className="text-button guide-tour-action" onClick={onTour}>Take the interface tour<ArrowRightIcon size={14} /></button>
        <span>{tourStepCount} steps · Skip any time</span>
      </div>
      <section className="guide-next" aria-labelledby="guide-next-title">
        <span className="eyebrow">Your next step</span>
        <h3 id="guide-next-title">{next.title}</h3>
        <p>{next.text}</p>
        <button className="primary-button" onClick={() => onContinue(next.kind)}>
          {next.label}
          <ArrowRightIcon size={16} />
        </button>
      </section>
      <ol className="guide-route" aria-label="How the review works">
        {steps.map(([number, title, text]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="guide-boundary">
        <LockSimpleIcon size={16} />
        Synthetic records and simulated roles. No payment or external system is
        connected.
      </p>
    </Modal>
  );
}
