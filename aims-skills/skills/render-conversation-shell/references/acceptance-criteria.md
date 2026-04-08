# Acceptance Criteria: render-conversation-shell

## Must Pass

- [ ] Chat history renders scrollable message list with auto-scroll to latest message
- [ ] User messages right-aligned with gold accent; ACHEEVY messages left-aligned with glass card style
- [ ] Voice button is the primary/most prominent input element on all device sizes
- [ ] Text input available as secondary input method with expandable textarea
- [ ] Persona chips render as horizontal scrollable row above input bar
- [ ] Model dropdown shows current model name and allows switching
- [ ] Voice picker tray slides up on long-press of voice button
- [ ] Layout is responsive across mobile (< 640px), tablet (640-1024px), and desktop (> 1024px)
- [ ] All animations use tokens from `frontend/lib/motion/tokens.ts` -- no magic numbers
- [ ] `prefers-reduced-motion` respected on all animated elements

## Should Pass

- [ ] Loading skeleton states shown during message fetch
- [ ] Markdown rendering supported in ACHEEVY responses
- [ ] Typing indicator displayed when ACHEEVY is generating a response
- [ ] Send button only visible when text content is entered
- [ ] Voice recording state shows visual feedback (red pulse, "Listening..." label)
- [ ] Error states handled gracefully (red outline on voice button, error message in text input)

## Performance

- [ ] Initial render time < 200ms on modern devices
- [ ] Input latency (keypress to character display) < 50ms
- [ ] Smooth scrolling at 60fps in chat history with 100+ messages
- [ ] No layout shift when persona chips load or model dropdown opens
