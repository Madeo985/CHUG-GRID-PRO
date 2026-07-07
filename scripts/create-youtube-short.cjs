const { createReadStream, mkdirSync, writeFileSync } = require("node:fs");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { chromium } = require("/Users/matteodelferraro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = "/Users/matteodelferraro/Documents/GitHub/CHUG-GRID-PRO";
const demoDir = join(root, "demo");
const inputVideo = join(demoDir, "chug-grid-demo-with-audio.webm");
const outputVideo = join(demoDir, "chug-grid-youtube-short.webm");
const outputThumb = join(demoDir, "chug-grid-youtube-short-thumb.png");

mkdirSync(demoDir, { recursive: true });

function createVideoServer() {
  const server = createServer((request, response) => {
    if (request.url === "/source.webm") {
      response.writeHead(200, {
        "Content-Type": "video/webm",
        "Cache-Control": "no-store"
      });
      createReadStream(inputVideo).pipe(response);
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(`
      <html>
        <body style="margin:0;background:#050505;overflow:hidden">
          <canvas id="canvas" width="1080" height="1920"></canvas>
          <video id="source" muted playsinline src="/source.webm"></video>
        </body>
      </html>
    `);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

(async () => {
  const videoServer = await createVideoServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });

  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1
  });
  page.on("console", (message) => console.log(`[browser] ${message.text()}`));

  await page.goto(videoServer.url, { waitUntil: "domcontentloaded" });

  const result = await page.evaluate(async () => {
    const canvas = document.querySelector("#canvas");
    const source = document.querySelector("#source");
    const ctx = canvas.getContext("2d", { alpha: false });
    const width = canvas.width;
    const height = canvas.height;

    console.log("waiting for source metadata");
    await new Promise((resolve, reject) => {
      if (source.readyState >= 1) {
        resolve();
        return;
      }
      source.onloadedmetadata = resolve;
      source.onerror = reject;
      source.load();
      setTimeout(() => reject(new Error("Source metadata timeout")), 10000);
    });
    console.log(`source metadata loaded: ${source.duration}s`);

    const totalDuration = Math.min(source.duration || 20.2, 20.2);
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const destination = audioContext.createMediaStreamDestination();
    const master = audioContext.createGain();
    master.gain.value = 0.38;
    master.connect(destination);

    function roundedRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawVideoCover(x, y, w, h, blur = false, alpha = 1) {
      const videoRatio = 1280 / 720;
      const targetRatio = w / h;
      let sx = 0;
      let sy = 0;
      let sw = 1280;
      let sh = 720;
      if (targetRatio > videoRatio) {
        sh = sw / targetRatio;
        sy = (720 - sh) / 2;
      } else {
        sw = sh * targetRatio;
        sx = (1280 - sw) / 2;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = blur ? "blur(28px) brightness(.48) saturate(1.25)" : "none";
      ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();
    }

    function drawVideoContain(x, y, w, h) {
      const ratio = 1280 / 720;
      let dw = w;
      let dh = dw / ratio;
      if (dh > h) {
        dh = h;
        dw = dh * ratio;
      }
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.65)";
      ctx.shadowBlur = 44;
      ctx.shadowOffsetY = 28;
      roundedRect(dx - 10, dy - 10, dw + 20, dh + 20, 34);
      ctx.fillStyle = "rgba(239,183,109,.18)";
      ctx.fill();
      roundedRect(dx, dy, dw, dh, 28);
      ctx.clip();
      ctx.drawImage(source, 0, 0, 1280, 720, dx, dy, dw, dh);
      ctx.restore();
    }

    function drawOrbitSpotlight(x, y, size) {
      const sx = 610;
      const sy = 78;
      const sw = 565;
      const sh = 565;

      ctx.save();
      ctx.shadowColor = "rgba(54,214,231,.42)";
      ctx.shadowBlur = 54;
      ctx.shadowOffsetY = 16;
      roundedRect(x - 10, y - 10, size + 20, size + 20, 38);
      ctx.fillStyle = "rgba(54,214,231,.14)";
      ctx.fill();
      roundedRect(x, y, size, size, 32);
      ctx.clip();
      ctx.drawImage(source, sx, sy, sw, sh, x, y, size, size);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(54,214,231,.86)";
      ctx.lineWidth = 4;
      roundedRect(x, y, size, size, 32);
      ctx.stroke();
      ctx.fillStyle = "rgba(3,4,6,.84)";
      roundedRect(x + 28, y + size - 94, size - 56, 58, 18);
      ctx.fill();
      ctx.fillStyle = "#36d6e7";
      ctx.font = "900 28px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ORBIT VIEW: SEE WHERE THE RIFF LANDS", x + size / 2, y + size - 55);
      ctx.textAlign = "left";
      ctx.restore();
    }

    function wrapText(text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line, x, y);
          line = word;
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) ctx.fillText(line, x, y);
    }

    const scenes = [
      {
        start: 0,
        end: 2.65,
        title: "MAKE METAL RIFFS IN ODD METERS",
        kicker: "WHAT IS CHUG-GRID?",
        detail: "A browser tool that generates playable chug riffs for your DAW."
      },
      {
        start: 2.65,
        end: 5.35,
        title: "PICK A METER + FEEL",
        kicker: "7/8, 5/4, 13/16",
        detail: "Choose odd meters, loop length, accents and riff style."
      },
      {
        start: 5.35,
        end: 8.75,
        title: "ONE CLICK. NEW RIFF.",
        kicker: "MESHUGGAH / VILDHJARTA / CAR BOMB",
        detail: "Generate variations instead of writing the same pattern again."
      },
      {
        start: 8.75,
        end: 12.55,
        title: "WATCH THE ORBIT MOVE",
        kicker: "RHYTHM ORBIT",
        detail: "The moving orbit shows how the riff shifts against the barline."
      },
      {
        start: 12.55,
        end: 16.3,
        title: "EXPORT TO YOUR DAW",
        kicker: "MIDI + MUSICXML",
        detail: "Download MIDI or MusicXML and drop the riff into your project."
      },
      {
        start: 16.3,
        end: 99,
        title: "TRY IT FREE",
        kicker: "CHUGGRID.COM",
        detail: "Use the generator, grab free loops, then upgrade for the full pack."
      }
    ];

    function currentScene(time) {
      return scenes.find((scene) => time >= scene.start && time < scene.end) || scenes[scenes.length - 1];
    }

    function easeOutBack(value) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
    }

    function drawFrame() {
      const time = source.currentTime;
      const scene = currentScene(time);
      const local = Number.isFinite(time) ? Math.max(0, Math.min(1, (time - scene.start) / 0.55)) : 1;
      const pop = Number.isFinite(local) ? easeOutBack(local) : 1;

      ctx.clearRect(0, 0, width, height);
      drawVideoCover(0, 0, width, height, true, 1);

      const glow = ctx.createRadialGradient(width / 2, 610, 80, width / 2, 610, 720);
      glow.addColorStop(0, "rgba(239,183,109,.24)");
      glow.addColorStop(0.45, "rgba(54,214,231,.12)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(3,4,6,.55)";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, 95);
      ctx.scale(1 + Math.sin(time * 3.2) * 0.015, 1 + Math.sin(time * 3.2) * 0.015);
      ctx.fillStyle = "#efb76d";
      ctx.font = "900 30px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.letterSpacing = "6px";
      ctx.fillText("CHUG-GRID PRO", 0, 0);
      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillStyle = "#efb76d";
      ctx.font = "900 31px Inter, Arial, sans-serif";
      ctx.fillText(scene.kicker, 70, 200);

      ctx.fillStyle = "#fff8ef";
      ctx.font = "900 76px Arial Black, Impact, Arial, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,.4)";
      ctx.shadowBlur = 18;
      ctx.save();
      ctx.translate(70, 292);
      ctx.scale(Math.max(0.92, Math.min(1.08, pop)), Math.max(0.92, Math.min(1.08, pop)));
      wrapText(scene.title, 0, 0, 880, 82);
      ctx.restore();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#cbd1d8";
      ctx.font = "600 34px Inter, Arial, sans-serif";
      wrapText(scene.detail, 70, 498, 880, 46);

      const videoY = 660 + Math.sin(time * 1.5) * 8;
      if (scene.kicker === "RHYTHM ORBIT") {
        drawOrbitSpotlight(160, 622, 760);
      } else {
        drawVideoContain(52, videoY, 976, 610);
      }

      const progress = Math.min(1, time / totalDuration);
      ctx.fillStyle = "rgba(255,255,255,.13)";
      roundedRect(70, 1348, 940, 12, 8);
      ctx.fill();
      const progressGradient = ctx.createLinearGradient(70, 0, 1010, 0);
      progressGradient.addColorStop(0, "#efb76d");
      progressGradient.addColorStop(1, "#36d6e7");
      ctx.fillStyle = progressGradient;
      roundedRect(70, 1348, 940 * progress, 12, 8);
      ctx.fill();

      ctx.fillStyle = "rgba(10,11,15,.78)";
      roundedRect(70, 1448, 940, 178, 34);
      ctx.fill();
      ctx.strokeStyle = "rgba(239,183,109,.28)";
      ctx.lineWidth = 2;
      roundedRect(70, 1448, 940, 178, 34);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "950 46px Inter, Arial, sans-serif";
      ctx.fillText("Generate riffs. Export MIDI.", 112, 1522);
      ctx.fillStyle = "#efb76d";
      ctx.font = "900 38px Inter, Arial, sans-serif";
      ctx.fillText("chuggrid.com", 112, 1586);

      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.font = "800 28px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LINK IN BIO / TRY IT FREE", width / 2, 1780);
      ctx.textAlign = "left";
    }

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

    function riser(start, length) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(70, start);
      oscillator.frequency.exponentialRampToValueAtTime(520, start + length);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.12);
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
      drone.frequency.setValueAtTime(41.2, base);
      droneGain.gain.setValueAtTime(0.0001, base);
      droneGain.gain.linearRampToValueAtTime(0.07, base + 0.4);
      droneGain.gain.linearRampToValueAtTime(0.03, base + totalDuration - 0.5);
      droneGain.gain.linearRampToValueAtTime(0.0001, base + totalDuration);
      drone.connect(droneGain);
      droneGain.connect(master);
      drone.start(base);
      drone.stop(base + totalDuration + 0.1);

      for (let t = 0; t < totalDuration; t += 0.18) {
        const step = Math.round(t / 0.18) % 14;
        if ([0, 3, 5, 8, 11].includes(step)) {
          pulse(base + t, step === 0 ? 72 : 108, 0.055, step === 0 ? 0.74 : 0.42);
        }
        if ([2, 7, 10, 13].includes(step)) {
          pulse(base + t, 440, 0.02, 0.16, "triangle");
        }
      }

      for (const scene of scenes.slice(1, -1)) {
        riser(base + scene.start - 0.38, 0.34);
        pulse(base + scene.start, 880, 0.055, 0.22, "triangle");
      }

      return base;
    }

    const stream = canvas.captureStream(30);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4000000,
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
    function loop() {
      if (!drawing) return;
      drawFrame();
      requestAnimationFrame(loop);
    }

    loop();
    recorder.start(250);
    console.log("recorder started");
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, (audioStart - audioContext.currentTime) * 1000)));
    await source.play();
    console.log("source playing");
    await new Promise((resolve) => setTimeout(resolve, Math.ceil((totalDuration + 0.45) * 1000)));

    drawing = false;
    console.log("stopping recorder");
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.stop();
    await stopped;
    console.log(`recorder stopped: ${chunks.length} chunks`);

    source.pause();
    await new Promise((resolve) => {
      source.onseeked = resolve;
      source.currentTime = 1.15;
      setTimeout(resolve, 1000);
    });
    drawFrame();

    await audioContext.close();
    const videoBlob = new Blob(chunks, { type: mimeType });
    console.log(`short blob size: ${videoBlob.size}`);
    const thumbData = canvas.toDataURL("image/png").split(",")[1];

    return {
      video: Array.from(new Uint8Array(await videoBlob.arrayBuffer())),
      thumb: thumbData
    };
  });

  writeFileSync(outputVideo, Buffer.from(result.video));
  writeFileSync(outputThumb, Buffer.from(result.thumb, "base64"));
  await browser.close();
  videoServer.server.close();
  console.log(outputVideo);
  console.log(outputThumb);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
