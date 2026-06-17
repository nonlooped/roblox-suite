---
last_reviewed: 2026-06-17
---

# Luau Data Types and Serialization Rules

**Main sources:** https://create.roblox.com/docs/en-us/luau, https://create.roblox.com/docs/en-us/luau/tables, https://create.roblox.com/docs/en-us/luau/type-checking, https://create.roblox.com/docs/en-us/scripting/attributes

## Primitive Types

- **nil**: The only value that represents "nothing". Different from `false` or `0`. Assigning `nil` to an array index creates a hole; dictionary tables can conceptually hold a nil value for a key, but in practice the key/value pair is removed and `pairs` will not visit it.
- **boolean**: `true` or `false`.
- **number**: 64-bit double-precision floating point. Be careful with very large integers and money (consider fixed-point or libraries).
- **string**: UTF-8 encoded. Must be valid UTF-8 to be stored in DataStores. The `utf8` library iterates Unicode codepoints, not grapheme clusters; for UI text that must respect user-perceived characters, additional handling is required.
- **Enum** values: `Enum.Foo.Bar` values (Roblox-specific datatypes, not built-in Luau types).

## Tables

The most important type. Can be used as arrays (1-based) or dictionaries.

Important limitations for storage (DataStores, JSON):
- No functions
- No cycles
- No custom metatables on the table being serialized (metatables are not preserved)
- Only the supported primitives inside

Modern table helpers:
- `table.create(n, value?)` — preallocate/initialize arrays efficiently.
- `table.find(t, value, init?)` — linear search.
- `table.clone(t)` — shallow copy.
- `table.freeze(t)` / `table.isfrozen(t)` — make a table read-only.

## Roblox Datatypes / Instances

These are engine objects exposed to Luau:
- **Instances** (Parts, Models, GUIs, etc.)
- **Math / value types**: Vector3, CFrame, UDim2, Color3, Ray, Region3, NumberRange, buffer, etc. `typeof()` returns the type name (e.g. `"CFrame"`, `"Vector3"`).
- **Sequences / physical types**: NumberSequence, ColorSequence, PhysicalProperties — commonly used for particle/beam curves and part physical material settings.
- **Attributes** — lightweight key/value storage on any Instance via `:SetAttribute`/`:GetAttribute`; prefer over legacy Value objects.
- **userdata**: Rarely used directly in modern Luau; most engine objects are Instances or datatypes.

These have properties and methods but are opaque for pure Luau operations like `pairs()` in some cases.

## Serialization for DataStores vs Networking

**DataStores** store data as JSON. Supported: nil, boolean, number, string, buffer, and tables containing only those types recursively.

**RemoteEvent / RemoteFunction** use Roblox's own binary replication, not JSON. They can pass many Roblox datatypes including `Instance`, `Enum`, `CFrame`, `Vector3`, `Color3`, etc. — but DataStores still cannot.

Supported after JSON round-trip (DataStores / HttpService):
- nil, boolean, number, string, buffer
- Tables containing only the above (recursively, with no cycles)

**Never store in DataStores / JSON:**
- `inf`, `-inf`, `nan` (they break JSON and can make keys unreadable via Open Cloud)
- Functions
- Threads / coroutines
- **Instances** or other Roblox datatypes (`Vector3`, `CFrame`, `Color3`, `NumberSequence`, etc.) unless you convert them to plain tables or strings first
- Invalid UTF-8 byte sequences in strings
- Cyclic tables

**Debugging tip**:
```lua
local HttpService = game:GetService("HttpService")
print(HttpService:JSONEncode(yourData))
```
A clean JSONEncode is a good sanity check, but it does not guarantee DataStore success. In particular, DataStores have their own key/value size limits, quotas, and constraints such as invalid UTF-8 and non-finite numbers. `nil` values become `null` in JSON but are allowed in DataStores.

## Randomness

Use the `Random` class for deterministic or independent random streams:

```lua
local rng = Random.new(12345)
local roll = rng:NextInteger(1, 6)
```

Avoid global `math.randomseed` in new code; it mutates shared state and can cause surprising interactions across modules.

## Type Checking

Luau supports gradual typing:
- `--!strict` is file-level; add it at the top of a script.
- A `.luaurc` file is the common way to enable type checking project-wide.
- Use annotations: `local gold: number = 100`
- Function signatures: `function grantGold(player: Player, amount: number): boolean`

This catches many bugs at edit time with zero runtime cost.

See the type-checking subpage for more.
