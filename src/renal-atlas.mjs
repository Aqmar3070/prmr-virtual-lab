import * as T from "../vendor/three/build/three.module.js";

// Retain atlas triangles in the renal region, in the same coordinates as the kidneys.
function regionalGeometry(node, box) {
  const source=node.geometry, positions=source.getAttribute("position"), index=source.index;
  const count=index ? index.count : positions.count;
  const vertices=[], triangle=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
  for(let i=0;i<count;i+=3){
    triangle.forEach((point,j)=>point.fromBufferAttribute(positions,index?index.getX(i+j):i+j).applyMatrix4(node.matrixWorld));
    if(triangle.every(point=>box.containsPoint(point))) {
      for(const point of triangle) vertices.push(point.x,point.y,point.z);
    }
  }
  if(!vertices.length)return null;
  const result=new T.BufferGeometry();
  result.setAttribute("position",new T.Float32BufferAttribute(vertices,3));result.computeVertexNormals();
  return result;
}

export function renalAtlas(body) {
  body.updateMatrixWorld(true);
  const parts=new T.Group(), vessels=new T.Group();
  const capsule=new T.MeshPhongMaterial({color:0x318ab4,specular:0xa3ebff,shininess:72,transparent:true,opacity:.59,depthWrite:false});
  const meshLines=new T.MeshBasicMaterial({color:0x81d9f5,wireframe:true,transparent:true,opacity:.075,depthWrite:false});
  const rim=new T.ShaderMaterial({
    uniforms:{},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalMatrix*normal;v=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 n; varying vec3 v; void main(){float r=pow(1.-abs(dot(normalize(n),normalize(v))),2.8);gl_FragColor=vec4(.32,.84,1.,r*.75);}'
  });
  for(const name of ["kidney_l","kidney_r"]){
    const node=body.getObjectByName(name);
    if(!node?.isMesh)throw Error("Surface rénale absente");
    const mesh=new T.Mesh(node.geometry,capsule);
    mesh.add(new T.Mesh(node.geometry,meshLines),new T.Mesh(node.geometry,rim));
    mesh.applyMatrix4(node.matrixWorld);parts.add(mesh);
  }
  const bounds=new T.Box3().setFromObject(parts),size=bounds.getSize(new T.Vector3());
  bounds.expandByVector(size.clone().multiply(new T.Vector3(.02,.13,.12)));
  for(const [name,color] of [["aorta",0xff9873],["arteries_abdomen",0xff8f75],["veins_abdomen",0x70c8fa],["vena_cava_inferior",0x70c8fa],["ureter_l",0xe1c69a],["ureter_r",0xe1c69a]]){
    const node=body.getObjectByName(name);
    if(!node?.isMesh)continue;
    const geometry=regionalGeometry(node,bounds);
    if(geometry)vessels.add(new T.Mesh(geometry,new T.MeshPhongMaterial({color,emissive:color,emissiveIntensity:.18})));
  }
  parts.add(vessels);
  const full=new T.Box3().setFromObject(parts);
  parts.position.copy(full.getCenter(new T.Vector3())).negate();
  const model=new T.Group();model.add(parts);
  return {model,size:full.getSize(new T.Vector3()),vessels};
}
