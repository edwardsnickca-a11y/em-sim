# Contributing to NEXUS EOC

NEXUS EOC is an emergency operations training platform. Contributions should protect the product’s core purpose: realistic EOC decision training for emergency managers, EOC staff, public safety leaders, continuity planners, and response partners.

This project should not drift into tactical incident command gameplay, generic chatbot roleplay, fictional jurisdiction simulation, or decorative dashboards that do not improve training value.

Before changing the product, read:

```text
/docs/PRODUCT_PRINCIPLES.md
```

Those principles are the operating standard for all product, UI, scenario, prompt, and architecture changes.

---

## Development Branching

All normal development should happen on the `dev` branch first.

Use `main` only for production-ready changes after review and testing.

Recommended workflow:

```powershell
git add .
git commit -m "your commit message"
git push origin dev
```

After the DEV build has been tested and approved:

```powershell
git push origin dev:main
```

Avoid making untested changes directly to `main`.

---

## Product Guardrails

Every contribution should support NEXUS EOC as an EOC-focused training platform.

Changes should preserve these guardrails:

- EOC decision-making comes first
- Real locations only
- Consequence-based simulation
- Deputy Emergency Manager voice
- EOC coordination, not tactical incident command
- Community Lifelines as the operating picture
- NRF / ESF grounding where appropriate
- Realistic friction over perfect information
- Guided user flows over complex authoring tools
- AAR value tied to actual exercise behavior
- Commercial polish without fake complexity

If a proposed change does not strengthen one of those areas, it should be redesigned, parked, or removed.

---

## Role Boundary

NEXUS EOC should keep the user in an emergency management, EOC coordination, or leadership support role.

The platform may reference field operations, but it should not ask the user to directly command tactical field actions such as:

- Fireground entry
- Police tactical movements
- SWAT operations
- EMS triage control
- HazMat entry team decisions
- Rescue team assignments
- Field unit routing as the primary gameplay mechanic

The user’s work should center on coordination, prioritization, situational awareness, public information, resource support, leadership briefings, continuity, and recovery transition.

---

## Location Standard

NEXUS EOC uses real-world locations.

Do not add fictional cities, counties, agencies, landmarks, or jurisdictions as if they are real.

When a custom scenario uses a user-provided real location, preserve that location throughout the exercise.

When local facts are uncertain, keep the language general instead of fabricating official details.

Acceptable:

```text
Local officials report impacts in low-lying neighborhoods near the river corridor.
```

Avoid:

```text
The fictional North Valley County Emergency Management Agency activates its fictional Riverfront Shelter Complex.
```

---

## AI Prompt and Scenario Changes

Prompt changes should reinforce the Deputy Emergency Manager controller behavior.

The AI controller should:

- Brief clearly
- Maintain realistic operational pressure
- Ask for EOC-level decisions
- Challenge vague responses
- Reflect consequences over time
- Update lifelines and injects based on user choices
- Preserve scenario, role, location, difficulty, and training focus
- Support a useful AAR at the end of the exercise

Prompt changes should not create:

- Quiz-style interactions
- Overly scripted gameplay
- Fictional jurisdictions
- Tactical field command tasks
- Generic chatbot behavior
- Fake certainty about local facts
- Unrelated academic explanation

---

## UI Changes

UI changes should make the product clearer, more professional, and more usable.

The interface should feel like a serious emergency operations platform, not a game menu or generic web demo.

Good UI changes improve:

- Orientation
- Scenario clarity
- Role clarity
- Decision flow
- Operational pressure
- AAR usefulness
- Commercial polish
- User confidence

Avoid UI changes that add clutter, fake data, unnecessary dashboards, unclear controls, or options that do not improve training value.

---

## Scenario Card Standard

Scenario cards should remain visually consistent across the Start Exercise grid.

Each card should follow the same general structure:

- Image area
- Scenario title
- Short scenario description
- Scenario tag or category chip
- Consistent sizing
- Consistent border radius
- Consistent hover / selected behavior

Special cards, including Build Custom Scenario, should not break the grid unless there is a deliberate design decision to do so.

---

## Build Custom Scenario Standard

Build Custom Scenario is a guided exercise intake flow.

It is not a full scenario-authoring suite, mission editor, tactical planner, or WebEOC-style configuration system.

The feature should allow the user to brief NEXUS in plain language using:

- Real-world location
- Event or hazard
- Situation description
- Exercise position/function
- Difficulty
- Training focus areas

The preview should confirm what NEXUS will build before the exercise launches.

The live exercise should preserve the approved setup.

---

## Documentation Changes

Documentation should be updated when product behavior meaningfully changes.

Important docs include:

```text
docs/PRODUCT_PRINCIPLES.md
docs/README.md
docs/ROADMAP.md
docs/CHANGELOG.md
docs/VISION.md
docs/DECISIONS.md
docs/ARCHITECTURE.md
docs/NEXUS_UI_SPEC_v1.0.md
docs/CONTRIBUTING.md
```

The documentation should be practical, direct, and useful for future development. Avoid marketing fluff, stale roadmap items, or overly academic descriptions.

---

## Changelog Discipline

Major product changes should be captured in `docs/CHANGELOG.md`.

Examples of changes that should be logged:

- New major screens
- New exercise flows
- AI controller behavior changes
- Scenario system changes
- Location engine changes
- AAR/transcript output changes
- Major UI redesigns
- Product guardrail decisions
- Production milestones

Minor copy edits and small layout fixes do not always need a changelog entry unless they affect product behavior or user experience.

---

## Decision Log Discipline

Use `docs/DECISIONS.md` to capture important product decisions and the reasoning behind them.

Examples:

- Why NEXUS EOC is EOC-focused, not IC-focused
- Why locations must be real
- Why Build Custom Scenario is guided, not a mission editor
- Why Community Lifelines are central to the operating picture
- Why AARs should be consequence-based instead of score-based

The decision log should help future contributors understand why the product is built this way.

---

## Testing Expectations

Before pushing a meaningful feature to production, test the DEV build.

At minimum, confirm:

- Mission Portal loads
- Start Exercise loads
- Scenario cards display correctly
- Prebuilt scenario launch works
- Build Custom Scenario flow works
- Exercise Preview appears before launch
- Live Exercise screen loads
- User responses produce expected exercise behavior
- End Exercise works
- AAR output works
- Transcript output works
- Reference and resource links still open

For changes that affect only a small area, test that area and any directly connected flow.

---

## Code Style

Keep changes focused and readable.

Prefer small, purposeful updates over large rewrites.

Avoid introducing unnecessary dependencies or complex abstractions unless they clearly improve maintainability.

Use clear names for components, data structures, and helper functions.

When possible, keep product logic easy to follow for future contributors.

---

## Pulling the Product Forward

NEXUS EOC should keep moving toward a serious commercial training platform.

Good contributions make the product:

- More realistic
- More useful for emergency managers
- Easier to demo
- Easier to train with
- More grounded in EOC operations
- More consistent with the product principles
- More valuable in the AAR

The standard is simple:

```text
Does this help someone practice better emergency operations decision-making?
```

If yes, it is worth considering.

If no, it probably does not belong in NEXUS EOC.
