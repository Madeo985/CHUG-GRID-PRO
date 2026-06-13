const steps = Array.from({ length: 64 }, (_, i) =>
  [0, 3, 6, 9, 13, 18, 21, 26, 31, 35, 39, 44, 47, 52, 57, 61].includes(i)
);

export default function Page() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <div className="eyebrow">RIFF SKETCHPAD FOR MODERN METAL GUITARISTS</div>
          <h1>CHUG-GRID PRO</h1>
          <p className="lead">Visualizza cicli, plettrate e riallineamenti polimetrici con un workflow da musicista, non da matematico.</p>
        </div>
        <div className="heroActions">
          <button className="primary">Launch Lab</button>
          <button className="ghost">Watch Demo</button>
        </div>
      </section>

      <section className="appFrame">
        <aside className="sidePanel">
          <div className="panelBlock">
            <label>TEMPO</label>
            <div className="bigValue">120 <span>BPM</span></div>
            <button className="wide">TAP</button>
          </div>

          <div className="panelBlock">
            <label>TIME</label>
            <div className="controlRow">
              <button>4 / 4</button>
              <button>16TH</button>
            </div>
          </div>

          <div className="panelBlock accentPanel">
            <label>TARGET REALIGN</label>
            <div className="target">7 <span>bars</span></div>
            <div className="slider"><i /></div>
            <button className="wide amber">GENERATE RIFF</button>
          </div>

          <div className="panelBlock">
            <label>DICE ENGINE</label>
            <div className="diceRow">
              <button>3</button><button>4</button><button>5</button><button className="active">6</button>
            </div>
            <div className="result">5 · 3 · 4 · 6 · 2 · 5</div>
            <button className="wide">ROLL + APPLY</button>
          </div>
        </aside>

        <section className="centerStage">
          <div className="tabs">
            <button className="selected">ORBIT</button>
            <button>GRID</button>
            <button>MATRIX</button>
            <button>EXPORT</button>
          </div>

          <div className="orbitCard">
            <div className="orbit">
              <div className="ring outer" />
              <div className="ring middle" />
              <div className="ring inner" />
              <div className="hand pulse" />
              <div className="hand riff" />
              <div className="hand bar" />
              {Array.from({ length: 12 }, (_, i) => <b key={i} className={`dot d${i}`} />)}
              <div className="orbitCenter">
                <span>BAR</span>
                <strong>1 / 7</strong>
                <em>riff 23/16 · realigns after 7 bars</em>
              </div>
            </div>
          </div>

          <div className="gridCard">
            <div className="gridHeader">
              <span>16TH GRID · 7 BARS TO CYCLE</span>
              <span>click → ghost → chug → accent → upstroke</span>
            </div>
            <div className="stepGrid">
              {steps.map((on, i) => (
                <div className={on ? "step on" : "step"} key={i}>
                  {on ? (i % 5 === 0 ? "U" : "X") : ""}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="rightPanel">
          <div className="panelBlock">
            <label>TRANSPORT</label>
            <div className="transport">
              <button className="play">▶</button>
              <button>STEP</button>
              <button>STOP</button>
            </div>
          </div>

          <div className="panelBlock">
            <label>MESHUGGAH VIEW</label>
            <div className="stat"><span>Riff cycle</span><b>23/16</b></div>
            <div className="stat"><span>Bar cycle</span><b>16/16</b></div>
            <div className="stat"><span>Realignment</span><b>7 bars</b></div>
          </div>

          <div className="panelBlock">
            <label>EXPORT</label>
            <button className="wide">MIDI</button>
            <button className="wide">MUSICXML</button>
            <button className="wide">WAV</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
