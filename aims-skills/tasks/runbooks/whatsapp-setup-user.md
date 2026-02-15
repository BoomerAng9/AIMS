---
id: "whatsapp-setup-user"
name: "WhatsApp Setup — User Runbook"
type: "task"
status: "active"
triggers: ["whatsapp setup", "connect whatsapp"]
description: "Step-by-step guide for users to connect WhatsApp notifications in A.I.M.S."
execution:
  target: "internal"
priority: "medium"
---

# WhatsApp Setup — User Runbook

## Prerequisites
- An active A.I.M.S. account
- A WhatsApp account on your phone

## Steps

### 1. Open Circuit Box
Navigate to your Circuit Box (user view) from the dashboard or sidebar.

### 2. Find WhatsApp
Look for the "WhatsApp" service card under the **Communications** category.

### 3. Enter Phone Number
Enter your phone number with country code (e.g., +1 555-123-4567).

### 4. Confirm Opt-In
You'll receive a WhatsApp message from A.I.M.S. asking you to confirm:
- Reply **YES** to opt in to notifications
- Reply **STOP** at any time to opt out

### 5. Verify Connection
After confirming, the service card will show "Connected" with a green indicator.

### 6. Configure Notifications
Select which events trigger WhatsApp messages:
- [ ] Deliverable ready
- [ ] Approval needed
- [ ] Status updates

### 7. Done
Your WhatsApp is connected. You'll receive messages based on your preferences.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No confirmation message | Check your phone number includes country code |
| Accidentally opted out | Go to Circuit Box → WhatsApp → Re-connect |
| Want to change number | Disconnect current, then connect with new number |

## Privacy Note
Your phone number is stored encrypted in your personal tenant space. It is never shared with other users or exposed in any logs.
