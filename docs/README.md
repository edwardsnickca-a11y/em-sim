# NEXUS EOC

**NEXUS EOC** is a simulated emergency operations training platform for emergency managers, EOC staff, public safety leaders, continuity planners, and response partners.

The platform uses AI-driven scenario control to create realistic Emergency Operations Center exercises where users practice decision-making, coordination, public information, resource prioritization, Community Lifeline stabilization, and consequence management under pressure.

NEXUS EOC is not a tactical incident command simulator. It is not a video game. It is not a full scenario-authoring suite.

It is built to help users practice the work that happens in and around an EOC when information is incomplete, consequences are unfolding, and leadership needs clear recommendations.

---

## Current Product Status

NEXUS EOC has evolved from an early emergency management simulator prototype into a branded EOC-focused training platform.

Current major capabilities include:

- Mission Portal landing experience
- Scenario library
- Start Exercise workflow
- Real-world location handling
- Live exercise interface
- Community Lifeline status tracking
- ESF activation tracker
- Flash cards / inject stream
- Media feed
- Situation map
- Reference desk
- Deputy Emergency Manager AI controller behavior
- Guided custom scenario builder
- Exercise preview before launch
- After-Action Review PDF output
- Transcript PDF output

---

## Core Training Focus

NEXUS EOC is designed around EOC-level decision-making.

Exercises should challenge the user to think through:

- What is happening?
- What is uncertain?
- What needs to be stabilized first?
- Which Community Lifelines are affected?
- What resources or partners need to be coordinated?
- What does leadership need to know?
- What does the public need to hear?
- What are the consequences of waiting, acting, or choosing one priority over another?
- How does the incident transition from response into continuity and recovery?

The product should keep the user in the emergency management, EOC coordination, or leadership support role.

---

## What NEXUS EOC Is Not

NEXUS EOC should not drift into:

- Tactical incident command gameplay
- Fireground command
- Police tactical operations
- EMS triage control
- HazMat entry team direction
- SWAT/security planning
- Military-style mission planning
- Fictional jurisdiction creation
- Generic chatbot roleplay
- Decorative dashboard simulation with no training value

Field operations may be referenced as part of the simulated environment, but the user’s role remains focused on EOC decision-making and coordination.

---

## Main User Flow

The current user flow is:

```text
Mission Portal
    ↓
Start Exercise
    ↓
Select Prebuilt Scenario or Build Custom Scenario
    ↓
Configure Role, Jurisdiction, and Difficulty
    ↓
Launch Exercise
    ↓
Live Exercise Interface
    ↓
End Exercise
    ↓
AAR and Transcript Outputs
```

For custom scenarios, the flow is:

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

The custom scenario builder allows a user to brief NEXUS in plain language using a real-world location, event or hazard, selected EOC position/function, difficulty, and training focus.

It is intentionally guided. It is not a mission editor.

---

## Major Screens

### Mission Portal

The Mission Portal introduces the platform, brand, training purpose, and featured scenarios.

It should feel professional, operational, and commercially polished.

The Mission Portal includes:

- NEXUS EOC brand identity
- Primary product message
- Training value blocks
- Featured scenario cards
- Guided Tour
- Overview
- User Guide
- Start Exercise entry point

---

### Start Exercise

The Start Exercise page is the main scenario selection and configuration area.

It includes:

- Prebuilt scenario cards
- Build Custom Scenario card
- Participant name field
- Exercise position/function selector
- Jurisdiction selector
- Difficulty selector
- Scenario confirmation area
- Launch control

The Build Custom Scenario card should sit in the same grid as the prebuilt scenarios and use the same card size, structure, hover behavior, and visual format.

---

### Live Exercise Interface

The Live Exercise Interface is the primary training environment.

It includes:

- Current scenario header
- Exercise position/function
- Jurisdiction
- Difficulty
- Community Lifelines
- ESF Activation Tracker
- Flash Cards
- Media Feed
- Current Situation / Inject panel
- User response input
- Role-specific notepad
- Situation Map
- Reference Desk
- End Exercise control

The screen should feel like an EOC operating environment, not a classroom quiz or tactical game.

---

