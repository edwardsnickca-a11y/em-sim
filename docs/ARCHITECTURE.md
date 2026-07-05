# NEXUS EOC Architecture

NEXUS EOC is a Vite / React application that delivers an AI-driven emergency operations training experience. The product is organized around a simple user path: Mission Portal, Start Exercise, Live Exercise, End Exercise, AAR, and Transcript export.

The architecture should stay understandable, maintainable, and aligned with the product principles. NEXUS EOC is not intended to become a tactical command simulator, a WebEOC clone, a GIS platform, or a complex scenario-authoring suite.

---

## Application Structure

The main application flow is controlled through React state in `src/App.jsx`.

Core application screens include:

```text
Mission Portal
    ↓
Start Exercise
    ↓
Live Exercise
    ↓
After-Action Review / Transcript
```

Custom scenarios follow the same operating model after preview approval:

```text
Build Custom Scenario
    ↓
Custom Scenario Setup
    ↓
Exercise Preview
    ↓
Live Exercise
    ↓
AAR / Transcript
```

The application should continue to preserve this clear flow. New features should support the training experience without adding unnecessary navigation complexity.

---

## Core Source Areas

Typical project structure:

```text
src/
  App.jsx
  components/
    brand/
    liveExercise/
    missionPortal/
    resources/
    startExercise/
  data/
    aar.js
    esfs.js
    jurisdictions.js
    lifelines.js
    locationBank.js
    mapConfig.js
    panelInfo.js
    references.js
    roles.js

public/
  NEXUS_EOC_Platform_Overview.pdf
  NEXUS_EOC_Reference_List.pdf
  NEXUS_EOC_User_Guide.pdf

docs/
  ARCHITECTURE.md
  CHANGELOG.md
  CONTRIBUTING.md
  DECISIONS.md
  NEXUS_UI_SPEC_v1.0.md
  PRODUCT_PRINCIPLES.md
  README.md
  ROADMAP.md
  VISION.md
```

---

## `App.jsx`

`App.jsx` is the primary application controller.

It manages:

- Current screen
- Selected scenario
- Jurisdiction type
- Selected location
- Difficulty
- Player role
- Exercise history
- Dispatches and injects
- Simulated time
- Community Lifeline state
- Media/headline state
- Map pins
- World state
- AAR generation
- Transcript output
- AI prompt construction

`App.jsx` should remain focused on orchestration. Where practical, large UI patterns, data definitions, and modal behavior should live in components or data files rather than making `App.jsx` harder to maintain.

---

## Mission Portal

The Mission Portal is the branded product entry point.

It introduces:

- NEXUS EOC identity
- Training purpose
- Scenario-based exercise model
- Major product value
- Featured scenarios
- Guided Tour
- Overview / User Guide access
- Start Exercise entry point

The Mission Portal should remain polished and commercially credible, but it should not become crowded with every product feature. Its job is orientation and entry, not full scenario configuration.

---

## Start Exercise

The Start Exercise component is the main exercise configuration area.

It handles:

- Prebuilt scenario card selection
- Build Custom Scenario card entry
- Participant name
- Exercise position/function
- Jurisdiction selection
- Difficulty selection
- Scenario confirmation
- Exercise launch

The Build Custom Scenario card should use the same visual card structure as other scenario cards. It is a first-class scenario pathway, not a separate oversized feature panel.

---

## Build Custom Scenario

Build Custom Scenario allows the user to brief NEXUS in plain language and generate a guided EOC exercise.

The setup captures:

- Real-world location or jurisdiction
- Event or hazard
- Situation description
- Exercise position/function
- Difficulty
- Training focus areas

The preview step confirms what NEXUS will build before the live exercise begins.

The custom scenario builder should remain guided. It should not become a full mission editor, tactical planner, or scenario-authoring suite.

Important rules:

- Preserve the user-provided real location
- Preserve the event or hazard
- Preserve the selected role/function
- Preserve difficulty
- Preserve training focus
- Keep the user in an EOC decision-making role
- Do not invent fictional jurisdictions
- Do not convert the exercise into tactical incident command

---

## Live Exercise Interface

The Live Exercise Interface is the primary training environment.

It should present the user with enough operational context to make decisions without overwhelming them with fake complexity.

Core live exercise elements include:

- Scenario header
- Jurisdiction / location context
- Exercise role
- Difficulty
- Current inject / situation prompt
- User response input
- Community Lifelines
- ESF Activation Tracker
- Flash cards / inject stream
- Media feed
- Situation map
- Role-specific notepad
- Reference desk
- End Exercise control

The interface should feel like an EOC support environment, not a tactical game board.

---

## Location Engine

NEXUS EOC uses real-world locations.

The location engine supports prebuilt scenarios by selecting appropriate real locations based on scenario type and jurisdiction category.

