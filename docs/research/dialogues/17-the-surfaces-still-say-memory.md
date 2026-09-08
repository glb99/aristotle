# Dialogue 17 — The surfaces still say memory

> Opened 2026-09-09 by the human, after a session spent adding views to a scene:
>
> *"I think there is a little mess with the project, I would like it to have a clear goal, that is reflected in the ui (the different tabs, etc.) also the api should reflect that. Also the codebase structure is so important."*

The mess is real and it has one cause. [Dialogue 13](13-the-subject-changed.md)
changed what this project is — *one engine, many instances, and the adapter is
what a domain is* — and [dialogue 14](14-the-domain-with-no-package.md) rebuilt
the packages around that ruling. **Neither reached the surfaces.** The tab bar,
the route prefixes and the biggest package still describe the thing this was
before 2026-08-28: an assistant with a memory, plus an architecture feature
bolted alongside it.

So this is dialogue 14 again, one level out. That one found a domain with no
package; this one finds a decision that reorganised the code and left every
door still labelled the old way.

## The measurement

**The tab bar mixes two axes.**

```
chat   graph   architecture
```

`chat` and `graph` are two *views* of one domain — the personal ontology.
`architecture` is a whole *domain*, sitting as their peer. There is no reading
of that row on which the three items are the same kind of thing.

**So do the route prefixes**, and for the same reason:

| prefix | routes | what it actually is |
|---|---|---|
| `/chat` | 11 | the personal domain's surface, plus the agent session transport |
| `/graph` | 7 | the personal domain's graph — the word is generic, the rows are not |
| `/architecture` | 8 | a second domain, entire |
| `/auth` | 2 | infrastructure |
| `/ingestion` | 2 | from the service this used to be |

`/graph` is the sharp one. It is served from `personal/graph_views.py`, so the
route that reads *the substrate* lives inside *a domain* — the same category
error as the tabs, one layer down. A third domain has nothing to copy: it
either takes `/business` and duplicates seven graph routes, or reaches into
`/graph` and finds it means somebody's dog.

**The domain switcher already exists, one level too deep.** `index.html` line
110:

```html
<span class="arch-pill on">ARCHITECTURE</span>
<span class="arch-pill off" title="not built">BUSINESS</span>
<span class="arch-pill off" title="not built">RESEARCH</span>
```

Inside the architecture tab. The right control, nested within one of the things
it is supposed to switch between.

**And the two domains have already built the same four surfaces, separately.**
This is the strongest evidence in the dialogue, because nobody planned it:

| | personal | architecture |
|---|---|---|
| the model | `graph` tab, node-link | the scene, node-link |
| what is waiting | `review queue` rail (index.html:70) | `PROPOSED` column (index.html:159) |
| ask it something | the `chat` tab | the `ASK` column (index.html:124) |
| the rules | conflict badges | `BOUNDARIES` column (index.html:156) |

Four surfaces each, under different names, with no shared component between
them. Two independent implementations converging is the design saying what it
wants.

**Package sizes, for the codebase half of the question:**

```
personal       17 modules   5,208 lines
architecture   14 modules   3,361 lines
graph          11 modules   3,178 lines
core           11 modules   1,296 lines
entrypoints     4 modules   1,239 lines
auth            8 modules     872 lines
evaluation      5 modules     681 lines
ingestion       7 modules     563 lines
```

`personal` is the largest, and dialogue 14 recorded why: it is a domain *and*
the agent host. That was accepted knowingly, with a named trigger for splitting
it — **a second domain wanting durable sessions** — and the trigger has *not*
fired. `architecture/conversation.py` refuses persistence on purpose: *"Each ask
opens an in-memory session, runs one turn and discards it."*

## What the goal is, phrased so a surface can fail it

The founding document never said memory ([dialogue 13](13-the-subject-changed.md)).
Stated so that an element of the UI can be held against it:

> **A negotiation surface over an ontology.** Something derives or extracts
> claims about a domain; a person judges them; the log keeps both sides and
> never edits. The domain is a plug-in; the argument is the product.

