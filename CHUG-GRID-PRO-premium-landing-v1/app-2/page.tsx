"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Step = "" | "X" | "U" | "G" | "A";

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
      ? i % 5 === 0
        ? "U"
        : "X"
      : ""
  );
}

function playBlip(ctx: AudioContext, type: Step, isDownbeat: boolean) {
  if (!type && !isDownbeat) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  const baseFreq =
    type === "A" ? 190 :
    type === "U" ? 150 :
    type === "G" ? 95 :
    type === "X" ? 115 :
    720;

  osc.type = type === "G" ? "triangle" : "square";
  osc.frequency.setValueAtTime(isDownbeat && !type ? 780 : baseFreq, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type ? 850 : 1800, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === "A" ? 0.22 : isDownbeat ? 0.12 : 0.15, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === "G" ? 0.045 : 0.075));

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

export default function Page() {
  const [steps, setSteps] = useState<Step[]>(makeInitialPattern);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBars, setTargetBars] = useState(7);
  const [diceResult, setDiceResult] = useState<number[]>([5, 3, 4, 6, 2, 5]);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const currentStepRef = useRef(0);
  const stepsRef = useRef(steps);
  const bpmRef = useRef(bpm);

  const activeCount = useMemo(() => steps.filter(Boolean).length, [steps]);
  const totalSteps = targetBars * 16;
  const currentBar = Math.floor(stepIndex / 16) + 1;
  const currentSixteenth = (stepIndex % 16) + 1;
  const playAngle = (stepIndex / Math.max(totalSteps, 1)) * 360;
  const pulseAngle = ((stepIndex % 16) / 16) * 360;
  const riffAngle = ((stepIndex % 23) / 23) * 360;

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      audioRef.current?.close();
    };
  }, []);

  function ensureAudio() {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    if (audioRef.current.state === "suspended") {
      audioRef.current.resume();
    }
    return audioRef.current;
  }

  function toggleStep(index: number) {
    setSteps((current) => current.map((value, i) => (i === index ? nextStep(value) : value)));
  }

  function clearGrid() {
    stop();
    setSteps(Array.from({ length: 64 }, () => ""));
    setStepIndex(0);
    currentStepRef.current = 0;
  }

  function generateDiceRiff() {
    const dice = Array.from({ length: 6 }, () => Math.floor(Math.random() * 6) + 1);
    const next = Array.from({ length: 64 }, () => "") as Step[];
    let cursor = 0;
    let diceIndex = 0;

    while (cursor < next.length) {
      next[cursor] = cursor % 5 === 0 ? "U" : "X";
      cursor += dice[diceIndex % dice.length];
      diceIndex++;
    }

    setDiceResult(dice);
    setSteps(next);
    setStepIndex(0);
    currentStepRef.current = 0;
  }

  function generateTargetRiff() {
    const target = targetBars * 16;
    const candidates = [5, 7, 9, 10, 11, 13, 14, 17, 19, 23, 25, 29].filter((n) => target % n !== 0 || n > 16);
    const cycleLength = candidates[Math.floor(Math.random() * candidates.length)] ?? 23;

    const next = Array.from({ length: 64 }, () => "") as Step[];
    let cursor = 0;
    const jumps = [3, 5, 7, 2, 6, 4];

    while (cursor < next.length) {
      next[cursor] = cursor % 8 === 0 ? "A" : cursor % 5 === 0 ? "U" : "X";
      cursor += jumps[cursor % jumps.length] ?? 5;
      if (cursor >= cycleLength && cursor < cycleLength + 4) cursor = cycleLength + 1;
    }

    setSteps(next);
    setStepIndex(0);
    currentStepRef.current = 0;
  }

  function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  }

  function play() {
    stop();
    const ctx = ensureAudio();
    setPlaying(true);

    const tick = () => {
      const index = currentStepRef.current % stepsRef.current.length;
      const value = stepsRef.current[index];
      const isDownbeat = index % 16 === 0;

      playBlip(ctx, value, isDownbeat);
      setStepIndex(index);

      currentStepRef.current = (index + 1) % stepsRef.current.length;
    };

    tick();
    const intervalMs = (60_000 / bpmRef.current) / 4;
    timerRef.current = window.setInterval(tick, intervalMs);
  }

  function stepOnce() {
    const ctx = ensureAudio();
    const index = currentStepRef.current % steps.length;
    playBlip(ctx, steps[index], index % 16 === 0);
    setStepIndex(index);
    currentStepRef.current = (index + 1) % steps.length;
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
        <a className="navCta" href="#app">Rhythm Engine V2</a>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="kicker">RHYTHM LAB FOR MODERN METAL</div>
          <h1>Visualize rhythm beyond time.</h1>
          <p>
            CHUG-GRID is now playable: edit the grid, generate cyclic riffs,
            hit play, and watch the pulse move through the pattern.
          </p>
          <div className="heroActions">
            <a className="primary" href="#app">Open rhythm lab</a>
            <a className="secondary" href="#features">Explore features</a>
          </div>
        </div>

        <div className="heroInstrument" id="app">
          <div className="topStrip">
            <span>{playing ? "PLAYING" : "ORBIT ENGINE"}</span>
            <span>{activeCount} hits · step {stepIndex + 1}/64 · bar {currentBar}</span>
          </div>

          <div className="orbitalStage">
            <div className="orbit orbitOuter" />
            <div className="orbit orbitMiddle" />
            <div className="orbit orbitInner" />
            <div className="hand handPulse" style={{ transform: `rotate(${pulseAngle}deg)` }} />
            <div className="hand handRiff" style={{ transform: `rotate(${riffAngle}deg)` }} />
            <div className="hand handBar" style={{ transform: `rotate(${playAngle}deg)` }} />
            {Array.from({ length: 12 }, (_, i) => <i key={i} className={`orbDot dot${i}`} />)}
            <div className="centerReadout">
              <span>BAR</span>
              <strong>{currentBar} / {targetBars}</strong>
              <em>step {currentSixteenth}/16 · riff cycle 23/16</em>
            </div>
          </div>

          <div className="transportDock">
            <div className="bpmControl">
              <label>BPM</label>
              <input
                type="number"
                min="40"
                max="260"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </div>

            <div className="bpmControl">
              <label>Target bars</label>
              <input
                type="number"
                min="1"
                max="32"
                value={targetBars}
                onChange={(event) => setTargetBars(Number(event.target.value))}
              />
            </div>

            <button type="button" className="playButton" onClick={play}>PLAY</button>
            <button type="button" onClick={stop}>STOP</button>
            <button type="button" onClick={stepOnce}>STEP</button>
          </div>

          <div className="controlDock">
            <div><label>Dice</label><b>{diceResult.join(" · ")}</b></div>
            <button type="button" onClick={generateDiceRiff}>ROLL RIFF</button>
            <button type="button" onClick={generateTargetRiff}>TARGET RIFF</button>
            <button type="button" onClick={clearGrid}>CLEAR</button>
          </div>

          <div className="gridToolbar">
            <span>Click cells: empty → X → U → G → A</span>
            <span>X chug · U upstroke · G ghost · A accent</span>
          </div>

          <div className="beatLabels">
            {Array.from({ length: 4 }, (_, bar) => (
              <div key={bar} className="beatLabel">
                {labels.map((label, i) => <span key={`${bar}-${i}`}>{label}</span>)}
              </div>
            ))}
          </div>

          <div className="miniGrid interactiveGrid">
            {steps.map((value, i) => (
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
            Pick a target realignment — 5, 7, 11 bars — and CHUG-GRID proposes
            playable picking grids that you can edit immediately.
          </p>
        </div>
        <div className="statPanel">
          <div><span>Riff Cycle</span><b>23/16</b></div>
          <div><span>Bar Cycle</span><b>16/16</b></div>
          <div><span>Current Bar</span><b>{currentBar}/{targetBars}</b></div>
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
