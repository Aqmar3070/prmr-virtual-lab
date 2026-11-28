const scene = document.querySelector(".scene");
const cards = [...scene.querySelectorAll(".cadran")];
function promote(card) {
  const large = cards.find(item => item.dataset.place === "grand");
  if (card === large) return;
  large.dataset.place = card.dataset.place;
  card.dataset.place = "grand";
}

// Keep the original target clickable while its illustration moves away.
let held = null;
scene.addEventListener("pointermove", event => {
  if (event.pointerType === "touch") return;
  if (held && Math.hypot(event.clientX - held.x, event.clientY - held.y) < 18) return;
  held = null;
  const card = event.target.closest(".cadran");
  if (card && card.dataset.place !== "grand") {
    held = {card, x:event.clientX, y:event.clientY};
    promote(card);
  }
});
scene.addEventListener("pointerleave", () => { held = null; });
scene.addEventListener("click", event => {
  if (held && event.detail && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    location.assign(held.card.href);
  }
});
for (const card of cards) {
  card.addEventListener("focus", () => {
    if (card.matches(":focus-visible")) promote(card);
  });
}

const canvas = scene.querySelector("canvas");
const ctx = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const circle = Math.PI * 2;
const dust = Array.from({length:136}, (_,i) => ({
  end: i % 2, angle:i*2.39996, speed:.11+(i%7)*.019,
  offset:((i*53)%137)/137, width: .4+(i%5)*.15
}));
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
  const radius = Math.min(w*.15,h*.105);
  function point(t,strand) {
    const a = seconds*.85 + t*circle*1.45 + strand*Math.PI;
    const taper = .25+.75*Math.min(1,t*7,(1-t)*7);
    return {x:w*(.24+.52*t)+Math.cos(a)*radius*taper,
      y:h*(.89-.78*t)+Math.cos(a)*radius*taper*.32, z:Math.sin(a)};
  }
  for(let i=0;i<=92;i++){
    const t=i/92, a=point(t,0), b=point(t,1);
    if (i%4===2) parts.push({a,b,z:0,rung:true});
    for(const p of [a,b]) parts.push({a:p,z:p.z,rung:false});
  }
  parts.sort((a,b)=>a.z-b.z);
  for(const {a,b,z,rung} of parts) {
    if(rung) {
      const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y+.001);
      g.addColorStop(0,"#b9ffe7");g.addColorStop(.48,"#599f91");g.addColorStop(1,"#cffff3");
      ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.2,radius*.08);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    } else {
      const r=Math.max(1.5,radius*(.131+.025*z));
      const g=ctx.createRadialGradient(a.x-r*.32,a.y-r*.45,0,a.x,a.y,r);
      g.addColorStop(0,"#f3fff5");g.addColorStop(.35,z>0?"#b1ffda":"#84d5b1");g.addColorStop(.74,"#45a897");g.addColorStop(1,"#205b68");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(a.x,a.y,r,0,circle);ctx.fill();
    }
  }
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
