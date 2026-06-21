"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Step = "" | "X" | "U" | "G" | "A";

const BAR_STEPS = 16;
const stepCycle: Step[] = ["", "X", "U", "G", "A"];
const labels = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];

const features = [
  ["Orbit View", "Pulse, riff cycle and bar realignment shown as rotating musical timelines."],
  ["Grid View", "16th-note guitar-first sequencer with chugs, ghosts, upstrokes and accents."],
  ["Target Realign", "Choose where the riff returns to the one. CHUG-GRID generates the cycle."],
  ["Dice Engine", "Roll 3–6 rhythmic values and generate polymetric loops instantly."],
  ["Practice Mode", "Loop strange patterns and feel where the one comes back."],
  ["Export Ready", "Designed for future MIDI and Guitar Pro workflows."]
];

function nextStep(value: Step): Step {
  const index = stepCycle.indexOf(value);
  return stepCycle[(index + 1) % stepCycle.length];
}

function makeInitialPattern(): Step[] {
  return Array.from({ length: 64 }, (_, i) =>
    [0, 2, 5, 8, 13, 18, 21, 26, 31, 35, 39, 44, 48, 52, 57, 61].includes(i)
      ? i % 5 === 0 ? "U" : "X"
      : ""
  );
}

function fitStepsToLoop(steps: Step[], loopLength: number): Step[] {
  const length = Math.max(1, Math.floor(loopLength));
  if (steps.length === length) return steps;
  if (steps.length === 0) return Array.from({ length }, () => "");
  return Array.from({ length }, (_, index) => steps[index % steps.length]);
}

function playHit(ctx: AudioContext, type: Step, metronome: boolean, isQuarter: boolean, isOne: boolean) {
  const now = ctx.currentTime;

  if (metronome && isQuarter) {
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(isOne ? 1200 : 800, now);
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(isOne ? 0.12 : 0.07, now + 0.004);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.05);
  }

  if (!type) return;

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "A" ? 1200 : type === "U" ? 900 : type === "G" ? 450 : 650, now);
  filter.Q.setValueAtTime(type === "A" ? 2 : 0.7, now);

  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(type === "A" ? 92 : type === "U" ? 76 : 64, now);
  thump.frequency.exponentialRampToValueAtTime(42, now + 0.07);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === "A" ? 0.34 : type === "G" ? 0.08 : 0.22, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === "G" ? 0.035 : 0.09));

  thumpGain.gain.setValueAtTime(type === "A" ? 0.16 : 0.09, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  thump.connect(thumpGain);
  thumpGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.09);
  thump.start(now);
  thump.stop(now + 0.09);
}

