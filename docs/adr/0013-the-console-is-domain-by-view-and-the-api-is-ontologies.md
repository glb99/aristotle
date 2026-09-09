# 0013 — The console is domain by view, and the API is `/ontologies/{id}`

## Status

Proposed — 2026-09-09.

Records what [dialogue 17](../research/dialogues/17-the-surfaces-still-say-memory.md)
settled and the console now demonstrates. Written after the surface was built
rather than before, deliberately: the central claim — that a uniform review
surface over three states is readable — is exactly the sort that looks fine on
paper, and a record written first would have been a proposal wearing a decision's
clothes.

Depends on [ADR 0006](0006-the-memory-graph-is-an-assertion-log.md) for the log
and [ADR 0010](0010-memory-has-a-port.md) for where memory lives. Constrains
what a third domain has to bring.

## Context

Two earlier decisions reorganised what this project *is* and never reached its
surfaces.

Dialogue 13 changed the subject: **one engine, many instances, and the adapter is
what a domain is.** Dialogue 14 rebuilt the packages around that, dissolving
`chat/` into `personal/` and proving it with an edge count. Neither touched the
tab bar, the route prefixes, or the biggest package's two-part shape.

So every door was still labelled for what this was before 2026-08-28 — an
assistant with a memory, plus an architecture feature bolted alongside:

- **The tab row mixed two axes.** `chat` and `graph` were *views* of the personal
  domain; `architecture` was a *domain*. No reading makes those three the same
  kind of thing.
- **`/graph` was served from `personal/graph_views.py`** — the route that reads
  the substrate living inside a domain, the same category error one layer down.
  A third domain had nothing to copy: duplicate seven routes under `/business`,
  or reach into `/graph` and find it means somebody's dog.
- **The domain switcher already existed**, nested inside one of the things it
  switches between.

And the evidence that decided it: **both domains had already built the same four
surfaces, separately, under different names, with no shared component** — the
model, what is waiting, ask, the rules. Two independent implementations
converging is a design saying what it wants.

## Decision

### 1. The console has two axes, drawn as two rows

Domain across the top, view beneath, and **the same four views for every
domain** — `MODEL`, `REVIEW`, `ASK`, `RULES`. That is what *one engine* has to
mean on a screen. Drawing them on one row is the error this record exists to
correct.

`MODEL` absorbs the graph and the scene; projections of it are settings within
the view rather than siblings of it.

### 2. `REVIEW` is one surface with three visibly distinct states

Asking whether one word covered two acts found it covered three, and that the
riskiest had no review surface at all:

| | where it lives | the act |
|---|---|---|
| **live** | `graph_assertion` — `claim_extraction` calls `observe()` on extraction, so it is traversable and firing conflicts before anyone looks | retract |
| **waiting** | `chat_memory_proposal` — inert; reaches no prompt until activated | activate |
| **proposed** | nowhere — `propose(derived)` recomputes it per request | accept |

Drawing them alike would repeat the mistake the scene already refuses — *a thing
you agreed was a feature must not look identical to one you rejected* — with
higher stakes, because the reader is about to act.

**Empty states are per domain**, because an empty band means opposite things:
personal has the waiting state and nothing in it; architecture cannot have it at
all. One sentence covering both would tell the reader nothing either time.

### 3. `REVIEW` reports the rejection rate, and `RULES` carries no badge

Dialogue 13 replaced the retired bet with a criterion — the proportion of
proposals *rejected or edited* rather than waved through, both tails failing —
and nothing implemented it. A criterion nothing measures is not one.

Counted over judgments that could have gone either way. **An empty denominator
says so rather than reading 0%**: *nothing judged yet* and *everything waved
through* are opposite findings and must not share a number.

`RULES` gets no badge. `core -> personal` has been crossed since dialogue 14
recorded it and deliberately left it standing, so that badge would be lit on day
one and every day after — the notification fatigue [ADR 0006] names, arriving
through a door this record would otherwise have built for it.

### 4. The API is `/ontologies/{id}`, and `{id}` is the column's own value

`NULL` for personal, `architecture:<project_id>` for a checkout. That identifier
already carries both facts — which vocabulary, which instance — and
`decisions.ontology_of` says why the prefix exists: *"so that a row is legible in
a database somebody is reading by hand."* The URL names what the column names.

`NULL` cannot be a path segment, so the URL says `personal` and the repository
maps it back. **The column stays `NULL`**, because rewriting it is the
backfilling its own docstring rejects.

### 5. The uniform verbs are the substrate's; the adapter keeps its own

The evidence is a duplicate already in the tree:

```
POST /graph/nodes/{node_id}/rename                 personal
POST /architecture/projects/{project_id}/renames   architecture
```

