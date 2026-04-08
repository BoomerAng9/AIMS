# Acceptance Criteria: stitch-app-factory-voice-ui

## Must Pass

- [ ] Normal ACHEEVY Chat screen (ConversationShell) fully implemented with voice-first input
- [ ] LiveSim screen renders real-time simulation view with status indicators
- [ ] Chicken Hawk Dashboard renders safety policies, audit log, and compliance gates
- [ ] Chicken Hawk Dashboard accessible only in PRIVATE/Admin mode -- never exposed to PUBLIC users
- [ ] Microphone button is the most prominent interactive element on every screen
- [ ] All three screens accessible via screen switcher (bottom nav / sidebar)
- [ ] Cross-device responsive: mobile (single-column), tablet (two-column), desktop (three-column)
- [ ] Touch targets minimum 44px on mobile
- [ ] Voice commands that trigger deployments require explicit confirmation dialog

## Should Pass

- [ ] Real-time transcription preview visible during voice input
- [ ] Visual waveform or pulse animation during active recording
- [ ] Persona chips, model dropdown, and voice picker visible and functional on all screens
- [ ] LiveSim split view: simulation output + ACHEEVY chat side by side on desktop
- [ ] Audit log in Chicken Hawk Dashboard updates in real-time (or near-real-time polling)

## Design Consistency

- [ ] A.I.M.S. theme colors applied consistently across all three screens
- [ ] Motion tokens from `frontend/lib/motion/tokens.ts` used for all transitions
- [ ] No agent names (Boomer_Ang, Lil_Hawk) exposed in PUBLIC mode UI
- [ ] Glass-morphism card style used for panels and information containers
