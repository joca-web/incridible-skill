/* Collectible card with a gold frame: painted front, printed back, slightly bevelled.
 * Params: name, number, title, stat, top / bottom (gradient colours), image (URL of a photo for the
 * front, same-origin or CORS-enabled; omitted = abstract art).
 * Technique: a thin rounded box body, a painted front panel and back panel, and a gold frame made
 * with kit.frame(). The front texture is drawn with the 2D canvas, so text stays sharp. Faces +Z. */
export const meta = { name: 'collectible-card', description: 'Trading card with gold frame and painted art', camera: { fov: 26, elevation: 4 }, shadow: false };

export default async function build({ THREE, kit, params = {} }) {
  const name = params.name || 'J. MARLOW';
  const number = params.number || '18';
  const title = params.title || 'THE PEACH BOWL';
  const stat = params.stat || '14 REC · 227 YDS · 4 TD';
  const top = params.top || '#2b1457', bottom = params.bottom || '#0b0614';
  const W = 0.63, H = 0.88, D = 0.012;

  let photo = null;
  if (params.image) photo = await new Promise((res) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = params.image; });

  const front = kit.canvasTexture(1024, 1430, (c, w, h) => {
    kit.paint.gradient(c, w, h, [top, bottom], { angle: 90 });
    if (photo) { const k = Math.max(w / photo.width, (h * 0.78) / photo.height); c.drawImage(photo, (w - photo.width * k) / 2, 0, photo.width * k, photo.height * k); }
    else {                                                       // abstract art: light burst and halftone
      const r = c.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.38, w * 0.7);
      r.addColorStop(0, 'rgba(255,214,120,0.95)'); r.addColorStop(0.35, 'rgba(160,90,255,0.55)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = r; c.fillRect(0, 0, w, h);
      kit.paint.halftone(c, w, h * 0.8, { color: 'rgba(255,255,255,0.18)', spacing: 18, f: (u, v) => 1 - Math.hypot(u - 0.5, v - 0.45) * 1.6 });
      kit.paint.text(c, number, w / 2, h * 0.4, { size: 520, color: 'rgba(255,255,255,0.9)', weight: 900, italic: true });
    }
    const band = c.createLinearGradient(0, h * 0.74, 0, h); band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.35, 'rgba(8,4,16,0.92)');
    c.fillStyle = band; c.fillRect(0, h * 0.7, w, h * 0.3);
    kit.paint.text(c, name, w / 2, h * 0.85, { size: 74, color: '#ffffff', weight: 900, tracking: 4 });
    kit.paint.text(c, title, w / 2, h * 0.91, { size: 34, color: '#f1c862', weight: 700, tracking: 10 });
    kit.paint.text(c, stat, w / 2, h * 0.955, { size: 28, color: 'rgba(255,255,255,0.75)', weight: 600, tracking: 4 });
  });
  const back = kit.canvasTexture(512, 715, (c, w, h) => {
    kit.paint.gradient(c, w, h, [bottom, top], { angle: 90 });
    kit.paint.dots(c, w, h, { color: 'rgba(241,200,98,0.25)', spacing: 22, radius: 3 });
    kit.paint.text(c, number, w / 2, h / 2, { size: 260, color: '#f1c862', weight: 900, italic: true });
  });

  const g = new THREE.Group(); g.name = 'card';
  const body = new THREE.Mesh(kit.roundedBox(W, H, D, 0.03, 4), kit.mat.metal('#111', { roughness: 0.6, metalness: 0.2 })); body.name = 'body';
  const face = new THREE.Mesh(kit.panel(kit.roundedRectShape(W - 0.02, H - 0.02, 0.025), 0.001), new THREE.MeshPhysicalMaterial({ map: front, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 }));
  face.position.z = D / 2 + 0.0006; face.name = 'front';
  const rear = new THREE.Mesh(kit.panel(kit.roundedRectShape(W - 0.02, H - 0.02, 0.025), 0.001), new THREE.MeshPhysicalMaterial({ map: back, roughness: 0.5 }));
  rear.position.z = -D / 2 - 0.0006; rear.rotation.y = Math.PI; rear.name = 'back';
  const rim = new THREE.Mesh(kit.frame(W + 0.004, H + 0.004, 0.035, D + 0.006, { radius: 0.032, bevel: 0.002 }), kit.mat.gold({ roughness: 0.18 })); rim.name = 'gold-frame';
  g.add(body, face, rear, rim);
  return g;
}
