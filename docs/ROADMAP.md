# NEXUS EOC Roadmap

NEXUS EOC is being built as a simulated emergency operations training platform for emergency managers, EOC staff, public safety leaders, continuity planners, and response partners.

The roadmap should protect the core product identity: EOC decision training, realistic operational friction, real-world locations, Community Lifeline stabilization, ESF/NRF grounding, and useful after-action learning.

This is not a tactical incident command game, a mission editor, or a generic chatbot wrapper.

---

## Product Direction

NEXUS EOC should continue moving toward a polished, commercially credible training platform that can be used for individual practice, facilitated exercises, classroom support, agency training, and eventually organizational licensing.

The product should remain focused on decisions that happen in and around an Emergency Operations Center:

- Situational awareness
- Resource coordination
- Community Lifelines
- Interagency coordination
- Public information
- Leadership support
- Continuity of operations
- Recovery transition
- Consequence management

Every roadmap item should strengthen that training value.

---

## Recently Completed

The following capabilities have moved from concept or prototype into the current product baseline.

### Brand and Product Identity

- Renamed and reframed the product as **NEXUS EOC**
- Established the platform message: **Train. Decide. Lead.**
- Moved away from the early **EM Crisis Simulator** prototype identity
- Created a professional Mission Portal landing experience
- Added NEXUS EOC logo and branded visual system
- Established a darker operational interface style with navy, teal, blue, and emergency-status accents

### Mission Portal

- Built the Mission Portal as the front door to the product
- Added featured scenario cards
- Added product value blocks
- Added Guided Tour, Overview, User Guide, and Start Exercise controls
- Established a more commercial product presentation

### Start Exercise Workflow

- Built the Start Exercise page as the scenario selection and configuration area
- Added scenario card grid
- Added participant name field
- Added exercise position/function selection
- Added jurisdiction selection
- Added difficulty selection
- Added scenario confirmation behavior
- Added launch flow into the live exercise

### Live Exercise Interface

- Built the primary live exercise environment
- Added scenario, role, jurisdiction, and difficulty header
- Added Community Lifeline status tracker
- Added ESF Activation Tracker
- Added flash cards / inject stream
- Added media feed
- Added current situation / inject panel
- Added user response area
- Added role-specific notepad
- Added situation map
- Added reference desk
- Added End Exercise flow

### AI Controller Behavior

- Refined the AI controller into a Deputy Emergency Manager voice
- Strengthened EOC-level role boundaries
- Reduced tactical Incident Command drift
- Added consequence-based simulation behavior
- Added stronger emphasis on incomplete information, operational friction, and realistic decision pressure
- Reinforced Community Lifelines, ESFs, public information, resource coordination, leadership support, continuity, and recovery

### Real Location Handling

- Rebuilt the location selection foundation
- Added real-world location behavior for prebuilt scenarios
- Reduced repeated default location behavior
- Added stronger guardrails against fictional jurisdictions
- Preserved user-provided real locations for custom scenarios

### AAR and Transcript Outputs

- Added After-Action Review PDF output
- Added Transcript PDF output
- Improved formatting for professional readability
- Preserved exercise interaction history for review
- Strengthened AAR usefulness by tying feedback to user decisions and exercise events

### Resource and Reference Support

- Added Resources modal
- Added Reference Desk in the live exercise interface
- Added platform Overview, User Guide, and Reference List documents
- Improved access to supporting guidance during exercises

### Build Custom Scenario

- Added Build Custom Scenario card to the Start Exercise scenario grid
- Added Custom Scenario Setup flow
- Added Exercise Preview before launch
- Added real-world location input
- Added event/hazard input
- Added situation description input
- Added exercise position/function selection
- Added difficulty selection
- Added training focus selection
- Preserved user-provided location, event, role, difficulty, and focus areas
- Kept the feature guided rather than turning it into a mission editor
- Added custom scenario card image using an EOC planning room with the NEXUS live exercise screen displayed on the wall

