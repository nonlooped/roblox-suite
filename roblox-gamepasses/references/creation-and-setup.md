---
read_when: "Create a pass, find its asset ID, or configure sales and test access"
last_reviewed: 2026-06-17
---

# Creation and setup of game passes

**Official guide:** https://create.roblox.com/docs/en-us/production/monetization/passes

## Creating a pass

1. Go to Creations in Creator Dashboard.
2. Select your experience (must be published).
3. Monetization → Passes → "Create a Pass".
4. Upload icon: Must be suitable for circular crop (important visual content must be inside the circle). Recommended formats: .jpg, .png, .bmp. Max 512x512.
5. Provide name and description.
6. Submit.

After creation, the pass appears in the list.

## Obtaining the pass ID (asset ID)

- Hover over the pass thumbnail in the list.
- Click the ⋯ menu.
- Select "Copy Asset ID".

This ID (a number like 1234567890) is what you use in all `MarketplaceService` calls:
- `GetProductInfoAsync(id, Enum.InfoType.GamePass)` (preferred; the non-async `GetProductInfo` still exists but `GetProductInfoAsync` is recommended)
- `PromptGamePassPurchase(player, id)`
- `UserOwnsGamePassAsync(userId, id)`
- `GetPassOwnershipAsync(player, id)` (`Owned` for paid ownership, `Active` for access)

## Enabling sales (external / game page store)

For the pass to appear on the game's Store tab on Roblox.com:

1. In the Passes list, select the pass or go to its detail.
2. Sales tab.
3. Toggle "Item for Sale".
4. Enter Robux price (minimum 1, max 1,000,000,000).
5. Save.

The price affects your Robux earnings after Roblox fees.

## Icon best practices and validation errors

Icons are validated strictly. Common issues:
- Content outside the circular boundary gets cropped.
- Low resolution or poor contrast.
- Text or important details near edges.

Test by viewing the pass in the in-experience purchase prompt and on the web store.

## Group vs individual ownership

When publishing the animation or pass:
- If the experience is group-owned, select the group as the creator during publish/export for the asset.
- Same applies conceptually for passes (the experience ownership determines who can manage).

## Testing setup

- If a backend API used in Studio requires it, enable **Studio Access to API Services** only for a dedicated test experience. Do not grant Studio sessions access to production data.
- Create a separate test experience/universe that mirrors your production one.
- Test the full flow: prompt → purchase (use small test Robux if possible, or Roblox test accounts).
- Check `GetPassOwnershipAsync(...).Owned` after purchase on a new server, and test that a trial never grants a permanent reward.
- Follow the [purchase flow test cases](purchase-flow-and-granting.md#test-on-a-dedicated-experience).

## Server setup

Use the [server grant pattern](purchase-flow-and-granting.md#verify-before-granting) in ServerScriptService.

## Common setup mistakes

- Using the wrong InfoType (must be GamePass, not Product).
- Forgetting that passes are experience-specific (after the 2026 change).
- Not handling the case where the player already owns it (show "Owned" UI instead of prompting again).
- Placing grant logic in a LocalScript.

Next reference: purchase-flow-and-granting.md for the full end-to-end code.
