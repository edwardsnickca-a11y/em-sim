# NEXUS EOC Decision Log

This file captures major product, design, AI behavior, and development decisions for NEXUS EOC.

The purpose of this log is to preserve why decisions were made, not just what changed. NEXUS EOC is moving quickly, and this document helps keep the platform aligned with its core purpose: realistic EOC decision training.

---

## Decision Standard

A product decision should support at least one of the following:

- Better EOC decision training
- More realistic emergency management friction
- Clearer role boundaries
- Stronger consequence-based simulation
- Better Community Lifeline or ESF grounding
- More useful After-Action Review output
- Cleaner user flow
- Stronger commercial polish without fake complexity

A feature should be redesigned, parked, or removed if it pulls NEXUS EOC toward tactical incident command gameplay, fictional jurisdictions, generic chatbot behavior, excessive dashboards, or low-value complexity.

---

## 2026-06 — Product Identity Shift

### Decision

Rename and reposition the product from a generic emergency management simulator concept into **NEXUS EOC — Simulated Emergency Operations Platform**.

### Rationale

The original prototype demonstrated the basic training concept, but the product needed a clearer identity and market position. NEXUS EOC better reflects the focus on Emergency Operations Center coordination, emergency management decision-making, and operational consequence management.

### Impact

This decision shaped the visual design, Mission Portal, user flow, AI controller behavior, documentation, and future commercialization direction.

---

## 2026-06 — EOC Role Boundary

### Decision

NEXUS EOC will train users at the emergency management, EOC staff, public safety leadership, and coordination level. It will not place the user in the role of tactical Incident Commander.

### Rationale

Emergency managers do not normally command field units directly. The value of NEXUS EOC is in practicing coordination, prioritization, public information, leadership support, resource support, consequence management, and recovery/continuity decisions.

### Impact

Scenario prompts, AI behavior, user roles, AAR language, and UI labels should reinforce the distinction between EOC coordination and field command.

---

## 2026-06 — Real Locations Only

### Decision

NEXUS EOC should use real locations and avoid fictional jurisdictions.

### Rationale

Fictional locations reduce realism and can make scenarios feel generic. Real-world geography, infrastructure, and jurisdictional context make exercises more credible and useful.

### Impact

The platform should not invent fictional cities, counties, agencies, or landmarks. When specific local facts are uncertain, the AI should remain general rather than fabricate details.

---

## 2026-06 — Location Engine

### Decision

Move real-location selection into the application layer instead of leaving location choice entirely to the AI model.

### Rationale

The AI repeatedly reused certain locations and sometimes selected locations that did not match the intended scenario context. Application-side location selection gives NEXUS better control, consistency, and transparency.

### Impact

Prebuilt scenarios can be paired with appropriate real locations before the AI builds the exercise world. Custom scenarios preserve the user-provided location.

---

## 2026-06 — Deputy Emergency Manager Voice

### Decision

The AI controller should behave like an experienced Deputy Emergency Manager supporting the exercise.

### Rationale

The simulator should feel like a professional operational training partner, not a generic chatbot, academic lecturer, or game narrator.

### Impact

AI responses should be conversational, direct, realistic, and grounded in operational pressure. The controller should brief the user, surface uncertainty, ask for decisions, show consequences, and preserve EOC role boundaries.

---

## 2026-06 — Community Lifelines as Operating Picture

### Decision

Use FEMA Community Lifelines as a central operating picture for the live exercise interface.

### Rationale

Community Lifelines give emergency managers a realistic way to understand what is affected, what is stabilizing, and what is deteriorating during response and recovery.

### Impact

Lifeline changes should be tied to scenario developments, user decisions, cascading consequences, and recovery conditions. Lifelines should not be decorative dashboard elements.

---

## 2026-06 — ESF Activation Tracker

### Decision

Include ESF activation/status information as part of the EOC coordination environment.

### Rationale

Emergency Support Functions help ground the exercise in realistic National Response Framework concepts and reinforce coordination across functional areas.

### Impact

ESF information should support decision-making without turning the product into a static reference chart or checklist exercise.

---

## 2026-06 — Mission Portal

### Decision

Create a branded Mission Portal as the front door to NEXUS EOC.

### Rationale

The early prototype opened directly into a basic scenario picker. A commercial training platform needs a stronger entry point that communicates purpose, credibility, and product value.

### Impact

The Mission Portal now introduces the platform, highlights training value, provides access to product documentation, and sends users into the Start Exercise workflow.

---

## 2026-06 — Start Exercise Workflow

### Decision

Separate the Mission Portal from the Start Exercise configuration flow.

### Rationale

The user should understand the product first, then configure and launch an exercise in a focused workspace.

