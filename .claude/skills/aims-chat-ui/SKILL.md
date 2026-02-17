---
name: aims-chat-ui
description: >
  Chat w/ ACHEEVY UI pattern: main account landing shell, chat stream,
  input bar, and onboarding gate for new users.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. Chat UI Skill

This skill defines the canonical "Chat with ACHEEVY" surface: the primary landing after sign-in where users work with their executive Boomer_Ang.

Use with `aims-global-ui`.

## When to Use

Activate when:

- Editing `app/chat/page.tsx` or the main chat shell component.
- The user describes "Chat w/ ACHEEVY" or "primary account landing chat".

---

## Layout

- Global shell:
  - Background consistent with A.I.M.S. global design.
  - Main glass card containing the chat.
- Chat area:
  - Scrollable list of messages.
  - Distinct styling for user vs ACHEEVY.
- Input row:
  - Text input field.
  - Optional mic button (can be visually present but functionally stubbed).
  - Send button with clear disabled/loading states.

Onboarding gate:

- If onboarding not complete, show banner at top:
  - "Finish setup to unlock more Boomer_Angs and Plugs."
  - CTA to `/onboarding`.

---

## Rules

- Chat page must be fully mobile-usable.
- Do not overload with extra navigation; keep focus on conversation.
- Use consistent component styling (buttons, inputs) with auth & dashboard.
