const cells = Array.from({ length: 64 }, (_, i) =>
  [0, 2, 5, 8, 13, 18, 21, 26, 31, 35, 39, 44, 48, 52, 57, 61].includes(i)
);

const features = [
  ["Orbit View", "Pulse, riff cycle and bar realignment shown as rotating musical timelines."],
  ["Grid View", "16th-note guitar-first sequencer with chugs, ghosts, upstrokes and accents."],
  ["Target Realign", "Choose where the riff returns to the one. CHUG-GRID generates the cycle."],
  ["Audio Detective", "Upload a riff and extract transient-based rhythmic ideas."],
  ["Export", "MIDI and MusicXML workflow for Guitar Pro-ready sketches."],
  ["Dice Engine", "Roll 3–6 rhythmic values and generate polymetric loops instantly."]
];

export default function Page() {
  return (
    <main className="site">
      <nav className="nav">
        <div className="brandMark">CG</div>
        <div className="navLinks">
          <a href="#app">App</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a className="navCta" href="#app">Launch Preview</a>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="kicker">RHYTHM LAB FOR MODERN METAL</div>
          <h1>Visualize rhythm beyond time.</h1>
          <p>
            CHUG-GRID is a premium riff sketchpad for progressive guitarists:
            design chugs, see polymetric cycles, generate Meshuggah-style loops,
            and export ideas for your writing workflow.
          </p>
          <div className="heroActions">
            <a className="primary" href="#app">Open rhythm lab</a>
            <a className="secondary" href="#features">Explore features</a>
          </div>
        </div>

        <div className="heroInstrument" id="app">
          <div className="topStrip">
            <span>ORBIT ENGINE</span>
            <span>23/16 · REALIGN 7 BARS</span>
          </div>

          <div className="orbitalStage">
            <div className="orbit orbitOuter" />
            <div className="orbit orbitMiddle" />
            <div className="orbit orbitInner" />
            <div className="hand handPulse" />
            <div className="hand handRiff" />
            <div className="hand handBar" />
            {Array.from({ length: 12 }, (_, i) => <i key={i} className={`orbDot dot${i}`} />)}
            <div className="centerReadout">
              <span>BAR</span>
              <strong>1 / 7</strong>
              <em>riff 23/16 · pulse 4/4</em>
            </div>
          </div>

          <div className="controlDock">
            <div><label>BPM</label><b>120</b></div>
            <div><label>Target</label><b>7 bars</b></div>
            <button>GENERATE</button>
            <button>ROLL</button>
          </div>

          <div className="miniGrid">
            {cells.map((active, i) => (
              <span key={i} className={active ? "cell active" : "cell"}>
                {active ? (i % 5 === 0 ? "U" : "X") : ""}
              </span>
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
            cycle lengths, groupings and playable picking grids.
          </p>
        </div>
        <div className="statPanel">
          <div><span>Riff Cycle</span><b>23/16</b></div>
          <div><span>Bar Cycle</span><b>16/16</b></div>
          <div><span>Realigns</span><b>7 bars</b></div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="priceCard">
          <span>FREE</span>
          <h3>Sketch</h3>
          <p>Orbit, grid, dice and basic export.</p>
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
