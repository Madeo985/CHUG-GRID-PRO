const { mkdirSync, renameSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("/Users/matteodelferraro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = "/Users/matteodelferraro/Documents/GitHub/CHUG-GRID-PRO";
const outputDir = join(root, "demo");
const finalVideo = join(outputDir, "chug-grid-demo.webm");
const baseUrl = process.env.CHUG_GRID_URL || "http://localhost:3000";

mkdirSync(outputDir, { recursive: true });

async function addCaption(page, eyebrow, title, detail = "") {
  await page.evaluate(
    ({ eyebrow, title, detail }) => {
      const existing = document.querySelector("[data-demo-caption]");
      if (existing) existing.remove();

      const caption = document.createElement("div");
      caption.setAttribute("data-demo-caption", "true");
      caption.style.position = "fixed";
      caption.style.left = "34px";
      caption.style.bottom = "30px";
      caption.style.zIndex = "99999";
      caption.style.maxWidth = "520px";
      caption.style.padding = "18px 20px";
      caption.style.border = "1px solid rgba(239,183,109,.36)";
      caption.style.borderRadius = "18px";
      caption.style.background = "rgba(7,8,10,.78)";
      caption.style.backdropFilter = "blur(14px)";
      caption.style.boxShadow = "0 22px 80px rgba(0,0,0,.42)";
      caption.style.fontFamily = "Inter, system-ui, sans-serif";
      caption.style.color = "#f4efe7";
      caption.innerHTML = `
        <div style="color:#efb76d;font-size:12px;font-weight:950;letter-spacing:.22em;text-transform:uppercase;margin-bottom:8px">${eyebrow}</div>
        <div style="font-size:30px;font-weight:950;line-height:1;letter-spacing:-.04em">${title}</div>
        ${detail ? `<div style="margin-top:10px;color:#b9bdc4;font-size:15px;line-height:1.4">${detail}</div>` : ""}
      `;
      document.body.appendChild(caption);
    },
    { eyebrow, title, detail }
  );
}

async function removeCaption(page) {
  await page.evaluate(() => document.querySelector("[data-demo-caption]")?.remove());
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await addCaption(page, "CHUG-GRID PRO", "Visualize rhythm beyond time.", "Generate playable modern metal riff cycles in the browser.");
  await wait(2200);

  await page.locator("a", { hasText: "Open rhythm lab" }).first().click();
  await wait(1000);
  await addCaption(page, "RHYTHM ENGINE", "Choose meter, cycle and feel.", "Build riffs around odd meters, realignment and grouped chugs.");
  await page.locator("select").first().selectOption("7/8");
  await page.locator('input[type="number"]').nth(1).fill("7");
  await wait(900);

  await addCaption(page, "GENERATE", "Create a riff in one click.", "Style engines turn rhythmic groups into editable picking grids.");
  await page.getByRole("button", { name: "MESHUGGAH" }).click();
  await wait(1000);
  await page.getByRole("button", { name: "VILDHJARTA" }).click();
  await wait(900);
  await page.getByRole("button", { name: "CAR BOMB" }).click();
  await wait(1000);

  await addCaption(page, "PLAYABLE GRID", "Hear it, watch it, reshape it.", "The orbit shows how the riff moves against the barline.");
  await page.getByRole("button", { name: "PLAY" }).click();
  await wait(2600);
  await page.getByRole("button", { name: "STOP" }).click();

  await addCaption(page, "EXPORT", "Send ideas to your DAW.", "Copy a riff link or export MIDI and MusicXML for production.");
  await page.getByRole("button", { name: "COPY RIFF LINK" }).click();
  await wait(1300);

  await page.goto(`${baseUrl}/modern-metal-midi-pack-vol-1`, { waitUntil: "networkidle" });
  await addCaption(page, "PREMIUM PACK", "50 modern metal MIDI riffs.", "A paid Gumroad pack turns the free tool into a product funnel.");
  await wait(2600);

  await page.goto(`${baseUrl}/free-metal-midi-riff-generator`, { waitUntil: "networkidle" });
  await addCaption(page, "FREE PACK", "Start with 10 free riff loops.", "Lead magnet first. Premium pack after trust.");
  await wait(2200);

  await removeCaption(page);
  await wait(500);

  const video = page.video();
  await context.close();
  await browser.close();

  const recordedPath = await video.path();
  renameSync(recordedPath, finalVideo);
  console.log(finalVideo);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
