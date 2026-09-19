---
read_when: "Reproduce latency, jitter, or packet-loss problems in Studio"
last_reviewed: 2026-09-19
---

# Studio network simulation

Official source: https://create.roblox.com/docs/studio/network-simulator

Network Simulator is a Studio beta that affects playtests, not live players. Enable **New Device Simulator** under **File → Beta Features**, restart Studio, and open **Test → Device Simulator → Network**.

- Inbound means server to client; outbound means client to server. Configure latency, jitter, and packet loss independently for each direction.
- Preset selection and numeric edits are staged until **Apply**. Applying updates a running playtest immediately.
- The values add to existing conditions, including real internet latency in Team Test. Inbound and outbound delays both contribute to round-trip ping.
- **Ideal Fiber** adds 8 ms per direction. Set all six controls to zero and apply for a zero-added-impairment comparison. **Reset** stages Ideal Fiber; it does not disable simulation.
- Packet loss is a percentage: `0.50%` means half a percent, not 50%.
- Saved custom presets persist across sessions, but applied values reset after a full Studio restart.

Repeat the same server-confirmed interaction under baseline, Wi-Fi/mobile, and poor-connection conditions. Check immediate local feedback, duplicate submissions, timeouts, stale unreliable updates, and recovery. Change one direction at a time to isolate request versus response delays. Record the preset, playtest mode, and observed result so comparisons remain reproducible.

The toolbar uses the same `NetworkSettings` properties as Studio Settings: `InboundNetworkMinDelayMs`, `OutboundNetworkMinDelayMs`, `InboundNetworkJitterMs`, `OutboundNetworkJitterMs`, `InboundNetworkLossPercent`, and `OutboundNetworkLossPercent`. Consult their security requirements before using them in plugin automation.
