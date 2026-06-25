import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packDir = join(root, "packs", "free-odd-meter-metal-midi-riffs");
const midiDir = join(packDir, "MIDI");
const musicXmlDir = join(packDir, "MusicXML");

const meters = {
  "3/4": { barSteps: 12 },
  "4/4": { barSteps: 16 },
  "5/4": { barSteps: 20 },
  "6/8": { barSteps: 12 },
  "7/8": { barSteps: 14 },
  "9/8": { barSteps: 18 }
};

const riffs = [
  {
    slug: "01-seven-over-four-chug-cycle",
    title: "Seven Over Four Chug Cycle",
    meter: "4/4",
    bpm: 124,
    bars: 7,
    groups: [7, 5, 4, 3, 6, 5, 2]
  },
  {
    slug: "02-five-four-stomp-grid",
    title: "Five Four Stomp Grid",
    meter: "5/4",
    bpm: 116,
    bars: 4,
    groups: [5, 5, 3, 7, 4, 6]
  },
  {
    slug: "03-nine-eight-ghost-pulse",
    title: "Nine Eight Ghost Pulse",
    meter: "9/8",
    bpm: 132,
    bars: 5,
    groups: [3, 4, 2, 5, 3, 6]
  },
  {
    slug: "04-vildhjarta-style-lurch",
    title: "Vildhjarta Style Lurch",
    meter: "4/4",
    bpm: 98,
    bars: 6,
    groups: [11, 5, 3, 7, 2, 5]
  },
  {
    slug: "05-meshuggah-style-realign",
    title: "Meshuggah Style Realign",
    meter: "4/4",
    bpm: 111,
    bars: 8,
    groups: [5, 5, 5, 3, 7]
  },
  {
    slug: "06-seven-eight-pick-engine",
    title: "Seven Eight Pick Engine",
    meter: "7/8",
    bpm: 146,
    bars: 6,
    groups: [2, 3, 2, 5, 4, 3]
  },
  {
    slug: "07-six-eight-collapse",
    title: "Six Eight Collapse",
    meter: "6/8",
    bpm: 140,
    bars: 8,
    groups: [3, 3, 2, 4, 5, 3]
  },
  {
    slug: "08-car-bomb-style-stutter",
    title: "Car Bomb Style Stutter",
    meter: "4/4",
    bpm: 158,
    bars: 5,
    groups: [2, 2, 7, 3, 2, 5, 11]
  },
  {
    slug: "09-three-four-offset-chugs",
    title: "Three Four Offset Chugs",
    meter: "3/4",
    bpm: 126,
    bars: 7,
    groups: [4, 3, 5, 2, 6]
  },
  {
    slug: "10-eleven-step-breaker",
    title: "Eleven Step Breaker",
    meter: "4/4",
    bpm: 104,
    bars: 7,
    groups: [11, 4, 4, 3, 5, 2]
  }
];

function makeGroupedPattern(groups, loopLength, barSteps) {
  const next = Array.from({ length: loopLength }, () => "");
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

function midiUint32(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ];
}

function midiVariableLength(value) {
  let buffer = value & 0x7f;
  const bytes = [];

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

function createMidiBytes(steps, bpm, meter) {
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

  const events = [
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
      data: [0xff, 0x58, 0x04, numerator, denominatorPower, clocksPerClick, 8]
    }
  ];

  steps.forEach((step, index) => {
    if (!step) return;
    const tick = index * ticksPerStep;

    events.push(
      { tick, order: 3, data: [0x90, 40, velocities[step]] },
      { tick: tick + noteLength, order: 2, data: [0x80, 40, 0] }
    );
  });

  events.sort((a, b) => a.tick - b.tick || a.order - b.order);

  const track = [];
  let previousTick = 0;

  events.forEach((event) => {
    track.push(...midiVariableLength(event.tick - previousTick), ...event.data);
    previousTick = event.tick;
  });

  const loopEnd = steps.length * ticksPerStep;
  track.push(...midiVariableLength(Math.max(0, loopEnd - previousTick)), 0xff, 0x2f, 0x00);

  return Uint8Array.from([
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
}

function createMusicXml(steps, bpm, meter, title) {
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

      const notehead = step === "G" ? `<notehead parentheses="yes">x</notehead>` : "";
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
<work><work-title>${title}</work-title></work>
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
}

function writeTextFile(path, content) {
  writeFileSync(path, `${content.trim()}\n`, "utf8");
}

mkdirSync(midiDir, { recursive: true });
mkdirSync(musicXmlDir, { recursive: true });

const catalog = riffs.map((riff) => {
  const barSteps = meters[riff.meter].barSteps;
  const loopLength = barSteps * riff.bars;
  const steps = makeGroupedPattern(riff.groups, loopLength, barSteps);
  const baseName = `${riff.slug}__${riff.meter.replace("/", "-")}__${riff.bpm}bpm`;

  writeFileSync(join(midiDir, `${baseName}.mid`), createMidiBytes(steps, riff.bpm, riff.meter));
  writeTextFile(join(musicXmlDir, `${baseName}.musicxml`), createMusicXml(steps, riff.bpm, riff.meter, riff.title));

  return `- ${riff.title} - ${riff.meter}, ${riff.bpm} BPM, ${riff.bars} bars, grouping ${riff.groups.join("-")}`;
});

writeTextFile(join(packDir, "README.txt"), `
CHUG-GRID FREE ODD-METER METAL MIDI RIFFS

10 free MIDI riff loops for modern metal writing, practice and production.

Included:
- 10 MIDI files
- 10 MusicXML files
- Odd-meter and polymetric riff ideas
- BPM, meter and grouping notes for every loop

How to use:
1. Drag the MIDI files into your DAW.
2. Route them to a guitar, bass, drum or low tuned instrument plugin.
3. Loop, edit, double, layer or rewrite them.
4. Use the MusicXML files if you want notation/tab-style starting material.

Riff list:
${catalog.join("\n")}

License:
You can use these loops in your own songs, demos, videos and productions.
Do not resell or redistribute this pack as a standalone product.

Created with CHUG-GRID
https://chug-grid-pro.vercel.app
`);

writeTextFile(join(packDir, "gumroad-description.txt"), `
10 free odd-meter MIDI riff loops for modern metal guitarists, drummers and producers.

This starter pack includes polymetric chug patterns, odd-time grooves and realignment-based riff ideas generated with CHUG-GRID.

Inside the ZIP:
- 10 MIDI riff loops
- 10 MusicXML files
- BPM, meter and grouping notes
- Ready for DAWs, notation apps and riff writing sessions

Use these ideas for writing, practice, production, drum programming or breaking out of the same 4/4 riff habits.

Free download. If it helps, support the project here:
https://paypal.me/ironreykh
`);

writeTextFile(join(packDir, "gumroad-title.txt"), "10 Free Odd-Meter Metal MIDI Riffs");

console.log(`Created pack at ${packDir}`);
