/**
 * The shell: signing in, which ontology, and which view of it.
 *
 * **Two axes, not one.** The row this replaces was `chat | graph |
 * architecture`, which mixed them — the first two were views of the personal
 * domain and the third was a domain. Dialogue 17: domain across the top, view
 * beneath, and the same four views for every domain, because that is what *one
 * engine* has to mean on a screen.
 *
 * Everything about drawing a graph still lives in `graph.ts`, a scene in
 * `architecture.ts`, a conversation in `chat.ts`, and the queue in `review.ts`.
 * This file owns only what none of them can: whether there is a session at all,
 * and which pair of axes is showing.
 */

import { closeSession, openSession, Unauthenticated } from "./api";
import * as architecture from "./architecture";
import * as chat from "./chat";
import { el } from "./dom";
import * as graph from "./graph";
import * as review from "./review";

const signIn = el("sign-in");
const signInForm = el<HTMLFormElement>("sign-in-form");
const signInError = el("sign-in-error");
const keyInput = el<HTMLInputElement>("key");
const workspace = el("workspace");
const who = el("who");
const signOut = el<HTMLButtonElement>("sign-out");
const domainRow = el<HTMLElement>("domains");
const viewRow = el<HTMLElement>("views");
const viewError = el("view-error");

const views = {
  model: el("v-model"),
  review: el("v-review"),
  ask: el("v-ask"),
  rules: el("v-rules"),
};

/** The per-domain half of each view. Both are in the markup; one is hidden. */
const panes = {
  personal: [el("model-personal"), el("ask-personal"), el("rules-personal")],
  architecture: [el("model-architecture"), el("ask-architecture"), el("rules-architecture")],
};

/** Controls belonging to one domain, which have no meaning in the other. */
const architectureOnly = [
  el("arch-project"),
  el("arch-add"),
  el("arch-reading"),
  el("arch-run-tests"),
];

type View = keyof typeof views;
type Domain = keyof typeof panes;

let view: View = "model";
let domain: Domain = "personal";

const show = (element: HTMLElement, visible: boolean) => {
  element.hidden = !visible;
};

function showSignIn(message?: string): void {
  show(signIn, true);
  show(workspace, false);
  show(domainRow, false);
  show(viewRow, false);
  show(signOut, false);
  show(who, false);
  if (message) {
    signInError.textContent = message;
    show(signInError, true);
  }
  keyInput.focus();
}

/** Which panes and controls the current pair implies. Placement only, no fetching. */
function place(): void {
  for (const [name, panel] of Object.entries(views)) show(panel, name === view);
  for (const [name, group] of Object.entries(panes)) {
    for (const pane of group) show(pane, name === domain);
  }
  for (const control of architectureOnly) show(control, domain === "architecture");
}

/**
 * Load the visible pair, sending the user back to sign-in if the session went.
 *
 * **Every call goes through here**, so an expired session cannot show as an
 * empty screen in one view and a working one in another. Sessions last twelve
 * hours and a console is exactly the thing left open longer than that.
 *
 * The domain decides which module answers; the view decides what it is asked
 * for. `architecture.refresh()` loads a project's whole model whatever the view,
 * because MODEL, REVIEW and RULES are three readings of one parse — asking three
 * times would re-walk a filesystem to draw a list.
 */
async function refresh(): Promise<void> {
  show(viewError, false);
  place();
  try {
    if (domain === "architecture") {
      await architecture.refresh();
      review.setDomain("architecture", architecture.currentModel());
    } else {
      if (view === "ask" || view === "review") await chat.refresh();
      if (view === "model" || view === "rules") {
        graph.setSession(chat.currentSession());
        await graph.refresh(chat.currentSession());
      }
      review.setDomain("personal", null);
    }
    if (view === "review") await review.refresh();

    show(workspace, true);
    show(domainRow, true);
    show(viewRow, true);
    show(signIn, false);
    show(signOut, true);
  } catch (error) {
    if (error instanceof Unauthenticated) {
      showSignIn("that session has ended — sign in again");
      return;
    }
    // Shown, not only rethrown. This handler runs inside an async listener, so a
    // bare rethrow becomes an unhandled rejection: the panel has already
    // switched, nothing renders, and the page looks like the click did nothing.
    // "Nothing happened" is the worst thing a UI can report, because it is
    // indistinguishable from working — and it cost a real debugging session.
    //
    // The raw error is deliberate. This is a console for whoever runs the
    // server; a friendlier string would hide the status code that says which
    // half is broken.
    viewError.textContent = `${domain} · ${view} failed to load — ${String(error)}`;
    show(viewError, true);
    show(workspace, true);
    // Rethrown as well, so the browser console still gets a stack for whoever is
    // looking there. The line above is for whoever is not.
    throw error;
  }
}

domainRow.addEventListener("click", async (event) => {
  const target = event.target;
  const button =
    target instanceof HTMLElement ? target.closest<HTMLButtonElement>("[data-domain]") : null;
  if (!button) return;

  domain = button.dataset["domain"] as Domain;
  for (const other of domainRow.querySelectorAll<HTMLButtonElement>("[data-domain]")) {
    other.classList.toggle("on", other === button);
  }
  await refresh();
});

viewRow.addEventListener("click", async (event) => {
  const target = event.target;
  const button =
    target instanceof HTMLElement ? target.closest<HTMLButtonElement>("[data-view]") : null;
  if (!button) return;

  view = button.dataset["view"] as View;
  for (const other of viewRow.querySelectorAll<HTMLButtonElement>("[data-view]")) {
    other.classList.toggle("on", other === button);
  }
  await refresh();
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  show(signInError, false);

  try {
    const opened = await openSession(keyInput.value);
    who.textContent = `as ${opened.principal_id}`;
    show(who, true);
  } catch (error) {
    // One message for every failure, matching the server, which answers a single
    // 401 for a malformed key, an unknown one, a wrong secret and a revoked one.
    // A page that guessed between them would undo that deliberately.
    showSignIn(error instanceof Unauthenticated ? "that key was not accepted" : String(error));
    return;
  } finally {
    // Cleared whether or not it worked: the value is a live credential, and the
    // cookie is what every later request uses.
    keyInput.value = "";
  }

  await refresh();
});

signOut.addEventListener("click", async () => {
  await closeSession();
  // Asked again rather than assumed. Logout answers 204 even when nothing was
  // ended, so the only honest way to know what the browser holds is to ask.
  await refresh().catch(() => showSignIn());
});

// Whether we are signed in is decided by asking. The cookie is HttpOnly, so
// there is nothing on this page to consult and nothing worth trusting if there
// were.
await refresh().catch((error) => {
  if (error instanceof Unauthenticated) showSignIn();
  else throw error;
});
