# Source drift review — 2026-10-21

Reviewed the six Creator Docs commits listed in [issue #66](https://github.com/nonlooped/roblox-suite/issues/66): `70a0110f`, `58f787e9`, `710b20a5`, `efe8741d`, `031b2f91`, and `784c5e21`. The changed files the suite cites were read as diffs from the commits. Most other changes are art, avatar, media, curriculum, and policy text that no suite skill cites; those were skipped after checking the suite's source list.

This is a change-focused review, not a whole-suite re-verification. Verification dates are updated only where the affected claims were checked against the changed source.

| Area | Finding and disposition | Official source |
| --- | --- | --- |
| UIGradient types | `Enum.GradientType.Elliptical` is added, and it is part of the beta "Upgraded UIGradients" feature. `roblox-user-interfaces` listed only Linear, Radial, and Conical. Added Elliptical with the beta note. Dates updated. | [Appearance modifiers](https://create.roblox.com/docs/en-us/ui/appearance-modifiers), [GradientType](https://create.roblox.com/docs/en-us/reference/engine/enums/GradientType) |
| Data Stores permissions | The group permission that grants full Data Stores Manager access is **Edit experiences**. `versioning-metadata-recovery.md` said "Edit all group experiences", which the docs have never used. Corrected. Dates updated. This is a label correction, not a behavior change. | [Data stores manager](https://create.roblox.com/docs/en-us/cloud-services/data-stores/data-stores-manager), [Groups](https://create.roblox.com/docs/en-us/projects/groups) |
| Data Stores Manager and RTBF navigation | The menu path changed to **Configurations** > **Data stores manager**. The suite does not give menu paths for these pages, so no change was needed. The RTBF template format and API steps are unchanged. | [Right to be forgotten](https://create.roblox.com/docs/en-us/cloud-services/data-stores/right-to-be-forgotten) |
| Webhooks | Navigation changed to **Configurations** > **Webhooks**. Trigger lists, payload fields, and the Transaction Refunded note are unchanged. The suite does not give menu paths, so no change was needed. | [Webhook notifications](https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications) |
| Load times | The join sequence is now documented: ReplicatedFirst, then the rest of the data model, then the avatar. The docs say the sample script in ReplicatedFirst excludes server connection and avatar load. The suite's load-time snippet did not say where it runs or what it measures. Clarified. Dates updated. | [Identify performance issues](https://create.roblox.com/docs/en-us/performance-optimization/identify), [Improve performance](https://create.roblox.com/docs/en-us/performance-optimization/improve) |
| Monetization policy and ads | Changes are removed `<br>` tags and layout edits. No claims changed. | [Immersive ads](https://create.roblox.com/docs/en-us/production/monetization/immersive-ads), [Price optimization](https://create.roblox.com/docs/en-us/production/monetization/price-optimization) |
| Avatar creation token | New `AvatarCreationService:PromptCreateMakeupAsync` and makeup token layers. The suite does not cover avatar creation, so it was not added. | [Avatar creation token](https://create.roblox.com/docs/en-us/production/monetization/avatar-creation-token) |
| Testing modes and Studio pages | Link fixes and a Quest publish step. The suite's testing-modes guidance does not depend on the changed text. | [Testing modes](https://create.roblox.com/docs/en-us/studio/testing-modes) |
| Engine references (RunService, SoundService, BadgeService, StarterPlayer, Workspace, WorldRoot, SurfaceAppearance, Studio, Object, ScriptEditorService, CompressorSoundEffect, EditableImage, EditableMesh) | The changed members are not claims the suite makes: for example `SoundService:GetMixerTime` wording, the new `BadgeInfo` fields, `RunService` security, and `EditableImage`/`EditableMesh` enabling steps. No suite guidance changed. | Creator Docs engine references |
| Logger and LogService | `LogService:GetLogger()` and the `Logger` class are new. The suite's `roblox-testing/scripts/Logger.lua` is a standalone module, so it was not changed. Candidate for a future release. | [Logger](https://create.roblox.com/docs/en-us/reference/engine/classes/Logger) |
| Particle emitters and global wind | New rain-simulation guidance and a wind cross-reference. The suite's VFX guidance is not contradicted and was not expanded. | [Particle emitters](https://create.roblox.com/docs/en-us/effects/particle-emitters) |
| Animation editor | Adds a note that custom rigs with Motor6D joints should check `AssemblyRootPart`. The suite does not describe the editor's root selection, so no change was needed. | [Animation editor](https://create.roblox.com/docs/en-us/animation/editor) |
| Character controller library | Input `Mode` semantics changed. `RunsWhile` may no longer contain the input, and `OutlivesInputWhile` was added. The suite does not cover this library, so there is no guidance to correct. Candidate for a future release. | [Character controller library](https://create.roblox.com/docs/en-us/characters/character-controller-library) |
| Open Cloud OpenAPI | Virtual-event operation IDs were renamed (`GameEvent_*` to `GameEvent*`). The suite does not cite those operation IDs. | [Virtual events](https://create.roblox.com/docs/en-us/cloud/reference/features/virtual-events) |
| Other | Studio texture generator, R6-to-R15 adapter, license manager, ad integrations, and curriculum changes are not cited by the suite. |  Creator Docs |

## Not covered

- The OpenAPI diffs in `710b20a5` and `efe8741d` were too large to review in full. Only the operation-ID changes were checked.
- The character controller library changes were not evaluated against suite guidance, because the suite does not cover that library.
- Analytics metric tables (`metrics.md`), error reporting, and the Early Harm Detection webhook events are not cited by the suite and were not reviewed.

## Review limitations

Under [REVIEW_POLICY.md](../REVIEW_POLICY.md), the Data Stores permission correction is documentation accuracy, not a behavior or policy change, so it is not labeled experimental. The critical-tier webhook refund note from the 2026-10-17 review remains experimental pending a second human reviewer.

## Verification

- `npm test` in `site/`: content validation, Astro type checking, static build, and built-site smoke check.
- `npm audit --omit=dev` in `site/`.
