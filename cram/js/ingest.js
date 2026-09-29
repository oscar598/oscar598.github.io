// Turn dropped files into plain text. PDF and Word parsers load only when needed.

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|rtf|tex|srt|vtt)$/i;

export async function readFile(file) {
  const name = file.name;
  if (/\.pdf$/i.test(name) || file.type === "application/pdf") return { name, text: await readPdf(file) };
  if (/\.docx$/i.test(name)) return { name, text: await readDocx(file) };
  if (/\.html?$/i.test(name)) return { name, text: htmlToText(await file.text()) };
  if (TEXT_EXT.test(name) || (file.type || "").startsWith("text/")) return { name, text: await file.text() };
  throw new Error(`${name}: can't read this file type yet. Use PDF, Word (.docx), or text files.`);
}

async function readPdf(file) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = "", out = [];
    for (const it of content.items) {
      line += it.str;
      if (it.hasEOL) { out.push(line); line = ""; }
    }
    if (line) out.push(line);
    pages.push(out.join("\n"));
  }
  const text = pages.join("\n\n");
  if (text.replace(/\s/g, "").length < 50) throw new Error(`${file.name}: no selectable text (scanned PDF?). Paste the text instead.`);
  return text;
}

let mammothLoading = null;
async function readDocx(file) {
  if (!window.mammoth) {
    mammothLoading ||= new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = MAMMOTH; s.onload = res; s.onerror = () => rej(new Error("Couldn't load the Word reader. Check your connection."));
      document.head.appendChild(s);
    });
    await mammothLoading;
  }
  const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return r.value;
}

function htmlToText(html) {
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll("script,style,nav,footer").forEach(n => n.remove());
  return d.body.innerText || d.body.textContent || "";
}
