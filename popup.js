document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnGrab");
  const card = document.querySelector(".card");
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");

  // ===== BUTTON ACTION =====
  btn.addEventListener("click", async () => {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    const res = await browser.tabs.sendMessage(
      tabs[0].id,
      { type: "START_GRAB" }
    );

    if (!res?.csv) {
      alert("❌ Tabel tidak ditemukan");
      return;
    }

    downloadCSV(res.csv);
  });

  // ===== PARTICLE BACKGROUND =====
  function resize() {
    canvas.width = card.clientWidth;
    canvas.height = card.clientHeight;
  }
  resize();

  const particles = Array.from({ length: 26 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.6 + 0.6,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    o: Math.random() * 0.45 + 0.35
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,255,220,${p.o})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }

    requestAnimationFrame(draw);
  }

  draw(); // ⬅️ WAJIB
});

// ===== DOWNLOAD =====
function downloadCSV(csv) {
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "data.csv";
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}



// summary 
const btnSummary = document.getElementById("btnSummary");
const output = document.getElementById("summaryResult");

btnSummary.addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  const res = await browser.tabs.sendMessage(
    tab.id,
    { type: "SUMMARY_GRAB" }
  );

  output.value = res?.summary || "❌ Data tidak ditemukan";
});
