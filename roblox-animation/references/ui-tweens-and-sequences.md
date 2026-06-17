---
last_reviewed: 2026-06-17
---

# UI Tweens and Animation Sequences

**Primary source:** https://create.roblox.com/docs/ui/animation

## Core TweenService Pattern for GuiObjects

```lua
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
local guiObject = playerGui:WaitForChild("ScreenGui"):WaitForChild("SomeButton")  -- or Frame, ImageLabel, etc.

-- Best practice: work in scale + set a sensible AnchorPoint
guiObject.AnchorPoint = Vector2.new(0.5, 0.5)

local tweenInfo = TweenInfo.new(
    0.35,                           -- duration seconds
    Enum.EasingStyle.Quad,          -- or Sine, Cubic, Back, Bounce, Elastic, Exponential...
    Enum.EasingDirection.Out,       -- In, Out, InOut
    0,                              -- repeat count ( -1 = infinite )
    false,                          -- reverses
    0                               -- delay
)

local tween = TweenService:Create(guiObject, tweenInfo, {
    Size = UDim2.fromScale(1.15, 1.15),
    -- Position = UDim2.fromScale(0.5, 0.5),
    -- Rotation = 15,
    -- BackgroundTransparency = 0.2,
    -- ImageColor3 = Color3.fromRGB(255, 220, 100),
})
tween:Play()
```

## Recommended Properties to Tween on Common UI Objects

**Frame / CanvasGroup:**
- Position, Size, Rotation, BackgroundTransparency, BackgroundColor3
- CanvasGroup.GroupTransparency and GroupColor3 (affects all descendants as a batch — extremely useful)

**TextLabel / TextButton:**
- The above + TextTransparency, TextColor3
- Avoid TextStrokeTransparency/TextStrokeColor3 for new work; add a UIStroke child and tween its Thickness/Color/Transparency for modern borders.

**ImageLabel / ImageButton:**
- The Frame properties + ImageTransparency, ImageColor3, ImageRectOffset/ImageRectSize (for sprite sheet tricks)

**UIStroke (modern borders on almost anything):**
- Color, Thickness, Transparency

**Other useful:**
- ScrollingFrame.CanvasPosition (smooth programmatic scrolling)
- ViewportFrame + its world contents (you can tween camera CFrame or properties of 3D objects inside the viewport for "3D UI" effects)

**Always add UIAspectRatioConstraint** when tweening Size on anything that has a designed aspect ratio. This prevents squashing on different screen sizes.

## Easing Guidance

- **Quad / Cubic** — excellent general purpose, natural feel for most UI.
- **Sine** — gentler.
- **Back** — slight overshoot then settle (great for "pop" on appear or button press).
- **Bounce** — playful, use sparingly.
- **Elastic** — rubber-band feel, can feel over-the-top.
- **Constant** is an interpolation mode in the Animation Editor / curve animations, not a `TweenService` easing style. To snap a value instantly with TweenService, use a 0-duration tween or set the property directly.
- Linear only when you truly want constant speed (rare for UI polish).

Experiment in Studio. The visual graphs in the docs are accurate.

## Sequences, Chaining, and State Machines

Simple chain:
```lua
local grow = TweenService:Create(obj, info, {Size = UDim2.fromScale(1.2, 1.2)})
local shrink = TweenService:Create(obj, info, {Size = UDim2.fromScale(1, 1)})

local conn
grow:Play()
conn = grow.Completed:Connect(function(playbackState)
    if playbackState == Enum.PlaybackState.Completed then
        conn:Disconnect()
        shrink:Play()
    end
end)

obj.AncestryChanged:Connect(function(_, parent)
    if not parent then
        if conn then conn:Disconnect() end
        grow:Destroy()
        shrink:Destroy()
    end
end)
```

For more complex UI flows (open panel → show content → highlight button), maintain a small table of tweens or use a simple state enum + a "playNext" function. Cancel any in-flight tween before starting a conflicting one, and disconnect Completed connections when the sequence finishes or the GUI is destroyed.

## Typewriter / Animated Text Reveal

One of the highest-ROI UI animations for immersion.

The official guide provides a complete reusable `AnimateUI` module using:
- `LocalizationService` translator (optional)
- `utf8.codes`/`utf8.codepoint` to iterate Unicode codepoints (use a grapheme-splitting library if you must animate by user-perceived character clusters)
- Stripping RichText tags for the animation pass, then restoring or handling separately
- `TextLabel.MaxVisibleGraphemes = index`
- Small `task.wait(delayBetweenChars)`

Call it from a LocalScript attached to the target TextLabel.

This technique works beautifully combined with sound cues or subtle particle "text dust" on each character.

## CanvasGroup Power Moves

Instead of individually tweening 8 elements inside a panel when you want to fade the whole thing:
1. Wrap them (or the important visual children) in a CanvasGroup.
2. Tween only `GroupTransparency` (0 → 1) and/or `GroupColor3`.
3. The group blends everything underneath with proper alpha.

This is dramatically cheaper than tweening many individual transparencies and colors.

## 3D-in-UI via ViewportFrame + Tweens

ViewportFrame lets you embed a miniature 3D scene (with its own ambient lighting, models, and cameras) inside a 2D UI rectangle.

Common pattern:
- Tween the ViewportFrame's size/position/transparency for entrance.
- Inside the viewport, tween the CurrentCamera CFrame, or properties on 3D parts/attachments (or even play AnimationTracks on a rig inside the viewport).
- This is how many inventory inspectors, character previews, and "3D button" effects are achieved.

**Important:** Real `ParticleEmitter`, `Beam`, `Trail`, and `Light` objects do **not** render inside `ViewportFrame`. Use the viewport's built-in `Ambient`, `LightColor`, and `LightDirection` for lighting.

Performance warning: ViewportFrames have a cost. Limit how many are active and visible, especially on lower-end devices.

## Gotchas Specific to UI Tweens

- ClipsDescendants does not clip rotated descendants reliably.
- Tweening very large numbers of transparent UI elements at once is a major source of fill-rate / overdraw problems on mobile.
- Always work in scale (0–1) + AnchorPoint for resolution independence. Hard pixel offsets are a maintenance nightmare.
- UDim2.fromScale vs UDim2.new — prefer the former for clarity when doing relative work.
- RichText tags will break simple character-by-character reveals unless you strip them first (as shown in the official typewriter example).
- Tween objects are GC'd when no longer referenced and finished. Keep a reference only while you need to Cancel/Pause/Resume or listen to Completed.
- Disconnect `Completed` connections and call `:Destroy()` on tweens when the GUI object is removed to avoid leaking memory.
- Style transitions (beta) via the Style Editor are an alternative declarative approach — good for consistent design-system motion.

## Multi-Property Tweens

You can (and should) change several properties in one tween for cohesive motion:
```lua
TweenService:Create(panel, info, {
    Size = UDim2.fromScale(0.9, 0.9),
    GroupTransparency = 0,          -- if inside CanvasGroup
    Position = UDim2.fromScale(0.5, 0.5)
}):Play()
```

## When to Prefer AnimationTracks over Tweens in UI Contexts

Rare, but possible: if you have a complex repeating or blended motion that is easier to author once in the Animation Editor and then drive a ViewportFrame rig, or if you want marker events from "UI animation" data.

In 99% of pure 2D GUI cases, TweenService (or the newer style transitions) is the correct, lighter-weight tool.

See the official ui/animation.md page for the complete typewriter module and many more single-property code snippets.