### Impact

Start Exercise now acts as the main scenario selection and setup area, including scenario cards, user role, jurisdiction type, difficulty, and launch controls.

---

## 2026-06 — AAR and Transcript Outputs

### Decision

Generate professional After-Action Review and transcript PDF outputs at exercise end.

### Rationale

Training value depends on reflection. Users need a clean record of the exercise and useful feedback tied to their decisions.

### Impact

AARs should identify decisions, strengths, missed opportunities, consequences, lifeline impacts, coordination issues, and recommended follow-up training. Transcripts should preserve the exercise interaction in a readable format.

---

## 2026-06 — Reference Desk and Resources

### Decision

Include reference and resource access inside the platform.

### Rationale

Users may need quick access to emergency management frameworks, ESF references, lifeline concepts, and platform guidance during training.

### Impact

Reference materials should support the exercise without overwhelming the live interface or turning the simulation into a document library.

---

## 2026-07 — Build Custom Scenario

### Decision

Add a guided **Build Custom Scenario** feature.

### Rationale

Users need a way to create relevant exercises using their own real-world location, event or hazard, selected EOC position/function, difficulty, and training focus. This significantly increases training flexibility without requiring a full scenario-authoring suite.

### Impact

The feature follows this flow:

```text
Build Custom Scenario Card
    ↓
Custom Scenario Setup
    ↓
Exercise Preview
    ↓
Start Exercise
    ↓
Live Exercise Interface
```

The user briefs NEXUS in plain language. NEXUS converts that briefing into a guided EOC exercise while preserving location, event/hazard, role, difficulty, and training focus.

---

## 2026-07 — Build Custom Scenario Is Not a Mission Editor

### Decision

Build Custom Scenario will remain guided and constrained. It will not become a full scenario-authoring suite, mission editor, tactical planner, or WebEOC-style configuration environment.

### Rationale

The value is speed, relevance, and realistic EOC training. Too many authoring options would slow the user down and increase product complexity without necessarily improving training value.

### Impact

The setup flow should remain simple. The user provides enough information to shape the exercise, and NEXUS handles the scenario construction.

---

## 2026-07 — Custom Scenario Preview

### Decision

Custom scenarios should generate an Exercise Preview before launch.

### Rationale

A preview gives the user a chance to confirm that NEXUS understood the location, hazard/event, role, difficulty, and training focus before the live exercise begins.

### Impact

The preview should not start the exercise, generate injects, or create an AAR. It should confirm the exercise concept, training emphasis, and boundaries before launch.

---

## 2026-07 — Custom Scenario Card Placement

### Decision

The Build Custom Scenario card belongs in the Start Exercise scenario grid with the other scenario cards.

### Rationale

Build Custom Scenario is an exercise launch path, not a front-page marketing feature. Placing it with the other scenarios makes the flow natural and keeps the user in the same mental model: choose a prebuilt scenario or build a custom one.

### Impact

The custom scenario card should match the same size, format, hover behavior, image ratio, title area, description area, and tag style as the prebuilt scenario cards.

---

## 2026-07 — Custom Scenario Card Image

### Decision

Use an EOC planning room image with the NEXUS live exercise screen displayed on the wall monitor for the Build Custom Scenario card.

### Rationale

The custom scenario feature needed to feel like a polished product capability rather than an add-on. Showing the NEXUS interface inside the card image reinforces brand identity and hints at what the user is about to create.

### Impact

The card visually communicates planning, emergency operations, and NEXUS EOC ownership while still matching the existing card grid format.

---

## 2026-07 — Documentation Refresh

### Decision

Refresh the docs folder to reflect the current product state.

### Rationale

The product evolved quickly from prototype to branded platform. The documentation needs to catch up so future development does not drift away from the validated direction.

### Impact

Priority documents include:

- PRODUCT_PRINCIPLES
- README
- ROADMAP
- CHANGELOG
- VISION
- DECISIONS
- ARCHITECTURE
- NEXUS_UI_SPEC
- CONTRIBUTING

---

## Open Decision Areas

The following areas still need future decisions:

- Facilitated / group exercise mode
- User account and saved exercise history
- Organization or agency-level licensing model
- Scenario library expansion strategy
- Jurisdiction document upload or local plan grounding
- Evaluation framework for AAR quality
- Product analytics and usage telemetry
- Commercial demo flow
- Training package structure
- NEXUS RS relationship to NEXUS EOC

---

## Decision Review Rule

When a future feature is proposed, compare it against this decision log and the Product Principles.

A good feature should make NEXUS EOC more useful, more realistic, clearer, or more commercially credible.

A bad feature may look impressive but add confusion, fake complexity, tactical drift, or weak training value.
