# Keep health data local while publishing the app publicly

Healthy Tracker is a static, local-first PWA hosted from a public GitHub repository. Personal InBody history, Workout Sessions, and Daily Nutrition Logs remain in the user's browser or explicitly exported JSON files; this avoids accounts and backend custody of health data, accepting that cross-device sync requires manual backup and restore.

## Consequences

The public repository must contain only schemas and example-free application code. Browser storage can be cleared, so full Export/Restore and a separately ignored private InBody import are part of the product rather than optional tooling.
