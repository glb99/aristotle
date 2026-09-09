"""Sessions: the transport an agent turn arrives on, and where its state lives.

**A feature that is not a domain**, the same shape as :mod:`aristotle.app.auth`.
It owns the session tables, the `/chat` routes' transport half, the durable
implementation of the agent's ``SessionRepository``, and the one access question
only it can answer -- whether this principal may have this session. It has no
vocabulary, no adapter, no rules and no proposer, and is not trying to acquire
any.

[Dialogue 14] refused this package on exactly that basis: *tables and a
repository and no domain*, and *a package beside the real domains that is
nobody's domain is precisely what ``chat/`` became*. Two things changed. It has
a surface now -- the transport's routes are its own under
[ADR 0013](../../../../../../docs/adr/0013-the-console-is-domain-by-view-and-the-api-is-ontologies.md)
§7, and leaving them in ``personal/`` would put a transport route inside a domain,
which is the category error that record exists to correct. And the accumulation
risk inverts: the domain logic moved *into* ``personal/``, so this package starts
empty of it rather than collecting it.

**The trigger dialogue 14 named has still not fired.** It was *a second domain
wanting durable sessions*, and ``architecture/conversation.py`` refuses
persistence on purpose -- each ask opens an in-memory session, runs one turn and
discards it. A different trigger fired, and the record says which.

Must not: import ``personal`` or any other domain. That is the acceptance test
for this package existing at all -- ``sessions -> personal`` at zero edges -- and
an import here would make it the wart it was extracted to remove, in a new
spelling and worse for having moved.
"""
