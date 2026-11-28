// Le navigateur choisit le rendu fixe si la réduction des animations est activée.
const emblem = document.createElement("picture");
emblem.className = "prmr-dna";
emblem.setAttribute("aria-hidden", "true");
const still = document.createElement("source");
still.media = "(prefers-reduced-motion: reduce)";
still.srcset = new URL("../assets/brand/helix-still.webp", import.meta.url).href;
const glass = document.createElement("img");
glass.alt = "";
glass.width = 132;
glass.height = 156;
glass.src = new URL("../assets/brand/helix-glass.webp", import.meta.url).href;
emblem.append(still, glass);

function place() {
  const hosts = [...document.querySelectorAll(".lab-landing,.xp-head .xp-logo,.atlas-brand a,.risk-head a,header > a[href='./index.html'],.prmr-route-brand")];
  const shown = hosts.filter(el=>el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
  const host = shown.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];
  if (host && emblem.parentElement !== host) host.prepend(emblem);
}
function start() {
  place();
  const overview = document.getElementById("view-overview");
  if (overview) new MutationObserver(place).observe(overview,{attributes:true,attributeFilter:["hidden"]});
  window.addEventListener("resize",place);
}
if (document.readyState === "complete") start();
else window.addEventListener("DOMContentLoaded", start, {once:true});
