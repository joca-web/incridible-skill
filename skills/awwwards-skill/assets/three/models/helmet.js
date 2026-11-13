/* Racing helmet: closed-face shell, mirrored visor, livery painted in code, rear spoiler, neck roll.
 * Params: color (base paint), ink (pattern colour), number, visor ('chrome' | 'gold' | 'smoke'), seed.
 * Technique: one deformed sphere for the shell (stretched back, chin pulled down), a slightly larger
 * sphere band for the visor, everything else from kit primitives. Faces +Z. */
export const meta = { name: 'racing-helmet', description: 'Closed-face racing helmet with a procedural livery', camera: { fov: 28, elevation: 8 } };

export default function build({ THREE, kit, params = {} }) {
  const color = params.color || '#d2ff00';
  const ink = params.ink || '#111112';
  const number = params.number || '07';
  const seed = parseInt(params.seed || '11', 10);
  const visorKind = params.visor || 'chrome';

  const helmet = new THREE.Group(); helmet.name = 'helmet';

  // same sculpting for shell and visor, so the visor sits exactly on the shell
  const sculpt = (v, push = 0) => {
    const n = v.clone().normalize();
    v.multiplyScalar(1 + push);
    v.x *= n.y < 0.1 ? 0.88 + 0.06 * Math.max(0, n.y + 0.6) : 0.9;   // cheeks slightly fuller than the crown
    v.y *= 1.04;
    if (v.z < 0) v.z *= 1.12;                                       // longer at the back
    // chin bar: the lower front is pulled down and pushed forward
    const chin = Math.max(0, -n.y - 0.15) * Math.max(0, n.z - 0.05);
    v.y -= chin * 1.1; v.z += chin * 0.55;
    // bottom edge: a plane that is low at the chin and rises towards the back
    const floor = -0.78 + 0.32 * Math.max(-1, Math.min(1, -n.z)) * 0.9;
    if (v.y < floor) v.y = floor + (v.y - floor) * 0.15;
  };

  // livery: base paint, organic strokes, a stripe band, numbers on both sides
  const livery = kit.canvasTexture(2048, 1024, (c, w, h) => {
    kit.paint.fill(c, w, h, color);
    kit.paint.squiggles(c, w, h, { color: ink, count: 34, width: 58, length: 300, seed });
    c.fillStyle = color; c.fillRect(0, h * 0.06, w, h * 0.05);                // clean band over the crown
    c.fillStyle = ink; c.fillRect(0, h * 0.075, w, h * 0.02);
    for (const u of [0.0, 0.5, 1.0]) {                                         // sides: u = 0/1 is -X, 0.5 is +X
      c.fillStyle = color; c.beginPath(); c.ellipse(u * w, h * 0.42, 150, 120, 0, 0, Math.PI * 2); c.fill();
      kit.paint.text(c, number, u * w, h * 0.43, { size: 190, color: ink, weight: 900, italic: true });
    }
  });
  const shellGeo = kit.deform(new THREE.SphereGeometry(1, 128, 96, 0, Math.PI * 2, 0, Math.PI * 0.74), (v) => sculpt(v));
  const shell = new THREE.Mesh(shellGeo, kit.mat.textured(livery, { side: THREE.DoubleSide }));
  shell.name = 'shell';

  // inner liner, so the open bottom does not show the livery from inside
  const liner = new THREE.Mesh(kit.deform(new THREE.SphereGeometry(0.97, 64, 48, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.44), (v) => sculpt(v)), kit.mat.fabric('#1a1a1a', { side: THREE.BackSide }));
  liner.name = 'liner';

  // visor: a band of a slightly larger sphere centred on +Z (phi = PI/2 faces +Z in SphereGeometry)
  const visorMat = {
    chrome: kit.mat.chrome({ color: '#c9ccd2', roughness: 0.04 }),
    gold: kit.mat.gold({ roughness: 0.06, iridescence: 0.6, iridescenceIOR: 1.6 }),
    smoke: new THREE.MeshPhysicalMaterial({ color: '#0d0d0f', metalness: 0.6, roughness: 0.05, clearcoat: 1 }),
  }[visorKind] || kit.mat.chrome();
  const visorGeo = kit.deform(new THREE.SphereGeometry(1, 96, 24, Math.PI / 2 - 0.98, 1.96, Math.PI * 0.38, Math.PI * 0.2), (v) => sculpt(v, 0.016));
  const visor = new THREE.Mesh(visorGeo, visorMat); visor.name = 'visor';

  // visor seal: a dark rim just around the visor
  const sealGeo = kit.deform(new THREE.SphereGeometry(1, 96, 30, Math.PI / 2 - 1.02, 2.04, Math.PI * 0.365, Math.PI * 0.23), (v) => sculpt(v, 0.008));
  const seal = new THREE.Mesh(sealGeo, kit.mat.rubber('#0b0b0b')); seal.name = 'visor-seal';

  // visor pivots on both sides
  const pivotGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 40);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(pivotGeo, kit.mat.metal('#2b2b2b', { roughness: 0.3 }));
    p.rotation.z = Math.PI / 2; p.position.set(s * 0.885, 0.03, 0.12); p.name = 'visor-pivot';
    helmet.add(p);
  }

  // rear spoiler (gurney) and its two fins
  const spoiler = new THREE.Mesh(kit.roundedBox(0.62, 0.05, 0.2, 0.02), kit.mat.carbon());
  spoiler.position.set(0, 0.86, -0.62); spoiler.rotation.x = -0.55; spoiler.name = 'spoiler';
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(kit.roundedBox(0.03, 0.12, 0.24, 0.01), kit.mat.carbon());
    fin.position.set(s * 0.3, 0.83, -0.6); fin.rotation.x = -0.55; helmet.add(fin);
  }

  // chin vent slots
  for (let i = -2; i <= 2; i++) {
    const slot = new THREE.Mesh(kit.roundedBox(0.07, 0.025, 0.06, 0.01), kit.mat.rubber());
    slot.position.set(i * 0.1, -0.5, 1.08 - Math.abs(i) * 0.03); slot.rotation.x = -0.35; slot.name = 'vent';
    helmet.add(slot);
  }

  // neck roll around the bottom opening
  const roll = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 20, 96), kit.mat.fabric('#141414'));
  roll.rotation.x = Math.PI / 2 - 0.22; roll.scale.set(0.82, 1.02, 0.8); roll.position.set(0, -0.6, 0.04);   // tucked inside the shell's bottom edge roll.name = 'neck-roll';

  helmet.add(shell, liner, seal, visor, spoiler, roll);
  return helmet;
}
