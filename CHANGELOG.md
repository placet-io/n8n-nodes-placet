# Changelog

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
