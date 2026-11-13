/* Spirits bottle: thick glass with a heavy base, liquid inside, curved paper label, wooden stopper.
 * Params: liquid (colour), glass (tint), label (text), sub (small line), paper (label colour), ink.
 * Technique: lathe profiles for glass and liquid (the liquid profile is the glass inset by the wall
 * thickness and cut at the fill line), a label made with kit.wrap() just outside the glass. Faces +Z. */
export const meta = { name: 'spirits-bottle', description: 'Premium spirits bottle with liquid and label', camera: { fov: 26, elevation: 6 } };

export default function build({ THREE, kit, params = {} }) {
  const liquid = params.liquid || '#b8611f';
  const tint = params.glass || '#f4f1ea';
  const labelText = params.label || 'NORD';
  const sub = params.sub || 'SMALL BATCH · No. 7';
  const paper = params.paper || '#efe8da';
  const ink = params.ink || '#1a1714';
  const fill = parseFloat(params.fill || '0.78');      // share of the body height filled

  const g = new THREE.Group(); g.name = 'bottle';
  const R = 0.36, H = 1.05;                            // body radius and shoulder height

  // outer glass profile [radius, height]; sharp corners at the base edge and the lip
  const outer = [[0, 0], [R - 0.03, 0], [R, 0.03], [R, H * 0.78], [R * 0.96, H * 0.9], [R * 0.7, H * 1.0], [0.16, H * 1.12], [0.135, H * 1.28], [0.135, H * 1.42], [0.16, H * 1.44], [0.16, H * 1.5], [0.12, H * 1.52]];
  const glassGeo = kit.lathe(outer, { segments: 128, sharp: [1, 2, 9, 10] });
  const glass = new THREE.Mesh(glassGeo, kit.mat.glass({ tint, thickness: 0.06 })); glass.name = 'glass';

  // liquid: inset by the wall, thick base, cut flat at the fill line
  const top = 0.06 + (H * 0.78 - 0.06) * fill;
  const liquidGeo = kit.lathe([[0, 0.06], [R - 0.035, 0.06], [R - 0.03, 0.09], [R - 0.03, top], [0, top]], { smooth: false, segments: 128 });
  const liq = new THREE.Mesh(liquidGeo, kit.mat.liquid(liquid)); liq.name = 'liquid';

  // label: flat rounded panel, painted, bent around the body
  const lw = 0.62, lh = 0.5;
  const labelTex = kit.canvasTexture(1024, 840, (c, w, h) => {
    kit.paint.fill(c, w, h, paper);
    kit.paint.noise(c, w, h, { amount: 0.05 });
    c.strokeStyle = ink; c.lineWidth = 4; c.strokeRect(28, 28, w - 56, h - 56); c.lineWidth = 1.5; c.strokeRect(42, 42, w - 84, h - 84);
    kit.paint.text(c, labelText, w / 2, h * 0.42, { size: 190, color: ink, weight: 400, font: 'Georgia, "Times New Roman", serif', tracking: 18 });
    c.fillStyle = ink; c.fillRect(w * 0.3, h * 0.6, w * 0.4, 3);
    kit.paint.text(c, sub, w / 2, h * 0.7, { size: 40, color: ink, weight: 600, tracking: 8 });
    kit.paint.text(c, 'DISTILLED & BOTTLED BY HAND', w / 2, h * 0.84, { size: 26, color: ink, weight: 500, tracking: 6 });
  });
  // a curved strip of a cylinder just outside the glass (kit.wrap keeps UVs readable left to right)
  const label = new THREE.Mesh(kit.wrap(R + 0.004, lw, lh, { segments: 64 }), new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.85, sheen: 0.3 }));
  label.position.set(0, H * 0.42, 0); label.name = 'label';

  // neck band and stopper
  const band = new THREE.Mesh(kit.lathe([[0.14, 0], [0.145, 0.005], [0.145, 0.07], [0.14, 0.075]], { smooth: false, segments: 96 }), kit.mat.gold({ roughness: 0.3 }));
  band.position.y = H * 1.3; band.name = 'neck-band';
  const wood = kit.canvasTexture(512, 256, (c, w, h) => { kit.paint.gradient(c, w, h, ['#5a3a22', '#7b5233', '#5a3a22'], { angle: 0 }); kit.paint.stripes(c, w, h, { colors: ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.03)'], width: 6, angle: 90 }); });
  const stopper = new THREE.Mesh(kit.lathe([[0, 0], [0.19, 0], [0.2, 0.02], [0.2, 0.16], [0.18, 0.2], [0, 0.21]], { segments: 96 }), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6 }));
  stopper.position.y = H * 1.52; stopper.name = 'stopper';

  g.add(liq, glass, label, band, stopper);
  g.position.y = -H * 0.8;          // centre roughly on the origin
  return g;
}
