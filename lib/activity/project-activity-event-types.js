/**
 * Registry of activity `event_type` values stored in `project_activity_events`.
 * Add a constant here when introducing a new writer + mapper branch.
 *
 * Payload shapes (JSON, optional keys omitted when empty):
 * - library.file.uploaded: { display_name, needs_approval, file_id? }
 * - library.file.comment: { file_id, file_display_name, body, comment_id?, voice_note_duration_ms?, voice_note_waveform? }
 * - library.file.approval_changed: { file_id, file_display_name, approval_status }
 * - library.link.created: { title, link_id?, url }
 * - invoice.created: { invoice_id, amount, invoice_link }
 */
export const PROJECT_ACTIVITY_EVENT_TYPES = Object.freeze({
  LIBRARY_FILE_UPLOADED: "library.file.uploaded",
  LIBRARY_FILE_COMMENT: "library.file.comment",
  LIBRARY_FILE_APPROVAL_CHANGED: "library.file.approval_changed",
  LIBRARY_LINK_CREATED: "library.link.created",
  INVOICE_CREATED: "invoice.created",
});
