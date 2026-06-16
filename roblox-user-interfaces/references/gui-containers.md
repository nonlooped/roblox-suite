# GUI Containers (ScreenGui, CanvasGroup, SurfaceGui, BillboardGui, ScrollingFrame, ViewportFrame)

Full details from the Roblox docs for [on-screen containers](https://create.roblox.com/docs/en-us/ui/on-screen-containers) and [in-experience containers](https://create.roblox.com/docs/en-us/ui/in-experience-containers).

## ScreenGui (2D overlay on the player's screen)

- Must ultimately live under a Player's PlayerGui to be visible to that player (cloned from StarterGui on spawn, or created at runtime on the client).
- .Enabled is the simplest visibility toggle (contents do not process input or render when false).
- Multiple ScreenGuis are layered by .DisplayOrder (higher numbers render on top).
- .ScreenInsets controls safe area:
  - CoreUISafeInsets (default): avoids Roblox top bar + device cutouts/notches. Recommended for interactive UI.
  - DeviceSafeInsets: avoids only device hardware (camera notch etc.), allows overlap with top bar.
  - TopbarSafeInsets: positions between top bar and right edge of device safe area; auto-flexes horizontally.
  - None: full screen, can be completely obscured by notches or top bar. Only for non-interactive background art.
- .ResetOnSpawn: true by default. False only works reliably when the ScreenGui is a *direct* child of StarterGui (not inside a Folder or other container).
- .ZIndexBehavior: `Global` (default, ZIndex is compared across the whole ScreenGui) vs `Sibling` (ZIndex only compared among siblings with the same parent). Use `Sibling` when you want nested containers to manage their own layering independently; use `Global` for a flat HUD where absolute ZIndex values matter.
- All logic that manipulates ScreenGui contents at runtime belongs on the client (LocalScript or required client module).

**Access pattern (LocalScript):**
```lua
local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
local hud = playerGui:WaitForChild("MainHUD")
local shop = playerGui:WaitForChild("ShopMenu")
```

## CanvasGroup (group transparency, color, and clipping)

- A container that renders its descendants into a shared texture, then applies `GroupTransparency` and `GroupColor3` to the whole group.
- The only built-in way to get **rounded clipping**: set `UICorner` on a CanvasGroup and child content that overflows the corners will be clipped. Regular Frames do not clip descendants with rounded corners.
- Because it allocates a render target, CanvasGroup has a real texture/memory cost proportional to its on-screen size. It is cheaper than many individual moving particles, but not free; avoid large CanvasGroups on low-end devices or stacking many of them.

## SurfaceGui (projected onto a part face in the 3D world)

- Can be parented directly to a BasePart (respects .Face = Front/Back/Left/Right/Top/Bottom).
- Alternative (more flexible for runtime): place in StarterGui, set .Adornee to any BasePart and .Face.
- The "canvas" fills the chosen face. Child GuiObjects are positioned/sized with the usual UDim2 rules relative to the canvas size (PixelsPerStud and CanvasSize control density).
- .AlwaysOnTop: renders above 3D geometry regardless of occlusion.
- .Brightness (0-1000): scales emitted light when **LightInfluence is 0**. Has no effect when `LightInfluence` is `1`.
- .LightInfluence (0-1): how much world lighting affects the UI appearance.
- .MaxDistance: culling distance (0 = infinite).
- .ZOffset: sort order when multiple SurfaceGuis share the same face (does not physically lift the UI off the surface).
- **Critical input rule:** Buttons and other interactive elements only receive player input if the SurfaceGui (or an ancestor) is ultimately under that player's PlayerGui. The target part must also have CanQuery = true.

Use for in-world computers, vehicle HUDs, keypads, interactive signs, etc.

## BillboardGui (always faces the camera, floats in 3D space)

- Similar lighting/occlusion/MaxDistance properties to SurfaceGui.
- Sizing is in *studs*: the scale components of .Size define the world-space dimensions (e.g. UDim2.fromScale(6, 4) is a 6-stud wide by 4-stud tall billboard whose on-screen size shrinks/grows with camera distance).
- .StudsOffset: offset in studs **relative to the camera orientation**; use `.StudsOffsetWorldSpace` for an offset along world X/Y/Z axes.
- **Input rule:** Interactive children only receive input if `BillboardGui.Active = true` **and** the child button's `Active = true`, in addition to the PlayerGui ancestry rule.
- Excellent for nameplates above heads, floating damage numbers, health bars, quest markers, contextual icons.
- Same PlayerGui ancestry rule as SurfaceGui for interactive children.

**Text scaling tip:** When using TextLabel inside a scale-sized BillboardGui, enable TextScaled so the text remains legible at varying distances. Pair it with a `UITextSizeConstraint` (MaxTextSize / MinTextSize) to prevent unreadably huge or tiny text.

## ScrollingFrame (scrollable content region)

- Set `AutomaticCanvasSize` to `X`, `Y`, or `XY` to auto-resize the canvas based on child `AbsoluteContentSize` (especially useful with UIListLayout). The child layout's `FillDirection` should match the scrolling axis.
- **Gotcha:** `AutomaticCanvasSize` can conflict with children sized via scale or with `UIScale`. If the canvas grows indefinitely or scrollbars flicker, switch the scrolling content to offset/AutomaticSize or set an explicit `CanvasSize` while driving it from the layout's `AbsoluteContentSize` manually.
- Use `ScrollingDirection`, `ScrollBarThickness`, `ScrollBarImageColor3`, `ScrollBarImageTransparency`, and `VerticalScrollBarPosition` to match your design.
- `CanvasPosition` can be tweened for smooth scrolling.

## ViewportFrame (2D rectangle that renders a 3D world)

- Lives inside any Gui container (usually ScreenGui or a Frame inside one).
- Has its own `.CurrentCamera` (required for rendering). Parent 3D content directly to the ViewportFrame — models, parts, meshes, cameras, and rigs. There is no separate `.World` property.
- You can play AnimationTracks on rigs inside the viewport and run IKControl. Real `ParticleEmitter`, `Beam`, `Trail`, and `Light` objects do **not** render inside `ViewportFrame`; use the built-in `Ambient`, `LightColor`, and `LightDirection` properties for lighting.
- Common for 3D item/character previews in shops or inventories, ability visualizers, "portal" effects, or embedding world particles as "UI particles".
- Performance cost is real — treat active ViewportFrames like expensive transparent elements. Limit concurrent visible ones and lower internal complexity on low-end devices.

## Common Patterns & Gotchas

- **Scale vs Offset:** Prefer scale for almost everything responsive. Offset is still the right tool for thin 1px separators/hairlines, crisp borders that must stay 1 pixel wide, fixed-size hit targets (e.g. 44×44 pt minimums), and fixed-width popovers that should not stretch.
- **UICorner clipping:** `UICorner` only rounds the object's own background; it does **not** clip descendant content to the rounded shape. Use a `CanvasGroup` with `UICorner` when you need rounded clipping.
- **TextScaled constraints:** `TextScaled` alone can make text shrink or grow without bounds. Add a `UITextSizeConstraint` with sensible `MinTextSize` and `MaxTextSize` values.
- **Gamepad/keyboard focus:** Set `GuiService.SelectedObject` to the first interactive button when opening a menu, and use `GuiService.SelectedObjectChanged` to keep visual focus indicators in sync. Without this, controller/keyboard players cannot navigate your UI.

## General Container Properties & Patterns

- ZIndex (per GuiObject) for layering within one container.
- For world containers, combine AlwaysOnTop + high Brightness + appropriate MaxDistance to keep important markers visible.
- Organize complex UIs with multiple ScreenGuis (one for HUD, one for modals, one for toasts) and toggle .Enabled or use DisplayOrder rather than constantly re-parenting.

See the parent SKILL.md and the other references/ files for how to combine these containers with layouts, strokes, and the "particles in UI" techniques.
