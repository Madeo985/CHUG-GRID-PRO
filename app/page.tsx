"use client";

import { useMemo, useState } from "react";

type Hydrant = {
  id: number;
  city: string;
  address: string;
  distance: string;
  pressure: string;
  flow: string;
  status: "Operativo" | "Da verificare";
  x: number;
  y: number;
  updated: string;
};

const hydrants: Hydrant[] = [
  { id: 1842, city: "Milano", address: "Via Melchiorre Gioia, 37", distance: "120 m", pressure: "6,2 bar", flow: "1.100 L/min", status: "Operativo", x: 56, y: 35, updated: "2 giorni fa" },
  { id: 1849, city: "Milano", address: "Via Pirelli, 21", distance: "280 m", pressure: "5,8 bar", flow: "980 L/min", status: "Operativo", x: 71, y: 24, updated: "5 giorni fa" },
  { id: 1811, city: "Milano", address: "Piazza Gae Aulenti", distance: "410 m", pressure: "—", flow: "—", status: "Da verificare", x: 39, y: 53, updated: "3 mesi fa" },
  { id: 1776, city: "Milano", address: "Via della Liberazione, 8", distance: "620 m", pressure: "6,0 bar", flow: "1.040 L/min", status: "Operativo", x: 76, y: 63, updated: "1 settimana fa" },
];

function Icon({ name }: { name: "search" | "location" | "share" | "route" | "close" | "layers" | "plus" | "minus" | "shield" }) {
  const icons = { search: "⌕", location: "⌖", share: "↗", route: "➜", close: "×", layers: "▱", plus: "+", minus: "−", shield: "◆" };
  return <span aria-hidden="true">{icons[name]}</span>;
}

export default function Home() {
  const [selected, setSelected] = useState<Hydrant>(hydrants[0]);
  const [query, setQuery] = useState("");
  const [premium, setPremium] = useState(false);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<"map" | "saved" | "profile">("map");

  const filtered = useMemo(() => hydrants.filter((item) =>
    `${item.address} ${item.city} ${item.id}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function shareMap() {
    const text = `Hydra Italia · Idrante H-${selected.id}, ${selected.address}`;
    if (navigator.share) await navigator.share({ title: "Hydra Italia", text, url: window.location.href }).catch(() => null);
    else await navigator.clipboard?.writeText(`${text} · ${window.location.href}`);
    notify("Mappa pronta per la condivisione");
  }

  return (
    <main className="hydraShell">
      <section className="phone" aria-label="Prototipo app Hydra Italia">
        <div className="statusBar"><b>9:41</b><span>● ᯤ ▰</span></div>

        <header className="appHeader">
          <div className="identity">
            <div className="logo"><Icon name="shield" /><i /></div>
            <div><strong>HYDRA</strong><span>ITALIA</span></div>
          </div>
          <button className="shareButton" onClick={shareMap} aria-label="Condividi mappa"><Icon name="share" /></button>
        </header>

        <div className="mapArea">
          <div className="street s1" /><div className="street s2" /><div className="street s3" /><div className="street s4" />
          <div className="park"><span>PARCO<br/>BIBLIOTECA<br/>DEGLI ALBERI</span></div>
          <span className="place p1">ISOLA</span><span className="place p2">PORTA NUOVA</span><span className="place p3">CENTRALE</span>

          <div className="searchBox">
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca indirizzo o ID idrante" aria-label="Cerca" />
            {query && <button onClick={() => setQuery("")} aria-label="Cancella"><Icon name="close" /></button>}
          </div>

          {filtered.map((item) => (
            <button key={item.id} className={`hydrantPin ${selected.id === item.id ? "active" : ""} ${item.status !== "Operativo" ? "warning" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => setSelected(item)} aria-label={`Idrante H-${item.id}`}>
              <span>H</span><small>{selected.id === item.id ? item.distance : ""}</small>
            </button>
          ))}
          <div className="userPin"><i /></div>

          <div className="mapControls">
            <button aria-label="Livelli"><Icon name="layers" /></button>
            <button aria-label="Aumenta zoom"><Icon name="plus" /></button>
            <button aria-label="Diminuisci zoom"><Icon name="minus" /></button>
            <button className="locate" onClick={() => notify("Posizione aggiornata")} aria-label="La mia posizione"><Icon name="location" /></button>
          </div>
          <div className="demoBadge">DATI DIMOSTRATIVI</div>
        </div>

        <section className="sheet">
          <div className="grabber" />
          <div className="sheetTop">
            <div><span className={`status ${selected.status === "Operativo" ? "online" : "check"}`}><i />{selected.status}</span><h1>Idrante H-{selected.id}</h1><p>{selected.address} · {selected.city}</p></div>
            <div className="distance"><b>{selected.distance}</b><span>dalla tua posizione</span></div>
          </div>
          <div className="metrics">
            <div><span>PRESSIONE</span><b>{selected.pressure}</b></div>
            <div><span>PORTATA</span><b>{selected.flow}</b></div>
            <div><span>AGGIORNATO</span><b>{selected.updated}</b></div>
          </div>
          <div className="actions">
            <button className="primaryAction" onClick={() => notify("Percorso aperto in Mappe")}><Icon name="route" /> Avvia percorso</button>
            <button onClick={shareMap}><Icon name="share" /></button>
          </div>
          <button className="report" onClick={() => notify("Segnalazione aperta")}>Segnala un problema con questo idrante</button>
        </section>

        <nav className="tabBar">
          <button className={tab === "map" ? "active" : ""} onClick={() => setTab("map")}><Icon name="location" /><span>Mappa</span></button>
          <button className={tab === "saved" ? "active" : ""} onClick={() => { setTab("saved"); notify("1 mappa salvata"); }}><span>☆</span><span>Salvati</span></button>
          <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><span>◎</span><span>Profilo</span></button>
        </nav>
      </section>

      <aside className="productPanel">
        <div className="eyebrow">MAPPE OPERATIVE · ITALIA</div>
        <h2>L’acqua giusta.<br/><em>Quando conta.</em></h2>
        <p>Una mappa professionale degli idranti, pensata per squadre antincendio, tecnici e gestori di reti idriche.</p>
        <ul>
          <li><i>✓</i><div><b>Ricerca nazionale</b><span>Indirizzi, coordinate e identificativi univoci.</span></div></li>
          <li><i>✓</i><div><b>Mappe condivise</b><span>Invia posizione, scheda e percorso alla squadra.</span></div></li>
          <li><i>✓</i><div><b>Dati verificabili</b><span>Stato, portata, pressione e ultimo controllo.</span></div></li>
        </ul>
        <div className="priceBox">
          <div><span>HYDRA PRO</span><b>€ 4,99 <small>/ mese</small></b><p>14 giorni gratis · annulla quando vuoi</p></div>
          <button onClick={() => { setPremium(true); notify("Prova Pro attivata"); }}>{premium ? "PRO ATTIVO ✓" : "PROVA GRATIS"}</button>
        </div>
        <small className="legal">Prototipo prodotto. Le posizioni mostrate non rappresentano infrastrutture reali. L’uso operativo richiede accordi con enti proprietari, verifica dei dati e controllo degli accessi.</small>
      </aside>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
