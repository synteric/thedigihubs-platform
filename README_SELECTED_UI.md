# TheDigiHubs Selected UI Build

This package applies the selected TheDigiHubs designs to the frontend codebase.

## Routes included

- `/` — approved landing page direction
- `/buyer` — buyer dashboard
- `/supplier` — supplier dashboard with Matched Opportunities
- `/supplier/rfq/1098` — supplier RFQ detail and prepare quote workflow
- `/admin` — admin dashboard and controls
- `/rfq/new` — RFQ creation workflow with optional specifications/documents upload

## Run locally

```powershell
cd "C:\Users\drdon\Documents\Codex\thedigihubs-starter"
docker compose up --build
```

Then open:

```txt
http://localhost:3000
```

## Codex instruction

Use these pages as the approved frontend baseline. Wire functionality and backend APIs only. Do not redesign the logo, colors, sidebar, cards, layout spacing, or language unless explicitly instructed.