Run the current surfaces against it. The chat tab passes — it is where claims
come from. The graph tab passes. `/ingestion`'s two routes do not: batch import
of records models nothing and is judged by nobody. That is not an argument for
deleting them today, but it is the first thing the test finds, which is some
evidence the test works.

## Questions

### Q1 — Do the tabs become *domain × view*, and is that two rows or one?

The claim: the console has two axes and currently draws them as one. Domain
across the top (personal · architecture · +), views below, and **the same views
for every domain**, because that is what *one engine* has to mean on a screen:

```
aristotle ://console        [ personal ]  architecture   · + add
─────────────────────────────────────────────────────────────────
  MODEL      REVIEW ⑤      ASK      RULES ⚑2
```

`MODEL` absorbs the graph tab and the scene; flat, layered and any later
projection are settings of that view rather than siblings of it. `REVIEW`
absorbs the review queue and the proposals column — and would fix a defect
`docs/status.md` already records: *"answering 'what is waiting anywhere' means
already knowing every session id."* One review surface across domains answers it
by construction.

**What would make this wrong:** that the two domains only *look* alike. A
personal claim is auto-committed and retracted afterwards; an architecture
proposal is refused until accepted. If those two need different affordances at
the point of judgment, `REVIEW` is one word covering two acts, and merging them
makes the more dangerous one look like the safer one.

**Also open:** whether the counts belong in the nav. `REVIEW ⑤` and `RULES ⚑2`
are the only reason to return to the console when nothing has been asked, and
badges that are always lit stop being read — the notification-fatigue failure
[§8](../../architecture/memory-graph.md) names in another costume.

### Q2 — Does the API become `/ontologies/{id}`, and what happens to `/chat`?

The shape that follows from Q1:

```
GET    /ontologies                                  what models exist
GET    /ontologies/{id}                             the model
GET    /ontologies/{id}/conclusions
POST   /ontologies/{id}/assertions/{aid}/retract    · /confirm
POST   /ontologies/{id}/nodes/{nid}/rename
POST   /ontologies/{id}/links
POST   /ontologies/{id}/judgments                   accept or reject a proposal
POST   /ontologies/{id}/order                       testimony nothing derives
POST   /ontologies/{id}/ask
GET    /ontologies/{id}/rules
POST   /ontologies/{id}/probes/tests                architecture only
```

Two consequences worth stating rather than discovering. **`/chat` stops being a
domain** and becomes what it is — the agent session transport — which is the
same correction dialogue 14 applied to the package and never applied to the
route. And **the ontology moves into the path**, where today it is implied by
which prefix you called; `SqlGraphRepository` already takes it as a constructor
argument, so the substrate is ready and only the routes are not.

**What would make this wrong:** that a uniform surface over non-uniform domains
is a lie that costs more than it saves. `probes/tests` is architecture-only
already; if half the verbs end up conditioned on which ontology is open, the
uniformity is decoration and two honest surfaces beat one dishonest one.

**The version of this question that has to be answered first:** is
`architecture:<project_id>` one ontology or many? Today every project gets its
own partition, so `GET /ontologies` lists one entry per checkout plus one
personal — which is either exactly right or a category error, depending on
whether *the architecture ontology* is the vocabulary or the instance.

### Q3 — What is a domain, in code, such that a third one is a fill-in?

Dialogue 14 established the five parts by observation — vocabulary, adapter,
rules, proposer, surface. Nothing declares them. "Which domains exist" is
implicit in which packages happen to have a `catalogue.py`, and `GET
/ontologies` cannot be written against that.

The proposal is a registry: each domain declares its catalogue, its adapter, its
rules and its label, and the shared routes are parameterised by it. The
acceptance test writes itself, and it is the kind dialogue 14 liked — a number
rather than a preference:

> **Adding a third domain touches no file outside its own package and the
> registry.**

