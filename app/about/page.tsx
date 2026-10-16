"use client";

import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Module } from "@/components/shared/Module";

export default function AboutPage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-5 sm:gap-8 sm:px-6 sm:py-8">
          <header className="flex flex-col gap-3">
            <span className="kbd">About · process</span>
            <h1
              className="display-tight text-[30px] leading-[0.95] text-[var(--fg)] sm:text-[42px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              How we built the orbital scheduler.
            </h1>
            <p className="max-w-[680px] text-[14px] leading-relaxed text-[var(--fg-mute)]">
              One repo, one pass: a Python planner that propagates orbits and
              scores schedules, and a Next.js console that renders them. The
              planner is frozen, so every result the console can show is
              precomputed and served as static files.
              Below is the path from a blank editor to a mission total
              that lands inside 99% of the geometric ceiling.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RepoChip
                href="https://github.com/skittlegit/chunksat"
                label="chunksat"
                sub="python planner · next.js console"
              />
              <div className="flex items-center gap-2">
                <PersonChip
                  href="https://github.com/ankitaww"
                  label="ankitaww"
                />
                <PersonChip
                  href="https://github.com/skittlegit"
                  label="skittlegit"
                />
              </div>
            </div>
          </header>

          {/* Pipeline stages -------------------------------------------------- */}
          <Stage
            n="01"
            title="Case definition"
            sub="GET /api/cases"
            body={[
              "Each case is a fixed JSON record describing a 12-minute pass: a TLE pair (orbit), an AOI polygon (1° × 1.26° box centred near 45 N / 10 E for the bundled cases), pass start/end UTC, and spacecraft parameters (FOV 2.0°, body inertia [0.12, 0.12, 0.08]).",
              "The three bundled cases differ only in the second TLE — case1 puts the satellite directly over the AOI, case2 ~330 km cross-track, case3 places it past the geometric horizon for a 60° off-nadir gate.",
              "Contest weights are 0.25 / 0.35 / 0.40 for case1 / case2 / case3. They are absolute (sum to 1.0) and applied to the per-case score at the very end.",
            ]}
          />
          <Stage
            n="02"
            title="Ephemeris"
            sub="GET /api/cases/{id}/ephemeris · core/propagator.py"
            body={[
              "SGP4 is propagated from `pass_start_utc` to `pass_end_utc` at 1 Hz (configurable via `dt_s`). Each sample carries r_eci, v_eci, geodetic lat/lon/alt, and the off-nadir angle from the satellite's nadir direction to the AOI centroid.",
              "The closest-approach instant is min(off_nadir_to_aoi_center_deg) over the pass — the natural anchor for any nadir-style strategy.",
            ]}
          />
          <Stage
            n="03"
            title="Tiling"
            sub="POST /api/plan · core/tiling.py"
            body={[
              "The AOI bounding box is gridded at roughly the FOV footprint size. For the bundled cases this yields a ~10 × 10 grid of square sub-targets, labelled t_RR_CC by row/column.",
              "Each tile is a {id, lat_deg, lon_deg, size_deg} record. The size depends on satellite altitude and FOV — backend ships ~0.20° square tiles at 506 km / 2° FOV.",
            ]}
          />
          <Stage
            n="04"
            title="Schedule"
            sub="POST /api/plan · core/planner.py"
            body={[
              "The planner walks the 1 Hz time grid and, for every (time, tile) pair, computes the off-nadir angle if the satellite were to point at that tile. Pairs that violate the adaptive gate (default 60°, relaxed for hard cases) are dropped.",
              "Boustrophedon / global-argmin / center-first strategies pick shutter assignments that minimise off-nadir while respecting a slew block (≈ ±0.8 s around each chosen shutter so attitude has time to settle).",
              "Output: a Schedule of attitude samples (q_BN quaternions, scalar-last) at high rate plus a list of shutters {t_start, t_end, tile_id, tile_lat_deg, tile_lon_deg, off_nadir_deg, q_BN, footprint}, plus diagnostics including the adaptive `off_nadir_limit_deg` actually used and the list of `skipped_tile_ids`.",
              "The frontend downsamples the attitude array to 1024 samples at the API boundary — the simulator only reads it at shutter midpoints, so high-rate samples are wasted bytes.",
            ]}
          />
          <Stage
            n="05"
            title="Simulation"
            sub="POST /api/simulate · routes/simulation.py"
            body={[
              "The simulator replays the schedule. For each shutter it samples the attitude quaternion at t_mid ± 0.01 s and estimates body rate via finite difference (`estimate_body_rate(q_a, q_b, dt)`).",
              "Wheel momentum used (Δh) is integrated across the full attitude trace using the body-x inertia (Ix = 0.12 kg·m² for the bundled cases). Active time is the interval from the first attitude sample to the last shutter end.",
              "Coverage is computed by sampling an 80 × 80 equirectangular grid inside the AOI and counting points covered by at least one shutter footprint (Sutherland-Hodgman polygon clip).",
            ]}
          />
          <Stage
            n="06"
            title="Score"
            sub="core/scorer.py"
            body={[
              "Per pass: S_orbit = C × (1 + 0.25·η_E + 0.10·η_T) × Q_smear",
              "C — coverage fraction (0–1) from the grid sampler.",
              "η_E = max(0, 1 − Δh / 0.200 Nms). 0.200 Nms is the per-pass momentum budget.",
              "η_T = max(0, 1 − T_active / 720 s). T_active = slew + shutter time across the full pass.",
              "Q_smear = fraction of shutters with body rate ≤ 0.05°/s at midpoint.",
              "Mission total: S_total = 0.25·score₁ + 0.35·score₂ + 0.40·score₃. The Console mirrors this exact formula; cases that haven't simulated yet contribute zero.",
            ]}
          />
          <Stage
            n="07"
            title="Validation"
            sub="POST /api/validate · routes/validation.py"
            body={[
              "Independent of the scorer, the validator re-checks the three hard gates per shutter: wheel saturation (|H_i| ≤ 0.030 Nms continuously), smear (|ω_body| ≤ 0.05°/s continuously), off-nadir (≤ 60° at the boresight ground hit).",
              "A shutter that fails any gate yields zero coverage credit. The simulator already accounts for this through Q_smear; the validator exists so submissions can audit themselves before grading.",
            ]}
          />

          {/* Story moved below the seven stages — read it after you know the */}
          {/* shape of the pipeline. */}
          <Module label="Story" hint="How we ideated and shipped it">
            <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-[var(--fg-mute)]">
              <p>
                The brief was deceptively simple: take a satellite, a 12-minute
                pass, and a polygon on the ground. Plan an attitude profile
                that images as much of the polygon as possible without smearing
                the photos, saturating the reaction wheels, or pointing past a
                60° off-nadir gate. Score it. Beat the reference.
              </p>
              <p>
                We split the problem in half on day one. One side took the
                physics — SGP4 propagation, frame conversions, attitude
                quaternions, the scoring contract. The other side took the
                interface — a dashboard you could trust to show what the
                planner was actually doing, frame by frame, instead of a
                single opaque number.
              </p>
              <p>
                The first plans hit ~0.08 / 1.35 per case. Slews were too
                aggressive, the wheel momentum integral blew through its 0.200
                Nms budget, and half the shutters fired with the spacecraft
                still settling. Three things fixed it: a serpentine tile order
                so neighbouring shots stayed close, a global argmin scheduler
                that picks the cheapest (time, tile) pair under the gate
                instead of greedy left-to-right, and identical-quaternion
                hold brackets around each 120 ms exposure to satisfy the
                smear gate without slowing the rest of the trajectory.
              </p>
              <p>
                On the web side the priority was honesty. Every value the UI
                shows comes from the backend payload — the closest-approach
                off-nadir is computed from SGP4 ephemeris, the per-case
                score is the raw S_orbit returned by /api/simulate, the
                frames-kept badge mirrors the planner&rsquo;s own diagnostics.
                When we discovered the front-end had been hard-coding the
                wrong contest weights (1.0 / 0.5 / 0.25 instead of 0.25 /
                0.35 / 0.40), we corrected it to the hackathon weights — those
                are what the grader uses.
              </p>
              <p>
                Case 3 took a day of dead ends. Cross-track distance is
                roughly 1000 km; the maximum reachable arc from 506 km
                altitude under a 60° gate is about 1022 km, and the AOI&rsquo;s
                nearest corner sits a few kilometres past that horizon. After
                four independent verifications — geometric, harness sweep,
                wide footprint sweep, and the organiser&rsquo;s own reference
                solution — we accepted the 0 and stopped trying to exploit it.
                The ceiling is 0.660. The current solver hits 0.6543.
              </p>
            </div>
          </Module>

          <Module label="Notes" hint="Caveats and known infeasibilities">
            <ul className="flex flex-col gap-3 text-[13px] leading-relaxed text-[var(--fg-mute)]">
              <li>
                <span className="text-[var(--fg)]">
                  Case 3 is provably infeasible.
                </span>{" "}
                Cross-track ≈ 1000 km; max reachable arc from 506 km under a
                60° gate ≈ 1022 km. All four reference submissions
                (identity, nadir-greedy, stop-and-stare, organiser solution)
                score case3 = 0. Ceiling for S_total ≈ 0.660; current solver
                lands at 0.6543 (99.1% of ceiling).
              </li>
              <li>
                <span className="text-[var(--fg)]">Mock simulator only.</span>{" "}
                Trajectory uses pure SLERP between attitude samples; angular
                rate is `np.gradient(q_BN)`. There is no plant dynamics —
                inter-frame slews can be arbitrarily fast, and only the
                integrated Δh penalises them through η_E.
              </li>
              <li>
                <span className="text-[var(--fg)]">
                  Quaternion convention.
                </span>{" "}
                Scalar-last `[qx, qy, qz, qw]`, body-to-inertial. Boresight
                is +z_body; pointing builder uses `y_body = z × v / |z × v|`
                for yaw resolution.
              </li>
            </ul>
          </Module>

          <p className="mt-2 border-t border-[var(--line)] pt-6 text-[11px] text-[var(--fg-faint)]">
            Source of truth for this page:{" "}
            <a
              className="underline hover:text-[var(--fg)]"
              href="https://github.com/skittlegit/chunksat/blob/main/planner/HANDOFF.md"
              target="_blank"
              rel="noreferrer"
            >
              planner/HANDOFF.md
            </a>{" "}
            and planner/app/core/{`{`}propagator,tiling,planner,scorer{`}`}
            .py. If the backend changes, update this page — nothing here is
            computed dynamically.
          </p>
        </div>
      </main>
      <StatusBar />
    </div>
  );
}

