browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SUMMARY_GRAB") {
    buildSummary().then(summary => sendResponse({ summary }));
    return true;
  }
  if (msg.type === "START_GRAB") {
    const csv = grabTableAsCSV();
    return Promise.resolve({ csv });
  }
});

// ================== CSV GRAB ==================
function grabTableAsCSV() {
  const table = document.querySelector("table");
  if (!table) return "";

  const rows = table.querySelectorAll("tr");
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("th, td");
    if (!cells.length) return;

    const cols = [];
    cells.forEach(cell => {
      let text = cell.innerText
        .replace(/\r?\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/"/g, '""');

      cols.push(`"${text}"`);
    });

    data.push(cols.join(","));
  });

  return "\uFEFF" + data.join("\r\n"); // UTF-8 CSV
}


// ================== SUMMARY ==================
function getFieldByLabels(labels) {
  for (const label of labels) {
    const labelEl = Array.from(document.querySelectorAll("td, th, label, div"))
      .find(e => e.textContent.trim() === label);
    if (!labelEl) continue;

    const container = labelEl.closest("tr") || labelEl.parentElement;
    const input = container.querySelector("input, select, textarea");
    if (input) return (input.value || "").trim();

    const valueEl = labelEl.nextElementSibling;
    if (valueEl) return valueEl.innerText.trim();
  }
  return "";
}

// ================== BUILD SUMMARY ==================
async function buildSummary() {
  const text = document.body.innerText;

  const inc = text.match(/INC\d+/)?.[0] || "";
  const system = text.match(/IboosterDIST_\d+/)?.[0] || "";

  const workzone = getFieldByLabels(["Workzone"]) || "";

  // Ambil headline asli
  const headlineEl = document.getElementById("header-title-ticket");
  let headline = headlineEl ? headlineEl.innerText : "";

  // Bersihkan double pipe dan spasi
  headline = headline.replace(/\|\|/g,"|").replace(/\s*\|\s*/g,"|").trim();

  // Ambil key → kata sebelum " | ["
  let key = "";
  let keyIndex = -1;
  const keyMatch = headline.match(/(\b[A-Z]+)\s*\|\s*\[/);
  if (keyMatch) {
    key = keyMatch[1].trim();
    keyIndex = headline.indexOf(keyMatch[0]);
  }

  // Ambil PIC dari JSON lokal
  let pic = "";
  if (key) {
    try {
      const res = await fetch(browser.runtime.getURL("data/DB_PIC_GAMAS.json"));
      const picDict = await res.json();
      pic = picDict[key] || "";
      console.log("Found key:", key, "PIC:", pic);
    } catch(e) {
      console.error("Gagal load DB_PIC_GAMAS.json", e);
    }
  }

  // Sisipkan (EST ...) tepat setelah key
  if (key && keyIndex >= 0) {
    const beforeKey = headline.slice(0, keyIndex + key.length);
    const afterKey = headline.slice(keyIndex + key.length);
    headline = `${beforeKey} | (EST ${formatDate(new Date())})${afterKey}`;
  }

  // Sisipkan PENYEBAB | PERBAIKAN | DATEK setelah REG-5
  // headline = headline.replace(/(REG-\d+)/, "$1 | PENYEBAB | PERBAIKAN | DATEK");

	// perbaikan terbaru 
const sto = workzone || ""; // SMA

if (sto) {
  // Hapus pola: | SINGARAJA | SMA |
  const cityStoRegex = new RegExp(`\\|\\s*[^|]+\\s*\\|\\s*${sto}\\s*\\|`);
  headline = headline.replace(cityStoRegex, " | ");
}

headline = headline.replace(
  /(REG-\d+)/,
  `$1 | PENYEBAB | PERBAIKAN | ${sto}`
);


// Hapus system di tengah (biar cuma muncul di akhir)
if (system) {
  const sysRegex = new RegExp(`\\|\\s*${system}\\s*\\|?`, "g");
  headline = headline.replace(sysRegex, "");
}

  // Bangun summary final
  return `
${headline} | SLOT PORT GPON | (PIC: ${pic}) ${system}
`
  .replace(/\n+/g," ")
  .replace(/\s*\|\s*/g," | ")
  .replace(/\|\s*\|/g,"|")
  .trim();
}



// Helper: format tanggal
function formatDate(d) {
  return `${String(d.getDate()).padStart(2,"0")}/` +
         `${String(d.getMonth()+1).padStart(2,"0")}/` +
         `${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:00`;
}




