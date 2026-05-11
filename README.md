# Fantasy Contest Tracker

Fantasy Contest Tracker is an Angular app for tracking My11Circle-style fantasy contests, participants, investments, winnings, and ROI over time.

## What You Can Do

- Create contests with match context (match name, tournament, contest type, notes)
- Track participants and entry-level investments
- Record contest results with manual entry, CSV/JSON import, or OCR-assisted screenshot parsing
- View performance analytics on dashboard (P/L, ROI, top winner, most profitable player)
- Export/import data as JSON for backup and recovery

## User Roles

- `admin`: create contests, record results, import/export, delete
- `user`: view contests and analytics

## Quick Start

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Demo Login

- Admin: `admin`
- User: `user`

Password validation uses hash matching in frontend for local demo behavior. For production, replace with backend auth.

## Recommended Workflow

1. Create contest with metadata and participants.
2. Record results after contest ends.
3. Check dashboard for ROI and player rankings.
4. Export all contests regularly for safe backup.

## Data Quality Rules

- Minimum participants per contest: `2`
- Duplicate participant names in a contest are blocked
- In results entry:
- ranks must be unique
- exactly one rank must be `1`
- Keep player naming consistent across contests to get reliable analytics

## Import Formats

### Contest Import (JSON)

```json
[
  {
    "id": "contest-101",
    "name": "Evening League",
    "matchName": "MI vs CSK",
    "tournament": "IPL 2026",
    "contestType": "Small League",
    "date": "2026-05-04T19:30:00.000Z",
    "entryFee": 20,
    "participants": [
      { "id": "player_1", "name": "Yash", "teamName": "", "entryCount": 1 }
    ],
    "results": [],
    "isCompleted": false
  }
]
```

### Results Import (CSV)

```csv
playerName,rank,winningAmount
Yash,1,3200
Rahul,2,1800
Amit,3,1200
```

## Scripts

- `npm start` - run dev server
- `npm run build` - production build
- `npm test -- --watch=false --browsers=ChromeHeadless` - run tests once

## Tech Stack

- Angular 19 standalone components
- RxJS
- Tesseract.js (OCR import)
- LocalStorage persistence

## Notes

- Data is stored in browser LocalStorage.
- Clearing browser storage clears app data unless you exported a backup.
- OCR accuracy depends on screenshot quality.
