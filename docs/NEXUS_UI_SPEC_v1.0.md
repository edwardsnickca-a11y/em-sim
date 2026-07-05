# NEXUS EOC UI Specification v1.1

This document defines the current user interface direction for NEXUS EOC.

NEXUS EOC is a professional emergency operations training platform. The interface should feel operational, credible, modern, and focused. It should not feel like a game, a generic chatbot, or a classroom worksheet.

The UI exists to support realistic EOC decision training. Visual polish matters, but only when it improves orientation, confidence, clarity, and training value.

---

## 1. UI Standard

NEXUS EOC should feel like a serious emergency operations environment.

The interface should communicate:

- Operational readiness
- Professional emergency management practice
- Clear decision pressure
- Real-time coordination
- Consequence-based training
- Public safety credibility
- Commercial product quality

The UI should avoid:

- Toy-like visuals
- Excessive dashboard clutter
- Fake metrics with no training value
- Tactical command-game styling
- Overly academic presentation
- Unclear role boundaries
- Fictional jurisdiction cues
- Generic SaaS templates that do not feel emergency-management specific

The user should immediately understand that they are entering an EOC training environment.

---

## 2. Visual Identity

The NEXUS EOC visual identity should remain consistent across the product.

Preferred visual tone:

- Dark navy / charcoal operating environment
- Teal or cyan operational accents
- White and muted gray text hierarchy
- Emergency-management appropriate contrast
- Clean card-based layouts
- Subtle gradients and glow effects used sparingly
- Map, grid, and command-center visual references where useful

The design should feel modern but grounded. It should support trust.

NEXUS EOC should not look like a comic-book simulator, military targeting system, or consumer game interface.

---

## 3. Main Screens

The primary product screens are:

```text
Mission Portal
Start Exercise
Custom Scenario Setup
Exercise Preview
Live Exercise Interface
AAR / Transcript Outputs
Resources / Reference Desk
Guided Tour
```

Each screen should have a clear purpose and a clear next action.

---

## 4. Mission Portal

The Mission Portal is the front door of the platform.

Purpose:

- Introduce NEXUS EOC
- Establish product credibility
- Explain the training value
- Guide users into the exercise workflow

The Mission Portal should include:

- NEXUS EOC branding
- Clear platform message
- Primary Start Exercise call-to-action
- Featured scenario or capability cards
- Guided Tour access
- Overview access
- User Guide access
- Resources access where appropriate

The Mission Portal should not become the scenario configuration screen. Its job is to orient the user and move them into the training experience.

---

## 5. Start Exercise Screen

The Start Exercise screen is the scenario selection and configuration hub.

Purpose:

- Let the user select a prebuilt scenario or build a custom scenario
- Capture participant name
- Select exercise position/function
- Select jurisdiction type
- Select difficulty
- Confirm the exercise before launch

The Start Exercise screen should include:

- Scenario search/filter area
- Scenario card grid
- Build Custom Scenario card
- Participant name field
- Exercise position/function selector
- Jurisdiction selector
- Difficulty selector
- Confirmation panel
- Start Exercise button

The Start Exercise page should feel like a professional mission setup area, not a form-heavy admin page.

---

## 6. Scenario Cards

Scenario cards are the primary visual entry point into exercises.

All scenario cards should use a consistent structure:

- Same card size
- Same image aspect ratio
- Same border radius
- Same title placement
- Same description placement
- Same tag/chip treatment
- Same hover behavior
- Same selected behavior
- Same grid alignment

Scenario cards should include:

- Scenario image
- Scenario title
- Short operational description
- Scenario category or tag

The Build Custom Scenario card should use the same layout and dimensions as other scenario cards. It should not be oversized or visually separated as a different class of object.

Recommended Build Custom Scenario card content:

```text
Title: Build Custom Scenario
Description: Create a guided EOC exercise using your own real-world location, event, and training focus.
Tag: CUSTOM EXERCISE
```

The card image should communicate EOC planning, emergency operations, and NEXUS EOC branding. The current preferred visual is an EOC planning room with the NEXUS live exercise interface displayed on a large wall screen.

---

## 7. Build Custom Scenario Flow

Build Custom Scenario is a guided intake flow.

It is not a full scenario-authoring suite.
It is not a mission editor.
It is not a tactical incident command planner.

The flow is:

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

The setup interface should collect:

- Real-world location / jurisdiction
- Event or hazard
- Situation description
- Exercise position/function
- Difficulty
- Training focus areas

The preview should confirm what NEXUS will build before the exercise launches.

The user should understand that they are briefing NEXUS in plain language, not designing every inject or mission detail.

---

## 8. Custom Scenario Setup Modal

The Custom Scenario Setup modal should be clear, guided, and restrained.

Required fields:

- Location / Jurisdiction
- Event or Hazard
- Situation Description
- Exercise Position / Function
- Difficulty
- Training Focus

Location helper language should reinforce real-world use:

```text
Use a real location. NEXUS EOC does not create fictional jurisdictions.
```

The modal should avoid overwhelming the user with advanced controls.

Good setup language should invite plain-language briefing:

```text
Brief NEXUS on the incident you want to exercise. Use a real place, a realistic hazard or event, and the EOC function you want to practice.
```

---

## 9. Exercise Preview

