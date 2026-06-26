"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Step = "" | "X" | "U" | "G" | "A";
type MeterId = "3/4" | "4/4" | "5/4" | "6/8" | "7/8" | "9/8";
type RiffPreset = {
  
  version: 1;
  bpm: number;
  targetBars: number;
    meter: MeterId;
  metronome: boolean;
  diceResult: number[];
  diceRollCount: number;
  sequenceInput: string;
  steps: Step[];
};
type SavedPreset = RiffPreset & {
  id: string;
  name: string;
  savedAt: string;
};

const PRESET_STORAGE_KEY = "chug-grid-presets-v1";
const meters: Record<MeterId, { label: string; barSteps: number; beatLabels: string[] }> = {
  "3/4": { label: "3/4", barSteps: 12, beatLabels: ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a"] },
  "4/4": { label: "4/4", barSteps: 16, beatLabels: ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"] },
  "5/4": { label: "5/4", barSteps: 20, beatLabels: ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a", "5", "e", "&", "a"] },
  "6/8": { label: "6/8", barSteps: 12, beatLabels: ["1", "&", "a", "2", "&", "a", "3", "&", "a", "4", "&", "a"] },
  "7/8": { label: "7/8", barSteps: 14, beatLabels: ["1", "&", "2", "&", "3", "&", "4", "&", "5", "&", "6", "&", "7", "&"] },
  "9/8": { label: "9/8", barSteps: 18, beatLabels: ["1", "&", "2", "&", "3", "&", "4", "&", "5", "&", "6", "&", "7", "&", "8", "&", "9", "&"] }
};
const groupValues = [2, 3, 4, 5, 6, 7, 9, 11];
const stepCycle: Step[] = ["", "X", "U", "G", "A"];


const features = [
  ["Orbit View", "Pulse, riff cycle and bar realignment shown as rotating musical timelines."],
  ["Grid View", "16th-note guitar-first sequencer with chugs, ghosts, upstrokes and accents."],
  ["Target Realign", "Choose where the riff returns to the one. CHUG-GRID generates the cycle."],
  ["Dice Engine", "Roll 3-6 rhythmic values and generate polymetric loops instantly."],
  ["Preset Library", "Save riffs locally, reload ideas instantly and share playable riff links."],
  ["Export Tools", "Download MIDI or MusicXML loops for DAWs, notation apps and guitar workflows."]
];

const supportCards = [
  {
    label: "SUPPORT",
    title: "Help keep CHUG-GRID alive",
    text: "Send a one-off tip if the rhythm engine helps you write, practice or break out of the same riff shapes.",
    action: "Support on PayPal",
    href: "https://paypal.me/ironreykh"
  },
  {
    label: "PACKS",
    title: "Free MIDI starter pack",
    text: "Download 10 odd-meter metal riff loops as MIDI and MusicXML files for DAWs, notation apps and writing sessions.",
    action: "Download free pack",
    href: "https://matteoferraro.gumroad.com/l/inznd"
  },
  {
    label: "GEAR",
    title: "Affiliate picks for metal writing",
    text: "When Reverb approves the partner request, this becomes a curated gear page for guitars, pedals and studio tools.",
    action: "Pending Reverb",
    href: ""
  }
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

function makeGroupedPattern(groups: number[], loopLength: number, barSteps: number): Step[] {
  const next = Array.from({ length: loopLength }, () => "") as Step[];
  let cursor = 0;
  let groupIndex = 0;

  while (cursor < next.length) {
    next[cursor] =
      cursor % barSteps === 0
        ? "A"
        : groupIndex % 5 === 3
          ? "G"
          : groupIndex % 3 === 1
            ? "U"
            : "X";

    cursor += groups[groupIndex % groups.length];
    groupIndex++;
  }

  return next;
}
function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  if (!a || !b) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

function findPatternCycle(steps: Step[]): number {
  const hits = steps
    .map((value, index) => value ? index : -1)
    .filter((index) => index >= 0);

  if (hits.length < 2) return steps.length;

  const gaps = hits.map((hit, index) => {
    const nextHit = hits[(index + 1) % hits.length] ?? hit;
    return (nextHit - hit + steps.length) % steps.length || steps.length;
  });

  const first = gaps.join(",");
  for (let size = 1; size <= Math.ceil(gaps.length / 2); size++) {
    if (gaps.length % size !== 0) continue;
    const chunk = gaps.slice(0, size).join(",");
    const repeated = Array.from({ length: gaps.length / size }, () => chunk).join(",");
    if (repeated === first) {
      return gaps.slice(0, size).reduce((sum, value) => sum + value, 0);
    }
  }

  return steps.length;
}
function parseSequence(input: string): number[] {
  return input
    .split(/[\s,;.-]+/)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 32);
}
function isMeterId(value: unknown): value is MeterId {
  return value === "3/4" || value === "4/4" || value === "5/4" || value === "6/8" || value === "7/8" || value === "9/8";
}
function isStep(value: unknown): value is Step {
        
  return value === "" || value === "X" || value === "U" || value === "G" || value === "A";
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function sanitizeNumberList(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value.map(Number).filter((item) => Number.isFinite(item) && item > 0 && item <= 32);
  return next.length ? next : fallback;
}

function sanitizeSteps(value: unknown): Step[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => isStep(item) ? item : "");
}

function encodePreset(preset: RiffPreset): string {
  return btoa(JSON.stringify(preset)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodePreset(value: string): RiffPreset | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as Partial<RiffPreset>;
    const steps = sanitizeSteps(parsed.steps);

    if (!steps) return null;

    return {
      version: 1,
      bpm: clampNumber(parsed.bpm, 120, 40, 260),
      targetBars: clampNumber(parsed.targetBars, 7, 1, 32),
            meter: isMeterId(parsed.meter) ? parsed.meter : "4/4",
      metronome: Boolean(parsed.metronome),
      diceResult: sanitizeNumberList(parsed.diceResult, [5, 3, 4, 6, 2, 5]),
      diceRollCount: clampNumber(parsed.diceRollCount, 6, 3, 6),
      sequenceInput: typeof parsed.sequenceInput === "string" ? parsed.sequenceInput : "5 3 4 6 2 5",
      steps
    };
  } catch {
    return null;
  }
}
type MidiEvent = {
  tick: number;
  order: number;
  data: number[];
};

function midiUint32(value: number): number[] {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ];
}

function midiVariableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];

  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 255);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }

  return bytes;
}

