# EVOLVE Territory Visualization — Design Reference

Inspired by [Territorial.io](https://territorial.io). Adapted for EVOLVE's
persistent, economy-driven civilization simulation on real Earth geography.

---

## Core principle: territory is the map, not a marker

EVOLVE today renders actors as dots on Earth. The goal is for an actor's
**controlled land** to render as a contiguous shape composed of the real
EVOLVE geographic cells it owns — not a colored circle pasted over a dot.

```
Today:        AI ●

Target:       AI ● → claims local cell → develops neighbors → contiguous shape
```

Territory should **emerge from the economy**, not from clicking land:

```
earn → acquire resources → build infrastructure → establish presence
     → claim/use cells → expand economic reach → cooperate/compete
     → organizations emerge
```

Conflict is only **one** mechanism for territory changing hands.

---

## Frontier expansion (the visual idea to steal)

When an actor claims a new adjacent cell, **don't instantly recolor a distant
square**. Animate the frontier advancing from already-controlled territory into
the neighboring cell:

```
▓▓▓▓▒▒░
```

The boundary pushes outward. Conquest/claim speed can change at territory-size
thresholds (Territorial.io does this), but in EVOLVE the speed should be gated
by **economic capacity** (compute, energy, capital), not a war timer.

---

## Inspector (clicking an actor dot)

Clicking a cyan AI dot should produce a map-first card:

```
AI #001
10.00 tKAS

CONTROLLED AREA
14 cells

INFRASTRUCTURE
3 compute · 2 energy

STATUS
EXPANDING

CURRENT ACTION
Acquiring G4239...
```

The actor's territory is visibly outlined on Earth underneath the card.

---

## Zoom-dependent hierarchy

Territorial.io keeps usernames/balance visible over controlled territory so you
can judge surrounding powers directly from the map. EVOLVE's equivalent:

| Zoom level        | What renders                                   |
|-------------------|------------------------------------------------|
| Far               | Organization territories (unified polygons)    |
| Medium            | Organization + independent actor territories  |
| Close             | Individual cells + agents                      |
| Very close        | Infrastructure/assets on cells                 |

An independent AI has a small cyan territory. Five cooperating AIs form an
organization, and their cells become one visually unified organization
territory while retaining individual ownership data underneath.

---

## Claim lifecycle (engine-level)

```
AI owns cell A
  ↓
AI evaluates neighboring cells (economic reason to expand)
  ↓
MOVE / BUILD / ACQUIRE / SETTLE / CLAIM
  ↓
World Engine checks: cost + resources + accessibility + existing ownership
  ↓
claim begins
  ↓
border visually advances into the neighboring geographic cell
  ↓
cell becomes controlled
  ↓
organization/player territory polygon updates
```

Expansion should usually happen because an actor has an **economic reason** to
occupy that area — not simply because clicking land makes you bigger.

---

## What we do NOT copy from Territorial.io

Territorial.io revolves around conquest: balance is simultaneously economic and
military strength, and attacking is the central way territory changes hands.

**EVOLVE is not Territorial.io with AI dots.** Territory emerges from the
EVOLVE economy. Simulated conflict is only one possible mechanism for territory
changing hands, alongside trade, cooperation, contracts, and organization
formation.

---

## Implementation notes (for future work)

- Territory shape = union of controlled geographic cells (GeoJSON polygon per
  actor/org), rendered as a MapLibre fill+outline layer.
- Frontier animation = interpolate fill-opacity / a progress mask from the
  source cell edge into the target cell over the claim duration.
- Zoom hierarchy = switch layer visibility by zoom band (already partially
  done with `CELL_MIN_ZOOM`).
- The engine already tracks `world.owner[]` and `world.orgSlots[]` per cell —
  territory polygons derive directly from these arrays.
- Actor inspector already shows economy; add CONTROLLED AREA count + CURRENT
  ACTION (from the active claim/expand step).