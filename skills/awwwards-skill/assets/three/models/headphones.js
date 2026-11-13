/* Over-ear headphones: arched headband, sliders, capsule ear cups with cushions, metal badge.
 * Params: color (shell), cushion, metal, badge (letter on the cups).
 * Technique: the band is a tube along an arc; ear cups are lathe profiles turned to face sideways;
 * cushions are flattened tori. Faces +Z with the band on top, like a product shot. */
export const meta = { name: 'over-ear-headphones', description: 'Over-ear headphones in product-shot pose', camera: { fov: 28, elevation: 10 } };

export default function build({ THREE, kit, params = {} }) {
  const color = params.color || '#f3f2ef';
  const cushion = params.cushion || '#e6e4df';
  const metal = params.metal || '#c9c9c9';
  const badge = params.badge || 'a';

  const g = new THREE.Group(); g.name = 'headphones';
  const shellMat = kit.mat.plastic(color, { roughness: 0.32, clearcoat: 0.6 });
  const W = 0.72;                                   // half distance between cups

  // headband: outer plastic arc plus a soft inner pad
  const band = new THREE.Mesh(kit.tube(kit.arc(W, 8, 172, 40, { cy: 0.18 }), 0.055, { radial: 24 }), shellMat);
  band.scale.set(1, 1.05, 0.55); band.name = 'headband';
  const pad = new THREE.Mesh(kit.tube(kit.arc(W - 0.05, 40, 140, 30, { cy: 0.18 }), 0.045, { radial: 20 }), kit.mat.fabric('#2a2a2a'));
  pad.scale.set(1, 1.05, 0.7); pad.name = 'band-pad';

  // sliders: thin metal strips dropping from the band to the cups
  for (const s of [-1, 1]) {
    const slider = new THREE.Mesh(kit.roundedBox(0.03, 0.28, 0.07, 0.012), kit.mat.metal(metal, { roughness: 0.2 }));
    slider.position.set(s * (W + 0.01), 0.05, 0); slider.rotation.z = s * 0.08; slider.name = 'slider';
    g.add(slider);
  }

  // ear cups: capsule-shaped shells (lathe around Y, then turned to face X)
  const cupGeo = kit.lathe([[0, 0], [0.2, 0], [0.31, 0.02], [0.34, 0.07], [0.34, 0.13], [0.3, 0.17], [0, 0.18]], { segments: 96 });
  const cushionGeo = new THREE.TorusGeometry(0.255, 0.07, 28, 96);
  const badgeTex = kit.canvasTexture(512, 512, (c, w, h) => {
    kit.paint.fill(c, w, h, metal); kit.paint.noise(c, w, h, { amount: 0.06 });
    kit.paint.text(c, badge, w / 2, h / 2 + 10, { size: 300, color: '#2a2a2a', weight: 800 });
  });
  for (const s of [-1, 1]) {
    const cup = new THREE.Group(); cup.name = s < 0 ? 'cup-left' : 'cup-right';
    const shell = new THREE.Mesh(cupGeo, shellMat);
    const ring = new THREE.Mesh(cushionGeo, kit.mat.fabric(cushion));
    ring.rotation.x = Math.PI / 2; ring.scale.set(1, 1.25, 0.8); ring.position.y = -0.03;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 64), [kit.mat.metal(metal), new THREE.MeshStandardMaterial({ map: badgeTex, metalness: 0.9, roughness: 0.25 }), kit.mat.metal(metal)]);
    disc.position.y = 0.183; disc.rotation.y = s * Math.PI / 2;   // letter upright once the cup is turned
    shell.scale.set(1, 1, 1.25); disc.scale.set(1, 1, 1.25);
    cup.add(shell, ring, disc);
    cup.rotation.z = s * -Math.PI / 2;               // outer face points away from the head
    cup.position.set(s * (W + 0.08), -0.22, 0);
    g.add(cup);
  }
  g.add(band, pad);
  g.rotation.y = 0.0;
  return g;
}
