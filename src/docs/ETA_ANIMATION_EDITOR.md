# ETA — Enhanced Timeline Animator

**ATE: Automated Timeline Experience**

ETA is an original AI-directed animation editor for turning a product brief, optional product link, and visual references into a planned sequence of editable motion-graphics scenes. This document defines ETA's own editor model and terminology.

## Workflow

1. Understand the product from its brief, audience, link, and screenshots.
2. Create the narrative, pacing, voiceover, and ordered scene plan.
3. Assign an ETA component and motion direction to every scene.
4. Generate scene assets, device presentations, typography, and audio cues.
5. Let the user refine scenes while ETA manages animation values and rendering.

## Scene controls

Each timeline item is a scene. A selected scene supports **Recompile**, **Edit scene**, **Delete clip**, and **Match transition**. A scene contains a primary component, content, styling, animation behavior, keyframes, and entrance/exit logic.

## Component library

| Component | Purpose |
|---|---|
| `TitleCard` | Opening or section headline |
| `NumberDisplay` | Statistics, counters, KPIs, and numbered steps |
| `Glass` | Translucent visual panel |
| `BrowserWindow` | Browser mockup with zoom and cursor choreography |
| `PhoneWindow` | Mobile application window |
| `Cards`–`Cards4` | Feature and benefit card systems |
| `IPhoneAnimated` | Animated phone presentation |
| `MacBookAnimated` | Animated laptop presentation |
| `DivMorph` | Container and layout morphing |
| `SearchAnimation` | Search-interface motion |
| `LogoAnimation` | Brand reveal and outro |
| `UIAnimation` | General interface animation |
| `Video` | Imported video media |

## Text system

Text properties include content, font size, family, weight, three color stops, gradient animation, glow, glow color, intensity, dissolve duration, and theme reset. Supported families include SF Pro Display, Inter, PT Sans, Montserrat, and Poppins.

### Text motion presets

`SplitText`, `TextType`, `RotatingText`, `FadeUpWords`, `SpringScaleText`, `AnchorSpring`, `FlyWords`, `MotionTextAnimation`, `StaggeredRevealText`, `SlideScaleWord`, `WordScaleSequence`, and `StaticSentences`.

Timing controls include speed, slide speed, start offset, end offset, and typography settings. Easing options include linear, ease-in, ease-out, ease-in-out, and custom curves.

## Match transitions

A match transition links the current scene's outgoing movement to the next scene's entrance. Directions include left, right, up, down, zoom in, and zoom out.

Outgoing controls: duration, slide distance, drift amount, final drift duration, drift curve, and easing graph.

Incoming controls: proportional timing, duration, slide distance, starting opacity, starting scale, easing graph, and inherited movement from the previous scene.

## BrowserWindow

Browser settings include content URL, rotation amplitude, animation speed, X/Y/Z rotation, start offset, motion and zoom, appearance, browser shell, and animated border.

### Browser keyframes

Browser keyframes store position, rotation, scale, and other component values at exact scene times. A small number of intentional keyframes should establish the reveal, presentation angle, feature focus, and transition preparation.

### Zoom keyframes

Zoom keyframes include time, selector, X/Y coordinates, scale, duration, and easing. A CSS selector can target a product element; coordinate targeting can frame content manually. Empty targeting can restore the full view.

### Cursor steps

Cursor steps include start time, target selector, movement duration, and optional click. They transform a static interface into a guided product walkthrough.

### Browser styling and overlays

Browser styling includes background, shadow, pill colors, and typing speed. Overlay text supports font controls, color, z-index, horizontal position, and keyframes for position, opacity, and scale. Background images or video can sit behind UI content.

## Keyframe model

A component has properties. A keyframe stores selected property values at a specific time. ETA interpolates between those values using the selected easing curve. Properties may include position, X/Y/Z rotation, scale, opacity, zoom target, zoom duration, cursor timing, text motion, and scene entrance/exit.

## Recommended scene workflow

1. Choose the component.
2. Add the main content.
3. Set visual style and typography.
4. Choose text motion.
5. Establish device or component movement.
6. Add zoom targets.
7. Add cursor choreography where useful.
8. Time overlay text.
9. Link the transition to the next scene.
10. Recompile the scene.

## SaaS launch sequence

1. `TitleCard` — pain-point hook.
2. `BrowserWindow` or `IPhoneAnimated` — product reveal.
3. `BrowserWindow` — first feature focus.
4. `Cards` — benefits.
5. `BrowserWindow` — guided workflow.
6. `NumberDisplay` — measurable outcome.
7. `LogoAnimation` — brand and call to action.

Every cut should preserve directional logic so the finished animation feels like one continuous visual journey rather than isolated slides.