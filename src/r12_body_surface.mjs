/* PRMR — enveloppe corporelle continue des espèces animales.
 *
 * L'enveloppe précédente empilait des ellipsoïdes distincts — tronc, cou, tête,
 * museau, oreilles, quatre pattes — qui s'interpénétraient en laissant leurs
 * lignes de rencontre visibles, le tout recouvert d'un maillage filaire. D'où un
 * aspect de schéma plutôt que de corps.
 *
 * Ici le corps est construit comme il se forme réellement : une colonne
 * vertébrale, et le long d'elle des sections transversales dont les rayons
 * varient de façon continue. Croupe, hanche, taille, cage thoracique, cou, crâne
 * et museau appartiennent à une seule surface, sans jointure. Les membres sont
 * des tubes à rayon variable, enracinés dans le tronc.
 *
 * Les proportions viennent de SPECIES_ANATOMY. Elles restent des proportions
 * d'illustration : ce module améliore la justesse de la silhouette, il ne
 * transforme aucune de ces surfaces en donnée acquise.
 */

import * as T from "../vendor/three/build/three.module.js";

const TWO_PI = Math.PI * 2;

/* Interpolation de Catmull-Rom sur une suite de points de contrôle (s, valeur).
   Elle passe par chaque point et garde une dérivée continue : le galbe du corps
   ne présente donc ni cassure ni facette entre deux repères. */
function splineAt(points, s) {
  const n = points.length;
  let i = 0;
  while (i < n - 2 && s > points[i + 1][0]) i++;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(n - 1, i + 1)];
  const p3 = points[Math.min(n - 1, i + 2)];
  const span = p2[0] - p1[0];
  const t = span > 1e-6 ? (s - p1[0]) / span : 0;
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1[1] +
    (-p0[1] + p2[1]) * t +
    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
  );
}

/* Rayons du corps, exprimés en unités de scène plutôt qu'en coefficients, et
   placés sur des repères anatomiques explicites : croupe, hanche, taille, cage
   thoracique, épaule, cou, crâne, museau, truffe. Un profil unique appliqué à
   tout le corps mélangeait les proportions du tronc et celles de la tête, ce qui
   donnait un crâne sphérique sans museau. */
function radiusKeys(sp) {
  const [, b, c] = sp.torso;
  const [, , , , hb, hc] = sp.head;
  // Chez un quadrupède la cage thoracique est la partie la plus profonde ; la
  // hanche est pleine mais moins, et la croupe redescend vers la queue.
  return {
    // Répartition le long de la colonne : tronc jusqu'à 0,70, cou court, puis
    // un crâne qui tient sur un véritable palier et un museau qui s'effile.
    // Auparavant le crâne n'occupait qu'une bosse étroite entre deux stations :
    // la tête se réduisait à un renflement sans museau.
    height: [
      [0.00, b * 0.30], [0.05, b * 0.72], [0.14, b * 0.90],
      [0.26, b * 0.93], [0.40, b * 0.90], [0.54, b * 1.00],
      [0.64, b * 0.96], [0.70, b * 0.84], [0.755, b * 0.64],
      [0.795, b * 0.60],
      [0.835, hb * 0.90], [0.872, hb * 1.00], [0.905, hb * 0.94],
      [0.937, hb * 0.66], [0.968, hb * 0.48], [0.990, hb * 0.30],
      [1.00, 0]
    ],
    width: [
      [0.00, c * 0.26], [0.05, c * 0.68], [0.14, c * 0.90],
      [0.26, c * 0.94], [0.40, c * 0.88], [0.54, c * 0.98],
      [0.64, c * 0.92], [0.70, c * 0.78], [0.755, c * 0.58],
      [0.795, c * 0.54],
      [0.835, hc * 0.88], [0.872, hc * 1.00], [0.905, hc * 0.92],
      [0.937, hc * 0.62], [0.968, hc * 0.45], [0.990, hc * 0.28],
      [1.00, 0]
    ]
  };
}

