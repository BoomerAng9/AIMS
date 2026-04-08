---
id: "upload-official-rfp"
name: "Upload Official RFP"
type: "skill"
status: "active"
triggers: ["uploadOfficialRfp", "upload rfp", "attach document"]
description: "Attaches user-provided documents to the internal RFP simulation."
execution:
  target: "api"
  route: "/api/acheevy/actions/upload-rfp"
priority: "medium"
---

# Upload Official RFP Skill

> Users can attach their own documents to the engagement process.

## Action: `uploadOfficialRfp`

### What It Does
1. Accepts a file reference (uploaded via the UI or provided as a URL)
2. Validates the file type (PDF, DOCX, TXT, images)
3. Stores the file in Cloud Storage: `rfp/{rfp_id}/official/{filename}`
4. Creates a reference in Firestore: `rfp_simulations/{rfp_id}/attachments/`
5. ACHEEVY acknowledges: "Got it. I've attached your document to this engagement."
6. If the document contains structured RFP data, ACHEEVY may parse and incorporate it into the simulation spine

### Parameters
```json
{
  "rfp_id": "uuid",
  "file_ref": "storage_path_or_url",
  "file_type": "pdf|docx|txt|image",
  "description": "optional user description"
}
```

### Security
- Files are stored in tenant-scoped storage (user can only access their own)
- Files are scanned for malware before processing
- No file contents are included in logs or audit entries (only references)

### Returns
```json
{
  "rfp_id": "uuid",
  "attachment_id": "uuid",
  "status": "attached",
  "file_ref": "storage_path"
}
```
