# Fur-Labs UI Design Prompt

## Overview

Design a complete UI system for **Fur-Labs** - a multiplayer web game where players collaboratively create fursonas (anthropomorphic characters) by drawing different body parts without seeing each other's work, then an AI combines them into cohesive characters.

**Theme:** Playful biotech laboratory meets creative art studio. Think "mad scientist meets furry artist" - bubbling test tubes, DNA helixes, petri dishes, but with a colorful, friendly, and whimsical aesthetic. NOT clinical or sterile - warm, inviting, and fun.

**Vibe:** Gartic Phone meets Portal's Aperture Science meets Cartoon Network. Accessible to all ages, playful animations, satisfying micro-interactions.

---

## Design Requirements

### Color Palette
- **Primary:** Vibrant pink/magenta (creative energy)
- **Secondary:** Electric cyan/teal (scientific/tech feel)
- **Accent:** Warm orange or gold (highlights, CTAs)
- **Background:** Deep purple/indigo gradients (mysterious lab atmosphere)
- **Success:** Bright green (bioluminescent)
- **Warning:** Amber/yellow
- **Error:** Coral red
- **Neutrals:** Cool grays with slight purple tint

### Typography
- **Headings:** Rounded, friendly, bold (like Fredoka, Nunito, or similar)
- **Body:** Clean, readable sans-serif
- **Monospace:** For invite codes (scientific/terminal feel)

### Visual Elements
- Subtle animated backgrounds (floating DNA strands, bubbles, particles)
- Glassmorphism panels with soft glows
- Rounded corners throughout (friendly feel)
- Soft shadows with colored tints
- Icon style: Filled, rounded, playful
- Subtle gradients on buttons and accents

### Animations & Micro-interactions
- Smooth page transitions (slide/fade)
- Button hover: gentle scale + glow
- Loading states: pulsing, spinning lab equipment
- Success feedback: confetti, sparkles, or "experiment complete" effects
- Toast notifications: slide in from corner with bounce

---

## Screen Specifications

### 1. Title Screen (Home)

**Purpose:** Welcome players, set the mood, provide main navigation

**Components:**
- **Logo/Title:** "Fur-Labs" with animated laboratory styling
  - Could have bubbling test tubes as letter stems
  - DNA helix integrated into typography
  - Subtle pulsing glow effect
- **Tagline:** "Collaborative Fursona Creator" or "Create Together. Reveal the Unexpected."
- **Main Menu Buttons:**
  - "Create Lobby" (Primary CTA - most prominent)
  - "Join Lobby" (Secondary)
  - "Gallery" (Secondary)
- **Background:** Animated lab environment with floating elements
- **Version number:** Small, bottom corner

**States:**
- Default idle with ambient animations
- Button hover states with glow/scale effects

---

### 2. Create Lobby Screen

**Purpose:** Host configures new game session

**Components:**
- **Header:** "Initialize Experiment" or "Create Lab Session"
- **Form Panel:** Glassmorphism card
  - **Name Input:** "Scientist Name" with icon (lab coat, goggles)
  - **Time Selector:** "Experiment Duration"
    - Slider or preset buttons (60s, 120s, 180s, 300s)
    - Visual timer representation (filling test tube?)
- **Buttons:**
  - "Back" (secondary, left)
  - "Create Lab" (primary, right)

**Visual Notes:**
- Form feels like configuring lab equipment
- Inputs could have subtle "digital readout" styling

---

### 3. Join Lobby Screen

**Purpose:** Player enters existing game

**Components:**
- **Header:** "Join Experiment" or "Enter Lab Code"
- **Form Panel:**
  - **Name Input:** Same styling as create screen
  - **Invite Code Input:**
    - 6-character input with monospace font
    - Individual character boxes (like verification codes)
    - Auto-uppercase, visual feedback on valid input
- **Buttons:**
  - "Back" (secondary)
  - "Join Lab" (primary)

**Visual Notes:**
- Code input feels like entering secure lab access code
- Could have "scanning" animation on input

---

### 4. Waiting Room Screen

**Purpose:** Players gather before game starts

**Components:**
- **Invite Code Display:**
  - Large, prominent code with monospace styling
  - "Copy" button with clipboard icon
  - Success feedback: "Copied!" with checkmark
  - Could look like a specimen label or lab ID badge
- **Players List:**
  - Each player shown as a "test subject" card
  - Avatar placeholder (could be random lab icons: beaker, flask, microscope)
  - Name display
  - Ready status indicator (green checkmark or "DNA strand" filling up)
  - Host badge (crown or "Lead Scientist" label)
  - "(quit)" badge styling for disconnected players
- **Ready Toggle:**
  - Large, satisfying checkbox or switch
  - "Ready for Experiment" label
  - Animation when toggled (could fill a progress element)
