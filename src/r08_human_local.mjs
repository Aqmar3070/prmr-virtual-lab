/** PRMR R08 — local fallback 3D anatomy. Educational reconstruction, not segmented medical imagery. */
export function buildLocalHuman(T,sex="male"){
 const root=new T.Group();root.name="PRMR_local_anatomy_"+sex;
 const female=sex==="female", groups={};
 const mat=(c,a=1)=>new T.MeshStandardMaterial({color:c,roughness:.64,metalness:.045,transparent:a<1,opacity:a,depthWrite:a>=1,side:T.DoubleSide});
 const group=k=>{const g=new T.Group();g.name=k;root.add(g);groups[k]=g;return g};
 const E=(g,p,s,c,a=1)=>{const m=new T.Mesh(new T.SphereGeometry(1,26,18),mat(c,a));m.position.set(...p);m.scale.set(...s);g.add(m);return m};
 const path=(g,points,r,c,a=1)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(18,points.length*10),r,9,false),mat(c,a));g.add(mesh);return mesh};
 const link=(g,a,b,r,c)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),dif=end.clone().sub(start),m=new T.Mesh(new T.CylinderGeometry(r*.84,r,dif.length(),14),mat(c));m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dif.normalize());g.add(m);E(g,a,[r,r,r],c);E(g,b,[r,r,r],c)};
 // Reference posture: 5.5 arbitrary scene units, aligned anatomy rather than measured patient geometry.
 const skin=group("skin"),tone=female?0xd9a58a:0xbb997f,trans=.115;
 E(skin,[0,2.0,0],[.43,.55,.34],tone,trans);E(skin,[0,2.48,.03],[.31,.34,.30],tone,trans);
 E(skin,[0,1.28,0],[female?.59:.66,.89,.38],tone,trans);E(skin,[0,.34,0],[female?.58:.49,.40,.38],tone,trans);
 link(skin,[0,1.98,0],[0,1.73,0],.19,tone);
 for(const s of [-1,1]){
  link(skin,[s*.61,1.84,0],[s*.77,.83,.02],.17,tone);
  link(skin,[s*.77,.83,.02],[s*.78,-.08,.08],.13,tone);
  E(skin,[s*.8,-.15,.09],[.18,.19,.15],tone,trans);
  link(skin,[s*.28,.28,0],[s*.31,-.98,0],female?.22:.25,tone);
  link(skin,[s*.31,-.98,0],[s*.33,-2.14,.07],.17,tone);
  E(skin,[s*.33,-2.30,.21],[.23,.12,.36],tone,trans);
 }
 // The main surface remains transparent. Bones are separately selectable anatomical systems.
 const skull=group("skull");E(skull,[0,2.49,-.02],[.27,.29,.26],0xe5d8be);
 const spine=group("spine_thoracic");path(spine,[[0,2.01,-.19],[0,1.65,-.24],[0,1.25,-.27],[0,.85,-.25]],.052,0xe4d9c9);
 const rib=group("ribs");for(let i=0;i<9;i++){const y=1.78-i*.14,w=.26+Math.sin((i+1)/10*Math.PI)*.33;for(const s of [-1,1])path(rib,[[s*.05,y,-.24],[s*w*.7,y+.02,-.31],[s*w,y-.055,.01],[s*w*.55,y-.13,.27],[s*.05,y-.15,.24]],.026,0xd3d8cf)}
 const pelvis=group("pelvis");for(const s of [-1,1]){E(pelvis,[s*.28,.34,-.15],[.26,.25,.17],0xded1b8)}
 const femurL=group("femur_l"),femurR=group("femur_r");for(const [s,g]of [[-1,femurL],[1,femurR]])link(g,[s*.29,.17,-.02],[s*.30,-.96,0],.078,0xe8dac1);
 const muscles=group("muscles_torso");for(const s of [-1,1]){E(muscles,[s*.32,1.69,.23],[.29,.40,.13],0xb65d61,.65);E(muscles,[s*.28,.76,.19],[.22,.51,.10],0xc47473,.52)}
 const brain=group("brain");E(brain,[0,2.51,-.01],[.235,.24,.23],0xd7a8b7);for(const s of [-1,1])for(let i=0;i<5;i++)path(brain,[[s*.04,2.39+i*.036,.17],[s*.14,2.37+i*.039,.21],[s*.22,2.43+i*.03,.09]],.011,0xbb768a);
 const brainstem=group("brainstem");path(brainstem,[[0,2.32,-.08],[0,2.14,-.10],[0,2.04,-.15]],.047,0xb99bb6);
 const lungsL=group("lung_l"),lungsR=group("lung_r");for(const [s,g]of [[-1,lungsL],[1,lungsR]]){const m=E(g,[s*.28,1.56,-.03],[.24,.47,.23],0xbfa8bc);m.rotation.z=s*.13;for(let j=0;j<4;j++)path(g,[[s*.1,1.92-j*.08,.01],[s*.27,1.68-j*.09,.08],[s*.39,1.42-j*.08,.10]],.017,0xdf9cac,.9)}
 const bronchi=group("bronchi");path(bronchi,[[0,2.04,.02],[0,1.77,.04]],.065,0xc8b6aa);for(const s of [-1,1])path(bronchi,[[0,1.77,.04],[s*.16,1.67,.02],[s*.28,1.50,0]],.038,0xc8b6aa);
 const heart=group("heart");const hm=E(heart,[-.12,1.48,.21],[.22,.29,.19],0xc0525c);hm.rotation.z=-.25;E(heart,[-.21,1.68,.20],[.13,.11,.14],0xb54857);
 const liver=group("liver");const liv=E(liver,[.23,.95,.11],[.37,.22,.25],0x995f59);liv.rotation.z=.11;
 const gall=group("gallbladder");E(gall,[.39,.77,.21],[.08,.13,.06],0x7e9d62);
 const stomach=group("stomach");const sm=E(stomach,[-.26,.84,.20],[.17,.23,.13],0xc98778);sm.rotation.z=-.37;
 const spleen=group("spleen");const spl=E(spleen,[-.47,.92,-.06],[.10,.24,.13],0x884e75);spl.rotation.z=-.18;
 const pancreas=group("pancreas");const pan=E(pancreas,[0,.65,.11],[.31,.09,.12],0xd4be82);pan.rotation.z=.09;
 const small=group("small_intestine");for(let i=0;i<6;i++){let y=.34-i*.11;path(small,[[-.32,y,.21],[-.15,y+.035,.28],[.06,y-.02,.27],[.29,y+.05,.22]],.048,0xd6a08c)}
 const colon=group("colon");path(colon,[[-.42,.56,.17],[-.46,.34,.19],[-.47,.05,.2],[-.16,-.03,.21],[.16,-.02,.21],[.44,.16,.18],[.43,.48,.14]],.069,0xc69879);
 const leftK=group("kidney_l"),rightK=group("kidney_r");for(const [s,g]of [[-1,leftK],[1,rightK]]){const m=E(g,[s*.36,.63,-.18],[.17,.26,.13],0xad5964);m.rotation.z=s*.15;E(g,[s*.32,.61,-.054],[.048,.11,.04],0xd39a9a)}
 const ureterL=group("ureter_l"),ureterR=group("ureter_r");for(const [s,g]of [[-1,ureterL],[1,ureterR]])path(g,[[s*.32,.46,-.09],[s*.29,.25,-.05],[s*.21,-.01,.01],[s*.10,-.15,.07]],.023,0xe2b5a1);
 const bladder=group("bladder");E(bladder,[0,-.20,.07],[.17,.17,.15],0xdba58c);
 const adrenalL=group("adrenal_l"),adrenalR=group("adrenal_r");for(const [s,g]of [[-1,adrenalL],[1,adrenalR]])E(g,[s*.36,.90,-.17],[.13,.075,.08],0xc8ad78);
 const aorta=group("aorta");path(aorta,[[-.10,1.64,-.17],[.04,1.92,-.15],[.20,1.82,-.17],[.14,1.61,-.20],[.09,1.17,-.23],[.09,.67,-.24],[.04,.25,-.20],[.04,-.10,-.19]],.057,0xc94655);
 const vc=group("vena_cava_inferior");path(vc,[[-.07,-.15,-.22],[-.08,.55,-.25],[-.08,1.06,-.26],[-.15,1.49,-.14]],.067,0x467ab6);
 const vcS=group("vena_cava_superior");path(vcS,[[-.11,2.06,-.23],[-.10,1.78,-.19],[-.16,1.49,-.13]],.055,0x527abb);
 const abArts=group("arteries_abdomen"),abVeins=group("veins_abdomen");for(const s of [-1,1]){path(abArts,[[.07,.72,-.22],[s*.20,.69,-.23],[s*.32,.65,-.18]],.031,0xdb5b68);path(abVeins,[[s*.32,.59,-.16],[s*.20,.58,-.21],[-.07,.56,-.24]],.036,0x4d86c6)}
 const chestArt=group("arteries_thorax"),chestVein=group("veins_thorax");
 for(const s of [-1,1]){path(chestArt,[[.06,1.77,-.22],[s*.28,1.89,-.19],[s*.57,1.90,-.11],[s*.69,1.69,-.04]],.025,0xd45a6b);path(chestVein,[[s*.68,1.70,-.13],[s*.38,1.85,-.21],[-.10,1.79,-.23]],.032,0x567db9)}
 const coronary=group("coronary_arteries");for(const s of [-1,1])path(coronary,[[-.12,1.63,.37],[s*.15-.12,1.5,.41],[s*.13-.12,1.33,.33]],.015,0xd8434d);
 const carotL=group("carotid_l"),carotR=group("carotid_r");for(const [s,g]of [[-1,carotL],[1,carotR]])path(g,[[0,1.92,-.18],[s*.10,2.11,-.14],[s*.11,2.45,-.11]],.025,0xd6535b);
 const peripheral={arteries_arm_l:-1,arteries_arm_r:1,veins_arm_l:-1,veins_arm_r:1,arteries_leg_l:-1,arteries_leg_r:1,veins_leg_l:-1,veins_leg_r:1};
 for(const [name,s]of Object.entries(peripheral)){const g=group(name),v=name.startsWith("veins"),c=v?0x487ac0:0xc84a5a;
  if(name.includes("arm"))path(g,[[s*.55,1.84,v?-.13:.08],[s*.75,1.18,v?-.12:.12],[s*.77,.40,v?-.11:.12],[s*.80,-.08,v?-.11:.11]],v?.024:.021,c);
  else path(g,[[s*.17,.24,v?-.19:.13],[s*.30,-.70,v?-.20:.14],[s*.33,-1.43,v?-.18:.14],[s*.34,-2.10,v?-.14:.14]],v?.026:.022,c)
 }
 const pelvisArts=group("arteries_pelvis"),pelvisVeins=group("veins_pelvis");for(const s of [-1,1]){path(pelvisArts,[[.04,.1,-.18],[s*.19,-.05,-.18],[s*.29,-.30,-.16]],.037,0xca5260);path(pelvisVeins,[[s*.29,-.32,-.23],[s*.19,-.02,-.25],[-.08,.2,-.22]],.035,0x4b83ba)}
 const nerves=group("nerves_spinal");for(const s of [-1,1])for(let i=0;i<12;i++){const y=1.86-i*.18;path(nerves,[[0,y,-.31],[s*.22,y-.03,-.30],[s*.42,y-.08,-.26]],.013,0xe1c975)}
 if(female){const uterus=group("uterus");E(uterus,[0,.01,.08],[.15,.15,.11],0xb87588);for(const s of [-1,1]){const ovary=group(s<0?"ovary_l":"ovary_r");E(ovary,[s*.29,.11,.13],[.085,.06,.06],0xe1baad)}}
 else {const prostate=group("prostate");E(prostate,[0,-.34,.06],[.12,.075,.09],0xb9877e)}
 return {root,groups};
}