**What would make this wrong:** a plug-in seam built for two users, which is the
mistake dialogue 14 refused when it declined a shared `sessions/` package —
*building a shared home for a thing with one user*. Two domains is one more than
one, and not obviously enough. The counter is that the seam is not being
invented here: the five parts are already present twice, and the registry only
writes down what is already true both times.

### Q4 — Does `personal/` split, and is this the trigger?

Dialogue 14 named the trigger narrowly so it could not be invoked on taste: **a
second domain wanting durable sessions.** It has not fired — architecture's ask
is stateless by choice.

But Q1 puts both conversations behind one `ASK` view, and Q2 puts both behind
`POST /ontologies/{id}/ask`. That is a uniform surface over one durable and one
disposable implementation. Either that is fine — the surface is the same and the
storage is the domain's business — or it is exactly the pressure that fires the
trigger, one step removed.

**The narrow question:** does a shared `ask` surface count as a second domain
wanting durable sessions, or does it only count when architecture asks to
*remember* an answer? The second reading keeps the wart and the trigger both
intact, and this dialogue prefers it, but it is worth saying out loud rather
than assuming.

### Q5 — What is the cost, and what is the evidence it was worth paying?

This changes no behaviour. It is a large rename across every route, the whole
console, the generated client and the e2e specs, justified entirely by a claim
about what the code *means* — which is [dialogue 14](14-the-domain-with-no-package.md)'s
justification, and also its recorded risk of churn.

What made #14 safe to do was that its acceptance test was a number this
codebase's own tool produced: `graph -> personal` must be 0 edges. Q3 offers the
equivalent here. **Is that enough, or does a surface refactor need a different
kind of evidence than an import-graph one?** The failure mode is real: an
interface can satisfy every structural check and still be worse to use, and
nothing in this repository measures that.

---

## What is agreed

### Q1 — Domain by view, two rows, and `REVIEW` carries state

**Agreed 2026-09-09.**

The tabs become two axes: domain across the top with `+ add`, views beneath, and
the same views for every domain. Two rows rather than one, because drawing two
axes on a single line is the error this dialogue opened about.

**The counter was right and stronger than it was stated, and it changes the
answer rather than defeating it.** The two domains do not have two judgment
models. They have three, and only two of them have a review surface:

| | what it is | where it lives | the act |
|---|---|---|---|
| **live claim** | live the moment it is written -- `claim_extraction.py:315` calls `observe()` straight into the log | `graph_assertion` | **retract** |
| **waiting memory** | inert; reaches no prompt until activated | `chat_memory_proposal` | **activate** |
| **proposal** | not stored at all -- `service.py:143` recomputes `propose(derived)` per request | nowhere | **accept** |

