const scene = document.querySelector(".scene");
const cards = [...scene.querySelectorAll(".cadran")];
let expanded = null;

function collapse() {
  if (!expanded) return;
  expanded.classList.remove("is-expanded");
  expanded = null;
  if (reduced.matches) restart();
}

function expand(card) {
  if (expanded === card) return;
  collapse();
  const box = card.getBoundingClientRect();
  const center = box.left + box.width / 2;
  const available = Math.min(center, document.documentElement.clientWidth - center);
  const limit = card.dataset.place === "grand" ? 1.2 : 1.55;
  card.style.setProperty("--zoom", Math.min(limit, 2 * available / card.offsetWidth));
  expanded = card;
  card.classList.add("is-expanded");
  if (reduced.matches) restart();
}

for (const card of cards) {
  card.addEventListener("pointerenter", event => {
    if (event.pointerType !== "touch") expand(card);
  });
  card.addEventListener("focus", () => {
    if (card.matches(":focus-visible")) expand(card);
  });
  card.addEventListener("pointerleave", event => {
    if (expanded === card && event.pointerType !== "touch") collapse();
  });
  card.addEventListener("blur", () => { if (expanded === card) collapse(); });
}
document.addEventListener("pointerdown", event => {
  if (expanded && !expanded.contains(event.target)) collapse();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") collapse();
});
window.addEventListener("resize", collapse);
window.addEventListener("pageshow", collapse);

const canvas = scene.querySelector("canvas");
const ctx = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const wires = [...scene.querySelectorAll(".liaisons path")];
const vertices = [[71,7],[229,7],[295,120],[229,233],[71,233],[5,120]];

// Intersect the line from the hexagon centre with its actual outer stroke.
function attachWire(card, wire, tip, origin) {
  const box = card.getBoundingClientRect();
  const cx = box.left + box.width/2 - origin.left;
  const cy = box.top + box.height/2 - origin.top;
  const dx = tip.x-cx, dy = tip.y-cy;
  const corners = vertices.map(([x,y]) => [(x/300-.5)*box.width,(y/240-.5)*box.height]);
  for(let i=0;i<corners.length;i++) {
    const [x,y] = corners[i], [nx,ny] = corners[(i+1)%corners.length];
    const sx=nx-x, sy=ny-y, det=dx*sy-dy*sx;
    if(Math.abs(det)<.001) continue;
    const t=(x*sy-y*sx)/det, u=(x*dy-y*dx)/det;
    if(t<0 || u<0 || u>1) continue;
    const ex=cx+t*dx, ey=cy+t*dy;
    const lead=(tip.x-ex)*.24;
    wire.setAttribute("d",`M${ex} ${ey}h${lead}L${tip.x-lead} ${tip.y}H${tip.x}`);
    return;
  }
}

// The atlas starts with the approved illustration and advances its glass texture
// along the two strands over one revolution. Each tile has a transparent backdrop.
const atlas = new Image();
const columns = 8, rows = 6;
const anchors = [];
let frame;
let started;

function prepare() {
  const tileWidth = atlas.naturalWidth / columns;
  const tileHeight = atlas.naturalHeight / rows;
  const surface = document.createElement("canvas");
  surface.width = tileWidth;
  surface.height = tileHeight;
  const probe = surface.getContext("2d", {willReadFrequently:true});
  for (let i=0; i<columns*rows; i++) {
    probe.clearRect(0,0,tileWidth,tileHeight);
    probe.drawImage(atlas, (i%columns)*tileWidth, Math.floor(i/columns)*tileHeight,
      tileWidth,tileHeight,0,0,tileWidth,tileHeight);
    anchors.push(cards.map(card=>{
      const left = card.dataset.place === "gauche";
      const y = Math.floor(tileHeight * (left ? .51 : card.dataset.place === "haut" ? .30 : .68));
      const strip = probe.getImageData(0,y,tileWidth,1).data;
      let x = left ? 0 : tileWidth-1;
      while (x>=0 && x<tileWidth && strip[x*4+3]<120) x += left ? 1 : -1;
      return {x:(x+.5)/tileWidth, y:(y+.5)/tileHeight};
    }));
  }
  restart();
}

function render(time) {
  if (!anchors.length || !ctx) return;
  const w=canvas.clientWidth, h=canvas.clientHeight;
  if (!w || !h) return;
  const dpr=Math.min(devicePixelRatio,2);
  if (canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)) {
    canvas.width=Math.round(w*dpr);
    canvas.height=Math.round(h*dpr);
  }
  started ??= time;
  const i = reduced.matches ? 0 : Math.floor((time-started)/100) % anchors.length;
  const tw=atlas.naturalWidth/columns, th=atlas.naturalHeight/rows;
  const scale=Math.min(w/tw,h/th);
  const dw=tw*scale, dh=th*scale, x=(w-dw)/2, y=(h-dh)/2;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(atlas,(i%columns)*tw,Math.floor(i/columns)*th,tw,th,x,y,dw,dh);
  const box=canvas.getBoundingClientRect(), origin=scene.getBoundingClientRect();
  cards.forEach((card,j)=>{
    const p=anchors[i][j];
    attachWire(card,wires[j],{x:box.left-origin.left+x+p.x*dw,y:box.top-origin.top+y+p.y*dh},origin);
  });
  if (!reduced.matches && !document.hidden) frame=requestAnimationFrame(render);
}
function restart() {
  cancelAnimationFrame(frame);
  if (!document.hidden) render(performance.now());
}
atlas.addEventListener("load",prepare,{once:true});
atlas.src=new URL("../assets/accueil/helice-jade-cyan.webp",import.meta.url).href;
new ResizeObserver(restart).observe(canvas);
reduced.addEventListener("change",restart);
document.addEventListener("visibilitychange",restart);