function createMidiBlob(steps: Step[], bpm: number, meter: MeterId): Blob {
  const ppq = 480;
  const ticksPerStep = ppq / 4;
  const noteLength = Math.round(ticksPerStep * 0.8);
  const [numerator, denominator] = meter.split("/").map(Number);
  const tempo = Math.round(60_000_000 / Math.max(40, Math.min(260, bpm)));
  const denominatorPower = Math.round(Math.log2(denominator));
  const clocksPerClick =
    denominator === 8 && numerator % 3 === 0
      ? 36
      : denominator === 8
        ? 12
        : 24;

  const velocities = {
    X: 100,
    U: 84,
    G: 42,
    A: 127
  };

  const events: MidiEvent[] = [
    {
      tick: 0,
      order: 0,
      data: [
        0xff, 0x51, 0x03,
        (tempo >>> 16) & 255,
        (tempo >>> 8) & 255,
        tempo & 255
      ]
    },
    {
      tick: 0,
      order: 1,
      data: [
        0xff, 0x58, 0x04,
        numerator,
        denominatorPower,
        clocksPerClick,
        8
      ]
    }
  ];

  steps.forEach((step, index) => {
    if (!step) return;

    const tick = index * ticksPerStep;
    events.push(
      {
        tick,
        order: 3,
        data: [0x90, 40, velocities[step]]
      },
      {
        tick: tick + noteLength,
        order: 2,
        data: [0x80, 40, 0]
      }
    );
  });

  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const track: number[] = [];
  let previousTick = 0;

  events.forEach((event) => {
    track.push(
      ...midiVariableLength(event.tick - previousTick),
      ...event.data
    );
    previousTick = event.tick;
  });

  const loopEnd = steps.length * ticksPerStep;
  track.push(
    ...midiVariableLength(Math.max(0, loopEnd - previousTick)),
    0xff, 0x2f, 0x00
  );

  const bytes = Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64,
    ...midiUint32(6),
    0x00, 0x00,
    0x00, 0x01,
    (ppq >>> 8) & 255,
    ppq & 255,
    0x4d, 0x54, 0x72, 0x6b,
    ...midiUint32(track.length),
    ...track
  ]);

  return new Blob([bytes.buffer], { type: "audio/midi" });
}
function createMusicXml(steps: Step[], bpm: number, meter: MeterId): Blob {
  const [numerator, denominator] = meter.split("/").map(Number);
  const divisions = 4;
  const stepDuration = denominator === 8 ? 2 : 1;
  const noteType = denominator === 8 ? "eighth" : "16th";
  const stepsPerBar = numerator * (denominator === 8 ? 2 : 4);
  const measureCount = Math.ceil(steps.length / stepsPerBar);
  const safeBpm = Math.max(40, Math.min(260, Math.round(bpm)));

  const measures = Array.from({ length: measureCount }, (_, measureIndex) => {
    const notes = Array.from({ length: stepsPerBar }, (_, stepIndex) => {
      const step = steps[measureIndex * stepsPerBar + stepIndex] ?? "";

      if (!step) {
        return `<note><rest/><duration>${stepDuration}</duration><voice>1</voice><type>${noteType}</type></note>`;
      }

      const notehead =
        step === "G" ? `<notehead parentheses="yes">x</notehead>` : "";

      const notation =
        step === "A"
          ? `<notations><articulations><accent/></articulations></notations>`
          : step === "U"
            ? `<notations><articulations><up-bow/></articulations></notations>`
            : "";

      return `<note>
<pitch><step>E</step><octave>2</octave></pitch>
<duration>${stepDuration}</duration>
<voice>1</voice>
<type>${noteType}</type>
${notehead}${notation}
</note>`;
    }).join("");

    const setup =
      measureIndex === 0
        ? `<attributes>
<divisions>${divisions}</divisions>
<key><fifths>0</fifths></key>
<time><beats>${numerator}</beats><beat-type>${denominator}</beat-type></time>
<clef><sign>G</sign><line>2</line></clef>
</attributes>
<direction placement="above">
<direction-type>
<metronome><beat-unit>quarter</beat-unit><per-minute>${safeBpm}</per-minute></metronome>
</direction-type>
<sound tempo="${safeBpm}"/>
</direction>`
        : "";

    return `<measure number="${measureIndex + 1}">${setup}${notes}</measure>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
<work><work-title>CHUG-GRID Riff</work-title></work>
<part-list>
<score-part id="P1">
<part-name>CHUG-GRID Guitar</part-name>
<score-instrument id="P1-I1">
<instrument-name>Electric Guitar</instrument-name>
</score-instrument>
<midi-instrument id="P1-I1">
<midi-channel>1</midi-channel>
<midi-program>31</midi-program>
</midi-instrument>
</score-part>
</part-list>
<part id="P1">${measures}</part>
</score-partwise>`;

  return new Blob([xml], {
    type: "application/vnd.recordare.musicxml+xml"
  });
}
function playHit(ctx: AudioContext, type: Step, metronome: boolean, isQuarter: boolean, isOne: boolean) {
  const now = ctx.currentTime;

  if (metronome && isQuarter) {
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(isOne ? 1200 : 800, now);
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(isOne ? 0.045 : 0.025, now + 0.004);
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
    const [meter, setMeter] = useState<MeterId>("4/4");
  const [metronome, setMetronome] = useState(true);
  const [diceResult, setDiceResult] = useState<number[]>([5, 3, 4, 6, 2, 5]);
  const [diceRollCount, setDiceRollCount] = useState(6);
  const [sequenceInput, setSequenceInput] = useState("5 3 4 6 2 5");
  const [shareStatus, setShareStatus] = useState("");
  const [presetName, setPresetName] = useState("My riff");
const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
const [selectedPresetId, setSelectedPresetId] = useState("");
  const [randomDensity, setRandomDensity] = useState(55);
const [randomComplexity, setRandomComplexity] = useState(60);

   const meterInfo = meters[meter];
  const barSteps = meterInfo.barSteps;
  const labels = meterInfo.beatLabels;
  const beatCount = Number(meter.split("/")[0]);
  const safeTargetBars = Math.max(1, Math.min(32, Number.isFinite(targetBars) ? Math.floor(targetBars) : 1));
  const loopLength = safeTargetBars * barSteps;
  const loopSteps = useMemo(() => fitStepsToLoop(steps, loopLength), [steps, loopLength]);

  const timeoutRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nextStepRef = useRef(0);
  const playingRef = useRef(false);
  const loopStepsRef = useRef(loopSteps);
  const loopLengthRef = useRef(loopLength);
  const bpmRef = useRef(bpm);
  const metronomeRef = useRef(metronome);
    const barStepsRef = useRef(barSteps);
  const generatorVariationRef = useRef(0);

  const activeCount = useMemo(() => loopSteps.filter(Boolean).length, [loopSteps]);
  const currentBar = Math.floor(stepIndex / barSteps) + 1;
  const currentSixteenth = (stepIndex % barSteps) + 1;
  const playAngle = (stepIndex / Math.max(loopLength, 1)) * 360;
  const pulseAngle = ((stepIndex % barSteps) / barSteps) * 360;
  const riffAngle = ((stepIndex % 23) / 23) * 360;
  const riffAnalysis = useMemo(() => {
  const hits = loopSteps
    .map((value, index) => value ? index : -1)
    .filter((index) => index >= 0);

  const gaps = hits.map((hit, index) => {
    const nextHit = hits[(index + 1) % hits.length] ?? hit;
    return (nextHit - hit + loopLength) % loopLength || loopLength;
  });

  const grouping = parseSequence(sequenceInput);
  const groupingSum = grouping.reduce((sum, value) => sum + value, 0);
  const accentCount = loopSteps.filter((value) => value === "A").length;
  const ghostCount = loopSteps.filter((value) => value === "G").length;
  const downbeatHits = loopSteps.filter((value, index) => value && index % barSteps === 0).length;
      const patternCycle = findPatternCycle(loopSteps);
  const autoRealignSteps = lcm(patternCycle, barSteps);
  const autoRealignBars = autoRealignSteps / barSteps;

  return {
    density: Math.round((activeCount / Math.max(loopLength, 1)) * 100),
    longestGap: gaps.length ? Math.max(...gaps) : 0,
    groupingSum,
    accentCount,
    ghostCount,
downbeatHits,
patternCycle,
autoRealignSteps,
autoRealignBars
  };
}, [activeCount, barSteps, loopLength, loopSteps, sequenceInput]);

  useEffect(() => { loopStepsRef.current = loopSteps; }, [loopSteps]);
  useEffect(() => { loopLengthRef.current = loopLength; }, [loopLength]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { metronomeRef.current = metronome; }, [metronome]);
    useEffect(() => { barStepsRef.current = barSteps; }, [barSteps]);
  useEffect(() => {
  const shared = new URLSearchParams(window.location.search).get("riff");
  if (!shared) return;

  const preset = decodePreset(shared);
  if (!preset) {
    setShareStatus("Shared riff link is invalid");
    return;
  }

  stop();
  setBpm(preset.bpm);
  setTargetBars(preset.targetBars);
    setMeter(preset.meter);
  setMetronome(preset.metronome);
  setDiceResult(preset.diceResult);
  setDiceRollCount(preset.diceRollCount);
  setSequenceInput(preset.sequenceInput);
  setSteps(preset.steps);
  resetPlayhead();
  setShareStatus("Shared riff loaded");
}, []);
useEffect(() => {
  try {
    const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      setSavedPresets(parsed);
    }
  } catch {
    window.localStorage.removeItem(PRESET_STORAGE_KEY);
  }
}, []);
  useEffect(() => {
    if (stepIndex >= loopLength) {
      nextStepRef.current = 0;
      setStepIndex(0);
    }
  }, [stepIndex, loopLength]);

    useEffect(() => {
    const pauseForBrowser = () => {
      playingRef.current = false;
      setPlaying(false);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) pauseForBrowser();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", pauseForBrowser);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", pauseForBrowser);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      audioRef.current?.close();
    };
  }, []);

  function clearPlaybackTimer() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function ensureAudio() {
    if (!audioRef.current || audioRef.current.state === "closed") {
      audioRef.current = new AudioContext();
    }

    return audioRef.current;
  }

  async function wakeAudio() {
    let ctx = ensureAudio();

    if (ctx.state !== "running") {
      await ctx.resume();
    }

    if (ctx.state !== "running") {
      await ctx.close().catch(() => undefined);
      audioRef.current = null;
      ctx = ensureAudio();
      await ctx.resume();
    }

    return ctx;
  }

  function resetPlayhead() {
    nextStepRef.current = 0;
    setStepIndex(0);
  }

  function tick() {
    if (!playingRef.current) return;

    const ctx = ensureAudio();

    if (ctx.state !== "running") {
      stop();
      setShareStatus("Audio paused by browser. Press PLAY.");
      return;
    }

    const index = nextStepRef.current % loopLengthRef.current;
    const value = loopStepsRef.current[index] ?? "";
    const isQuarter = index % 4 === 0;
    const isOne = index % barStepsRef.current === 0;

    playHit(ctx, value, metronomeRef.current, isQuarter, isOne);
    setStepIndex(index);

    nextStepRef.current = (index + 1) % loopLengthRef.current;

    const intervalMs = (60_000 / Math.max(40, bpmRef.current)) / 4;
    timeoutRef.current = window.setTimeout(tick, intervalMs);
  }

  async function play() {
  clearPlaybackTimer();
  playingRef.current = false;
  setPlaying(false);

  try {
    const oldContext = audioRef.current;
    audioRef.current = null;

    if (oldContext && oldContext.state !== "closed") {
      await oldContext.close().catch(() => undefined);
    }

    const ctx = await wakeAudio();

    if (ctx.state !== "running") {
      throw new Error("Audio unavailable");
    }

    playingRef.current = true;
    setPlaying(true);
    setShareStatus("");
    tick();
  } catch {
    stop();
    audioRef.current = null;
    setShareStatus("Audio reset. Press PLAY again.");
  }
}

  function stop() {
    playingRef.current = false;
    setPlaying(false);
    clearPlaybackTimer();
  }

  function reset() {
    stop();
    resetPlayhead();
  }

  async function stepOnce() {
    try {
      const ctx = await wakeAudio();
      const index = nextStepRef.current % loopLengthRef.current;
      const value = loopStepsRef.current[index] ?? "";

      playHit(ctx, value, metronome, index % 4 === 0, index % barSteps === 0);
      setStepIndex(index);
      nextStepRef.current = (index + 1) % loopLengthRef.current;
    } catch {
      audioRef.current = null;
      setShareStatus("Audio reset. Press STEP again.");
    }
  }

  function toggleStep(index: number) {
    setSteps((current) => fitStepsToLoop(current, loopLength).map((value, i) => (i === index ? nextStep(value) : value)));
  }

  function clearGrid() {
    stop();
    setSteps(Array.from({ length: loopLength }, () => ""));
    resetPlayhead();
  }

  function applyGroups(groups: number[]) {
    stop();
    setDiceResult(groups);
    setSequenceInput(groups.join(" "));
    setSteps(makeGroupedPattern(groups, loopLength, barSteps));
    resetPlayhead();
  }
function generateRandomRiff() {
  const density = randomDensity / 100;
  const complexity = randomComplexity / 100;

  const availableGroups =
    complexity < 0.34
      ? [2, 4, 6]
      : complexity < 0.67
        ? [2, 3, 4, 5, 6, 7]
        : groupValues;

  const groupCount = 3 + Math.round(complexity * 6);
  const groups = Array.from(
    { length: groupCount },
    () =>
      availableGroups[
        Math.floor(Math.random() * availableGroups.length)
      ]
  );

  const groupedPattern = makeGroupedPattern(
    groups,
    loopLength,
    barSteps
  );

  const next = groupedPattern.map(
    (value, index): Step => {
      const isDownbeat = index % barSteps === 0;
      const keepChance = 0.25 + density * 0.75;
      const extraChance =
        density * (0.08 + complexity * 0.18);

      const active = value
        ? isDownbeat || Math.random() < keepChance
        : Math.random() < extraChance;

      if (!active) return "";
      if (isDownbeat) return "A";

      const chance = Math.random();

      if (chance < 0.58) return "X";
      if (chance < 0.74) return "U";
      if (chance < 0.9) return "G";
      return "A";
    }
  );

  stop();
  setDiceResult(groups);
  setSequenceInput(groups.join(" "));
  setSteps(next);
  resetPlayhead();
  setShareStatus(
    `Random riff: density ${randomDensity}% · complexity ${randomComplexity}%`
  );
}
  function generateDiceRiff() {
    const rollCount = Math.max(3, Math.min(6, diceRollCount));
    const dice = Array.from(
      { length: rollCount },
      () => groupValues[Math.floor(Math.random() * groupValues.length)]
    );

    applyGroups(dice);
  }

  function generateSequenceRiff() {
    const groups = parseSequence(sequenceInput);
    if (!groups.length) return;
    applyGroups(groups);
  }

  function randomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffleGroups(groups: number[]): number[] {
    return [...groups].sort(() => Math.random() - 0.5);
  }

  function chooseTargetCycle(total: number, minimum: number): number {
    const exactCycles = Array.from({ length: total - 1 }, (_, index) => index + 2)
      .filter((cycle) => lcm(cycle, barSteps) === total);
    const playableCycles = exactCycles.filter((cycle) => cycle >= minimum);
    const candidates = playableCycles.length ? playableCycles : exactCycles;

    return randomItem(candidates.length ? candidates : [total]);
  }

  function makeVariedGrouping(targetCycle: number, preferredGroups: number[]): number[] {
    const groups: number[] = [];
    let remaining = targetCycle;
    let guard = 0;
    let palette = shuffleGroups(preferredGroups);
    let paletteIndex = generatorVariationRef.current++;

    while (remaining > 0 && guard < 128) {
      guard++;

      if (remaining <= 4) {
        groups.push(remaining);
        break;
      }

      const avoidPrevious = groups[groups.length - 1];
      const candidates = palette.filter(
        (value) =>
          value <= remaining &&
          value !== avoidPrevious &&
          remaining - value !== 1
      );

      const fallback = preferredGroups.filter(
        (value) => value <= remaining && remaining - value !== 1
      );
      const group = candidates[paletteIndex % candidates.length] ?? randomItem(fallback.length ? fallback : [remaining]);

      groups.push(group);
      remaining -= group;
      paletteIndex += Math.random() < 0.45 ? 2 : 1;

      if (paletteIndex >= palette.length) {
        palette = shuffleGroups(preferredGroups);
        paletteIndex = 0;
      }
    }

    return groups;
  }

  function writeGeneratedRiff(
    groups: number[],
    targetCycle: number,
    style: "target" | "meshuggah" | "vildhjarta" | "carbomb"
  ): Step[] {
    const next = Array.from({ length: loopLength }, () => "") as Step[];
    const phase = Math.floor(Math.random() * Math.max(1, groups.length));
    let pos = Math.random() < 0.22 ? randomItem([0, 1, 2]) : 0;
    let groupIndex = 0;

    while (pos < loopLength) {
      const localIndex = (groupIndex + phase) % groups.length;
      const cycleStart = pos % targetCycle === 0 || pos === 0;
      const downbeat = pos % barSteps === 0;
      const accentChance = style === "vildhjarta" ? 0.32 : style === "carbomb" ? 0.28 : 0.18;
      const ghostChance = style === "vildhjarta" ? 0.42 : style === "target" ? 0.2 : 0.12;
      const upChance = style === "meshuggah" ? 0.14 : style === "carbomb" ? 0.24 : 0.22;
      const restChance = style === "carbomb" ? 0.18 : style === "vildhjarta" ? 0.08 : 0.04;

      if (Math.random() >= restChance || cycleStart || downbeat) {
        if (cycleStart || downbeat || localIndex % 7 === 3 || Math.random() < accentChance) {
          next[pos] = "A";
        } else if (localIndex % 4 === 2 || Math.random() < upChance) {
          next[pos] = "U";
        } else if (Math.random() < ghostChance) {
          next[pos] = "G";
        } else {
          next[pos] = "X";
        }
      }

      if ((style === "vildhjarta" || style === "target") && Math.random() < ghostChance) {
        const ghostIndex = (pos - 1 + loopLength) % loopLength;
        if (!next[ghostIndex]) next[ghostIndex] = "G";
      }

      if ((style === "carbomb" || style === "meshuggah") && Math.random() < (style === "carbomb" ? 0.42 : 0.18)) {
        const stutterIndex = (pos + randomItem([1, 2])) % loopLength;
        if (!next[stutterIndex]) next[stutterIndex] = style === "carbomb" && Math.random() < 0.35 ? "A" : "X";
      }

      pos += groups[groupIndex % groups.length];
      groupIndex++;
    }

    return next;
  }

    function generateTargetRiff() {
    const total = loopLength;
    const targetCycle = chooseTargetCycle(total, Math.max(5, Math.floor(barSteps * 0.75)));
    const grouping = makeVariedGrouping(targetCycle, [2, 3, 5, 7, 4, 6, 9, 11, 13]);
    const next = writeGeneratedRiff(grouping, targetCycle, "target");

    stop();
    setDiceResult(grouping);
    setSequenceInput(grouping.join(" "));
    setSteps(next);
    resetPlayhead();
    setShareStatus(`Target riff: ${safeTargetBars} bars`);
  }
    function generateMeshuggahRiff() {
    const total = loopLength;
    const targetCycle = chooseTargetCycle(total, Math.max(7, barSteps));
    const grouping = makeVariedGrouping(targetCycle, [5, 3, 4, 2, 7, 6, 9, 11, 13, 15]);
    const next = writeGeneratedRiff(grouping, targetCycle, "meshuggah");

    stop();
    setDiceResult(grouping);
    setSequenceInput(grouping.join(" "));
    setSteps(next);
    resetPlayhead();
    setShareStatus(`Meshuggah mode: ${safeTargetBars} bars`);
  }
    function generateVildhjartaRiff() {
    const total = loopLength;
    const targetCycle = chooseTargetCycle(total, Math.max(7, Math.floor(barSteps * 0.9)));
    const grouping = makeVariedGrouping(targetCycle, [7, 3, 5, 2, 11, 4, 9, 6, 13]);
    const next = writeGeneratedRiff(grouping, targetCycle, "vildhjarta");

    stop();
    setDiceResult(grouping);
    setSequenceInput(grouping.join(" "));
    setSteps(next);
    resetPlayhead();
    setShareStatus(`Vildhjarta mode: ${safeTargetBars} bars`);
  }
    function generateCarBombRiff() {
    const total = loopLength;
    const targetCycle = chooseTargetCycle(total, Math.max(5, Math.floor(barSteps * 0.75)));
    const grouping = makeVariedGrouping(targetCycle, [3, 2, 5, 7, 4, 11, 6, 9, 13]);
    const next = writeGeneratedRiff(grouping, targetCycle, "carbomb");

    stop();
    setDiceResult(grouping);
    setSequenceInput(grouping.join(" "));
    setSteps(next);
    resetPlayhead();
    setShareStatus(`Car Bomb mode: ${safeTargetBars} bars`);
  }
  function mutateSteps(next: Step[], message: string) {
  stop();
  setSteps(next);
  resetPlayhead();
  setShareStatus(message);
}

function shiftForward() {
  const next = Array.from({ length: loopLength }, () => "") as Step[];

  loopSteps.forEach((value, index) => {
    next[(index + 1) % loopLength] = value;
  });

  mutateSteps(next, "Shifted +1");
}

function addGhostNotes() {
  const next = [...loopSteps];

  loopSteps.forEach((value, index) => {
    if (!value) return;

    const ghostIndex = (index - 1 + loopLength) % loopLength;
    if (!next[ghostIndex]) next[ghostIndex] = "G";
  });

  mutateSteps(next, "Ghost notes added");
}
  function persistPresets(next: SavedPreset[]) {
  setSavedPresets(next);
  window.localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify(next)
  );
}
  function savePreset() {
  const name =
    presetName.trim() || `Riff ${savedPresets.length + 1}`;

  const preset: SavedPreset = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    savedAt: new Date().toISOString(),
    version: 1,
    bpm,
    targetBars: safeTargetBars,
    meter,
    metronome,
    diceResult,
    diceRollCount,
    sequenceInput,
    steps: loopSteps
  };

  const next = [preset, ...savedPresets];

  persistPresets(next);
  setSelectedPresetId(preset.id);
  setPresetName(name);
  setShareStatus(`Preset saved: ${name}`);
}
  function loadPreset() {
  const preset = savedPresets.find(
    (item) => item.id === selectedPresetId
  );

  if (!preset) return;

  stop();
  setBpm(preset.bpm);
  setTargetBars(preset.targetBars);
  setMeter(preset.meter);
  setMetronome(preset.metronome);
  setDiceResult(preset.diceResult);
  setDiceRollCount(preset.diceRollCount);
  setSequenceInput(preset.sequenceInput);
  setSteps(preset.steps);
  setPresetName(preset.name);
  resetPlayhead();
  setShareStatus(`Preset loaded: ${preset.name}`);
}
  function deletePreset() {
  if (!selectedPresetId) return;

  const next = savedPresets.filter(
    (item) => item.id !== selectedPresetId
  );

  persistPresets(next);
  setSelectedPresetId("");
  setShareStatus("Preset deleted");
}
function exportMidi() {
  const blob = createMidiBlob(loopSteps, bpm, meter);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `chug-grid-${meter.replace("/", "-")}-${safeTargetBars}-bars.mid`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setShareStatus("MIDI exported");
}
  function exportMusicXml() {
  const blob = createMusicXml(loopSteps, bpm, meter);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `chug-grid-${meter.replace("/", "-")}-${safeTargetBars}-bars.musicxml`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setShareStatus("MusicXML exported");
}
  async function copyRiffLink() {
  const preset: RiffPreset = {
  version: 1,
  bpm,
  targetBars: safeTargetBars,
  meter,
  metronome,
    diceResult,
    diceRollCount,
    sequenceInput,
    steps: loopSteps
  };

  const url = new URL(window.location.href);
  url.searchParams.set("riff", encodePreset(preset));
  url.hash = "app";

  try {
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, "", url.toString());
    setShareStatus("Riff link copied");
  } catch {
    setShareStatus("Copy failed: copy the address bar");
  }
}

  return (
    <main className="site">
      <nav className="nav">
        <div className="brandMark">CG</div>
        <div className="navLinks">
          <a href="#app">App</a>
          <a href="#features">Features</a>
          <a href="#support">Packs</a>
          <a href="#workflow">Workflow</a>
          <a href="https://paypal.me/ironreykh" target="_blank" rel="noreferrer">Support</a>
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
            <a className="secondary" href="https://paypal.me/ironreykh" target="_blank" rel="noreferrer">Support project</a>
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
            {Array.from({ length: beatCount }, (_, beat) => {
  const angle = (beat / beatCount) * 360;
  const compoundAccent =
    (meter === "6/8" || meter === "9/8") && beat % 3 === 0;

  return (
    <span
      key={`orbit-beat-${beat}`}
      className={`orbitBeatLabel ${beat === 0 ? "downbeat" : ""} ${compoundAccent ? "compoundAccent" : ""}`}
      style={{
        transform: `rotate(${angle}deg) translateY(var(--orbit-label-radius)) rotate(${-angle}deg)`
      }}
      aria-hidden="true"
    >
      {beat + 1}
    </span>
  );
})}
            <div className="hand handPulse" style={{ transform: `rotate(${pulseAngle}deg)` }} />
            <div className="hand handRiff" style={{ transform: `rotate(${riffAngle}deg)` }} />
            <div className="hand handBar" style={{ transform: `rotate(${playAngle}deg)` }} />
            {loopSteps.map((value, i) => value && (
              <i
                key={i}
                className={`orbDot type${value} ${i === 0 ? "cycleStart" : ""} ${i % barSteps === 0 ? "barStart" : ""} ${i === stepIndex ? "current" : ""}`}
                style={{ transform: `rotate(${(i / loopLength) * 360}deg) translateY(var(--orbit-dot-radius))` }}
              />
            ))}
            <div className="centerReadout">
              <span>BAR</span>
              <strong>{currentBar} / {safeTargetBars}</strong>
            <em>step {currentSixteenth}/{barSteps} · loop {loopLength} steps</em>
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
                        <div className="bpmControl">
              <label>Time</label>
              <select value={meter} onChange={(e) => setMeter(e.target.value as MeterId)}>
                {Object.keys(meters).map((meterId) => (
                  <option key={meterId} value={meterId}>{meterId}</option>
                ))}
              </select>
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
            <div className="bpmControl">
              <label>Dice rolls</label>
              <input type="number" min="3" max="6" value={diceRollCount} onChange={(e) => setDiceRollCount(Number(e.target.value))} />
            </div>
            <div className="bpmControl">
  <label>Density {randomDensity}%</label>
  <input
    type="range"
    min="10"
    max="100"
    step="5"
    value={randomDensity}
    onChange={(e) => setRandomDensity(Number(e.target.value))}
  />
</div>

<div className="bpmControl">
  <label>Complexity {randomComplexity}%</label>
  <input
    type="range"
    min="0"
    max="100"
    step="10"
    value={randomComplexity}
    onChange={(e) => setRandomComplexity(Number(e.target.value))}
  />
</div>
            <button type="button" onClick={generateRandomRiff}>
  RANDOM RIFF
</button>
            <button type="button" onClick={generateDiceRiff}>ROLL RIFF</button>
            <button type="button" onClick={generateTargetRiff}>TARGET RIFF</button>
            <button type="button" onClick={generateMeshuggahRiff}>MESHUGGAH</button>
            <button type="button" onClick={generateVildhjartaRiff}>VILDHJARTA</button>
            <button type="button" onClick={generateCarBombRiff}>CAR BOMB</button>
            <button type="button" onClick={clearGrid}>CLEAR</button>
          </div>

          <div className="controlDock">
            <div className="bpmControl">
              <label>Sequence</label>
              <input
                type="text"
                value={sequenceInput}
                onChange={(e) => setSequenceInput(e.target.value)}
                placeholder="3 5 7 2"
              />
            </div>
            <button type="button" onClick={generateSequenceRiff}>GENERATE FROM SEQUENCE</button>
          </div>
          <div className="controlDock">
  <div className="bpmControl">
    <label>Preset name</label>
    <input
      type="text"
      value={presetName}
      onChange={(e) => setPresetName(e.target.value)}
      placeholder="My riff"
    />
  </div>

  <button type="button" onClick={savePreset}>
    SAVE PRESET
  </button>

  <div className="bpmControl">
    <label>Saved presets</label>
    <select
      value={selectedPresetId}
      onChange={(e) => setSelectedPresetId(e.target.value)}
    >
      <option value="">Select preset</option>
      {savedPresets.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.name}
        </option>
      ))}
    </select>
  </div>

  <button
    type="button"
    onClick={loadPreset}
    disabled={!selectedPresetId}
  >
    LOAD
  </button>

  <button
    type="button"
    onClick={deletePreset}
    disabled={!selectedPresetId}
  >
    DELETE
  </button>
