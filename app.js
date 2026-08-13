const words = ["我", "你", "他", "的", "是", "請", "謝", "學", "校", "讀"];
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const target = document.querySelector("#target");
const progress = document.querySelector("#progress");
const status = document.querySelector("#status");
let wordIndex = 0;
let strokes = [];
let activeStroke = null;
let samples = JSON.parse(localStorage.getItem("traditional-handwriting-samples") || "[]");

function drawGuide() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#e3e8ef";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke(); ctx.setLineDash([]);
}
function redraw() {
  drawGuide();
  ctx.strokeStyle = "#172334"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    ctx.beginPath();
    stroke.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }
}
function point(event) {
  const box = canvas.getBoundingClientRect();
  return { x: Math.round((event.clientX - box.left) * canvas.width / box.width), y: Math.round((event.clientY - box.top) * canvas.height / box.height), t: Date.now(), pressure: event.pressure || 0.5 };
}
function updateTarget() {
  target.value = words[wordIndex];
  progress.textContent = `${wordIndex + 1} / ${words.length}`;
  redraw();
}
canvas.addEventListener("pointerdown", event => {
  event.preventDefault(); canvas.setPointerCapture(event.pointerId);
  activeStroke = { points: [point(event)] }; strokes.push(activeStroke); redraw();
});
canvas.addEventListener("pointermove", event => {
  if (!activeStroke || !canvas.hasPointerCapture(event.pointerId)) return;
  activeStroke.points.push(point(event)); redraw();
});
function endStroke() { activeStroke = null; }
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
document.querySelector("#undo").onclick = () => { strokes.pop(); redraw(); };
document.querySelector("#clear").onclick = () => { strokes = []; redraw(); };
document.querySelector("#save").onclick = () => {
  if (!strokes.length) { status.textContent = "請先寫一個字。"; return; }
  samples.push({ target: words[wordIndex], writer_id: document.querySelector("#writer").value.trim() || "anonymous", created_at: new Date().toISOString(), canvas: { width: canvas.width, height: canvas.height }, strokes });
  localStorage.setItem("traditional-handwriting-samples", JSON.stringify(samples));
  status.textContent = `已儲存：${words[wordIndex]}（共 ${samples.length} 個樣本）`;
  strokes = []; wordIndex = (wordIndex + 1) % words.length; updateTarget();
};
document.querySelector("#download").onclick = () => {
  const blob = new Blob([JSON.stringify(samples, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `traditional-handwriting-${new Date().toISOString().slice(0, 10)}.json`;
  link.click(); URL.revokeObjectURL(url);
};
updateTarget();
