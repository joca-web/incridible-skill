/* Three collectible cards fanned out: one model module composed from another.
 * Params: names (comma list), numbers (comma list). */
import buildCard from '../three/models/card.js';

export const meta = { name: 'cards-fan', camera: { fov: 26, elevation: 2 }, shadow: false };

export default async function build({ THREE, kit, params = {} }) {
  const names = (params.names || 'THE PEACH BOWL,SINGLE SEASON,ROOKIE OF THE YEAR').split(',');
  const numbers = (params.numbers || '07,07,07').split(',');
  const palettes = [['#3a1676', '#0b0614'], ['#5a2a10', '#120804'], ['#0f3b46', '#04121a']];
  const fan = new THREE.Group(); fan.name = 'cards-fan';
  for (let i = 0; i < 3; i++) {
    const card = await buildCard({ THREE, kit, params: { title: names[i], number: numbers[i] || '07', name: 'N. VALE', top: palettes[i][0], bottom: palettes[i][1] } });
    const k = i - 1;
    card.position.set(k * 0.52, -Math.abs(k) * 0.05, -Math.abs(k) * 0.08);
    card.rotation.set(0, -k * 0.35, -k * 0.12);
    fan.add(card);
  }
  return fan;
}
