## Landing Intake Screen Concept

- Single full-height view with soft gray background (`bg-slate-100`) and one central white card (`max-w-3xl`, rounded corners, subtle shadow).
- The card holds:
  - Compact header with logo placeholder and product name “eviCore Intake Assistant”.
  - Two-tab input surface: default tab “Doctor’s Note” and secondary “Referral Note”; both share a minimal bordered textarea with large font and generous padding.
  - Helper text row beneath the textarea with optional upload link (future use).
  - Primary action row centered under the input:
    - Filled button `Generate eviCore Form` (teal/brand color).
    - Outlined button `View Tasks`.
- Buttons appear side-by-side on desktop and stack on small screens.
- Footer microcopy with reassurance: “Secure, HIPAA-compliant workspace.”

Interaction Outline:

- On page load, focus the textarea inviting paste/typing.
- Pressing Enter inside the surface doesn’t submit; user must click buttons.
- Clicking `Generate eviCore Form` transitions (fade/slide) into the full workflow layout with sidebar, top bar, and pre-populated note content.
- `View Tasks` bypasses generation and jumps directly into the Denials & AR queue while storing the note text for later use.

Visual Tone:

- Mirrors Google’s simplicity: abundant white space, single-eyeful interface, barely-there borders (`border-slate-200`), and light drop shadows.
- Typography leans on Tailwind defaults with semi-bold headings, 1.1rem body text, and muted helper copy.
