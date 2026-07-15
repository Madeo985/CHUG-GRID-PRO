import type { Metadata } from "next";

const gumroadUrl = "https://matteoferraro.gumroad.com/l/inznd";
const premiumPackUrl = "https://matteoferraro.gumroad.com/l/itawg";

const useCases = [
  "Generate odd-meter metal riff ideas",
  "Export MIDI loops for your DAW",
  "Study polymeter and barline realignment",
  "Create MusicXML sketches for notation workflows"
];

const adProofPoints = [
  "No DAW setup required",
  "Odd meters and polymetric cycles",
  "MIDI and MusicXML export",
  "Free 10-riff starter pack"
];

const faqs = [
  [
    "What is a metal MIDI riff generator?",
    "It is a writing tool that creates rhythmic MIDI ideas you can drag into a DAW, edit, layer with drums or use as the starting point for guitar and bass parts."
  ],
  [
    "Can I use the free MIDI pack in my own music?",
    "Yes. The free CHUG-GRID starter pack is made for writing, practice, demos, videos and productions. You should not resell the pack as a standalone product."
  ],
  [
    "Does CHUG-GRID only work in 4/4?",
    "No. The rhythm lab supports meters such as 3/4, 5/4, 6/8, 7/8 and 9/8, plus grouped patterns that realign over longer cycles."
  ]
];

export const metadata: Metadata = {
  title: "Free Metal MIDI Riff Generator",
  description:
    "Generate odd-meter metal riffs, export MIDI and MusicXML loops, and download a free starter pack for modern metal writing.",
  alternates: {
    canonical: "/free-metal-midi-riff-generator"
  },
  keywords: [
    "free metal MIDI riff generator",
    "metal MIDI riffs",
    "odd meter riff generator",
    "djent MIDI riffs",
    "polymeter guitar riffs",
    "MusicXML metal riffs"
  ],
  openGraph: {
    title: "Free Metal MIDI Riff Generator | CHUG-GRID PRO",
    description:
      "Generate modern metal rhythm ideas, export MIDI loops, and download 10 free odd-meter metal riffs.",
    url: "https://chuggrid.com/free-metal-midi-riff-generator",
    type: "website"
  }
};

export default function FreeMetalMidiRiffGeneratorPage() {
  return (
    <main className="site seoLanding">
      <nav className="nav">
        <a className="brandMark" href="/">CG</a>
        <div className="navLinks">
          <a href="/#app">App</a>
          <a href="/#how-to-use">How to use</a>
          <a href="/#support">Free pack</a>
        </div>
        <a className="navCta" href="/">Open CHUG-GRID</a>
      </nav>

      <section className="seoHero">
        <div>
          <span className="kicker">FREE METAL MIDI RIFF GENERATOR</span>
          <h1>Generate odd-meter metal riffs and export them as MIDI.</h1>
          <p>
            CHUG-GRID is a rhythm-first riff generator for modern metal, djent and progressive
            writing sessions. Build polymetric chug patterns, see how they move against the barline,
            then export MIDI or MusicXML for your DAW.
          </p>
          <div className="heroActions">
            <a className="primary" href="/#app">Open the riff generator</a>
            <a className="secondary" href={gumroadUrl} target="_blank" rel="noreferrer">
              Download free MIDI pack
            </a>
          </div>
        </div>
        <div className="seoSignalPanel">
          <span>STARTER PACK</span>
          <strong>10</strong>
          <p>free odd-meter metal MIDI riffs with MusicXML files included.</p>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <span>WHAT YOU CAN DO</span>
          <h2>Turn rhythmic ideas into usable riff material.</h2>
        </div>
        <div className="workflowGrid">
          {useCases.map((item, index) => (
            <article className="workflowCard" key={item}>
              <span>{index + 1}</span>
              <h3>{item}</h3>
              <p>
                Use the browser-based rhythm lab to move quickly from pattern idea to playable
                loop without building every step by hand.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="seoCopySection">
        <article>
          <h2>Why CHUG-GRID works for metal MIDI riffs</h2>
          <p>
            Most riff generators focus on notes first. CHUG-GRID starts with rhythm: chugs,
            ghost notes, upstrokes, accents, groupings and realignment. That makes it useful for
            guitarists, drummers and producers who write around pulse, displacement and odd meters.
          </p>
          <p>
            You can generate a riff, edit the grid, listen to the pattern, save presets, copy a
            playable link, then export MIDI or MusicXML. The result is not a finished song; it is a
            strong rhythmic sketch that helps you get moving.
          </p>
        </article>
        <article>
          <h2>Download the free MIDI starter pack</h2>
          <p>
            The free CHUG-GRID pack includes 10 odd-meter metal riff loops for DAWs, notation apps
            and practice sessions. Use them as writing prompts, drum-programming references or
            rhythmic studies.
          </p>
          <a className="primary" href={gumroadUrl} target="_blank" rel="noreferrer">
            Get the free pack
          </a>
        </article>
      </section>

      <section className="adLandingSection" aria-labelledby="ad-offer-title">
        <div className="adOfferCopy">
          <span className="kicker">FOR PRODUCERS AND GUITARISTS</span>
          <h2 id="ad-offer-title">Start with the free riffs, then build the full session.</h2>
          <p>
            If you came here from a metal production post, start with the free pack first. You get
            10 odd-meter MIDI riffs to test in your DAW, then the full pack adds 50 more modern
            metal writing seeds when you want a bigger library.
          </p>
          <div className="heroActions">
            <a className="primary" href={gumroadUrl} target="_blank" rel="noreferrer">
              Download 10 free riffs
            </a>
            <a className="secondary" href={premiumPackUrl} target="_blank" rel="noreferrer">
              Get the 50-riff pack
            </a>
          </div>
        </div>
        <div className="adProofGrid" aria-label="Why try CHUG-GRID">
          {adProofPoints.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <span>FAQ</span>
          <h2>Quick answers for riff writers.</h2>
        </div>
        <div className="faqGrid">
          {faqs.map(([question, answer]) => (
            <article className="featureCard" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