</div>
                    <div className="controlDock">
            <div>
              <label>Share</label>
              <b>{shareStatus || "Copy a playable riff link"}</b>
            </div>
            <button type="button" onClick={copyRiffLink}>COPY RIFF LINK</button>
                      <button type="button" onClick={exportMidi}>EXPORT MIDI</button>
                      <button type="button" onClick={exportMusicXml}>EXPORT MUSICXML</button>
          </div>
                    <div className="controlDock">
            <div>
              <label>Mutate</label>
              <b>Shift or humanize the current riff</b>
            </div>
            <button type="button" onClick={shiftForward}>SHIFT +1</button>
            <button type="button" onClick={addGhostNotes}>ADD GHOSTS</button>
          </div>
                    <div className="controlDock">
            <div>
              <label>Realignment</label>
              <b>Manual loop: {safeTargetBars} bars / {loopLength} steps</b>
            </div>
                                  <div>
              <label>Auto realign</label>
              <b>{riffAnalysis.autoRealignBars} bars / {riffAnalysis.autoRealignSteps} steps</b>
            </div>
            <div>
              <label>Pattern cycle</label>
              <b>{riffAnalysis.patternCycle} steps</b>
            </div>
            <div>
              <label>Density</label>
              <b>{riffAnalysis.density}% · longest gap {riffAnalysis.longestGap}</b>
            </div>
            <div>
              <label>Grouping sum</label>
              <b>{riffAnalysis.groupingSum || "manual grid"}</b>
            </div>
            <div>
              <label>Accents / Ghosts</label>
              <b>{riffAnalysis.accentCount} / {riffAnalysis.ghostCount}</b>
            </div>
            <div>
              <label>Downbeats hit</label>
              <b>{riffAnalysis.downbeatHits}/{safeTargetBars}</b>
            </div>
          </div>
          <div className="gridToolbar">
            <span>Click cells: empty → X → U → G → A</span>
            <span>X chug · U upstroke · G ghost · A accent</span>
          </div>

          <div className="beatLabels">
            {Array.from({ length: safeTargetBars }, (_, bar) => (
            <div key={bar} className="beatLabel" style={{ gridTemplateColumns: `repeat(${barSteps}, minmax(24px, 1fr))` }}>
                {labels.map((label, i) => <span key={`${bar}-${i}`}>{label}</span>)}
              </div>
            ))}
          </div>