### AAR and Transcript Outputs

At the end of an exercise, NEXUS EOC generates professional PDF outputs.

The AAR should provide useful reflection tied to the actual exercise.

It should identify:

- Major decisions
- Operational strengths
- Missed opportunities
- Consequences of user actions
- Lifeline impacts
- Coordination issues
- Public information challenges
- Recovery or continuity considerations
- Recommended follow-up training

The transcript should preserve the exercise interaction in a clean, readable format.

---

## Scenario Types

Current prebuilt scenario areas include:

- Hurricane Landfall
- Mass Casualty Incident
- Hazardous Materials Release
- Cyber-Infrastructure Cascade
- Major Earthquake
- Flash Flood / Dam Failure
- Urban Wildfire
- Winter Storm Cascade
- Radiological Dispersal Device
- Train Derailment — MCI / HazMat

The scenario library should continue to focus on incidents that create meaningful EOC-level coordination problems.

---

## Build Custom Scenario

Build Custom Scenario allows the user to generate a guided EOC exercise from a plain-language briefing.

The user provides:

- Real-world location or jurisdiction
- Event or hazard
- Situation description
- Exercise position/function
- Difficulty
- Training focus areas

Training focus areas may include:

- Community Lifelines
- Resource Coordination
- Interagency Coordination
- Public Information
- Leadership Support
- Continuity / COOP
- Recovery Transition

The custom scenario builder must preserve the user’s real location, event/hazard, role, difficulty, and training focus.

It should not convert the user’s request into a tactical incident command scenario.

---

## Location Behavior

NEXUS EOC uses real-world locations.

The simulator should not invent fictional cities, counties, jurisdictions, or landmarks.

For prebuilt scenarios, the application may select a real location appropriate to the selected scenario and jurisdiction type.

For custom scenarios, the user-provided location must be preserved.

When the model does not know specific local details, it should remain general rather than fabricating official facts.

---

## AI Controller Behavior

The AI controller should act like an experienced Deputy Emergency Manager supporting the exercise.

The controller should:

- Brief the situation clearly
- Maintain realistic operational pressure
- Keep the user at the EOC decision level
- Ask for decisions, not trivia answers
- Challenge vague responses
- Show consequences over time
- Update lifelines and injects based on user decisions
- Preserve the scenario, role, location, and difficulty
- Support a professional AAR at exercise end

The controller should not sound like a generic chatbot, academic lecturer, or scripted game narrator.

---

## Product Principles

All development should follow the NEXUS EOC Product Principles.

Key standards:

- EOC decision-making comes first
- Real locations only
- Consequence-based simulation
- Deputy Emergency Manager voice
- EOC, not tactical incident command
- Community Lifelines as the operating picture
- NRF / ESF grounding
- Realistic friction over perfect information
- Guided, not overbuilt
- AAR value matters
- Commercial polish without fake complexity
- Build for emergency managers

See:

```text
docs/PRODUCT_PRINCIPLES.md
```

---

## Development Workflow

Development should occur on the `dev` branch first.

After testing and approval, `dev` can be pushed to production through `main`.

Recommended workflow:

```powershell
git add .
git commit -m "your commit message"
git push origin dev
```

After DEV approval:

```powershell
git push origin dev:main
```

The project should avoid large unreviewed changes directly to `main`.

---

## Repository Structure

Common project areas include:

```text
src/
  App.jsx
  components/
    missionPortal/
    startExercise/
    liveExercise/
    resources/
    brand/
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

## Current Priority

The current product priority is to preserve the clean EOC-focused training experience while continuing to improve:

- Scenario realism
- Custom scenario quality
- Real location handling
- AAR usefulness
- Commercial polish
- Facilitated training potential
- Documentation quality
- Stability before adding complexity

New features should be judged against the product principles before implementation.

---

## Product Standard

Before changing NEXUS EOC, ask:

1. Does this improve EOC decision training?
2. Does it preserve realistic role boundaries?
3. Does it use real locations responsibly?
4. Does it create useful operational consequences?
5. Does it improve the AAR or learning value?
6. Does it make the product clearer, not more cluttered?

If not, redesign it, park it, or remove it.
