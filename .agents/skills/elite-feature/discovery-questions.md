# Discovery Question Bank

Complete question bank for Phase 1 discovery. Select 4-6 most relevant questions based on the feature type and what you observe in the code.

## Selection Strategy

Read the code first, then pick questions that fill gaps in your understanding:

- **If the feature is UI-heavy**: prioritize User Experience and Purpose questions
- **If the feature is data/API-heavy**: prioritize Boundaries, Current State, and Performance questions
- **If the feature touches payments/auth**: prioritize Security and Business Context questions
- **If the feature is new/MVP**: prioritize Purpose and Completeness questions
- **If the feature is mature**: prioritize Pain Points and Growth questions

## Question Categories

### Purpose & Users

| Question                                                       | When to ask                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| What problem does this feature solve? Who is the primary user? | Always — if not obvious from code                             |
| What does success look like? How would you measure it?         | When there are no analytics/metrics in the code               |
| Are there user segments that use this differently?             | When the feature has roles, permissions, or conditional flows |
| What was the original motivation for building this?            | When the code looks over-engineered or oddly structured       |
| Is this a core feature or supporting/secondary?                | When prioritizing findings                                    |

### Current State

| Question                                            | When to ask                                         |
| --------------------------------------------------- | --------------------------------------------------- |
| Is this feature complete, MVP, or work-in-progress? | When there are TODOs, stubs, or incomplete paths    |
| What are the known pain points or complaints?       | Always — code can't tell you what users feel        |
| Are there workarounds users currently rely on?      | When the feature seems limited                      |
| Has this feature been through any major refactors?  | When the code has mixed patterns or legacy remnants |
| What's the typical usage volume?                    | When assessing performance requirements             |

### Business Context

| Question                                                    | When to ask                                             |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| How important is this feature to retention vs acquisition?  | When prioritizing business improvements                 |
| Does this feature have a direct revenue impact?             | When the feature touches pricing, plans, or conversions |
| Are competitors doing this differently or better?           | When assessing completeness                             |
| What would make a user recommend this feature specifically? | When looking for differentiation opportunities          |
| Is this feature part of the free or paid tier?              | When assessing monetization opportunities               |

### Boundaries & Constraints

| Question                                            | When to ask                                            |
| --------------------------------------------------- | ------------------------------------------------------ |
| Are there performance requirements or SLAs?         | When the feature handles real-time data or high volume |
| What integrations or dependencies does this touch?  | When you see external API calls or shared state        |
| Are there planned changes that would affect this?   | When the code is about to be impacted by other work    |
| Are there regulatory or compliance requirements?    | When the feature handles PII, payments, or health data |
| What's the deployment/rollout strategy for changes? | When suggesting breaking changes                       |

### User Experience

| Question                                               | When to ask                                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| What's the most common user flow through this feature? | When the feature has multiple entry points       |
| Where do users most often get stuck or drop off?       | When there's analytics or the UI flow is complex |
| Is this feature used on mobile, desktop, or both?      | When assessing responsive design needs           |
| How do users discover this feature?                    | When the feature seems hidden or hard to find    |

## Anti-patterns

Do NOT ask questions when:

- The answer is obvious from reading the code
- The question is too vague to get a useful answer (e.g., "Is this good?")
- You're asking about implementation details you can verify yourself
- The question is really just a suggestion disguised as a question
