---
name: roblox-user-interfaces
description: "Every Roblox GUI container and building block — ScreenGui, SurfaceGui, BillboardGui, CanvasGroup, ScrollingFrame, ViewportFrame, plus layouts and modifiers (UIListLayout, UIGridLayout, UIStroke, UIGradient, UICorner, constraints). Covers positioning, scale vs offset, AnchorPoint, clipping, AutomaticSize, responsive design, interaction, drag detectors, and particle-like VFX inside 2D UI. Use for any HUD, menu, or interface work."
last_reviewed: 2026-06-17
---

# roblox-user-interfaces

Roblox UI is one of the most powerful and also one of the most commonly poorly-implemented areas. This skill gives precise, up-to-date knowledge of the full hierarchy, properties that actually matter for production (especially cross-device), layout systems that replace manual positioning, and the creative techniques for "particle-like" or VFX behavior inside 2D UI without using the 3D ParticleEmitter directly in ScreenGui.

**Primary sources:**
- https://create.roblox.com/docs/en-us/ui
- https://create.roblox.com/docs/en-us/ui/on-screen-containers
- https://create.roblox.com/docs/en-us/ui/in-experience-containers
- Sub guides for frames, labels, buttons, text-input, position-and-size, list-flex-layouts, grid-table-layouts, appearance-modifiers, styling, proximity-prompts, ui-drag-detectors, etc.
- roblox-animation skill (for motion on these objects)
- Engine classes: ScreenGui, SurfaceGui, BillboardGui, GuiObject and all descendants, the various UI*Layout and UI*Constraint classes, CanvasGroup, ViewportFrame, etc.

**How this skill is organized:**
- SKILL.md: decision frameworks, core patterns, responsive design rules, interaction model, "particles in UI" overview, checklists, and pointers to granular references/.
- references/: deep files for containers (gui-containers.md covers building blocks, layouts, positioning) and particles-in-ui.md.
- scripts/: UIParticlePool.lua for 2D HUD/reward particle bursts. Add other client utilities as needed.

Always cross-reference the roblox-animation skill for motion on these objects and roblox-vfx when embedding 3D effects.

## Container Types — When to Use Each

**ScreenGui (on-screen overlay)**
- Parent to StarterGui for automatic cloning into every player's PlayerGui.
- Control visibility with .Enabled (or parent/child manipulation).
- Layer multiple with .DisplayOrder (higher = on top).
- .ScreenInsets = CoreUISafeInsets (default, respects top bar + device notches), DeviceSafeInsets, TopbarSafeInsets, or None.
- .ResetOnSpawn behavior depends on direct ancestry of StarterGui.
- All interaction and logic is client-only (LocalScripts or client ModuleScripts).

**SurfaceGui (world space on a part face)**
- Can be parented directly to a BasePart (then uses .Face) or placed in StarterGui/PlayerGui and pointed at a part via .Adornee.
- Interactive buttons only receive input if the SurfaceGui ultimately lives under the viewing player's PlayerGui and the part's CanQuery is true.
- .AlwaysOnTop, .Brightness (0-1000), .LightInfluence (0-1), .MaxDistance, .ZOffset (for sorting multiple on the same face).
- Excellent for terminals, vehicle dashboards, keypads, signs.

**BillboardGui (world space, always camera-facing)**
- Similar properties to SurfaceGui + `.StudsOffset` (offset relative to camera orientation) and `.StudsOffsetWorldSpace` (offset in world axes). Size expressed in studs via the scale components of Size (e.g. UDim2.fromScale(4, 2) creates a 4×2 stud billboard whose screen size changes with distance).
- Perfect for nameplates, floating health bars, quest markers, damage numbers, contextual prompts above heads or objects.
- Interactive elements require the same PlayerGui ancestry rule as SurfaceGui **and** `BillboardGui.Active = true` (plus the button's own `Active`).

**Other / special:**
- CoreGui (Roblox-owned; control with StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.XXX, false)).
- ViewportFrame (embed a 3D camera + world inside a 2D rectangle — great for item previews and static 3D models; real ParticleEmitter, Beam, and Trail effects do not render here).

## Building Blocks & Layout System (stop positioning manually)

The vast majority of modern Roblox UIs are built from:
- **Frame** or **CanvasGroup** as containers (ClipsDescendants, AutomaticSize = X/Y/XY, Background* properties, Rotation).
- **TextLabel / ImageLabel** for display.
- **TextButton / ImageButton** for interaction (Activated is the preferred cross-platform event).
- **TextBox** for input.
- **ScrollingFrame** (CanvasSize, AutomaticCanvasSize, ScrollBar* properties).
- **ViewportFrame** for 3D content.

**Layout objects (the real power):**
- UIListLayout / UIGridLayout / UIPageLayout — automatic arrangement, FillDirection, Horizontal/VerticalAlignment, Padding, SortOrder. `UIListLayout` also supports flex features (`HorizontalFlex`, `VerticalFlex`, `ItemLineAlignment`, `Wraps`) and pairs with per-object `UIFlexItem` for flex overrides.
- These + AutomaticSize on parents = truly responsive UIs that grow/shrink with content or different languages.

