/* PRMR — l'accueil tient en un écran.
 *
 * La console d'accueil a un rapport de forme fixe et prend toute la largeur :
 * sur 1440 px elle mesurait 810 px de haut, et le bandeau de navigation, la
 * barre de fil d'Ariane et la rubrique repliée la poussaient hors de l'écran.
 *
 * On pourrait écrire la hauteur de ce qui l'entoure en dur dans le CSS. Ce
 * serait faux au premier bandeau ajouté, et faux en silence. On la mesure
 * donc : hauteur du document moins hauteur de la console. Cette différence ne
 * dépend pas de la taille de la console, le calcul ne tourne pas en rond.
 *
 * Sans JavaScript, la règle CSS garde sa valeur de repli : la page défile un
 * peu, elle reste entièrement utilisable.
 */

const SELECTEUR = "#view-overview .prmr-home";
const MINIMUM = 320; /* en deçà, la console devient illisible : on laisse défiler. */

function ajuster() {
  /* Le corps de page impose min-height:100vh, et le bandeau de navigation est
     au-dessus de lui : la page mesurait donc toujours au moins un écran plus
     la hauteur du bandeau, quoi qu'on fasse de la console. On publie cette
     hauteur pour que la règle puisse la déduire. */
  const bandeau = document.querySelector(".prmr-routebar, .prmr-route-bar");
  document.documentElement.style.setProperty(
    "--prmr-bar", Math.round(bandeau ? bandeau.getBoundingClientRect().height : 0) + "px");

  const console3d = document.querySelector(SELECTEUR);
  if (!console3d) return;
  const hauteurConsole = console3d.getBoundingClientRect().height;
  if (!hauteurConsole) return;
  const autour = Math.max(0, document.documentElement.scrollHeight - hauteurConsole);
  document.documentElement.style.setProperty("--prmr-home-chrome", Math.round(autour) + "px");
}

/* Deux passes : la première change la taille de la console, ce qui peut
   déplacer ce qui la suit ; la seconde fige la mesure. */
function ajusterDeuxFois() {
  ajuster();
  requestAnimationFrame(ajuster);
}

if (document.querySelector(SELECTEUR)) {
  ajusterDeuxFois();
  addEventListener("resize", ajusterDeuxFois, { passive: true });
  /* La rubrique repliée change la hauteur sans redimensionner la fenêtre. */
  for (const bloc of document.querySelectorAll("#view-overview details")) {
    bloc.addEventListener("toggle", ajusterDeuxFois);
  }
}

export { ajuster, MINIMUM };