---

## Current Priorities

These are the priorities for the next phase of development.

### 1. Stabilize Build Custom Scenario

Build Custom Scenario is a major product enhancement and should be tested across realistic use cases before expanding it.

Focus areas:

- Confirm setup fields behave correctly
- Confirm preview content is useful and accurate
- Confirm real locations are preserved
- Confirm the launch flow carries custom scenario data into the live exercise
- Confirm the AI controller does not drift into tactical command
- Confirm the AAR reflects the custom scenario correctly
- Confirm training focus areas influence exercise pressure

Success standard:

The user can brief NEXUS in plain language and receive a guided EOC exercise that feels realistic, bounded, and useful.

---

### 2. Improve Custom Scenario Quality

Once the core flow is stable, improve the quality of generated custom exercises.

Potential enhancements:

- Better preview summaries
- Stronger role-specific exercise framing
- More visible training focus influence
- Better opening injects based on event type
- More realistic hazard-specific friction
- Better continuity/recovery pressure when selected
- Clearer public information and leadership pressure

Avoid:

- Full scenario-authoring complexity
- Excessive setup fields
- Tactical planning tools
- Overly detailed fake local facts

---

### 3. Strengthen AAR Value

The AAR is one of the most important product outputs.

Improvements should focus on making the AAR more specific, useful, and tied to the actual exercise.

Potential enhancements:

- Better decision timeline
- Clearer strengths and missed opportunities
- More specific Community Lifeline impacts
- Role-specific feedback
- Training focus feedback
- Recovery and continuity observations
- Recommended follow-up practice areas
- Cleaner executive summary section

Avoid:

- Fake numeric scores without meaning
- Generic praise
- Academic language
- Feedback that is not tied to the transcript

---

### 4. Continue Documentation Refresh

The documentation should match the product as it exists now.

Priority documents:

- `PRODUCT_PRINCIPLES.md`
- `README.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `VISION.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- `NEXUS_UI_SPEC_v1.0.md`
- `CONTRIBUTING.md`

The docs should be practical and useful for future development, not ceremonial.

---

### 5. Preserve Product Focus

Before adding new features, confirm they improve EOC decision training.

Near-term development should avoid drifting into:

- Tactical Incident Command simulation
- Law enforcement tactical planning
- Military mission planning
- GIS replacement behavior
- Full WebEOC-style incident management
- Complex authoring tools
- Dashboard clutter
- Features that look impressive but do not improve training

---

## Near-Term Backlog

These are practical next items after the current documentation refresh and Build Custom Scenario stabilization.

### Scenario and Exercise Improvements

- Add more realistic opening baselines for each prebuilt scenario
- Improve scenario-specific inject pacing
- Add more role-specific response pressure
- Add more public information consequences
- Add more resource coordination friction
- Add more leadership request injects
- Add more recovery transition moments

### Interface Improvements

- Review scenario card layout and spacing
- Improve mobile/tablet behavior where appropriate
- Tighten selected-card visual state
- Improve modal readability
- Review map panel visual hierarchy
- Improve end-exercise confirmation experience

### Reference and Resource Improvements

- Keep Overview, User Guide, and Reference List current
- Add scenario-relevant reference links where useful
- Improve Reference Desk organization
- Avoid overwhelming the user with too many links

### AAR / Transcript Improvements

- Improve PDF formatting consistency
- Add clearer section hierarchy
- Add better transcript readability
- Add role and training-focus metadata to outputs
- Add custom scenario details to output headers

---

## Medium-Term Opportunities

These items may add value after the current product foundation is stable.

### Facilitated Exercise Mode

A future facilitator mode could support classroom, agency, or group training.

Possible capabilities:

- Facilitator-controlled inject pacing
- Observer notes
- Group exercise setup
- Pause/resume exercise
- Facilitator-only scenario notes
- Exportable group AAR

Guardrail:

This should support EOC training, not become a complex exercise-control suite too early.

