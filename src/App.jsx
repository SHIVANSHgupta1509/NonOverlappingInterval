import React, { useMemo, useState } from "react";

const EXAMPLE = "1, 3\n2, 4\n3, 5";

function parseIntervals(raw) {
  const lines = raw.split("\n");
  const intervals = [];
  const errors = [];
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.trim().split(/[,\s]+/).filter(Boolean);
    if (parts.length !== 2) {
      errors.push(`Line ${index + 1}: enter exactly two numbers, like 1, 4.`);
      return;
    }
    const [start, end] = parts.map(Number);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      errors.push(`Line ${index + 1}: start and end must be numbers, with start < end.`);
      return;
    }
    intervals.push({ id: index + 1, start, end });
  });
  return { intervals, errors };
}

function solve(intervals) {
  const sorted = [...intervals].sort(
    (a, b) => a.end - b.end || a.start - b.start || a.id - b.id
  );
  let lastEnd = -Infinity;
  const kept = [];
  const removed = [];
  const steps = [];

  for (const interval of sorted) {
    if (interval.start >= lastEnd) {
      const reason =
        lastEnd === -Infinity
          ? "Keep the first interval with the earliest ending time."
          : `${interval.start} ≥ ${lastEnd}, so it does not overlap the last kept interval.`;
      kept.push(interval.id);
      steps.push({ ...interval, decision: "Keep", reason });
      lastEnd = interval.end;
    } else {
      removed.push(interval.id);
      steps.push({
        ...interval,
        decision: "Remove",
        reason: `${interval.start} < ${lastEnd}, so it overlaps the last kept interval.`,
      });
    }
  }
  return { kept, removed, steps };
}

