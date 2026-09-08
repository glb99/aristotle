"""Which memory this deployment chose, and a session repository composed with it.

**The choice lives here because the alternatives do.** `ADR 0010` gave keyed
memory a port so that the graph could back it *by configuration*, and the
graph-backed implementation reads this domain's vocabulary — so the module that
picks between them is necessarily a domain's, not the transport's.

It used to sit inside `sessions/repository.py`, with a deferred import to dodge
the cycle that created. That import was the only edge from the transport into a
domain, and `sessions -> personal` at zero edges is the acceptance test
`sessions/` exists to pass — so the choice moved rather than the rule bending
around it.

**One answer for the process, not one per caller.** That property came from the
old placement and is worth keeping: `comparison.py` exists to ask both stores the
same question and report where they differ, and a discrepancy is only
attributable to the stores if every caller got the same one.
"""

from __future__ import annotations

from sqlmodel.ext.asyncio.session import AsyncSession

from bacteria.app.core.settings import get_settings
from bacteria.app.sessions.memory import MemoryStore, TableMemoryStore
from bacteria.app.sessions.repository import SqlSessionRepository


def configured_store(session: AsyncSession) -> MemoryStore:
    """The store this deployment chose, defaulting to the tables that work."""
    if get_settings().graph_backed_memory:
        # Imported here rather than at module scope: the graph store reaches the
        # graph package, which reaches the session models, and a top-level
        # import would close the cycle. The deferral is the same one this
        # function carried in its previous home, for the same reason.
        from bacteria.app.personal.graph_memory import GraphMemoryStore

        return GraphMemoryStore(session)
    return TableMemoryStore(session)


def session_repository(session: AsyncSession) -> SqlSessionRepository:
    """A session repository backed by whichever store this deployment chose.

    Every construction of one in this domain goes through here. Constructing it
    directly would silently take the transport's own default — the tables —
    whatever `BACTERIA_GRAPH_BACKED_MEMORY` says, which is a setting having no
    effect and looking exactly like working.
    """
    return SqlSessionRepository(session, memory=configured_store(session))