One act, two spellings, and the second implements it with `SAME_AS` — the
substrate's own relation. Eight uniform verbs against two domain ones, so
*uniformity over non-uniform domains is decoration* does not hold at these
numbers, and will not hold later for a reason rather than by luck: **the uniform
verbs are the substrate's, and the substrate does not grow per domain.** That is
dialogue 10 Q4 applied to routes.

### 6. Creation stays domain-specific

`POST /ontologies` does not mean the same thing twice: creating an architecture
ontology registers a checkout and takes a filesystem path; creating a personal
one is meaningless, because it exists when the user does. `POST
/architecture/projects` stays beside the uniform surface. It costs the tidiness
of one prefix and buys an honest statement that **creation is the adapter's
business** — the one route that has to know what a checkout is.

### 7. `/chat` splits, and memory does not follow the graph

Sessions, turns, transcript and extraction are transport and become
`/sessions/...` — the correction dialogue 14 made to the package and never made
to the route. **Memory stays with them**, because memory is the agent's and not
an ontology's: it is what reaches a prompt, [ADR 0010](0010-memory-has-a-port.md)
gave it a port precisely so the graph is one possible backing rather than its
home, and its two tables are scoped one to a user and one to a session — so it
spans both ontologies and belongs to neither.

### 8. A domain is declared, in a registry above the domains

`ontologies/` holds the registry and the uniform routes, and imports both
domains: **a composition root for domains**, the role `entrypoints/` plays for
processes. Not `core/`, where `_core_names_a_domain_concept` would fire and be
right. Not `graph/`, which is substrate and imports no domain.

A `Domain` declares its name, label, vocabulary, which ontology ids it owns, and
how to build its model. `model()` returns a common core — nodes, assertions,
conclusions, proposals, rules — with **fields absent rather than routes
conditioned**, because the response is shared and the production is not.

### 9. `sessions/` is a feature that is not a domain

Dialogue 14 refused this package on a five-part test — no adapter, no
vocabulary, no rules, no proposer, no surface. Four still hold; **the fifth
changed**: under §7 it has a surface. And the objection underneath was
accumulation — *"a package beside the real domains that is nobody's domain is
precisely what `chat/` became"* — which inverts here, because the domain logic
moves *into* `personal/` and `sessions/` starts empty of it.

The precedent is `auth/`: a feature that is not a domain, owning its tables, its
routes and one job.

**The trigger dialogue 14 named — a second domain wanting durable sessions —
has not fired.** `architecture/conversation.py` still refuses persistence. A
different trigger did, and #14 could not have seen it.

## Consequences

**Two acceptance tests, both checkable by this codebase's own tool**, the way
#14's 0-edge test was:

- `sessions -> personal` is **0 edges**. If `sessions/` imports `personal/` to
  serve a route, it is the wart in a new spelling and worse for having moved.
- **Adding a third domain touches no file outside its own package and the
  registry.**

**A large rename with no behaviour change.** Every route, the generated client,
the console, the e2e specs. That is dialogue 14's justification and dialogue
14's recorded risk of churn — with one difference: this one is justified by
building an instrument rather than by tidiness (§3), and the first reading that
instrument gave was **0% rejected**, an agent proposing and an agent accepting.

**The one to dislike: nothing here measures whether the console is nicer to
use.** An interface can satisfy every structural check and still be worse, and
this record ships two structural checks and no usability one. The weak
substitute is a single binary task test — *can a person answer "what is waiting
anywhere?"* — which failed before and passes by construction now. One question
is not a programme; it beats asserting an improvement nobody can check.

**Personal keeps its four impersonal tables until they move.** `MemoryContent`
is `value`, `reason`, `created_at`, and its own docstring says *"whatever owns
it."* In `sessions/` the column names stop being a wart. Classes move,
`__tablename__` stays, no migration — the discipline #14 held to.

**A third domain now has a checklist rather than an example.** That is the point,
and also the risk: a seam built for two users, which is the mistake #14 refused
when it declined a shared `sessions/` package. The counter is that the seam is
not invented here — the five parts are present twice already, and the registry
writes down what is true both times.

## Alternatives rejected

**One row, with the domain as another tab.** What exists today. It answers two
questions at once and gives a third domain nowhere to go except beside the views
of the first.

**`GET /ontologies` returning one entry per *domain*, with instances nested.**
Inverts the nesting so `{id}` is `architecture` and projects sit inside it.
Rejected because the partition is what the substrate actually filters on: the
column holds `architecture:<project_id>`, and a URL naming something coarser
would need translating at every read.

**Extending the memory port with a cross-session read**, so the review queue is
one query instead of N+1. Correct eventually and refused now: it is a protocol
change requiring both backings to implement it, taken on for a listing. The
trigger is named in `waiting_for`'s docstring — a principal with enough sessions
to notice.

**Splitting `personal/` on the trigger #14 named.** It has not fired, and
inventing that it had in order to justify a package would be reasoning backwards
from a conclusion. §9 rests on a different trigger and says which.
