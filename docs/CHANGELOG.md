# NEXUS EOC Changelog

This changelog captures major product changes, design decisions, and capability additions for NEXUS EOC.

NEXUS EOC has moved quickly from an early emergency management simulator prototype into a branded Emergency Operations Center training platform. This file should be updated whenever a feature meaningfully changes the user experience, training value, AI behavior, documentation, or production workflow.

---

## Current Product Baseline

NEXUS EOC now includes:

- Mission Portal landing experience
- Start Exercise scenario-selection workflow
- Prebuilt scenario library
- Build Custom Scenario workflow
- Exercise Preview before launch
- Real-world location handling
- Live Exercise Interface
- Community Lifeline tracking
- ESF Activation Tracker
- Flash Cards / inject stream
- Media Feed
- Situation Map
- Reference Desk and resources modal
- Deputy Emergency Manager AI controller behavior
- AAR PDF output
- Transcript PDF output
- Updated NEXUS branding and commercial UI polish

---

## 2026-07 — Build Custom Scenario Release

### Added

- Added **Build Custom Scenario** as a guided custom exercise pathway.
- Added custom scenario card to the Start Exercise scenario grid.
- Added Custom Scenario Setup flow.
- Added Exercise Preview step before launch.
- Added support for user-provided real-world locations.
- Added user-provided event or hazard input.
- Added plain-language situation description input.
- Added training focus selection.
- Added custom scenario launch path into the Live Exercise Interface.
- Added custom scenario visual card image using an EOC planning room with the NEXUS live exercise screen displayed on the wall.

### Training Focus Areas

The custom scenario builder supports the following focus areas:

- Community Lifelines
- Resource Coordination
- Interagency Coordination
- Public Information
- Leadership Support
- Continuity / COOP
- Recovery Transition

### Design Intent

Build Custom Scenario is intentionally guided.

It allows a user to brief NEXUS in plain language and generate a realistic EOC exercise, but it is not a full scenario-authoring suite, mission editor, or tactical incident command planner.

The feature preserves:

- Real-world location
- Event or hazard
- Situation description
- Exercise position/function
- Difficulty
- Training focus

### Guardrails

The feature must not:

- Invent fictional jurisdictions
- Replace the user’s selected location with another location
- Convert the scenario into tactical incident command gameplay
- Ask the user to direct field-level tactical operations
- Drift into law enforcement or security tactical planning
- Generate an AAR before the exercise is complete

---

## 2026-07 — Custom Scenario Card Visual Update

### Added

- Added a polished custom card image for Build Custom Scenario.
- Used an EOC planning room concept to visually communicate planning, emergency management, and exercise design.
- Placed the NEXUS live exercise interface on the large wall screen inside the card image.

### Changed

- Updated the Build Custom Scenario card to match the same size, structure, and visual format as the other scenario cards.
- Kept the card as a peer in the scenario grid rather than a separate oversized feature block.

### Reason

The card needed to feel like part of the scenario library while still signaling that it opens a different, more flexible exercise path.

The wall-screen image reinforces the NEXUS brand and makes the feature feel more commercial and productized.

---

## 2026-07 — Real-World Location Engine

### Added

- Added application-side location selection for prebuilt scenarios.
- Added location preservation for custom scenarios.
- Added stricter handling to prevent the AI model from inventing or randomly changing locations.

### Changed

- Scenario world-building now receives a selected real location before the exercise begins.
- Loading language may display the real selected location while the world is being built.

### Reason

Earlier versions allowed repeated or unrealistic location behavior. The updated location engine makes the simulation feel more grounded and reinforces the product principle that NEXUS EOC uses real-world locations only.

---

## 2026-06 / 2026-07 — Mission Portal and Start Exercise Flow

### Added

- Added NEXUS EOC Mission Portal.
- Added Start Exercise page.
- Added scenario card grid.
- Added featured scenario presentation.
- Added role, jurisdiction, and difficulty setup before exercise launch.
- Added guided tour entry point.
- Added platform overview and user guide access.

### Changed

- Reframed the product from a generic emergency management simulator into **NEXUS EOC — Simulated Emergency Operations Platform**.
- Clarified the product as an EOC decision-training tool rather than a tactical incident command simulator.
- Improved overall navigation from landing page to scenario launch.

### Reason

The product needed a clearer front door, a more professional brand experience, and a user flow that made sense for training users before they entered a live exercise.

---

## 2026-06 / 2026-07 — Live Exercise Interface Enhancements

### Added

- Added Community Lifeline operating picture.
- Added ESF Activation Tracker.
- Added Flash Cards / inject stream.
- Added Media Feed.
- Added Situation Map.
- Added Reference Desk.
- Added user notepad.
- Added role-specific exercise framing.
- Added End Exercise control.

### Changed

- Improved the interface from a simple text interaction into a more complete EOC training environment.
- Shifted the experience toward consequence-based decision-making and operational friction.

### Reason

The live exercise screen needed to feel like an emergency operations workspace, not a chatbot window or classroom quiz.

---

## 2026-06 / 2026-07 — Deputy Emergency Manager AI Controller

### Added

- Added stronger AI controller behavior for EOC-level simulation.
- Added Deputy Emergency Manager voice guidance.
- Added stronger role boundaries for emergency management and EOC coordination.
- Added response behavior that emphasizes consequences, friction, lifelines, coordination, and decision pressure.

### Changed

- Reduced generic chatbot behavior.
- Reduced tactical incident command drift.
- Improved realism of operational updates and injects.

### Reason

The AI controller should feel like an experienced Deputy Emergency Manager working through the incident with the player. The exercise should challenge judgment, prioritization, and coordination rather than trivia recall.

---

## 2026-06 / 2026-07 — AAR and Transcript Outputs

### Added

- Added AAR PDF output.
- Added transcript PDF output.
- Added cleaner export formatting.
- Added exercise-end workflow to produce reviewable outputs.

### Changed

- Improved AAR and transcript structure so outputs feel more professional and easier to review.

### Reason

The exercise needs to produce useful training value after completion. AARs and transcripts help the user review decisions, consequences, strengths, gaps, and follow-on training needs.

---

## 2026-06 / 2026-07 — Resources and Reference Material

### Added

- Added resources modal.
- Added reference material access.
- Added platform overview and user guide documents.
- Added reference list document.

### Changed

- Improved how users access supporting documentation during the platform experience.

### Reason

NEXUS EOC should support training without overwhelming the live exercise screen. References should be available, but they should not distract from decision-making.

---

## 2026-06 — Product Rebrand

### Changed

- Shifted from **EM Crisis Simulator** toward **NEXUS EOC**.
- Adopted the product framing: **NEXUS EOC — Simulated Emergency Operations Platform**.
- Improved visual identity, color palette, and commercial design direction.

### Reason

The original prototype name and interface no longer matched the product direction. NEXUS EOC better reflects the focus on emergency operations, EOC coordination, and scalable training.

---

## Documentation Refresh

### Updated

- PRODUCT_PRINCIPLES.md
- README.md
- ROADMAP.md
- CHANGELOG.md

### In Progress

- VISION.md
- DECISIONS.md
- ARCHITECTURE.md
- NEXUS_UI_SPEC_v1.0.md
- CONTRIBUTING.md

### Reason

The documentation had fallen behind the product. The refresh aligns the repo docs with the current platform, current product principles, and current development workflow.

---

## Changelog Standard

Add a changelog entry when a change affects:

- User flow
- Scenario behavior
- AI controller behavior
- Location handling
- AAR or transcript output
- Product principles
- Visual identity
- Production workflow
- Major documentation
- Training value

Each entry should explain what changed and why it matters.

