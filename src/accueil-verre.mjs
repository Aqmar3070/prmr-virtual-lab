const scene = document.querySelector(".scene");
const cards = [...scene.querySelectorAll(".cadran")];
let expanded = null;

function collapse() {
  if (!expanded) return;
  expanded.classList.remove("is-expanded");
  expanded = null;
  if (reduced.matches) restart();
}

for (const card of cards) {
  card.addEventListener("click", event => {
    if (expanded === card || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    collapse();
    const box = card.getBoundingClientRect();
    const center = box.left + box.width / 2;
    const available = Math.min(center, document.documentElement.clientWidth - center);
    const limit = card.dataset.place === "grand" ? 1.2 : 1.55;
    card.style.setProperty("--zoom", Math.min(limit, 2 * available / box.width));
    expanded = card;
    card.classList.add("is-expanded");
    if (reduced.matches) restart();
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
const circle = Math.PI * 2;
const dust = Array.from({length:136}, (_,i) => ({
  end: i % 2, angle:i*2.39996, speed:.11+(i%7)*.019,
  offset:((i*53)%137)/137, width: .4+(i%5)*.15
}));
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

function glassTube(a,b,r,base) {
  const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy);
  if(len<.01) return;
  const nx=-dy*r/len, ny=dx*r/len;
  const g=ctx.createLinearGradient(a.x-nx,a.y-ny,a.x+nx,a.y+ny);
  for (const [stop,color] of base) g.addColorStop(stop,color);
  ctx.strokeStyle=g;ctx.lineWidth=r*2;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
}
const front=[[0,"#cbffed"],[.13,"#548b81"],[.36,"#258071"],[.55,"#a8f8d4"],[.67,"#f2fff3"],[.78,"#82cdbf"],[1,"#356c72"]];
const rear=[[0,"#91d5cc"],[.22,"#285f67"],[.6,"#67aa91"],[.78,"#bee8da"],[1,"#366d73"]];
const rungs=[[0,"#749da6"],[.32,"#63bbaa"],[.56,"#e0fff2"],[1,"#387883"]];

let frame;
function render(time) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h || !ctx) return;
  const dpr = Math.min(devicePixelRatio,2);
  if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
    canvas.width = Math.round(w*dpr);
    canvas.height = Math.round(h*dpr);
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const seconds = reduced.matches ? 0 : time/1000;
  const parts = [];
  const radius = Math.min(w*.21,h*.13);
  function point(t,strand) {
    const angle = seconds*.8 + t*circle*1.75 + strand*Math.PI;
    const taper = .22+.78*Math.min(1,t*6,(1-t)*6);
    const offset=Math.cos(angle)*radius*taper;
    return {x:w*(.24+.52*t)+offset, y:h*(.89-.78*t)+offset*.35,
      z:Math.sin(angle), taper};
  }
  for (let i=0;i<96;i++) {
    for(const strand of [0,1]){
      const a=point(i/96,strand), b=point((i+1)/96,strand);
      parts.push({a,b,z:(a.z+b.z)/2, backbone:true});
    }
    if(i%4===2){
      const a=point(i/96,0), b=point(i/96,1);
      // Two half-bars meet at a narrow optical seam in each base pair.
      for(const [start,end] of [[0,.48],[.52,1]]){
        const mix=k=>({x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,z:a.z+(b.z-a.z)*k});
        parts.push({a:mix(start),b:mix(end),z:mix((start+end)/2).z,backbone:false});
      }
    }
  }
  parts.sort((a,b)=>a.z-b.z);
  for(const part of parts) {
    const {a,b,z,backbone}=part;
    const thickness=backbone ? radius*.145*(.55+.45*a.taper)*(1+.14*z) : radius*.052;
    glassTube(a,b,thickness,backbone ? (z>0?front:rear) : rungs);
  }
  const origin=scene.getBoundingClientRect(), box=canvas.getBoundingClientRect();
  cards.forEach((card,i)=>{
    const slot=card.dataset.place;
    const t=slot==="gauche"?.52:slot==="haut"?.79:.28;
    const sides=[point(t,0),point(t,1)];
    sides.sort((a,b)=> slot==="gauche"?a.x-b.x:b.x-a.x);
    const p=sides[0];
    attachWire(card,wires[i],{x:box.left-origin.left+p.x,y:box.top-origin.top+p.y},origin);
  });
  for(const d of dust) {
    const f=(seconds*d.speed+d.offset)%1, p=point(d.end,0), spread=f*radius*.72;
    const x=p.x+Math.cos(d.angle)*spread+(d.end?1:-1)*f*w*.055;
    const y=p.y+Math.sin(d.angle)*spread+(d.end?-1:1)*f*h*.115;
    ctx.fillStyle='rgba(192,255,221,'+((1-f)*.87)+')';
    ctx.beginPath();ctx.arc(x,y,d.width,0,circle);ctx.fill();
  }
  if (!reduced.matches && !document.hidden) frame=requestAnimationFrame(render);
}
function restart() {
  cancelAnimationFrame(frame);
  if(!document.hidden) render(performance.now());
}
new ResizeObserver(restart).observe(canvas);
reduced.addEventListener("change",restart);
document.addEventListener("visibilitychange",restart);
