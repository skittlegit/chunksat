# chunksat

Satellite attitude planning and imaging scheduler for the "Lost in Space"
hackathon. The planner chunks an area of interest into tiles and schedules a
12-minute pass to image them; the console renders coverage maps, score cards,
and a frame table for each run.

- `planner/` — Python planner, scorer, and (locally runnable) FastAPI app.
  See [planner/README.md](planner/README.md).
- Repo root — Next.js (App Router) console, deployed on Vercel.

The planner is frozen, so the site needs no backend: every plan + simulate
result for every case, strategy, and slider position is precomputed into
`public/data/` and served as static JSON.

## Scoring

Per-case score: `S_orbit = C · (1 + 0.25·η_E + 0.10·η_T) · Q_smear`

Mission total uses the contest weights from `planner/HANDOFF.md`:

```
S_total = 0.25·S_case1 + 0.35·S_case2 + 0.40·S_case3
```

Reference run against the bundled test cases: `S_total ≈ 1.18`.

## Local development

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

## Regenerating data

Only needed if the planner, scorer, test cases, or slider ranges change.
Takes ~10 minutes on many cores:

```powershell
cd planner
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe scripts\precompute.py
```

Slider ranges and strategies in `planner/scripts/precompute.py` must match
`components/controls/ParameterSliders.tsx` and `lib/types.ts`.

## Layout

- `app/page.tsx` — main console, mission strip, per-case cards
- `components/` — score card, frame table, coverage map, timeline
- `hooks/useRunPass.ts` — load precomputed result → store flow
- `lib/api.ts` — static data loader + adapter between the flat planner
  output and the rich UI types
- `lib/constants.ts` — weight scheme, score ceilings, palette
- `store/useAppStore.ts` — Zustand store (selected case, sliders, results)
- `public/data/` — generated; see "Regenerating data"
- `planner/` — Python planner and precompute script

## Notes

- Precomputed plans ship with the attitude array stripped (~4 MB per run);
  simulate consumed it at generation time and the UI never reads it.
- `settle_margin_s` defaults to `0.3` to match the planner.
- Only one weight scheme is exposed (contest weights).
