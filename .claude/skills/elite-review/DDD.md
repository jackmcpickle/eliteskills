# DDD Architecture Review Skill

Evaluates whether an app's complexity warrants DDD, reviews existing DDD implementations for pattern adherence, and recommends migration paths. Based on strategic and tactical DDD patterns.

## Workflow

### Phase 1: Assess Complexity

Determine if DDD is appropriate before recommending it. Not every app needs DDD.

```
- Is domain logic complex with interdependent business rules?
- Are there multiple bounded contexts or subdomains?
- Is the team collaborating with non-technical stakeholders on domain concepts?
- Would conventional MVC/CRUD suffice? (If yes, recommend against DDD overhead)
- Is there long-term evolution expected in the domain?
```

If the domain is simple CRUD with minimal business logic, stop here and recommend against DDD. Explain why conventional patterns are sufficient.

### Phase 2: Strategic Review

Ubiquitous language and bounded context analysis.

```
- Does code use domain terminology consistently (not technical jargon)?
- Are bounded contexts clearly separated with explicit boundaries?
- Do models in different contexts have independent representations?
- Is there a context map showing relationships between bounded contexts?
- Are shared concepts handled via shared kernel, anti-corruption layer, or conformist patterns?
```

### Phase 3: Architecture Review

Layer separation and dependency flow.

**Domain Layer**

- Pure business logic, no framework/DB/infrastructure imports?
- Contains entities, value objects, aggregates, domain services, domain events?

**Application Layer**

- Thin orchestration only? No business rules leaking in?
- Coordinates use cases and manages transactions?

**Infrastructure Layer**

- DB, APIs, messaging isolated behind interfaces?
- Domain doesn't depend on it?

**Presentation Layer**

- Controllers/handlers delegate to application layer?

**Dependency Direction**

- All dependencies flow inward toward domain?

Note alternative architectural patterns where relevant: Hexagonal (Ports & Adapters), CQRS, Event-Driven Architecture.

### Phase 4: Tactical Pattern Review

DDD building blocks.

**Entities**

- Have identity, lifecycle, and behavior (not anemic)?

**Value Objects**

- Immutable, equality by attributes, encapsulate validation?

**Aggregates**

- Clear aggregate roots? Transactional boundaries respected? External refs by ID only?

**Repositories**

- One per aggregate root? Interface in domain, implementation in infrastructure?

**Domain Services**

- Logic that doesn't belong to a single entity? Not duplicating entity behavior?

**Domain Events**

- Cross-aggregate communication via events, not direct calls?

**Factories**

- Complex creation logic encapsulated?

### Phase 5: Anti-pattern Detection

Common DDD violations to flag:

```
- Anemic domain model (entities are just data bags, logic in services)
- Fat application services (business rules outside domain layer)
- Framework coupling in domain layer
- Aggregate boundaries too large or too small
- Direct DB queries bypassing repositories
- Shared mutable state across bounded contexts
- Over-engineering simple CRUD into DDD
```

## Output Format

```markdown
# DDD Architecture Review: {app/module name}

## Complexity Assessment

Whether DDD is warranted and why.

## Strategic Findings

Ubiquitous language, bounded contexts, context maps.

## Architecture Findings

Layer separation, dependency direction, pattern adherence.

## Tactical Findings

Entity/VO/Aggregate/Repository/Service/Event review.

## Anti-patterns Detected

Specific violations with file:line references.

## Recommendations

Prioritized list: what to fix/adopt first.

## Verdict

One of:

- **Well-structured** — DDD patterns properly applied
- **Needs Improvement** — specific patterns violated
- **Consider DDD** — complexity warrants adoption, here's a migration path
- **DDD Overkill** — app is simple enough for conventional patterns
```

## Rules

- ALWAYS assess complexity first — don't recommend DDD for simple CRUD apps.
- Reference specific files and line numbers.
- Suggest incremental adoption, not big-bang rewrites.
- Respect existing architecture decisions — explain tradeoffs, don't dictate.
- When recommending DDD adoption, provide a concrete starting point (which bounded context first).
- Be constructive — frame feedback as suggestions: "Consider..." not "You must..."
- If the app is already well-structured without DDD, acknowledge that.