---

### Team / Multi-Role Exercise Support

Future versions may support multiple users playing different EOC roles.

Possible roles:

- EOC Director
- Public Information
- Planning / Situation Unit
- Operations Coordination
- Logistics / Resource Support
- ESF-specific coordinators

Guardrail:

Multi-role support should not be added until the single-player exercise loop is stable and commercially presentable.

---

### Organization Profiles

Future versions may allow organizations to configure recurring assumptions.

Possible profile elements:

- Jurisdiction type
- Primary hazards
- Common partners
- Local planning priorities
- Preferred training focus areas
- Continuity concerns

Guardrail:

Organization profiles should not fabricate local facts or create false authority. User-provided details should be clearly treated as user-provided context.

---

### Scenario Expansion

Potential future scenario areas:

- Extreme heat and mass gathering
- Public health emergency
- Long-duration power outage
- Water contamination
- Critical infrastructure cyberattack
- Port disruption
- Airport incident
- School district crisis coordination
- Sheltering and mass care surge
- Continuity of government / continuity of operations event

Scenario expansion should prioritize EOC-level complexity rather than dramatic visuals alone.

---

## Long-Term Opportunities

These are larger product directions that should wait until the core platform is stable.

### Commercial Licensing Model

Possible customer groups:

- Local emergency management agencies
- County and city EOCs
- State emergency management agencies
- Public safety training organizations
- Colleges and universities
- Healthcare emergency preparedness programs
- Utilities and critical infrastructure operators
- Continuity and resilience teams

This will require stronger packaging, pricing, onboarding, and training materials.

---

### Instructor / Curriculum Support

NEXUS EOC may eventually support structured training programs.

Possible capabilities:

- Instructor guides
- Exercise objectives
- Learning outcomes
- Scenario facilitation notes
- Student handouts
- Evaluation rubrics
- Module-based training paths

Guardrail:

Do not make the product feel academic at the expense of operational realism.

---

### Advanced AAR Analytics

Future AAR capabilities may include deeper analysis of decision patterns.

Possible capabilities:

- Decision timeline visualization
- Lifeline stabilization timeline
- Missed coordination opportunities
- Public information timing review
- Resource prioritization analysis
- Leadership briefing quality assessment

Guardrail:

Avoid fake precision. Analytics should be explainable and tied to exercise evidence.

---

### NEXUS Product Family

NEXUS EOC may eventually support related products or modules, such as remote sensing, continuity, or specialized response coordination training.

Any product expansion should preserve the NEXUS standard:

- Realistic professional training
- Decision pressure
- Clear operational roles
- Consequence-based simulation
- Useful after-action learning

---

## Parking Lot

These ideas may be useful later but should not distract from the current product foundation.

- Full scenario authoring suite
- Complex mission editor
- Fully custom map building
- Deep GIS integration
- Real-time multiplayer
- Credentialed user management
- LMS integration
- Agency-specific document upload
- Automated grading dashboard
- Marketplace of scenarios
- Voice-based exercise controller
- Live facilitator console

These should remain parked until the core product is stable, tested, and commercially coherent.

---

## Do Not Build Without Reconsideration

The following directions are high-risk for product drift:

- Tactical fireground command gameplay
- SWAT or law enforcement tactical scenarios
- Military operational planning workflows
- Fictional jurisdiction generators
- Game-style scoring without training meaning
- Overly complex dashboards
- Excessive setup options
- Features that replace the EOC decision loop instead of supporting it

These may look impressive but can weaken the product.

---

## Roadmap Standard

Before moving an item forward, ask:

1. Does it improve EOC decision training?
2. Does it preserve realistic role boundaries?
3. Does it strengthen scenario realism?
4. Does it improve consequence-based learning?
5. Does it improve the AAR or transcript value?
6. Does it keep the product commercially understandable?
7. Does it avoid unnecessary complexity?

If the answer is no, the item should stay parked, be redesigned, or be removed.