function Stage({
  n,
  title,
  sub,
  body,
}: {
  n: string;
  title: string;
  sub: string;
  body: string[];
}) {
  return (
    <section className="relative grid grid-cols-[42px_1fr] gap-x-4 border-b border-[var(--line)] pb-6 sm:grid-cols-[60px_1fr] sm:gap-x-5 sm:pb-7">
      <span
        className="numeric leading-none text-[var(--fg-ghost)]"
        style={{ fontSize: 30, letterSpacing: "-0.04em" }}
      >
        {n}
      </span>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2
            className="display-tight text-[18px] leading-tight text-[var(--fg)] sm:text-[20px]"
            style={{ letterSpacing: "-0.025em" }}
          >
            {title}
          </h2>
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
            {sub}
          </span>
        </div>
        <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-[var(--fg-mute)]">
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function RepoChip({
  href,
  label,
  sub,
}: {
  href: string;
  label: string;
  sub: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-baseline gap-2 border border-[var(--line-bright)] px-3 py-1.5 transition-colors hover:border-[var(--phos)] hover:bg-[var(--phos-soft)]"
      style={{ borderRadius: 2 }}
    >
      <span className="display text-[13px] text-[var(--fg)]">{label}</span>
      <span className="mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-faint)] group-hover:text-[var(--fg-mute)]">
        {sub}
      </span>
    </a>
  );
}

function PersonChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mono border border-[var(--line)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--fg-mute)] transition-colors hover:border-[var(--phos)] hover:text-[var(--fg)]"
      style={{ borderRadius: 2 }}
    >
      @{label}
    </a>
  );
}