/* Ligne du dos : plate sur le tronc, puis remontée régulière vers la tête. */
function spineLift(s, headY) {
  if (s < 0.66) return 0.04 * Math.sin(s * Math.PI * 1.4);
  const u = (s - 0.66) / 0.34;
  return headY * u * u * (3 - 2 * u);
}

/* Géométrie de la colonne : les éléments rapportés (oreilles, membres, queue)
   doivent s'accrocher aux mêmes repères que la surface, sinon ils dérivent.
   Les oreilles étaient placées d'après head[] et non d'après la station du
   crâne dans le loft : elles se retrouvaient posées sur l'épaule. */
function spineGeometry(sp) {
  const [a] = sp.torso;
  const [hx, hy, , ha] = sp.head;
  const snoutReach = sp.id === "pig" ? 0.40 : sp.id === "nhp" ? 0.18 : 0.30;
  const tailEnd = a * 1.02;
  const noseEnd = hx - ha * 0.50 - snoutReach;
  const keys = radiusKeys(sp);
  return {
    tailEnd,
    noseEnd,
    keys,
    at(s) {
      return {
        x: tailEnd + (noseEnd - tailEnd) * s,
        y: spineLift(s, hy),
        ry: Math.max(splineAt(keys.height, s), 1e-3),
        rz: Math.max(splineAt(keys.width, s), 1e-3)
      };
    }
  };
}

/* Une surface de révolution à section elliptique, échantillonnée le long de la
   colonne. Les deux extrémités se referment en un point. */
function loft(sp, { stations = 160, ring = 48 } = {}) {
  const spine = spineGeometry(sp);
  const { tailEnd, noseEnd } = spine;
  const [, hy] = [0, sp.head[1]];

  const positions = [];
  const indices = [];

  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const { x, y, ry, rz } = spine.at(s);

    for (let j = 0; j <= ring; j++) {
      const theta = (j / ring) * TWO_PI;
      const cy = Math.cos(theta);
      const cz = Math.sin(theta);
      // Le ventre est un peu plus plein que le dos : un corps n'est pas
      // symétrique de haut en bas.
      const belly = cy < 0 ? 1.07 : 0.96;
      positions.push(x, y + ry * cy * belly, rz * cz);
    }
  }

  const perRing = ring + 1;
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < ring; j++) {
      const p = i * perRing + j;
      indices.push(p, p + perRing, p + 1, p + 1, p + perRing, p + perRing + 1);
    }
  }

  // Les deux extrémités se referment sur un sommet : sans cela le museau et la
  // croupe laissaient voir l'intérieur de la surface par un trou circulaire.
  const rumpPole = positions.length / 3;
  positions.push(tailEnd, spineLift(0, hy), 0);
  const nosePole = positions.length / 3;
  positions.push(noseEnd, spineLift(1, hy), 0);
  const lastRing = stations * perRing;
  for (let j = 0; j < ring; j++) {
    indices.push(rumpPole, j + 1, j);
    indices.push(nosePole, lastRing + j, lastRing + j + 1);
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* Tube à rayon variable : sert aux membres et à la queue, qui s'affinent de leur
   racine vers leur extrémité. Un TubeGeometry ordinaire garde un rayon constant
   et donnerait des pattes cylindriques. */
function taperedTube(points, radii, { ring = 18 } = {}) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const steps = Math.max(24, points.length * 10);
  const frames = curve.computeFrenetFrames(steps, false);
  const positions = [];
  const indices = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = curve.getPointAt(t);
    const normal = frames.normals[Math.min(i, steps - 1)];
    const binormal = frames.binormals[Math.min(i, steps - 1)];
    const r = splineAt(radii, t);
    for (let j = 0; j <= ring; j++) {
      const theta = (j / ring) * TWO_PI;
      const cx = Math.cos(theta) * r;
      const cy = Math.sin(theta) * r;
      positions.push(
        point.x + normal.x * cx + binormal.x * cy,
        point.y + normal.y * cx + binormal.y * cy,
        point.z + normal.z * cx + binormal.z * cy
      );
    }
  }

  const perRing = ring + 1;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < ring; j++) {
      const p = i * perRing + j;
      indices.push(p, p + perRing, p + 1, p + 1, p + perRing, p + perRing + 1);
    }
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* Oreille : écaille aplatie, dont la forme suit le type porté par le catalogue.
   L'oreille du lapin n'est pas celle du porc, et cette différence est l'un des
   repères les plus immédiats d'une espèce. */