export default function App() {
  const [raw, setRaw] = useState(EXAMPLE);
  const [result, setResult] = useState(null);
  const [nextStart, setNextStart] = useState("6");
  const [nextEnd, setNextEnd] = useState("8");

  const { intervals, errors } = useMemo(() => parseIntervals(raw), [raw]);
  const answer = useMemo(() => solve(intervals), [intervals]);
  const min = intervals.length ? Math.min(...intervals.map((x) => x.start)) : 0;
  const max = intervals.length ? Math.max(...intervals.map((x) => x.end)) : 5;
  const range = Math.max(max - min, 1);
  const x = (value) => 90 + ((value - min) / range) * 690;

  function updateRaw(value) {
    setRaw(value);
    setResult(null);
  }

  function addInterval() {
    const start = Number(nextStart);
    const end = Number(nextEnd);
    if (nextStart.trim() === "" || nextEnd.trim() === "" ||
        !Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      return;
    }
    updateRaw(raw.trim() ? `${raw.trim()}\n${start}, ${end}` : `${start}, ${end}`);
  }

  const hasValidAnswer = intervals.length > 0 && errors.length === 0;

  return (
    <main className="page">
      <header className="hero">
        <div className="eyebrow">DSA • GREEDY ALGORITHMS</div>
        <h1>Non-Overlapping Intervals</h1>
        <p>Visualize the intervals, run the greedy algorithm, and see exactly what to remove.</p>
      </header>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>1. Enter intervals</h2>
            <p>One interval per line. Use <code>start, end</code> format.</p>
          </div>
          <button className="text-button" onClick={() => updateRaw(EXAMPLE)}>Reset example</button>
        </div>

        <label className="sr-only" htmlFor="intervals">Intervals</label>
        <textarea
          id="intervals"
          value={raw}
          onChange={(event) => updateRaw(event.target.value)}
          spellCheck="false"
          placeholder={"1, 3\n2, 4\n3, 5"}
        />

        {errors.length > 0 && (
          <div className="error-list" role="alert">
            {errors.map((error) => <div key={error}>{error}</div>)}
          </div>
        )}

        <div className="add-row">
          <span className="muted">Add interval</span>
          <input aria-label="New interval start" type="number" value={nextStart} onChange={(e) => setNextStart(e.target.value)} />
          <span>to</span>
          <input aria-label="New interval end" type="number" value={nextEnd} onChange={(e) => setNextEnd(e.target.value)} />
          <button className="secondary-button" onClick={addInterval}>+ Add</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>2. Timeline</h2>
            <p>Intervals update as you type.</p>
          </div>
          <span className="count-pill">{intervals.length} intervals</span>
        </div>

        {intervals.length === 0 ? (
          <div className="empty-state">Enter a valid interval to see it here.</div>
        ) : (
          <div className="timeline-wrap">
            <svg viewBox={`0 0 820 ${Math.max(150, intervals.length * 54 + 55)}`} role="img" aria-label="Timeline showing each interval">
              {Array.from({ length: 6 }, (_, i) => {
                const value = min + (range * i) / 5;
                const px = 90 + (690 * i) / 5;
                return (
                  <g key={i}>
                    <line x1={px} y1="18" x2={px} y2={intervals.length * 54 + 30} className="grid-line" />
                    <text x={px} y="14" textAnchor="middle" className="axis-label">{Number(value.toFixed(2))}</text>
                  </g>
                );
              })}
              {intervals.map((interval, index) => {
                const isKept = result && result.kept.includes(interval.id);
                const isRemoved = result && result.removed.includes(interval.id);
                const color = isKept ? "#16835d" : isRemoved ? "#d94b4b" : "#3779d6";
                const y = 42 + index * 54;
                return (
                  <g key={interval.id}>
                    <text x="12" y={y + 5} className="interval-label">I{interval.id}</text>
                    <line x1={x(interval.start)} y1={y} x2={x(interval.end)} y2={y} stroke={color} strokeWidth="9" strokeLinecap="round" />
                    <circle cx={x(interval.start)} cy={y} r="5" fill={color} />
                    <circle cx={x(interval.end)} cy={y} r="5" fill={color} />
                    <text x={(x(interval.start) + x(interval.end)) / 2} y={y - 12} textAnchor="middle" className="interval-value">
                      [{interval.start}, {interval.end}]
                    </text>
                    {result && <text x="798" y={y + 5} textAnchor="end" className="status-label" fill={color}>{isKept ? "KEEP" : isRemoved ? "REMOVE" : ""}</text>}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
        <div className="legend">
          <span><i className="dot blue" /> Not evaluated</span>
          <span><i className="dot green" /> Keep</span>
          <span><i className="dot red" /> Remove</span>
        </div>

        <button
          className="primary-button"
          disabled={!hasValidAnswer}
          onClick={() => setResult(answer)}
        >
          Find Minimum Removals
        </button>
      </section>

      {result && (
        <section className="panel results" aria-live="polite">
          <div className="section-heading">
            <div>
              <h2>3. Result</h2>
              <p>Minimum removals needed to make all remaining intervals non-overlapping.</p>
            </div>
            <span className="success-pill">Solved</span>
          </div>

          <div className="stats">
            <div className="stat-card">
              <span>Minimum removals</span>
              <strong>{result.removed.length}</strong>
            </div>
            <div className="stat-card">
              <span>Intervals kept</span>
              <strong>{result.kept.length}</strong>
            </div>
          </div>

          <div className="answer-block">
            <h3>Intervals to keep</h3>
            <div className="chips">
              {result.kept.map((id) => {
                const interval = intervals.find((item) => item.id === id);
                return <span className="chip keep-chip" key={id}>I{id}: [{interval.start}, {interval.end}]</span>;
              })}
            </div>
          </div>

          <div className="answer-block">
            <h3>Intervals to remove</h3>
            <div className="chips">
              {result.removed.length ? result.removed.map((id) => {
                const interval = intervals.find((item) => item.id === id);
                return <span className="chip remove-chip" key={id}>I{id}: [{interval.start}, {interval.end}]</span>;
              }) : <p className="muted">None — all intervals can be kept.</p>}
            </div>
          </div>

          <div className="answer-block">
            <h3>Greedy walkthrough</h3>
            <p className="muted">The algorithm processes intervals in increasing order of end time.</p>
            <div className="steps">
              {result.steps.map((step, index) => (
                <article className="step" key={step.id}>
                  <div className="step-top">
                    <strong>Step {index + 1}: I{step.id} [{step.start}, {step.end}]</strong>
                    <span className={`decision ${step.decision.toLowerCase()}`}>{step.decision}</span>
                  </div>
                  <p>{step.reason}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer>
        <strong>Greedy intuition:</strong> keep the compatible interval that finishes earliest.
        <span>Touching endpoints are allowed: [1, 3] and [3, 5] do not overlap.</span>
      </footer>
    </main>
  );
}
