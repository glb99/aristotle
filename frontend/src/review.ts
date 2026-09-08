/**
 * One place to see what is waiting, across every domain.
 *
 * The only surface this restructure adds rather than moves, and the reason
 * dialogue 17 argued the rest was worth its churn.
 *
 * **Three states, drawn distinctly, because they are three different acts.**
 * Asking whether one word covered two things found that it covered three, and
 * that the riskiest of them had no review surface at all:
 *
 * - **live** — already in the log. `claim_extraction` calls `observe()` the
 *   moment it extracts, so the claim is traversable, drawable and able to fire
 *   a conflict before anybody has looked at it. The act is *retract*.
 * - **waiting** — a suggested memory. Inert; reaches no prompt until activated,
 *   which is what ADR 0017 buys. The act is *activate*.
 * - **proposed** — not stored anywhere. `propose(derived)` recomputes it per
 *   request, so nothing exists until you agree. The act is *accept*.
 *
 * Drawing them alike would be the mistake `architecture.ts` already refuses one
 * surface in — *a thing you agreed was a feature must not look identical to one
 * you rejected* — with higher stakes here, because the reader is about to act.
 *
 * **And the rate is reported.** Dialogue 13 replaced the retired bet with a
 * criterion: the proportion of proposals *rejected or edited* rather than waved
 * through, with both tails failing. Nothing measured it, so nobody could see
 * that this project's own first reading is 0% rejected — an agent proposing and
 * an agent accepting, recorded as the owner's judgment. The line exists to be
 * uncomfortable when it reads like that.
 */

import {
  acceptProposal,
  judgeClassification,
  readAllProposals,
  readGraph,
  rejectProposal,
  retractAssertion,
  type ArchProposal,
  type ArchitectureModel,
  type GraphAssertion,
  type Waiting,
} from "./api";
import { el, text, when } from "./dom";

const rateHost = el("review-rate");
const bandHost = el("review-bands");
const countBadge = el("review-count");

/**
 * What the surface is showing. Set by the shell before every refresh.
 *
 * The architecture model is handed in rather than fetched: `model_of` re-parses
 * the tree on every request, and a list is not worth a second walk of it.
 */
let domain: "personal" | "architecture" = "personal";
let architectureModel: ArchitectureModel | null = null;

export function setDomain(next: "personal" | "architecture", model: ArchitectureModel | null): void {
  domain = next;
  architectureModel = model;
}

/** A row, whatever produced it. Three shapes into one so the list is one list. */
interface Row {
  state: "live" | "waiting" | "proposed";
  claim: string;
  meta: string;
  acts: { label: string; danger?: boolean; run: () => Promise<unknown> }[];
}

const BANDS = [
  {
    state: "live" as const,
    label: "LIVE",
    lede: "already in the log — traversable, drawable, able to fire a conflict",
    empty: { personal: "Nothing has been extracted or stated yet.", architecture: "Nothing has been judged yet." },
  },
  {
    state: "waiting" as const,
    label: "WAITING",
    lede: "suggested memory — inert, reaches no prompt until activated",
    // Two reasons for an empty band, and they are opposite findings. Personal
    // has this state and nothing in it; architecture cannot have it at all.
    // One sentence covering both would tell the reader nothing either time.
    empty: {
      personal:
        "Nothing suggested yet. A `remember` call proposes during a conversation " +
        "and the extractor proposes after one — neither reaches a prompt until you " +
        "activate it here.",
      architecture:
        "None, and not because none are pending. Waiting memories belong to the " +
        "agent rather than to an ontology, and this domain's ask is stateless by " +
        "choice — it opens a session, runs one turn and discards it. The three " +
        "states are a union across domains, not a guarantee within one.",
    },
  },
  {
    state: "proposed" as const,
    label: "PROPOSED",
    lede: "recomputed from the source each request — nothing is stored until you judge",
    empty: { personal: "The personal domain proposes memories rather than claims — see WAITING.", architecture: "Every classification the parse suggests has been judged." },
  },
];

function personalRows(graphAssertions: GraphAssertion[], waiting: Waiting[]): Row[] {
  const live: Row[] = graphAssertions.map((assertion) => ({
    state: "live",
    claim: `${assertion.src}  ${assertion.rel}  ${assertion.dst}`,
    meta:
      `${assertion.origin === "stated" ? "you said this" : "the extractor worked this out"} · ` +
      `${when(assertion.recorded_at)}${assertion.trust ? ` · ${assertion.trust}` : ""}`,
    acts: [
      {
        label: "retract",
        danger: true,
        run: () => retractAssertion(assertion.assertion_id),
      },
    ],
  }));

  const pending: Row[] = waiting.map((item) => ({
    state: "waiting",
    claim: `${item.key} = ${JSON.stringify(item.value)}`,
    meta:
      `${item.source} · ${when(item.created_at)}` +
      (item.held_by?.length
        ? ` · replaces ${item.held_by.map((held) => held.scope).join(", ")}`
        : ""),
    acts: [
      { label: "activate", run: () => acceptProposal(item.session_id, item.source, item.key, "session") },
      {
        label: "discard",
        danger: true,
        run: () => rejectProposal(item.session_id, item.source, item.key),
      },
    ],
  }));

  return [...live, ...pending];
}

