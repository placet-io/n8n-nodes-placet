# Changelog

## [0.1.2] - 2026-04-04

### Changed

- **Split trigger into two separate nodes**:
  - **Placet On Message** (`placetOnMessage`) — new webhook-based trigger that receives events in real-time. Automatically registers/deregisters the webhook at the Placet API (`setWebhook`/`deleteWebhook`) on workflow activation/deactivation. Supports event filtering (`message:created`, `review:responded`, `review:expired`). Includes a notice that each channel can only have one active webhook at a time.
  - **Placet On Poll Change Trigger** (`placetTrigger`) — the existing polling trigger, now a clean standalone node with configurable poll interval and optional message acknowledgement.
- Removed the dual-mode "Trigger Mode" selector — each trigger type is now its own node for a clearer UX.

## [0.1.1] - 2026-04-03

### Fixed

- **Agent Status (Ping)**: Added required `agentId` field (channel selector), corrected status enum values (`active`, `busy`, `error`, `offline`), added optional `message` field
- **Request Form**: Replaced raw JSON input for select options with structured UI fields (value + label per option), added conditional field visibility based on field type (placeholder/defaultValue only shown for applicable types)

## [0.1.0] - 2026-04-02

### Added

- Initial release
- **`Placet` node** with the following resources and operations:
  - **Message**: Send, Request Approval, Request Selection, Request Form, Request Text Input, Request Plugin Review, Get, Get Many, Delete
  - **Review**: Get Pending, Get
  - **File**: Upload (binary), Download (binary), Get Many
  - **Agent Status**: Ping
- **`PlacetTrigger` node** — polling trigger for new messages in a channel
- **`PlacetApi` credentials** — API key + base URL
- Webhook-based send-and-wait (`putExecutionToWait`) for all review request operations — workflow pauses until the human responds in Placet, then resumes with the review data
- Channel picker via `resourceLocator` with live search (`searchChannels`)
- Plugin review with dynamic field schema loading via `resourceMapper` (`getPluginFields`)
- Simple UI mode and raw Custom JSON mode for all review operations
- `usableAsTool: true` on both nodes for use inside n8n AI Agent workflows
- Multipart file upload built with n8n built-in helpers only (no external dependencies)