export default function Page() {
  const [steps, setSteps] = useState<Step[]>(makeInitialPattern);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBars, setTargetBars] = useState(7);
  const [metronome, setMetronome] = useState(true);
  const [diceResult, setDiceResult] = useState<number[]>([5, 3, 4, 6, 2, 5]);

  const safeTargetBars = Math.max(1, Math.min(32, Number.isFinite(targetBars) ? Math.floor(targetBars) : 1));
  const loopLength = safeTargetBars * BAR_STEPS;
  const loopSteps = useMemo(() => fitStepsToLoop(steps, loopLength), [steps, loopLength]);

  const timeoutRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nextStepRef = useRef(0);
  const playingRef = useRef(false);
  const loopStepsRef = useRef(loopSteps);
  const loopLengthRef = useRef(loopLength);
  const bpmRef = useRef(bpm);
  const metronomeRef = useRef(metronome);

  const activeCount = useMemo(() => loopSteps.filter(Boolean).length, [loopSteps]);
  const currentBar = Math.floor(stepIndex / BAR_STEPS) + 1;
  const currentSixteenth = (stepIndex % BAR_STEPS) + 1;
  const playAngle = (stepIndex / Math.max(loopLength, 1)) * 360;
  const pulseAngle = ((stepIndex % BAR_STEPS) / BAR_STEPS) * 360;
  const riffAngle = ((stepIndex % 23) / 23) * 360;

  useEffect(() => { loopStepsRef.current = loopSteps; }, [loopSteps]);
  useEffect(() => { loopLengthRef.current = loopLength; }, [loopLength]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { metronomeRef.current = metronome; }, [metronome]);

  useEffect(() => {
    if (stepIndex >= loopLength) {
      nextStepRef.current = 0;
      setStepIndex(0);
    }
  }, [stepIndex, loopLength]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      audioRef.current?.close();
    };
  }, []);

  function ensureAudio() {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function tick() {
    if (!playingRef.current) return;

    const ctx = ensureAudio();
    const index = nextStepRef.current % loopLengthRef.current;
    const value = loopStepsRef.current[index] ?? "";
    const isQuarter = index % 4 === 0;
    const isOne = index % BAR_STEPS === 0;

    playHit(ctx, value, metronomeRef.current, isQuarter, isOne);
    setStepIndex(index);

    nextStepRef.current = (index + 1) % loopLengthRef.current;

    const intervalMs = (60_000 / Math.max(40, bpmRef.current)) / 4;
    timeoutRef.current = window.setTimeout(tick, intervalMs);
  }

  function play() {
    if (playingRef.current) return;
    ensureAudio();
    playingRef.current = true;
    setPlaying(true);
    tick();
  }

  function stop() {
    playingRef.current = false;
    setPlaying(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function reset() {
    stop();
    nextStepRef.current = 0;
    setStepIndex(0);
  }

  function stepOnce() {
    const ctx = ensureAudio();
    const index = nextStepRef.current % loopLengthRef.current;
    const value = loopStepsRef.current[index] ?? "";
    playHit(ctx, value, metronome, index % 4 === 0, index % BAR_STEPS === 0);
    setStepIndex(index);
    nextStepRef.current = (index + 1) % loopLengthRef.current;
  }

  function toggleStep(index: number) {
    setSteps((current) => fitStepsToLoop(current, loopLength).map((value, i) => (i === index ? nextStep(value) : value)));
  }

  function clearGrid() {
    stop();
    setSteps(Array.from({ length: loopLength }, () => ""));
    nextStepRef.current = 0;
    setStepIndex(0);
  }

  function generateDiceRiff() {
    const dice = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);
    const next = Array.from({ length: 64 }, () => "") as Step[];
    let cursor = 0;
    let diceIndex = 0;

    while (cursor < next.length) {
      next[cursor] = cursor % 8 === 0 ? "A" : cursor % 5 === 0 ? "U" : "X";
      cursor += dice[diceIndex % dice.length];
      diceIndex++;
    }

    setDiceResult(dice);
    setSteps(next);
    nextStepRef.current = 0;
    setStepIndex(0);
  }

  function generateTargetRiff() {
    const total = loopLength;
    const cycleCandidates = [5, 7, 9, 11, 13, 17, 19, 23, 29, 31].filter((n) => n < total && total % n !== 0);
    const cycle = cycleCandidates[Math.floor(Math.random() * cycleCandidates.length)] ?? 23;

    const grouping = [3, 5, 2, 4, 6, 7];
    const next = Array.from({ length: 64 }, () => "") as Step[];
    let pos = 0;
    let groupIndex = 0;

    while (pos < next.length) {
      next[pos] = pos % cycle === 0 ? "A" : groupIndex % 3 === 0 ? "U" : "X";
      pos += grouping[groupIndex % grouping.length];
      groupIndex++;
    }

    setDiceResult(grouping);
    setSteps(next);
    nextStepRef.current = 0;
    setStepIndex(0);
  }

  return (
    <main className="site">
      <nav className="nav">
        <div className="brandMark">CG</div>
        <div className="navLinks">
          <a href="#app">App</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a className="navCta" href="#app">Rhythm Engine V3</a>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="kicker">RHYTHM LAB FOR MODERN METAL</div>
          <h1>Visualize rhythm beyond time.</h1>
          <p>
            CHUG-GRID is playable: edit the grid, generate cyclic riffs, hit play,
            and watch the pulse move through the pattern.
          </p>
          <div className="heroActions">
            <a className="primary" href="#app">Open rhythm lab</a>
            <a className="secondary" href="#features">Explore features</a>
          </div>
        </div>

        <div className="heroInstrument" id="app">
          <div className="topStrip">
            <span>{playing ? "PLAYING" : "READY"}</span>
            <span>{activeCount} hits · step {stepIndex + 1}/{loopLength} · bar {currentBar}/{safeTargetBars}</span>
          </div>

          <div className="orbitalStage">
            <div className="orbit orbitOuter" />
            <div className="orbit orbitMiddle" />
            <div className="orbit orbitInner" />
            <div className="hand handPulse" style={{ transform: `rotate(${pulseAngle}deg)` }} />
            <div className="hand handRiff" style={{ transform: `rotate(${riffAngle}deg)` }} />
            <div className="hand handBar" style={{ transform: `rotate(${playAngle}deg)` }} />
            {loopSteps.map((value, i) => value && (
              <i
                key={i}
                className={`orbDot type${value} ${i === 0 ? "cycleStart" : ""} ${i % BAR_STEPS === 0 ? "barStart" : ""} ${i === stepIndex ? "current" : ""}`}
                style={{ transform: `rotate(${(i / loopLength) * 360}deg) translateY(var(--orbit-dot-radius))` }}
              />
            ))}
            <div className="centerReadout">
              <span>BAR</span>
              <strong>{currentBar} / {safeTargetBars}</strong>
              <em>step {currentSixteenth}/16 · loop {loopLength} steps</em>
            </div>
          </div>

          <div className="transportDock">
            <div className="bpmControl">
              <label>BPM</label>
              <input type="number" min="40" max="260" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
            </div>
            <div className="bpmControl">
              <label>Target bars</label>
              <input type="number" min="1" max="32" value={targetBars} onChange={(e) => setTargetBars(Number(e.target.value))} />
            </div>
            <button type="button" className="playButton" onClick={play}>PLAY</button>
            <button type="button" onClick={stop}>STOP</button>
            <button type="button" onClick={reset}>RESET</button>
            <button type="button" onClick={stepOnce}>STEP</button>
            <button type="button" className={metronome ? "toggleOn" : ""} onClick={() => setMetronome(!metronome)}>
              CLICK {metronome ? "ON" : "OFF"}
            </button>
          </div>

          <div className="controlDock">
            <div><label>Grouping</label><b>{diceResult.join(" · ")}</b></div>
            <button type="button" onClick={generateDiceRiff}>ROLL RIFF</button>
            <button type="button" onClick={generateTargetRiff}>TARGET RIFF</button>
            <button type="button" onClick={clearGrid}>CLEAR</button>
          </div>

          <div className="gridToolbar">
            <span>Click cells: empty → X → U → G → A</span>
            <span>X chug · U upstroke · G ghost · A accent</span>
          </div>

          <div className="beatLabels">
            {Array.from({ length: safeTargetBars }, (_, bar) => (
              <div key={bar} className="beatLabel">
                {labels.map((label, i) => <span key={`${bar}-${i}`}>{label}</span>)}
              </div>
            ))}
          </div>

          <div className="miniGrid interactiveGrid">
            {loopSteps.map((value, i) => (
              <button
                type="button"
                key={i}
                onClick={() => toggleStep(i)}
                className={`cell stepButton ${value ? "active" : ""} ${value ? `type${value}` : ""} ${i === stepIndex ? "playhead" : ""}`}
                aria-label={`Step ${i + 1}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="sectionHeader">
          <span>PREMIUM WORKFLOW</span>
          <h2>Built like an instrument, not a calculator.</h2>
        </div>
        <div className="featureGrid">
          {features.map(([title, text]) => (
            <article className="featureCard" key={title}>
              <div className="featureIcon" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase">
        <div>
          <span className="kicker">MESHUGGAH MODE</span>
          <h2>Tell it where to return. Let it generate the chaos.</h2>
          <p>
            Pick a target realignment — 5, 7, 11 bars — and CHUG-GRID proposes playable picking grids.
          </p>
        </div>
        <div className="statPanel">
          <div><span>Riff Cycle</span><b>23/16</b></div>
          <div><span>Bar Cycle</span><b>16/16</b></div>
          <div><span>Current Bar</span><b>{currentBar}/{safeTargetBars}</b></div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="priceCard">
          <span>FREE</span>
          <h3>Sketch</h3>
          <p>Orbit, grid, dice and basic playback.</p>
          <button>Start free</button>
        </div>
        <div className="priceCard pro">
          <span>PRO</span>
          <h3>Studio</h3>
          <p>Audio Detective, advanced export, cloud presets and AI riff tools.</p>
          <button>Coming soon</button>
        </div>
      </section>
    </main>
  );
}