The Exercise Preview screen or modal should show the user what NEXUS will create before launch.

It should include:

- Location / Jurisdiction
- Event / Hazard
- Exercise position/function
- Difficulty
- Training focus areas
- Scenario summary
- What the exercise will emphasize
- What the exercise will avoid

The preview should not start the exercise, generate injects, or create an AAR.

The preview should provide confidence that the user’s requested location, hazard, role, difficulty, and training focus were preserved.

Primary actions:

- Start Exercise
- Revise Setup
- Cancel

---

## 10. Live Exercise Interface

The Live Exercise Interface is the core training screen.

Purpose:

- Create the feel of an active EOC operating environment
- Present evolving information
- Require user decisions
- Track consequences
- Preserve situational awareness

The Live Exercise Interface should include:

- Scenario header
- Current role/function
- Jurisdiction
- Difficulty
- Simulation time
- Current situation
- AI controller injects
- User response input
- Community Lifelines
- ESF Activation Tracker
- Flash Cards
- Media Feed
- Situation Map
- Role-specific notepad
- Reference Desk
- End Exercise control

The screen should be dense enough to feel operational, but not so crowded that the user cannot decide what matters.

---

## 11. Community Lifelines UI

Community Lifelines are a central part of the operating picture.

The lifeline display should:

- Be visible during live exercises
- Use clear status indicators
- Change only when operationally justified
- Reflect scenario developments and user decisions
- Support situational awareness

Lifelines should not be decorative. They should help the user understand what is stabilizing, what is deteriorating, and what requires coordination.

---

## 12. ESF Activation Tracker

The ESF Activation Tracker should support EOC coordination.

It should help users understand which functions are engaged, likely needed, or becoming relevant.

The tracker should stay grounded in Emergency Support Function logic and avoid implying that the user is directly commanding field operations.

---

## 13. Media Feed

The Media Feed should create realistic public information pressure.

It may include:

- News-style updates
- Social media-style pressure
- Rumors or incomplete public reports
- Leadership-sensitive public concerns
- Public confidence indicators

The feed should support decision-making, not become noise.

Media items should create realistic public information consequences and communication challenges.

---

## 14. Situation Map

The Situation Map should support orientation and context.

It should not pretend to be a full GIS replacement.

Map pins and location markers should be plausible and useful, but the interface should avoid presenting fabricated local details as confirmed facts.

When location specificity is uncertain, the product should remain general.

---

## 15. Reference Desk and Resources

The Reference Desk and Resources modal should support the user during the exercise without pulling them out of the experience.

Content should be practical, concise, and relevant to EOC work.

Reference material may include:

- Community Lifelines
- ESFs
- EOC role guidance
- Public information considerations
- Resource coordination reminders
- AAR expectations
- Platform overview and user guide material

Reference content should not become a classroom textbook inside the simulator.

---

## 16. AAR and Transcript Screens

AAR and transcript outputs should feel professional and useful.

The AAR should focus on:

- Decisions made
- Consequences observed
- Lifeline impacts
- Coordination strengths
- Missed opportunities
- Public information issues
- Recovery or continuity concerns
- Recommended next training focus

The transcript should preserve the exercise interaction in a clean format.

Both outputs should be suitable for saving, sharing, and reviewing after the exercise.

---

## 17. Writing and Microcopy

NEXUS EOC language should be direct, professional, and operational.

Good UI copy should:

- Use plain language
- Sound like emergency management practice
- Avoid academic filler
- Avoid game language
- Avoid tactical command language
- Reinforce EOC decision-making

Preferred phrasing:

```text
Start Exercise
Build Custom Scenario
Exercise Preview
Live Exercise
Community Lifelines
Reference Desk
End Exercise
After-Action Review
```

Avoid phrasing that makes the user feel like they are playing a game or commanding field units.

---

## 18. Accessibility and Readability

The UI should maintain strong readability and usable contrast.

Important considerations:

- Clear text hierarchy
- Avoid overly small text in critical panels
- Maintain contrast in dark mode
- Use consistent button states
- Ensure focus and hover states are visible
- Avoid relying on color alone for critical status
- Keep dense panels readable

Emergency operations training can be cognitively demanding. The UI should reduce unnecessary confusion.

---

## 19. Component Consistency

Common components should remain visually consistent across screens.

This includes:

- Buttons
- Cards
- Modals
- Tags / chips
- Form fields
- Status indicators
- Headers
- Navigation controls
- Resource links

New UI work should reuse existing design patterns before creating new ones.

Inconsistent one-off styling should be avoided unless there is a clear product reason.

---

## 20. Product Guardrails

Before adding or changing UI, ask:

1. Does this make the EOC training experience clearer?
2. Does this support decision-making under realistic pressure?
3. Does this preserve the EOC role boundary?
4. Does this avoid fake or decorative complexity?
5. Does this align with the current NEXUS EOC visual identity?
6. Does this help the user understand what to do next?

If the answer is no, the UI should be simplified, redesigned, or removed.

---

## Current UI Direction

NEXUS EOC should continue moving toward a polished, commercial, EOC-focused operating environment.

The product should feel:

- Serious
- Operational
- Modern
- Guided
- Realistic
- Professional
- Emergency-management specific

The interface should help users practice the decisions they may actually face in an EOC.

That is the standard.
