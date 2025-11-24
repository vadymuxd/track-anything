-- Event Types Reference
-- This document describes the event_type column and how to extend it

/*
Current Event Types:
- 'Count': Simple counting/tracking (e.g., "Did I do it today?")
- 'Scale': Numeric range with custom label (e.g., "Rate 1-10", "Cups of water 1-8")

Future Event Type Ideas:
- 'Yes-No': Boolean choice with custom labels
- 'Rating': Star rating (1-5)
- 'Duration': Time-based tracking (minutes, hours)
- 'Multi-Choice': Select from predefined options
- 'Number': Open-ended numeric value
- 'Text': Free-form text entry

Event Type Metadata:
- Count events: value is always 1 (just logged the event)
- Scale events: value ranges from 1 to scale_max, with scale_label describing the unit

Adding New Event Types:
1. Update this file with the new type description
2. Update EventDialog.tsx to add the new type to the dropdown
3. Update LogEventDialog.tsx to handle the new input type
4. Update display logic in HistoryTab, LogTab, EventsTab
5. Update mobile screens (EventsScreen, LogScreen, HistoryScreen)
6. No database migration needed - event_type is plain text

Example:
To add 'Yes-No' type:
- Add to EventDialog: <SelectItem value="Yes-No">Yes/No</SelectItem>
- Add input fields for custom yes/no labels
- Update LogEventDialog to show toggle/buttons instead of slider
- Update formatValue() functions to show custom labels
*/