<div className="miniGrid interactiveGrid" style={{ gridTemplateColumns: `repeat(${barSteps}, minmax(24px, 1fr))` }}>
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
          <span className="kicker">REALIGNMENT ENGINE</span>
          <h2>Generate riffs that leave the barline and land back clean.</h2>
          <p>
            Choose a meter, bar target and style engine. CHUG-GRID builds playable picking grids, then shows the cycle against the bar.
          </p>
        </div>
        <div className="statPanel">
          <div><span>Pattern Cycle</span><b>{riffAnalysis.patternCycle} steps</b></div>
          <div><span>Auto Realign</span><b>{riffAnalysis.autoRealignBars} bars</b></div>
          <div><span>Current Bar</span><b>{currentBar}/{safeTargetBars}</b></div>
        </div>
      </section>

      <section className="section supportSection" id="support">
        <div className="sectionHeader">
          <span>SUPPORT THE RHYTHM LAB</span>
          <h2>Free riffs first, paid packs later.</h2>
          <p>
            CHUG-GRID is built for guitarists, drummers and producers who need modern metal MIDI riffs,
            odd-meter practice loops and polymetric writing ideas without opening a blank DAW session.
          </p>
        </div>
        <div className="supportGrid">
          {supportCards.map((card) => (
            <article className="supportCard" key={card.title}>
              <span>{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              {card.href ? (
                <a className="secondary" href={card.href} target="_blank" rel="noreferrer">
                  {card.action}
                </a>
              ) : (
                <button type="button" disabled>
                  {card.action}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="pricing" id="workflow">
        <div className="priceCard">
          <span>GENERATE</span>
          <h3>Find a starting point</h3>
          <p>Roll grouped rhythms, use style modes, or type a custom sequence to create a riff foundation.</p>
        </div>
        <div className="priceCard pro">
          <span>FINISH</span>
          <h3>Save, share, export</h3>
          <p>Store presets, copy a playable link, or export MIDI and MusicXML for the next production step.</p>
        </div>
      </section>
    </main>
  );
}
