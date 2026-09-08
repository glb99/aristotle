"""Which ontologies exist, and how to resolve one to the domain that owns it.

The lookup the uniform routes need and neither domain can provide.
``personal/graph_views.py`` hardcoded ``VOCABULARY`` and
``architecture/views.py`` hardcoded ``ontology_of(project)``; a route serving
both can hardcode neither.

**The identifier is the column's own value**, per
[ADR 0013](../../../../../../docs/adr/0013-the-console-is-domain-by-view-and-the-api-is-ontologies.md)
§4. ``graph_assertion.ontology`` already carries both facts -- which vocabulary,
which instance -- and its docstring says the prefix exists *"so that a row is
legible in a database somebody is reading by hand."* So the URL names what the
column names, and the domain is read off the prefix rather than tracked
separately.

One translation, at the edge: ``NULL`` cannot be a path segment, so the personal
ontology is ``personal`` in a URL and ``None`` in a query. The column keeps its
``NULL`` -- rewriting it is the backfilling its own docstring rejects.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from bacteria.app.architecture.catalogue import CATALOGUE as ARCHITECTURE_RELATIONS
from bacteria.app.graph.catalogue import Vocabulary
from bacteria.app.personal.catalogue import VOCABULARY as PERSONAL_VOCABULARY

PERSONAL = "personal"
ARCHITECTURE_PREFIX = "architecture:"


@dataclass(frozen=True)
class Domain:
    """One ontology's policy, as far as a shared route needs to know it.

    Deliberately small. It holds what a uniform verb cannot work without -- a
    vocabulary to resolve a relation against, a label to show, and the rule for
    which ontology ids belong to it -- and nothing about how the domain builds a
    model, because that is the part that is not uniform.

    Adding a third domain is an entry here and a package of its own. If it ever
    needs a field that only it would use, that field belongs in its package and
    this stayed the wrong place to put it.
    """

    name: str
    label: str
    vocabulary: Vocabulary
    prefix: Optional[str] = None
    """What an ontology id of this domain starts with, or ``None`` for the one
    domain that has exactly one instance and therefore needs no discriminator."""

    def owns(self, ontology: str) -> bool:
        return ontology == self.name if self.prefix is None else ontology.startswith(self.prefix)


DOMAINS: tuple[Domain, ...] = (
    Domain(
        name=PERSONAL,
        label="personal",
        vocabulary=PERSONAL_VOCABULARY,
    ),
    Domain(
        name="architecture",
        label="architecture",
        # Built here rather than exported from the domain, because the domain's
        # catalogue is a tuple of relations and `Vocabulary` is the meta-model's
        # wrapper around one. `graph/catalogue.py` owns the shape; the entries
        # are the domain's. That is the split ADR 0007 drew, kept.
        vocabulary=Vocabulary(relations=ARCHITECTURE_RELATIONS),
        prefix=ARCHITECTURE_PREFIX,
    ),
)


class UnknownOntology(ValueError):
    """An ontology id no registered domain claims.

    Named rather than a bare 404 for the reason ``NothingToRename`` is: asking
    for `business` before that domain exists is the ordinary mistake, and the
    answer is a sentence saying which ones do exist.
    """


def domain_for(ontology: str) -> Domain:
    """Which domain owns this ontology id."""
    for domain in DOMAINS:
        if domain.owns(ontology):
            return domain
    raise UnknownOntology(ontology)


def partition(ontology: str) -> Optional[str]:
    """The value the ``ontology`` column holds for this id.

    ``personal`` is ``None`` in the column and cannot be ``None`` in a path, so
    this is the one place the two spellings meet. Every read narrows on the
    return value; nothing downstream sees the URL's version.
    """
    return None if ontology == PERSONAL else ontology


def listing(architecture: Sequence[tuple[str, str]]) -> list[dict[str, str]]:
    """What ontologies this caller has, personal first.

    The architecture ones arrive as ``(ontology, label)`` rather than being
    looked up: knowing which checkouts a principal registered means reading that
    domain's table, and a registry querying a domain's storage would be the
    coupling this package sits above the domains to avoid. The label is the
    project's name, which only the caller has -- deriving one from the id here
    would put a uuid in front of a person.
    """
    return [{"ontology": PERSONAL, "domain": PERSONAL, "label": "your own graph"}] + [
        {"ontology": ontology, "domain": "architecture", "label": label}
        for ontology, label in architecture
    ]