For custom scenarios, the user-provided location should be preserved and passed into the AI controller behavior.

Location rules:

- Do not invent fictional cities or counties
- Do not fabricate official local details as confirmed facts
- Use real locations responsibly
- When uncertain, stay general
- Preserve selected locations across world initialization and live exercise play

The location behavior is a core product trust issue. The system should never casually create fake jurisdictions.

---

## Data Files

The `src/data/` directory contains product configuration, reference structures, and stable operational frameworks.

Common data areas include:

- `aar.js` — AAR-related structure and support content
- `esfs.js` — Emergency Support Function data
- `jurisdictions.js` — Jurisdiction categories
- `lifelines.js` — Community Lifeline definitions and status behavior
- `locationBank.js` — Real-world location selection logic
- `mapConfig.js` — Map and display configuration
- `panelInfo.js` — UI/help panel content
- `references.js` — Reference desk resources
- `roles.js` — Exercise position/function definitions

These files should remain grounded in emergency management practice and should not introduce fictional operational doctrine.

---

## AI Controller Prompting

The AI controller is central to the product experience.

It should behave like an experienced Deputy Emergency Manager supporting the exercise.

Core prompt behavior should enforce:

- EOC-level decision-making
- Realistic operational friction
- Community Lifeline impacts
- ESF / NRF grounding where appropriate
- Consequence-based simulation
- Clear scenario continuity
- Role-specific pressure
- Real location preservation
- No tactical incident command drift
- Useful end-of-exercise AAR generation

The controller should avoid academic summaries, generic chatbot phrasing, fictional jurisdictions, fake precision, and game-like scoring behavior.

---

## World Initialization

World initialization establishes the baseline operating environment before the live exercise begins.

It should define:

- Scenario context
- Location / jurisdiction context
- Initial incident conditions
- Initial Community Lifeline concerns
- Likely EOC coordination pressures
- Key operational uncertainties
- Plausible early partner actions

World initialization should not over-specify details that are not known or not needed. The point is to create a believable starting environment, not to write a full incident action plan.

---

## Community Lifelines

Community Lifelines are a core operating picture element.

They should reflect actual changes in the scenario environment and user decisions.

Lifeline changes should be tied to:

- Incident escalation
- Stabilization progress
- Cascading effects
- Resource decisions
- Public information outcomes
- Recovery or continuity conditions

Lifeline displays should not be decorative. They should help the user understand operational consequences.

---

## ESF Activation Tracker

The ESF Activation Tracker supports EOC-level coordination.

It should help users think about which functional areas are engaged, stressed, or needed.

The tracker should not imply that the user is directly commanding all ESF activity. It should support coordination awareness and decision-making.

---

## Reference Desk and Resources

The Reference Desk and Resources modal provide supporting information without interrupting the exercise flow.

References should be practical, concise, and relevant to EOC decision-making.

They should not turn the exercise into a reading assignment.

---

## AAR and Transcript Outputs

NEXUS EOC generates AAR and transcript outputs at the end of an exercise.

The AAR should be based on the actual interaction, not generic feedback.

It should identify:

- Major user decisions
- Operational strengths
- Missed opportunities
- Consequences
- Lifeline impacts
- Coordination challenges
- Public information issues
- Recovery / continuity considerations
- Recommended next training areas

The transcript should provide a clean record of the exercise interaction.

---

## PDF / Public Assets

Public-facing documents live in `public/` and are available through the application.

Current major user-facing documents include:

- `NEXUS_EOC_Platform_Overview.pdf`
- `NEXUS_EOC_Reference_List.pdf`
- `NEXUS_EOC_User_Guide.pdf`

These documents should stay aligned with the live product. When major product capabilities change, the public documents should be reviewed.

---

## Styling and Brand

NEXUS EOC uses a professional emergency operations visual identity.

The interface should feel:

- Serious
- Modern
- Operational
- Clear
- Commercially credible
- Calm under pressure

Avoid unnecessary clutter, gimmicks, fake data, or game-like UI elements that weaken trust.

---

## Development Branching

Normal development should happen on `dev`.

After testing, approved changes can be pushed to production through `main`.

Standard workflow:

```powershell
git add .
git commit -m "your commit message"
git push origin dev
```

Production push after approval:

```powershell
git push origin dev:main
```

Large changes should be tested in DEV before production.

---

## Architecture Principle

The application should stay easy to reason about.

Before adding architectural complexity, ask:

1. Does this improve EOC decision training?
2. Does it make the product easier to maintain?
3. Does it preserve the user flow?
4. Does it support useful AAR output?
5. Does it protect the EOC-not-IC boundary?
6. Does it avoid unnecessary product sprawl?

If the answer is no, keep the architecture simpler.
