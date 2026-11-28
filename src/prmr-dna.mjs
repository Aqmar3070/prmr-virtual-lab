// Emblème décoratif : deux brins en opposition, projetés autour d’un axe incliné.
const canvas = document.createElement("canvas");
canvas.className = "prmr-dna";
canvas.setAttribute("aria-hidden", "true");
const ctx = canvas.getContext("2d");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const tilt = Math.PI * 25 / 180;
const tau = 2 * Math.PI;
function point(t, angle) {
  const x = 8 * Math.cos(angle), y = 43 * (t - .5);
  return { x: 22 + x * Math.cos(tilt) - y * Math.sin(tilt),
           y: 26 + x * Math.sin(tilt) + y * Math.cos(tilt), z: Math.sin(angle) };
}
function draw(time) {
  const phase = motion.matches ? 0 : tau * (time % 8000) / 8000;
  const lines = [];
  for (let strand = 0; strand < 2; strand++) {
    let last;
    for (let i = 0; i <= 64; i++) {
      const t = i / 64, angle = phase + (1.55 * t + .5 * strand) * tau;
      const p = point(t, angle);
      if (last) lines.push({a:last, b:p, depth:(last.z+p.z)/2, strand});
      if (!strand && i % 4 === 0) lines.push({a:p,b:point(t,angle+Math.PI),depth:0,strand:2});
      last = p;
    }
  }
  ctx.clearRect(0,0,44,52);
  ctx.lineCap = "round";
  for (const {a,b,depth,strand} of lines.sort((l,r)=>l.depth-r.depth)) {
    const light = (strand === 1 ? 77 : 57) + 14 * depth;
    ctx.strokeStyle = strand === 2 ? "#abd9df" : `hsl(${strand ? 204 : 181} ${strand ? 26 : 55}% ${light}%)`;
    ctx.lineWidth = strand === 2 ? 1.25 : 3.4;
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    if (strand !== 2) {
      ctx.strokeStyle = "rgba(238,255,255,.65)"; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(a.x-.55,a.y-.4); ctx.lineTo(b.x-.55,b.y-.4); ctx.stroke();
    }
  }
}
let frame = 0, visible = false;
function tick(time) {
  draw(time);
  frame = visible && !document.hidden && !motion.matches ? requestAnimationFrame(tick) : 0;
}
function refresh() { cancelAnimationFrame(frame); tick(performance.now()); }
function place() {
  const hosts = [...document.querySelectorAll(".lab-landing,.xp-head .xp-logo,.atlas-brand a,.risk-head a,header > a[href='./index.html'],.prmr-route-brand")];
  const shown = hosts.filter(el=>el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
  const host = shown.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];
  if (host && canvas.parentElement !== host) host.prepend(canvas);
}
function start() {
  if (!ctx) return;
  place();
  new ResizeObserver(()=>{
    const ratio = Math.min(devicePixelRatio || 1, 3);
    canvas.width = Math.max(1,Math.round(canvas.clientWidth*ratio));
    canvas.height = Math.max(1,Math.round(canvas.clientHeight*ratio));
    ctx.setTransform(canvas.width/44,0,0,canvas.height/52,0,0);
    refresh();
  }).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;refresh();}).observe(canvas);
  const overview = document.getElementById("view-overview");
  if (overview) new MutationObserver(place).observe(overview,{attributes:true,attributeFilter:["hidden"]});
  window.addEventListener("resize",place);
  document.addEventListener("visibilitychange",refresh);
  motion.addEventListener("change",refresh);
}
if (document.readyState === "complete") start();
else window.addEventListener("DOMContentLoaded", start, {once:true});
