const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("/Users/matteodelferraro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = "/Users/matteodelferraro/Documents/GitHub/CHUG-GRID-PRO";
const demoDir = join(root, "demo");
const inputVideo = join(demoDir, "chug-grid-demo.webm");
const outputVideo = join(demoDir, "chug-grid-demo-with-audio.webm");

mkdirSync(demoDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  page.on("console", (message) => console.log(`[browser] ${message.text()}`));

  const videoData = readFileSync(inputVideo).toString("base64");
  await page.setContent(`
    <html>
      <body style="margin:0;background:#050505;overflow:hidden">
        <canvas id="canvas" width="1280" height="720"></canvas>
        <video id="source" muted playsinline src="data:video/webm;base64,${videoData}"></video>
      </body>
    </html>
  `);

  const bytes = await page.evaluate(async () => {
    console.log("loading source video");
    const canvas = document.querySelector("#canvas");
    const source = document.querySelector("#source");
    const ctx = canvas.getContext("2d", { alpha: false });

    await new Promise((resolve, reject) => {
      source.onloadedmetadata = resolve;
      source.onerror = reject;
    });
    console.log(`metadata loaded: ${source.duration}s`);

    const duration = source.duration || 20.25;
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const destination = audioContext.createMediaStreamDestination();
    const master = audioContext.createGain();
    master.gain.value = 0.32;
    master.connect(destination);

    function pulse(start, frequency, length, volume, type = "square") {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + length + 0.03);
    }

    function sweep(start, from, to, length, volume) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + length + 0.05);
    }

    function scheduleAudio() {
      const base = audioContext.currentTime + 0.15;
      const drone = audioContext.createOscillator();
      const droneGain = audioContext.createGain();
      drone.type = "sine";
      drone.frequency.setValueAtTime(55, base);
      droneGain.gain.setValueAtTime(0.0001, base);
      droneGain.gain.linearRampToValueAtTime(0.055, base + 0.45);
      droneGain.gain.linearRampToValueAtTime(0.035, base + duration - 0.6);
      droneGain.gain.linearRampToValueAtTime(0.0001, base + duration);
      drone.connect(droneGain);
      droneGain.connect(master);
      drone.start(base);
      drone.stop(base + duration + 0.1);

      for (let beat = 0; beat < duration; beat += 0.25) {
        const step = Math.round(beat / 0.25) % 14;
        const time = base + beat;
        if ([0, 3, 6, 8, 11].includes(step)) {
          pulse(time, step === 0 ? 82 : 110, 0.07, step === 0 ? 0.7 : 0.42);
        } else if ([2, 5, 10, 13].includes(step)) {
          pulse(time, 310, 0.025, 0.18, "triangle");
        }
      }

      for (let bar = 0; bar < duration; bar += 3.5) {
        sweep(base + bar, 45, 92, 0.22, 0.42);
        pulse(base + bar + 1.75, 660, 0.04, 0.16, "triangle");
      }

      return base;
    }

    const canvasStream = canvas.captureStream(30);
    destination.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";

    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000
    });

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    await audioContext.resume();
    console.log("audio context ready");
    const audioStart = scheduleAudio();
    console.log("audio scheduled");

    let drawing = true;
    function draw() {
      if (!drawing) return;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    }

    draw();
    recorder.start(250);
    console.log("recorder started");
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, (audioStart - audioContext.currentTime) * 1000)));
    await source.play();
    console.log("source playing");
    await new Promise((resolve) => {
      source.onended = resolve;
      setTimeout(resolve, Math.ceil((duration + 0.75) * 1000));
    });

    drawing = false;
    console.log("stopping recorder");
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    await stopped;
    console.log(`recorder stopped: ${chunks.length} chunks`);

    await audioContext.close();
    const blob = new Blob(chunks, { type: mimeType });
    console.log(`blob size: ${blob.size}`);
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });

  writeFileSync(outputVideo, Buffer.from(bytes));
  await browser.close();
  console.log(outputVideo);
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
