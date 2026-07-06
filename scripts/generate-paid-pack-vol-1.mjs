import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packDir = join(root, "packs", "chug-grid-modern-metal-midi-pack-vol-1");
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

const blueprints = [
  ["Meshuggah-style realign", "4/4", 111, 8, [5, 5, 5, 3, 7]],
  ["Vildhjarta-style lurch", "4/4", 98, 6, [11, 5, 3, 7, 2, 5]],
  ["Car Bomb-style stutter", "4/4", 158, 5, [2, 2, 7, 3, 2, 5, 11]],
  ["Seven-eight pick engine", "7/8", 146, 6, [2, 3, 2, 5, 4, 3]],
  ["Nine-eight ghost pulse", "9/8", 132, 5, [3, 4, 2, 5, 3, 6]],
  ["Five-four stomp grid", "5/4", 116, 4, [5, 5, 3, 7, 4, 6]],
  ["Six-eight collapse", "6/8", 140, 8, [3, 3, 2, 4, 5, 3]],
  ["Three-four offset chugs", "3/4", 126, 7, [4, 3, 5, 2, 6]],
  ["Doom palm-mute crawl", "4/4", 84, 8, [8, 3, 5, 2, 6]],
  ["Blast-grid accent trap", "4/4", 176, 4, [3, 3, 2, 7, 5]]
];

const variations = [
  { suffix: "A", bpm: 0, bars: 0, rotate: 0 },
  { suffix: "B", bpm: 7, bars: 1, rotate: 1 },
  { suffix: "C", bpm: -9, bars: 0, rotate: 2 },
  { suffix: "D", bpm: 13, bars: 2, rotate: 3 },
  { suffix: "E", bpm: -4, bars: 1, rotate: 4 }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function rotateGroups(groups, amount) {
  return groups.map((_, index) => groups[(index + amount) % groups.length]);
}

function makeGroupedPattern(groups, loopLength, barSteps) {
  const next = Array.from({ length: loopLength }, () => "");
  let cursor = 0;
  let groupIndex = 0;

  while (cursor < next.length) {
    next[cursor] =
      cursor % barSteps === 0
        ? "A"
        : groupIndex % 6 === 4
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
  const velocities = { X: 100, U: 84, G: 42, A: 127 };
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
    { tick: 0, order: 1, data: [0xff, 0x58, 0x04, numerator, denominatorPower, clocksPerClick, 8] }
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
<score-instrument id="P1-I1"><instrument-name>Electric Guitar</instrument-name></score-instrument>
<midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>31</midi-program></midi-instrument>
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

const riffs = blueprints.flatMap(([name, meter, bpm, bars, groups], blueprintIndex) =>
  variations.map((variation, variationIndex) => {
    const number = String(blueprintIndex * variations.length + variationIndex + 1).padStart(2, "0");
    const title = `${name} ${variation.suffix}`;
    return {
      slug: `${number}-${slugify(title)}`,
      title,
      meter,
      bpm: bpm + variation.bpm,
      bars: bars + variation.bars,
      groups: rotateGroups(groups, variation.rotate)
    };
  })
);

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
CHUG-GRID MODERN METAL MIDI PACK VOL. 1

50 MIDI riff loops for modern metal writing, guitar programming, drum sketching and production.

Included:
- 50 MIDI files
- 50 MusicXML files
- Odd-meter, polymetric and realignment-based riff ideas
- BPM, meter and grouping notes for every loop
- DAW-friendly file names

How to use:
1. Drag a MIDI file into your DAW.
2. Route it to a guitar, bass, drum, synth or low-tuned instrument plugin.
3. Loop it, edit the accents, double it with drums, or rewrite it into a full riff.
4. Use the MusicXML files for notation and arrangement starting points.

Riff list:
${catalog.join("\n")}

License:
You can use these loops in your own songs, demos, videos, lessons and productions.
Do not resell or redistribute this pack as a standalone product.

Created with CHUG-GRID
https://chuggrid.com
`);

writeTextFile(join(packDir, "gumroad-title.txt"), "CHUG-GRID Modern Metal MIDI Pack Vol. 1");

writeTextFile(join(packDir, "gumroad-description.txt"), `
50 modern metal MIDI riff loops built for odd-meter writing, djent-style cycles, polymetric chugs and progressive metal arrangement.

This is the first premium CHUG-GRID pack: a compact writing toolkit for guitarists, drummers and producers who want instant riff seeds without falling into the same 4/4 habits.

Inside the ZIP:
- 50 MIDI riff loops
- 50 MusicXML files
- BPM, meter and grouping notes
- DAW-ready file names
- 4/4 realignment riffs, 5/4 stomps, 7/8 pick engines, 9/8 ghost pulses and stuttered modern metal patterns

Use it for:
- guitar riff writing
- drum programming
- production sketches
- practice loops
- notation experiments
- breaking writer's block

Suggested launch price: 9 EUR.
Standard price after launch: 12 EUR.

Created with CHUG-GRID:
https://chuggrid.com
`);

writeTextFile(join(packDir, "gumroad-receipt-message.txt"), `
Thanks for supporting CHUG-GRID.

Drag the MIDI files into your DAW, try the MusicXML files in your notation app, and treat every loop as a starting point rather than a finished song.

If you write something heavy with it, send it over:
https://chuggrid.com
`);

console.log(`Created ${riffs.length} riffs at ${packDir}`);
