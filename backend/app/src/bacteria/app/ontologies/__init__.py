"""Every ontology this deployment holds, and the verbs that work on all of them.

**A composition root for domains**, the role
:mod:`bacteria.app.entrypoints` plays for processes. It imports both domains;
neither imports it. That position is what distinguishes it from the shared
package [dialogue 14] refused: that one would have sat *beside* the domains and
been nobody's, and this one sits above them and is explicitly everybody's.

Not :mod:`bacteria.app.core`, where ``_core_names_a_domain_concept`` would fire
and be right -- a registry naming domains is domain concepts. Not
:mod:`bacteria.app.graph`, which is substrate and imports no domain.

**What is uniform here is the substrate's, and only that.**
[ADR 0013](../../../../../../docs/adr/0013-the-console-is-domain-by-view-and-the-api-is-ontologies.md)
§5 draws the line: retract, confirm, rename, link and reading the log are the
same act whatever the domain, because they are operations on an assertion.
Deriving a model is not -- architecture parses a filesystem, personal projects a
conversation -- so ``/ontologies/{id}`` answers *what is claimed here* and the
adapter keeps its own route for *what I derived*.

That is narrower than ADR 0013 §8 proposed, and the narrowing was found by
building it. §8 wanted one ``model()`` per domain returning a common core;
implementing it produced a union of two shapes with nothing in common but their
name, which is the *"wrapper around an if"* dialogue 17 Q3 said would make the
seam fake. The stated/derived split the whole project turns on is the honest
seam, and it was already there.
"""