- **Action Buttons:**
  - "Leave Lab" (secondary/destructive)
  - "Begin Experiment" (primary, host only, disabled until all ready)

**Visual Notes:**
- Players arranged like specimens in a display case
- Ambient "waiting" animation (bubbling, pulsing)
- Clear visual when all players are ready (room "activates")

---

### 5. Style Selection Screen

**Purpose:** Player chooses art style and background for their fursona

**Components:**
- **Header:** "Configure Your Creation" or "Set Lab Parameters"
- **Art Style Section:**
  - Grid of style option cards
  - Each card has: Icon/preview, Style name
  - Options: Cartoon, Pixel Art, Anime, Watercolor, Sketch, Cell-Shaded
  - Selected state: Prominent border, glow, checkmark
  - Custom input field below: "Or type your own..."
- **Background Section:**
  - Same grid layout
  - Options: Gradient, Beach, Forest, Space, City, Moon, Party, Cozy Room
  - Icons representing each scene
  - Custom input field
- **Confirm Button:** "Begin Creation!" or "Start Experiment!"

**Visual Notes:**
- Options feel like selecting lab parameters
- Could have "mixing" or "combining" visual metaphor
- Playful icons for each option

---

### 6. Drawing Screen (Main Gameplay)

**Purpose:** Where players draw their assigned body part

**Layout:** Two-column on desktop (sidebar + canvas), stacked on mobile

**Components:**

#### Player Sidebar:
- **Header:** "Lab Participants"
- **Player List:**
  - Each player with submission status
  - Submitted: Checkmark, green glow, "Sample Collected"
  - Waiting: Pulsing indicator, "In Progress..."
  - Quit: Grayed out with "(quit)" badge
- **Waiting Indicator:** Spinner + "Awaiting submissions..."

#### Drawing Header:
- **Part Label:**
  - "Draw the HEAD" / "Draw the TORSO" / "Draw the LEGS"
  - Round indicator: "Round 1 of 3"
  - Could show whose fursona you're drawing for
- **Timer:**
  - Large, prominent countdown
  - Visual states: Normal (cyan), Warning <30s (amber), Danger <10s (red pulse)
  - Could be styled as lab timer/digital readout

#### Canvas Area:
- **Canvas:** 800x400 internal, responsive display
- **Hint Overlays:**
  - Top hint zone (for torso/legs): Shows previous artist's edge
  - Bottom hint zone: Dashed border showing "Hint Zone - draw here for next artist"
  - Subtle, non-intrusive styling

#### Tool Palette:
- **Drawing Tools:** (Icon + Label)
  - Brush (default)
  - Eraser
  - Fill/Paint Bucket
  - Color Picker/Pipette
- **Color Section:**
  - Color wheel/picker input
  - Preset color grid (20 colors in 5x4 or 4x5)
    - Basic: Black, White, Grays
    - Primary/Secondary: RGB, Yellow
    - Warm: Coral, Orange, Gold, Salmon
    - Cool: Teal, Mint, Lavender, Purple
    - Fur tones: Browns, Tan, Peach
- **Brush Size:**
  - Slider with value display
  - Visual preview of brush size
- **Actions:**
  - Undo button
  - Clear button (with confirmation?)
- **Submit Button:**
  - Large, prominent: "Submit Sample" or "Complete!"
  - Disabled state when already submitted

**Visual Notes:**
- Canvas area should feel like a digital petri dish or specimen slide
- Tools feel like lab instruments
- Clean, focused interface during drawing

---

### 7. Reveal Screen (Results)

**Purpose:** Dramatic reveal of combined fursonas

**Layout:** Sidebar + main reveal area

**Components:**

#### Fursona Sidebar:
- **Header:** "Lab Results" or "Specimens"
- **Player/Fursona List:**
  - Each player's fursona as clickable item
  - Shows owner name
  - Indicates if AI version is ready (loading/complete)
  - Active/selected state

#### Reveal Header:
- **Title:** "[Player]'s Fursona"
- **Zoom Controls:** 50% / 100% toggle buttons

#### Parts Reveal Section:
- **Individual Part Cards:**
  - HEAD, TORSO, LEGS revealed sequentially
  - Each card shows:
    - Part label
    - Drawing image
    - "Drawn by: [Artist Name]" credit
    - "(quit)" badge if artist left
  - Animated entrance (slide up, fade in)
- **Click-to-Reveal Overlay:**
  - "Click to Reveal!" prompt
  - Blurred/hidden parts behind overlay
  - Satisfying reveal animation

#### Combined View:
- **Stitched Canvas:**
  - All three parts vertically combined (800x1200)
  - "Raw" drawing result
- **Download Button:** "Download Drawing"

