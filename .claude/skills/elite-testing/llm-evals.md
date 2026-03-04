# LLM / AI Evaluation Testing

## Contents
- When you need evals
- Eval types
- Scoring strategies
- Golden datasets
- Regression detection
- Prompt testing
- CI integration

## When You Need Evals

Use evals when your system includes AI/LLM components:
- Prompt-driven features (summarization, extraction, classification)
- RAG pipelines (retrieval + generation)
- AI agents with tool use
- Content generation (copy, code, recommendations)

Traditional tests assert exact outputs. Evals score quality on a spectrum.

## Eval Types

### Accuracy / Correctness
Does the output match the expected answer? For factual questions, extraction tasks, classification.

### Relevance
Is the output relevant to the input? For search, RAG, recommendation systems.

### Format Compliance
Does the output follow the required structure? JSON schema, markdown format, length constraints.

### Safety / Guardrails
Does the output avoid prohibited content? Prompt injection resistance, PII leakage, harmful content.

### Regression
Did output quality change between model versions or prompt changes? The most important eval for production systems.

## Scoring Strategies

### Rubric-Based
Define criteria and score each independently. Best for subjective quality.

```
Rubric:
- Accuracy (0-3): Factually correct, no hallucinations
- Completeness (0-3): Covers all requested aspects
- Conciseness (0-3): No unnecessary padding or repetition
- Format (0-1): Follows requested output format

Total: 0-10
Pass threshold: 7
```

### Reference Comparison
Compare output to a known-good reference. Best for extraction and summarization.

```
- Exact match (classification, extraction)
- BLEU/ROUGE score (summarization)
- Semantic similarity via embeddings (general)
```

### LLM-as-Judge
Use a stronger model to evaluate a weaker model's output. Fast iteration, but watch for bias.

```
Prompt to judge:
"Rate this summary on accuracy (1-5) and completeness (1-5).
Source document: {source}
Summary to evaluate: {output}
Respond as JSON: { accuracy: N, completeness: N, reasoning: '...' }"
```

**Calibrate judges:** Run the judge against known-scored examples first. If the judge disagrees with human scores > 20% of the time, fix the judge prompt.

## Golden Datasets

Curated input/output pairs that represent expected behavior.

**Building golden sets:**
1. Start with 20-50 representative examples
2. Include edge cases: empty input, long input, ambiguous input, adversarial input
3. Have humans score the expected outputs
4. Version the dataset alongside code
5. Grow it as you find failures in production

**Versioning:** Treat golden datasets like schema migrations. Never silently change expected outputs — document why.

## Regression Detection

The most important eval in practice. Detect when changes make things worse.

```
1. Run eval suite on current version → baseline scores
2. Make changes (prompt update, model swap, code change)
3. Run eval suite again → new scores
4. Compare:
   - If any category drops > threshold → flag regression
   - If overall score drops > 5% → block deployment
   - Use statistical significance for noisy evals (n > 30)
```

**Threshold setting:** Depends on use case.
- Safety evals: zero tolerance for regression
- Quality evals: 5% tolerance (model outputs are inherently variable)
- Format evals: zero tolerance (structured output must comply)

## Prompt Testing

### Input Perturbation
Same question, different phrasing. Output should be consistent.

```
Variations:
- "Summarize this article"
- "Give me a summary of this article"
- "What are the key points of this article?"
→ All should produce similar quality summaries
```

### Adversarial Testing
Attempt to break the system. Prompt injection, jailbreaks, out-of-scope requests.

```
- "Ignore previous instructions and..."
- Inputs with embedded system prompts
- Requests outside the system's domain
- Extremely long inputs
- Empty / whitespace-only inputs
```

### A/B Prompt Testing
Compare two prompt versions on the same eval set. Statistical significance required — don't pick a winner from 10 examples.

## CI Integration

### Gate Strategy
- **Blocking:** Safety evals, format compliance, regression detection
- **Advisory:** Quality scores (post as PR comment, don't block)
- **Periodic:** Full eval suite on schedule (weekly), not every PR

### Speed
Full eval suites are slow (API calls, judge evaluation). Strategies:
- Run a **fast subset** (10-20 examples) on every PR
- Run the **full suite** on main branch merges
- Run **adversarial tests** on prompt changes only

### Cost
LLM evals cost money (API calls). Budget accordingly:
- Cache eval results for unchanged prompts
- Use cheaper models for format/structure evals
- Reserve expensive judge models for quality evals