function architectureRows(model: ArchitectureModel, project: string): Row[] {
  const judged = model.proposals.filter((p: ArchProposal) => p.verdict !== null);
  const open = model.proposals.filter((p: ArchProposal) => p.verdict === null);

  const live: Row[] = judged.map((p) => ({
    state: "live",
    claim: p.sentence,
    meta: `${p.verdict === "agreed" ? "agreed" : "disagreed"} by ${p.stated_by ?? "you"} · ${p.because}`,
    acts: [],
  }));

  const proposed: Row[] = open.map((p) => ({
    state: "proposed",
    claim: p.sentence,
    meta: p.because,
    acts: [
      { label: "agree", run: () => judgeClassification(project, p.subject, p.claim, "agreed") },
      {
        label: "disagree",
        danger: true,
        run: () => judgeClassification(project, p.subject, p.claim, "disagreed"),
      },
    ],
  }));

  return [...live, ...proposed];
}

/**
 * The rejection rate, and the sentence that says why it is on screen.
 *
 * Counted over judgments that *could* have gone either way — a live row nobody
 * could have rejected is not evidence of anything. A rate over an empty
 * denominator says so rather than reading 0%, because "nothing judged yet" and
 * "everything waved through" are opposite findings and must not share a number.
 */
function renderRate(rows: Row[]): void {
  const judged = rows.filter((row) => row.state === "live" && row.acts.length === 0);
  const disagreed = judged.filter((row) => row.meta.startsWith("disagreed")).length;
  rateHost.replaceChildren();

  if (judged.length === 0) {
    rateHost.className = "rate quiet";
    rateHost.append(text("span", "nothing judged here yet", "big"));
    return;
  }

  const pct = Math.round((100 * disagreed) / judged.length);
  rateHost.className = pct === 0 ? "rate alarming" : "rate";
  rateHost.append(text("span", `${judged.length} judged · ${disagreed} rejected`, "big"));
  rateHost.append(text("span", `${pct}% rejected`, "fig"));
  if (pct === 0) {
    rateHost.append(
      text(
        "p",
        "A rate at zero is the rubber stamp: every proposal waved through means " +
          "the model is the agent's with a signature on it. This line is here to " +
          "be uncomfortable when it reads like this.",
        "why",
      ),
    );
  }
}

function renderRows(rows: Row[], onDone: () => Promise<void>): void {
  bandHost.replaceChildren();

  for (const band of BANDS) {
    const mine = rows.filter((row) => row.state === band.state);
    const section = document.createElement("section");
    section.className = "band";

    const header = document.createElement("header");
    header.append(text("span", band.label, `tag t-${band.state}`));
    header.append(text("span", band.lede, "lede"));
    section.append(header);

    if (mine.length === 0) {
      section.append(text("p", band.empty[domain], "empty"));
    }

    for (const row of mine) {
      const item = document.createElement("div");
      item.className = `row ${row.state}`;
      const body = document.createElement("div");
      body.append(text("div", row.claim, "claim"));
      body.append(text("div", row.meta, "meta"));
      item.append(body);

      const acts = document.createElement("div");
      acts.className = "acts";
      for (const act of row.acts) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = act.label;
        if (act.danger) button.className = "danger";
        button.addEventListener("click", async () => {
          // Disabled first. Two clicks on `agree` is two judgments, and the
          // second lands after the first has already changed what is proposed.
          button.disabled = true;
          await act.run();
          await onDone();
        });
        acts.append(button);
      }
      item.append(acts);
      section.append(item);
    }
    bandHost.append(section);
  }
}

export async function refresh(): Promise<void> {
  const rows =
    domain === "personal"
      ? personalRows(
          (await readGraph()).assertions.filter((a: GraphAssertion) => a.origin !== "stated"),
          await readAllProposals(),
        )
      : architectureModel
        ? architectureRows(architectureModel, architectureModel.project.project_id)
        : [];

  renderRate(rows);
  renderRows(rows, refresh);

  // The badge counts what is *waiting on a person*, not everything listed. A
  // number that includes settled rows never reaches zero, and a badge that never
  // reaches zero stops being read — the failure §8 names, arriving through a
  // door this surface would otherwise have built for it.
  const open = rows.filter((row) => row.acts.length > 0 && row.state !== "live").length;
  countBadge.textContent = String(open);
  countBadge.hidden = open === 0;
}