**Appearance & constraint modifiers (use these instead of old hacks):**
- UIStroke (ApplyStrokeMode, Color, Enabled, LineJoinMode, Thickness, Transparency, ZIndex) — modern borders that work on any GuiObject.
- UIGradient (ColorSequence or TransparencySequence on backgrounds or images).
- UICorner (CornerRadius — much better than 9-slice hacks for rounded rectangles).
- UIPadding, UISizeConstraint, UIAspectRatioConstraint, UIScale, UIFlexItem.

**Positioning fundamentals (non-negotiable for quality):**
- Prefer Scale (0-1) over Offset (pixels) for almost everything.
- AnchorPoint controls the pivot point of the object (0,0 = top-left; 0.5,0.5 = center — set this before tweening Position or Size).
- ZIndex for layering inside one container; DisplayOrder for layering whole ScreenGuis.
- For world-space: StudsOffset on BillboardGui, ZOffset + AlwaysOnTop on both Surface and Billboard.

See references/gui-containers.md for exhaustive property tables, common hierarchies, and responsive recipes (building blocks & layouts covered there).

## Interaction Model

- Buttons: Prefer .Activated (fires on release, works for mouse, touch, gamepad).
- MouseButton1Click / MouseButton1Down etc. still exist but are less ideal for cross-platform.
- TextBox has FocusLost, Focused, ReturnPressedFromOnScreenKeyboard, etc.
- Newer: UI drag detectors (2D) and 3D drag detectors for sliders, spinners, draggable objects, doors, etc.
- ProximityPrompt for 3D world "press E to interact" style prompts (separate but often paired with UI).

Control default Roblox UI with `StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false)` etc. Hide virtual controls with `GuiService.TouchControlsEnabled = false` when you provide custom input.

## "Particles in the UI" (dedicated deep coverage)

Direct ParticleEmitter lives in the 3D world (parent to Part or Attachment). For 2D UI you have several excellent options:

1. **Scripted 2D particle pools** — tables of ImageLabels (or a single CanvasGroup with many small children). Use TweenService for Position (in scale or local), Size, Transparency, Rotation, Color. Pool and recycle instances. Great for confetti, sparks, floating numbers, reward bursts, hit markers.
2. **ViewportFrame embedding** — place a ViewportFrame inside your ScreenGui. Inside, put 3D parts, meshes, cameras, and small rigs. Real `ParticleEmitter`, `Beam`, `Trail`, and `Light` objects do **not** render inside ViewportFrames. Tween the ViewportFrame's own properties or the camera / parts inside. This is how many 3D ability previews or glowing item inspectors are done.
3. **CanvasGroup + rapid tweens** — for group "pop", shimmer, or dissolve effects.
4. **UIStroke + UIGradient animated** — energy borders, charging effects, animated lines.
5. **Text + MaxVisibleGraphemes** combined with small image "particles" for fancy dialogue or title sequences.

Performance reality: Transparent overdraw and fill-rate are the enemy on mobile. Keep concurrent UI "particles" low, reuse instances aggressively, use smaller textures, and test at low graphics quality.

See the dedicated references/particles-in-ui.md for concrete pool implementations, ViewportFrame setup patterns, integration with 3D markers, and performance guardrails.

## Responsive & Professional Patterns

- Design in a canonical resolution/aspect (e.g. 1920x1080 or a common mobile one) but implement everything in scale + constraints.
- Use UIListLayout + AutomaticSize + Padding for rows/columns instead of manually calculating positions.
- For different device classes, either use multiple ScreenGui variants toggled by UserInputService or make one layout that flexes via the layout objects + size modifiers.
- Universal styling (Style Editor + StyleRules) is the Roblox equivalent of CSS — use it for consistent colors, strokes, fonts, and even transitions across many UI pieces.

## Core Checklists

**New ScreenGui:**
- [ ] Correct ScreenInsets for the content (interactive → CoreUISafeInsets).
- [ ] DisplayOrder set if it needs to appear above/below other layers.
- [ ] ResetOnSpawn behavior understood and intentional.
- [ ] All children use scale + AnchorPoint + constraints.

**New interactive element:**
- [ ] Button uses Activated.
- [ ] If world-space, the ancestry rule for input is satisfied (PlayerGui) and CanQuery is true on the part.
- [ ] Visual feedback via hover/press states (tweens or state changes on the button itself or a sibling highlight).

**Particles / VFX in UI:**
- [ ] Instance pooling / recycling.
- [ ] Limited concurrent count.
- [ ] Tested at lowest graphics quality.
- [ ] Tied to meaningful gameplay moments (via markers from the animation skill or UI events).

This skill + roblox-animation + roblox-vfx will let you build interfaces that feel alive and integrated with the 3D world rather than bolted-on 2D afterthoughts.

For the definitive list of every property and the latest additions (new layouts, drag detectors, styling features), consult the Engine API reference at https://create.roblox.com/docs/reference/engine.

<!-- catalog:references:start -->
## Reference index

- [gui-containers.md](references/gui-containers.md)
- [particles-in-ui.md](references/particles-in-ui.md)
<!-- catalog:references:end -->