#### AI Lab Section:
- **Divider:** "✧ The Lab ✧" with decorative elements
- **States:**
  - **Placeholder:** "Generate in Lab!" button + "Auto-generating..." note
  - **Loading:** Animated spinner + "Creating in the Lab..." + progress hints
  - **Complete:**
    - AI-generated image display
    - Style info: "Style: [X] | Background: [Y]"
    - "Download Lab Version" button
    - "Save Both to Gallery" button

#### New Game Section:
- **Button:** "New Experiment" or "Play Again"

**Visual Notes:**
- Reveal should feel dramatic and exciting
- AI section feels like "the final experiment result"
- Celebration animations when AI completes

---

### 8. Gallery Screen

**Purpose:** Browse saved fursonas

**Components:**
- **Header:**
  - "Specimen Archive" or "Fursona Gallery"
  - Back button
- **Gallery Grid:**
  - Card-based layout, responsive columns
  - Each card shows:
    - Thumbnail (raw or AI version)
    - Hover: subtle zoom/glow
    - Click: open detail modal
- **Loading State:** Spinner + "Loading specimens..."
- **Empty State:** "No specimens yet! Create one in a game."
- **Pagination:**
  - Previous/Next buttons
  - Page indicator

---

### 9. Gallery Detail Modal

**Purpose:** View individual fursona in detail

**Components:**
- **Close Button:** X in corner
- **Tab Switcher:** "Raw" / "Lab Version" tabs
- **Image Display:** Large view of selected version
- **Actions:** "Download" button
- **Backdrop:** Dimmed background, click to close

---

### 10. Toast Notifications

**Purpose:** Feedback messages

**Types:**
- **Success:** Green, checkmark icon (e.g., "Copied!", "Saved!")
- **Error:** Red, X icon (e.g., "Connection lost")
- **Info:** Blue/cyan, info icon (e.g., "Player joined")
- **Warning:** Amber, warning icon (e.g., "30 seconds remaining!")

**Behavior:**
- Slide in from top-right or bottom-center
- Auto-dismiss after 3-5 seconds
- Stack multiple notifications

---

## Responsive Breakpoints

### Desktop (900px+)
- Two-column layouts (sidebar + main)
- Full tool palette visible
- Larger canvas display

### Tablet (600-900px)
- Sidebar moves below main content
- Tool palette wraps
- Canvas takes full width

### Mobile (<600px)
- Single column, stacked layout
- Larger touch targets (min 44px)
- Simplified tool arrangement
- Canvas fills viewport width
- Collapsible sections where appropriate

---

## Accessibility Requirements

- Minimum contrast ratios (WCAG AA)
- Focus states for all interactive elements
- Keyboard navigation support
- Screen reader labels for icons
- Reduced motion option for animations
- Color not sole indicator of state (use icons/labels too)

---

## Interactive States Reference

### Buttons
- **Default:** Base styling
- **Hover:** Scale up slightly, glow effect
- **Active/Pressed:** Scale down, darker
- **Disabled:** Reduced opacity, no interactions
- **Loading:** Spinner inside, disabled

### Inputs
- **Default:** Subtle border
- **Focus:** Highlighted border, glow
- **Error:** Red border, error message below
- **Valid:** Green checkmark (optional)

### Cards/Panels
- **Default:** Glass effect, soft shadow
- **Hover:** Lift up, enhanced shadow
- **Selected/Active:** Accent border, glow

### Player Items
- **Ready:** Green indicator, checkmark
- **Not Ready:** Gray/muted
- **Submitted:** Green checkmark, "complete" styling
- **In Progress:** Pulsing indicator
- **Quit/Disconnected:** Grayed out, "(quit)" badge

---

## Animation Guidelines

### Timing
- Micro-interactions: 150-200ms
- Page transitions: 300-400ms
- Reveals/celebrations: 500-800ms

### Easing
- UI elements: ease-out or cubic-bezier for snappy feel
- Ambient animations: ease-in-out for smooth loops

### Key Animations
1. **Page transitions:** Slide + fade between screens
2. **Button press:** Quick scale bounce
3. **Part reveal:** Slide up + fade in, staggered timing
4. **AI complete:** Celebration effect (particles, glow burst)
5. **Timer warning:** Pulse animation
6. **Canvas submit:** "Whoosh" or "collected" effect

---

## Summary

Create a cohesive design system that makes players feel like playful scientists creating unique specimens together. The UI should be:

- **Inviting:** Warm colors, friendly shapes, approachable
- **Exciting:** Dramatic reveals, satisfying animations
- **Clear:** Obvious actions, clear states, intuitive flow
- **Themed:** Consistent lab/biotech aesthetic without being clinical
- **Fun:** Delightful micro-interactions, playful copy, celebratory moments

The game should feel like a party game you'd play with friends - easy to understand, fun to play, and exciting to see results.
