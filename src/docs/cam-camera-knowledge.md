# CAM — Cinematic Camera Moves Knowledge Base

> Source article: "Essential Camera Controls and Movements in After Effects: A Motion Designer's Guide to Cinematic Animation" by MJ Behroozi (Medium, Nov 3, 2025)
> https://medium.com/@mj.behroozi/essential-camera-controls-and-movements-in-after-effects-a-motion-designers-guide-to-cinematic-af27f8f9f205
>
> **CAM is a new TTT store app.** Before building any feature, check `src/docs/new-app-checklist.md` — landing page FIRST (even with wallet connected), unique logo + hero, scoped theme, App Store listing, no overlapping UI, readable text.

---

## 1. Camera Types & Tools

- **1-Node Camera** — freeform movement in X/Y/Z. Great for broad sweeps and exploratory animations.
- **2-Node Camera** — adds a **Point of Interest (POI)**. Keeps the subject framed while you orbit or dolly. (Preferred for the CAM rig.)

**Toolbar (the C-key cycle):**
| Tool | Shortcut | Does |
|---|---|---|
| Unified Camera | C | Toggle between all three |
| Pan | C ×1 | Tilt/pan the view without moving the camera |
| Orbit | C ×2 | Rotate around the POI |
| Dolly | C ×3 | Move camera toward/away from the action |

## 2. Camera Specifications

- **Film Size** — virtual "sensor" width. Larger = wider field of view; smaller = more zoomed in.
- **Focal Length (mm)** — low (24mm) = wide-angle; high (100mm) = telephoto / cinematic close-ups.
- **Zoom vs Focal Length** — focal length is a fixed measurement; **zooming is transitioning between focal lengths**. AE's Zoom slider actually modifies focal length under the hood — the camera never physically moves.
  - Tip: for cinematic realism animate **Position Z together with Zoom** to mimic real lens compression.
- **Focus Distance** — where the lens sharpens focus. Essential for **rack focus** between foreground and background.
- **Angle of View (AoV) vs Field of View (FoV)** — AoV is the lens's angular coverage (derived from focal length + film size); FoV is what you actually see in pixels as the camera moves in the comp.
- **Depth of Field (DoF)** — simulates real lens blur; layers fall out of focus as they recede from the focus distance.
- **Aperture (f-stop)** — controls DoF. Low f-stop (f/1.8) = creamy bokeh; high f-stop (f/16) = deep focus.

## 3. What Affects Depth of Field (in order of impact)

1. **Aperture** — lower f-stop = shallower DoF (biggest factor).
2. **Focus Distance** — focusing close to the lens = shallower DoF; far = more of the scene sharp.
3. **Focal Length** — longer lenses (85mm) = shallower DoF; wider (18mm) = deeper (telephoto compresses the scene).
4. **Film (sensor) size** — larger sensor = shallower DoF (why full-frame looks "cinematic").

**Bonus:** use **Blur Level** (Camera Options) together with Aperture for cinematic blur, and animate Focus Distance for rack focus.

## 4. The Essential Camera Movements (CAM's core move set)

| Move | Real action | AE property | Feel |
|---|---|---|---|
| **Pan** | Rotate left/right (camera stays put) | Y Rotation | Scans landscapes |
| **Tilt** | Look up/down (camera stays put) | X Rotation | Reveals new information |
| **Roll** | Dutch tilt — twist sideways | Z Rotation | Disorientation, tension |
| **Dolly** | Move physically in/out | Z Position | Draws the viewer into the scene |
| **Zoom** | Change focal length (camera stays put) | Focal Length | Lens compression, scrutiny |
| **Dolly Zoom (Vertigo)** | Push in + zoom out (or vice versa) | Z Position + Focal Length | Warps reality, surreal dread |
| **Truck** | Move side-to-side (no rotation) | X Position (camera AND POI) | Follows alongside action |
| **Pedestal** | Move vertically up/down (no rotation) | Y Position (camera AND POI) | Towering / diminishing reveal |
| **Orbit** | Circle around the subject, looking inward | Fixed POI + move around it | Heroic, dimensional |
| **Crane (H/V)** | Pedestal + tilt/pan/forward move combined | Position + Rotation together | Dynamic combo sweeps |

Emotional weight: pans scan, dollies draw in, dolly zooms warp reality, a subtle handheld shake adds life and authenticity.

## 5. The Rig (drop into any project)

**Setup:**
1. Create a **2-Node Camera**; enable **Depth of Field**.
2. Add two 3D Nulls: an **Orbit Null** (parent the camera to it) and a **Camera Control** null (the slider hub).
3. Parenting: `Camera → Orbit Null`, Orbit Null stays at the comp center.
4. On Camera Control: Effect → Expression Controls → **Slider Control** ×10 — Pan, Tilt, Roll, Dolly, Zoom (Focal Length), Truck, Pedestal, Vertical Crane, Horizontal Crane, Orbit.

**Expressions:**

```javascript
// Orbit — Orbit Null > Y Rotation
thisComp.layer("Camera Control").effect("Orbit")("Slider")

// Pan — Camera > Y Rotation
thisComp.layer("Camera Control").effect("Pan")("Slider")

// Tilt — Camera > X Rotation
thisComp.layer("Camera Control").effect("Tilt")("Slider")

// Roll — Camera > Z Rotation
thisComp.layer("Camera Control").effect("Roll")("Slider")

// Dolly — Camera > Position (Z relative to orbit null; keeps parenting intact)
camPos = [0, 0, 0];
dolly = thisComp.layer("Camera Control").effect("Dolly")("Slider");
[camPos[0], camPos[1], camPos[2] + dolly]

// Truck — Orbit Null > X Position
value + thisComp.layer("Camera Control").effect("Truck")("Slider");

// Pedestal — Orbit Null > Y Position
value + thisComp.layer("Camera Control").effect("Pedestal")("Slider");

// Zoom — Camera > Zoom
thisComp.layer("Camera Control").effect("Zoom")("Slider")

// Dolly Zoom (Vertigo) — animate BOTH:
//   Dolly: 0 → -1000  while  Zoom: 50mm → 150mm (or reverse)

// Crane shots — Camera > Position (blend with dolly)
camPos = [0, 0, 0];
dolly  = thisComp.layer("Camera Control").effect("Dolly")("Slider");
Cranex = thisComp.layer("Camera Control").effect("Horizontal Crane Shot")("Slider");
Craney = thisComp.layer("Camera Control").effect("Vertical Crane Shot")("Slider");
[camPos[0] + Cranex, camPos[1] + Craney, camPos[2] + dolly]
```

## 6. CAM implementation notes (for building the app)

- Model the camera as: position (x, y, z), rotation (pan/tilt/roll), focal length, focus distance, aperture — matching the spec above so moves translate 1:1.
- Each of the 10 movements maps to a preset that animates one or two of those parameters — exactly the rig above.
- Dolly Zoom = inverse Z-position + focal-length curves; Crane = combined position axes.
- Pair every move with the emotion it carries when generating presets/shot lists (dolly = draw in, roll = tension, vertigo = surreal).