Personal's rail lists the second. Architecture's column lists the third. **The
first has no review surface at all** -- an extracted claim is live, traversable,
drawable and able to fire a conflict, and nothing anywhere lists *what it just
decided about you*. `docs/status.md` records the small version of this ("review
across sessions"); this is the large one, and it was found by asking whether one
word covered two acts and discovering it covered three.

So `REVIEW` is one surface with three visibly distinct rows, which is
[§9](../../architecture/memory-graph.md)'s drawing rule applied one surface out:
`architecture.ts` already refuses to let an agreed feature look like a rejected
one, and a list that draws *live*, *waiting* and *proposed* alike makes the same
mistake with higher stakes, because the reader is about to act on it.

**Counts: `REVIEW` yes, `RULES` no.** A queue that drains is worth returning
for; a standing condition is not. `core -> personal` has been crossed since
[dialogue 14](14-the-domain-with-no-package.md) recorded it and deliberately left
it standing, so a `RULES` badge would be lit on day one and every day after --
the notification-fatigue failure [§8](../../architecture/memory-graph.md) names,
arriving through a door this dialogue would have built for it. The count belongs
on the page, not in the nav.

**What would reopen this:** the three states needing different *layouts* rather
than different rows. Activating a memory wants to show the prompt it would join;
accepting a classification wants to show the five packages that repeat. If those
cannot share a list, `REVIEW` is three surfaces wearing one name and the merge
is cosmetic.

### Q2 — `/ontologies/{id}`, where `{id}` is the column's own value

**Agreed 2026-09-09.**

**The prerequisite answered itself: the `ontology` column already is the id.**
`NULL` for personal, `architecture:<project_id>` for a checkout — and
`decisions.ontology_of` says the prefix exists *"so that a row is legible in a
database somebody is reading by hand."* It already carries both facts, which
vocabulary and which instance, so the URL names exactly what the column names
and `GET /ontologies` lists partitions. One translation at the edge: `NULL`
cannot be a path segment, so the URL says `personal` and the repository maps it
back. The column stays `NULL`, because rewriting it is the backfilling its own
docstring forbids.

**The uniform core is the substrate's verbs, and the evidence is a duplicate
that already exists:**

```
POST /graph/nodes/{node_id}/rename                 personal
POST /architecture/projects/{project_id}/renames   architecture
```

One act — *say a subject is the same thing under a new name* — two spellings,
and `architecture/decisions.py` implements it with `SAME_AS`, the substrate's
own relation. Not two similar features; one verb written twice.

Counted against the real routes the split is eight uniform to two specific, so
the counter — *uniformity over non-uniform domains is decoration* — does not
hold at these numbers, and will not hold later for a reason rather than by luck:
**the uniform verbs are the substrate's, and the substrate does not grow per
domain.** That is [dialogue 10](10-a-place-to-stand.md) Q4 applied to routes.

```
GET  /ontologies                                 personal + one per checkout
GET  /ontologies/{id}                            the model
GET  /ontologies/{id}/conclusions
POST /ontologies/{id}/assertions/{aid}/retract   · /confirm
POST /ontologies/{id}/conclusions/{cid}/reject
POST /ontologies/{id}/nodes/{nid}/rename
POST /ontologies/{id}/links
POST /ontologies/{id}/judgments
POST /ontologies/{id}/ask
POST /ontologies/{id}/probes/tests               architecture
POST /ontologies/{id}/order                      architecture
```

**`/chat` splits, and memory does not follow the graph.** Sessions, turns,
transcript and extraction are transport and become `/sessions/...` — the
correction [dialogue 14](14-the-domain-with-no-package.md) made to the package
and never made to the route. Memory stays with them at
`/sessions/{sid}/memory`, because **memory is the agent's and not an
ontology's**: it is what reaches a prompt, [ADR 0010] gave it a port precisely so
the graph is one possible backing rather than its home, and
`chat_user_memory_entry` is scoped to a user while `chat_memory_entry` is scoped
to a session — so it already spans both and belongs to neither ontology.

The consequence for Q1: `REVIEW` composes two sources, waiting memories from
`/sessions/...` and live claims and proposals from `/ontologies/...`. Honest,
because Q1 established they are different kinds of thing.

**Creation stays domain-specific**, ruled by the human. `POST /ontologies` does
not mean the same thing twice: creating an architecture ontology means
registering a checkout and takes a filesystem path, while creating a personal one
is meaningless because it exists when the user does. So `POST
/architecture/projects` remains beside the uniform surface rather than being
forced into it. It costs the tidiness of a single prefix and buys an honest
statement that **creation is the adapter's business** — it is the one route that
has to know what a checkout is.

**What would make this wrong:** that one entry per checkout is the wrong
granularity. If *the architecture ontology* should be a single thing with
projects inside it, the nesting inverts and `{id}` becomes the domain rather than
the partition.

### Q3 — open

*Not yet discussed.*

---

Related: [dialogue 10](10-a-place-to-stand.md) Q4 (substrate travels, policy
does not — the rule Q2 applies to routes),
[dialogue 13](13-the-subject-changed.md) (the subject changed and the surfaces
did not), [dialogue 14](14-the-domain-with-no-package.md) (the same correction
one level in, and the `personal/` wart Q4 revisits),
[dialogue 15](15-the-third-axis.md) (`MODEL` is where its projections live), and
[`architecture/modules.md`](../../architecture/modules.md) for what the packages
hold today.
