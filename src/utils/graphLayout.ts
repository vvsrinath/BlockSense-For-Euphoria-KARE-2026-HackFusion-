import type { NetworkEntity } from '../types/network';

export const NODE_WIDTH = 120;

interface Placement {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

/** Radial layout: first-degree connections on a ring, expansions fanned outward from their parent. */
export function layoutEntities(entities: NetworkEntity[], centerId: string): Map<string, Placement> {
  const placements = new Map<string, Placement>();
  placements.set(centerId, { x: 0, y: 0, angle: 0, radius: 0 });

  const ring = entities.filter((e) => e.id !== centerId && (!e.parentId || e.parentId === centerId));
  const radius = Math.max(260, ring.length * 26);
  ring.forEach((e, i) => {
    const angle = i / Math.max(1, ring.length) * Math.PI * 2 - Math.PI / 2;
    placements.set(e.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle, radius });
  });

  let frontier = ring;
  let depth = 1;
  while (frontier.length && depth < 6) {
    const next: NetworkEntity[] = [];
    frontier.forEach((parent) => {
      const p = placements.get(parent.id);
      if (!p) return;
      const kids = entities.filter((e) => e.parentId === parent.id);
      kids.forEach((kid, i) => {
        const angle = p.angle + (i - (kids.length - 1) / 2) * (0.42 / depth);
        const r = p.radius + 190;
        placements.set(kid.id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r, angle, radius: r });
        next.push(kid);
      });
    });
    frontier = next;
    depth += 1;
  }
  return placements;
}