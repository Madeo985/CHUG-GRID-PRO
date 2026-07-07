"use client";

import { useMemo, useState } from "react";

type OracleCard = {
  name: string;
  symbol: string;
  tone: string;
  message: string;
  mantra: string;
  action: string;
};

const cards: OracleCard[] = [
  {
    name: "La Soglia",
    symbol: "I",
    tone: "Inizio netto",
    message: "La risposta si apre quando smetti di chiedere permesso. Il futuro favorisce una scelta piccola, visibile e fatta entro poco tempo.",
    mantra: "Entro con calma, vinco con presenza.",
    action: "Fai il primo gesto prima di sera."
  },
  {
    name: "Il Fuoco Lucido",
    symbol: "II",
    tone: "Coraggio mirato",
    message: "La strada migliore non e la piu rumorosa. Punta la tua energia su una sola mossa e lascia che il resto perda importanza.",
    mantra: "Scelgo il centro e il centro mi apre la via.",
    action: "Taglia una distrazione e proteggi 30 minuti."
  },
  {
    name: "La Moneta d'Aria",
    symbol: "III",
    tone: "Fortuna pratica",
    message: "Arriva un segnale utile da una persona, un messaggio o un dettaglio che stavi sottovalutando. Rispondi in fretta, ma senza ansia.",
    mantra: "Vedo il segno, prendo l'occasione.",
    action: "Contatta qualcuno che puo sbloccare la situazione."
  },
  {
    name: "Il Ponte",
    symbol: "IV",
    tone: "Passaggio",
    message: "Non devi saltare tutto in una volta. Il futuro ti chiede una sequenza: chiarire, chiedere, agire, confermare.",
    mantra: "Un passo vero vale piu di cento pensieri.",
    action: "Scrivi la prossima azione in una frase sola."
  },
  {
    name: "La Corona Quietta",
    symbol: "V",
    tone: "Potere stabile",
    message: "La vittoria qui non nasce dalla pressione, ma dalla postura. Quando smetti di inseguire, diventi piu leggibile e piu forte.",
    mantra: "Non rincorro: attiro cio che reggo.",
    action: "Riformula la domanda da bisogno a decisione."
  },
  {
    name: "Lo Specchio Verde",
    symbol: "VI",
    tone: "Verita gentile",
    message: "Qualcosa e gia chiaro, ma stai aspettando una conferma perfetta. La carta dice che la conferma arrivera dopo il movimento.",
    mantra: "Mi fido del chiaro, avanzo senza rumore.",
    action: "Scegli una prova reversibile, non una promessa eterna."
  },
  {
    name: "Il Nodo d'Oro",
    symbol: "VII",
    tone: "Allineamento",
    message: "Due parti della tua vita vogliono finalmente parlare tra loro. Un compromesso elegante puo diventare il tuo vantaggio.",
    mantra: "Unisco cio che serve, lascio cio che pesa.",
    action: "Trova il punto comune tra desiderio e disciplina."
  },
  {
    name: "La Lama Serena",
    symbol: "VIII",
    tone: "Decisione",
    message: "La domanda non chiede altra informazione: chiede una scelta. Il futuro migliora quando rendi il confine esplicito.",
    mantra: "La mia chiarezza e la mia fortuna.",
    action: "Dici un si o un no senza aggiungere scuse."
  }
];

function hashQuestion(question: string) {
  const value = question.trim().toLowerCase();
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

function pickCard(question: string) {
  const salt = new Date().toISOString().slice(0, 10);
  return cards[hashQuestion(`${question}-${salt}`) % cards.length];
}

export default function FutureCardApp() {
  const [question, setQuestion] = useState("");
  const [paid, setPaid] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [drawCount, setDrawCount] = useState(0);

  const cleanQuestion = question.trim();
  const selectedCard = useMemo(
    () => cleanQuestion ? pickCard(`${cleanQuestion}-${drawCount}`) : cards[0],
    [cleanQuestion, drawCount]
  );
  const canDraw = paid && cleanQuestion.length >= 8;

  function handlePayment() {
    setPaid(true);
    setIsRevealed(false);
  }

  function handleDraw() {
    if (!canDraw) return;
    setDrawCount((count) => count + 1);
    setIsRevealed(true);
  }

  function handleReset() {
    setQuestion("");
    setPaid(false);
    setIsRevealed(false);
  }

  return (
    <main className="oracleShell">
      <section className="oracleApp" aria-label="Carta del futuro">
        <div className="phoneStatus">
          <span>9:41</span>
          <span>0,20 EUR</span>
        </div>

        <header className="oracleHeader">
          <p>Oracolo istantaneo</p>
          <h1>Carta del Futuro</h1>
          <span>Fai una domanda, sblocca una carta e ricevi un mantra vincente.</span>
        </header>

        <div className="oracleQuestion">
          <label htmlFor="future-question">La tua domanda</label>
          <textarea
            id="future-question"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              setIsRevealed(false);
            }}
            maxLength={160}
            placeholder="Esempio: riuscira questo progetto a portarmi fortuna?"
          />
          <div>
            <span>{question.length}/160</span>
            <span>{paid ? "Credito attivo" : "Carta bloccata"}</span>
          </div>
        </div>

        <section className={`oracleCard ${isRevealed ? "isRevealed" : ""}`} aria-live="polite">
          <div className="cardFace cardBack">
            <span>?</span>
            <strong>La carta aspetta la tua domanda</strong>
          </div>
          <div className="cardFace cardFront">
            <span>{selectedCard.symbol}</span>
            <p>{selectedCard.tone}</p>
            <h2>{selectedCard.name}</h2>
            <strong>{selectedCard.message}</strong>
          </div>
        </section>

        {isRevealed ? (
          <section className="oracleResult">
            <div>
              <span>Mantra vincente</span>
              <strong>{selectedCard.mantra}</strong>
            </div>
            <div>
              <span>Mossa consigliata</span>
              <strong>{selectedCard.action}</strong>
            </div>
          </section>
        ) : (
          <section className="oracleHint">
            <span>Intrattenimento e intuito, non consulenza professionale.</span>
          </section>
        )}

        <div className="oracleActions">
          <button className="coinButton" type="button" onClick={handlePayment} disabled={paid}>
            {paid ? "0,20 EUR caricati" : "Sblocca con 0,20 EUR"}
          </button>
          <button className="drawButton" type="button" onClick={handleDraw} disabled={!canDraw}>
            Estrai carta
          </button>
        </div>

        <button className="resetButton" type="button" onClick={handleReset}>
          Nuova domanda
        </button>
      </section>
    </main>
  );
}