function ear(kind) {
  const shapes = {
    long: { len: 0.74, width: 0.17, thick: 0.045, tilt: -0.12, curl: 0.30 },
    floppy: { len: 0.34, width: 0.21, thick: 0.05, tilt: 0.95, curl: 0.22 },
    triangular: { len: 0.30, width: 0.24, thick: 0.05, tilt: 0.28, curl: 0.12 },
    round: { len: 0.24, width: 0.23, thick: 0.04, tilt: 0.10, curl: 0.18 },
    small: { len: 0.17, width: 0.15, thick: 0.035, tilt: 0.12, curl: 0.14 }
  };
  const s = shapes[kind] || shapes.round;
  const geo = new T.SphereGeometry(1, 26, 18);
  const p = geo.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    // Effilement vers la pointe et légère conque.
    const taper = 0.45 + 0.55 * (1 - Math.max(0, y));
    p.setXYZ(
      i,
      x * s.width * taper,
      y * s.len,
      z * s.thick * taper + s.curl * (1 - y * y) * (z > 0 ? 0.5 : -0.2) * s.width
    );
  }
  geo.computeVertexNormals();
  return { geo, tilt: s.tilt, len: s.len };
}

/* Matière de l'enveloppe.
 *
 * Une enveloppe simplement translucide pose un dilemme : assez opaque pour que
 * la silhouette se lise, elle voile les organes ; assez transparente pour les
 * montrer, elle disparaît. L'ancienne version tranchait en superposant un
 * maillage filaire, d'où l'aspect de schéma technique.
 *
 * La réponse habituelle en visualisation anatomique est le terme de Fresnel :
 * la surface devient opaque là où elle est vue en incidence rasante, c'est-à-dire
 * exactement sur le contour et sur les galbes, et reste presque invisible là où
 * elle est vue de face, c'est-à-dire devant les organes. Le corps se lit alors
 * comme un volume, sans rien masquer.
 */
function bodyMaterial(color) {
  const material = new T.MeshPhysicalMaterial({
    color,
    metalness: 0.02,
    roughness: 0.58,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: T.DoubleSide,
    clearcoat: 0.4,
    clearcoatRoughness: 0.45
  });

  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPrmrView;\nvarying vec3 vPrmrNormal;")
      .replace(
        "#include <fog_vertex>",
        "#include <fog_vertex>\n vPrmrView = normalize(-mvPosition.xyz);\n vPrmrNormal = normalize(normalMatrix * objectNormal);"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPrmrView;\nvarying vec3 vPrmrNormal;")
      .replace(
        "#include <dithering_fragment>",
        [
          "#include <dithering_fragment>",
          " float facing = abs(dot(normalize(vPrmrNormal), normalize(vPrmrView)));",
          // 0.085 de base pour ne pas voiler les organes, jusqu'à 0.72 sur le contour.
          " float rim = pow(1.0 - facing, 2.6);",
          " gl_FragColor.a = 0.085 + 0.635 * rim;",
          " gl_FragColor.rgb += vec3(0.16, 0.30, 0.29) * rim;"
        ].join("\n")
      );
  };
  // Deux enveloppes compilées séparément ne doivent pas partager un programme
  // mis en cache avec une matière ordinaire.
  material.customProgramCacheKey = () => "prmr-body-fresnel";
  return material;
}

