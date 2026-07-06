import type { Metadata } from "next";

const freePackUrl = "https://matteoferraro.gumroad.com/l/inznd";
const supportUrl = "https://paypal.me/ironreykh";

const contents = [
  "50 MIDI riff loops",
  "50 MusicXML files",
  "Odd-meter and polymetric rhythm ideas",
  "DAW-ready file names with meter and BPM",
  "4/4 realignment, 5/4 stomp, 7/8 pick engines and 9/8 ghost pulses",
  "README, license notes and Gumroad-ready description"
];

const useCases = [
  "Start modern metal riffs without staring at an empty piano roll.",
  "Program drums around chug cycles, accents and displaced patterns.",
  "Study how odd-meter loops realign against the barline.",
  "Use MusicXML sketches as notation or arrangement starting points."
];

const faqs = [
  [
    "Can I use these MIDI riffs in my own music?",
    "Yes. You can use the loops in your own songs, demos, videos, lessons and productions. You should not resell the pack as a standalone product."
  ],
  [
    "Are the riffs finished songs?",
    "No. They are writing seeds: rhythmic ideas designed to be edited, layered, looped, rewritten and turned into your own parts."
  ],
  [
    "What should the launch price be?",
    "Use 9 EUR as a simple launch price, then move it to 12 EUR once the page has traffic and the free pack is converting."
  ]
];

export const metadata: Metadata = {
  title: "Modern Metal MIDI Pack Vol. 1",
  description:
    "A premium pack of 50 modern metal MIDI riff loops with MusicXML files for guitarists, drummers and producers.",
  alternates: {
    canonical: "/modern-metal-midi-pack-vol-1"
  },
  keywords: [
    "modern metal MIDI pack",
    "metal MIDI riffs",
    "djent MIDI pack",
    "odd meter MIDI loops",
    "polymeter guitar MIDI",
    "progressive metal riff pack"
  ],
  openGraph: {
    title: "Modern Metal MIDI Pack Vol. 1 | CHUG-GRID PRO",
    description:
      "50 modern metal MIDI riff loops with MusicXML files, built for odd-meter writing and polymetric rhythm ideas.",
    url: "https://chuggrid.com/modern-metal-midi-pack-vol-1",
    type: "website"
  }
};

export default function ModernMetalMidiPackVol1Page() {
  return (
    <main className="site seoLanding">
      <nav className="nav">
        <a className="brandMark" href="/">CG</a>
        <div className="navLinks">
          <a href="/#app">App</a>
          <a href="/free-metal-midi-riff-generator">Free pack</a>
          <a href="/#support">Packs</a>
        </div>
        <a className="navCta" href="/">Open CHUG-GRID</a>
      </nav>

      <section className="seoHero">
        <div>
          <span className="kicker">PREMIUM MIDI PACK</span>
          <h1>50 modern metal MIDI riffs for fast writing sessions.</h1>
          <p>
            CHUG-GRID Modern Metal MIDI Pack Vol. 1 is a compact riff-writing toolkit for
            guitarists, drummers and producers. Drag the loops into your DAW, reshape the accents,
            layer drums, or use the MusicXML files as notation starting points.
          </p>
          <div className="heroActions">
            <a className="primary" href={freePackUrl} target="_blank" rel="noreferrer">
              Get the free starter pack
            </a>
            <a className="secondary" href={supportUrl} target="_blank" rel="noreferrer">
              Support CHUG-GRID
            </a>
          </div>
        </div>
        <div className="seoSignalPanel">
          <span>VOL. 1</span>
          <strong>50</strong>
          <p>premium MIDI riff loops with matching MusicXML files.</p>
        </div>
      </section>

      <section className="seoCopySection">
        <article>
          <h2>What is inside</h2>
          <div className="topicList productList" aria-label="Pack contents">
            {contents.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
        <article>
          <h2>Built to become riffs, not wallpaper.</h2>
          <p>
            The pack is designed around rhythm-first metal writing: chugs, accents, ghost pulses,
            upstroke markers and repeating groups that push against the barline. It is meant to
            give you usable starting points quickly.
          </p>
          <p>
            Launch plan: publish it on Gumroad at 9 EUR, link it from this page, then keep the free
            pack as the lead magnet that sends writers toward the premium version.
          </p>
        </article>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <span>USE IT FOR</span>
          <h2>Turn rhythm loops into songs, lessons and production sketches.</h2>
        </div>
        <div className="workflowGrid">
          {useCases.map((item, index) => (
            <article className="workflowCard" key={item}>
              <span>{index + 1}</span>
              <h3>{item}</h3>
              <p>
                Keep the loop, rewrite it, double it with drums, or use it as the awkward little
                rhythmic spark that gets the session moving.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <span>FAQ</span>
          <h2>Clear rules for buyers.</h2>
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