export function buildBodySurface(sp) {
  const group = new T.Group();
  group.name = "body-envelope";

  const [a, b, c] = sp.torso;
  const [hx, hy, , , hb] = sp.head;

  const material = bodyMaterial(sp.bodyColor);

  const spine = spineGeometry(sp);
  group.add(new T.Mesh(loft(sp), material));

  const legLen = sp.legs;

  // Membres : enracinés aux stations d'épaule et de hanche de la colonne, et
  // dimensionnés pour porter le corps. Les pattes précédentes partaient du
  // milieu du tronc et s'arrêtaient à mi-hauteur, d'où un animal posé sur des
  // moignons.
  const shoulder = spine.at(0.66);
  const hip = spine.at(0.20);
  const ground = -b * 0.95 - legLen * 1.25;
  for (const sign of [-1, 1]) {
    for (const [joint, bend, splay] of [[shoulder, 0.08, 0.80], [hip, -0.12, 0.86]]) {
      const z = sign * joint.rz * splay;
      const top = joint.y - joint.ry * 0.25;
      const knee = (top + ground) * 0.52;
      const points = [
        [joint.x, joint.y + joint.ry * 0.10, z * 0.70],
        [joint.x + bend * 0.4, top - (top - ground) * 0.22, z * 0.98],
        [joint.x + bend, knee, z * 1.04],
        [joint.x + bend * 0.45, (knee + ground) * 0.5, z * 1.0],
        [joint.x + bend * 0.1, ground, z * 0.98]
      ];
      const radii = [
        [0, joint.rz * 0.46], [0.22, joint.rz * 0.30], [0.5, joint.rz * 0.20],
        [0.80, joint.rz * 0.16], [1, joint.rz * 0.19]
      ];
      group.add(new T.Mesh(taperedTube(points, radii), material));
      // Pied : petite masse posée au sol, qui referme le tube.
      const paw = new T.SphereGeometry(1, 20, 14);
      const pp = paw.getAttribute("position");
      for (let i = 0; i < pp.count; i++) {
        pp.setXYZ(i,
          pp.getX(i) * joint.rz * 0.32 + joint.x + bend * 0.1 - joint.rz * 0.06,
          pp.getY(i) * joint.rz * 0.15 + ground,
          pp.getZ(i) * joint.rz * 0.22 + z * 0.98);
      }
      paw.computeVertexNormals();
      group.add(new T.Mesh(paw, material));
    }
  }

  // Oreilles, posées sur la station du crâne et non d'après head[].
  const e = ear(sp.ear);
  const skull = spine.at(0.872);
  for (const sign of [-1, 1]) {
    const mesh = new T.Mesh(e.geo.clone(), material);
    mesh.position.set(
      skull.x + skull.ry * 0.25,
      skull.y + skull.ry * 0.80 + e.len * 0.42,
      sign * skull.rz * 0.62
    );
    mesh.rotation.x = e.tilt * sign * 0.2;
    mesh.rotation.z = sign * 0.26;
    group.add(mesh);
  }

  // Queue, enracinée dans la croupe et effilée.
  if (sp.tail > 0.12) {
    const droop = sp.id === "pig" ? 0.42 : sp.id === "rabbit" ? 0.1 : 0.26;
    const points = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      points.push([
        a * 0.92 + t * sp.tail,
        b * 0.18 + Math.sin(t * Math.PI * (sp.id === "pig" ? 2.2 : 0.9)) * droop,
        Math.sin(t * Math.PI) * 0.04
      ]);
    }
    const radii = [[0, c * 0.17], [0.4, c * 0.1], [1, c * 0.035]];
    group.add(new T.Mesh(taperedTube(points, radii), material));
  }

  group.userData = {
    species: sp.id,
    validation: "outline illustration not anatomically validated"
  };
  return group;
}
