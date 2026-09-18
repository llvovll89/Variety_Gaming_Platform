import * as T from 'three';
import { appearanceFor } from './appearance';
import type { Officer } from './types';

export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, x = 0, y = 0, z = 0): T.Mesh {
  const m = new T.Mesh(geometry, new T.MeshStandardMaterial({ color, roughness: 0.78 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
export function box(p: T.Object3D, color: string, w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  return mesh(p, new T.BoxGeometry(w, h, d), color, x, y, z);
}

/** Original procedural polygon models. All body parts are real, lit 3D geometry. */
export function officerModel(officer: Officer, mounted = false): T.Group {
  const a = appearanceFor(officer);
  const root = new T.Group();
  const body = new T.Group(); root.add(body);
  body.scale.set(a.build, 1, 1);
  if (mounted) {
    const horse = new T.Group(); root.add(horse);
    const hide = officer.id === 'lubu' ? '#884632' : officer.id === 'zhaoyun' ? '#d5d4c7' : '#6d5443';
    box(horse, hide, 0.65, 0.7, 1.45, 0, 1.05);
    for (const x of [-0.25, 0.25]) for (const z of [-0.5, 0.5]) {
      box(horse, hide, 0.16, 0.9, 0.18, x, 0.5, z);
      box(horse, '#282929', 0.18, 0.13, 0.23, x, 0.1, z);
    }
    const neck = box(horse, hide, 0.35, 0.8, 0.4, 0, 1.55, 0.65); neck.rotation.x = -0.3;
    box(horse, hide, 0.38, 0.35, 0.65, 0, 1.9, 0.87);
    box(horse, a.cloth, 0.8, 0.08, 0.8, 0, 1.43);
    box(horse, '#292523', 0.12, 0.7, 0.16, 0, 1, -0.83).rotation.x = -0.3;
    body.position.y = 0.95;
  }
  for (const x of [-0.18, 0.18]) {
    box(body, '#292c30', 0.23, 0.65, 0.25, x, 0.4);
    box(body, '#292322', 0.25, 0.18, 0.4, x, 0.12, 0.07);
  }
  mesh(body, new T.CylinderGeometry(0.34, 0.46, 0.72, 8), a.cloth, 0, 0.93);
  box(body, a.armor, 0.68, 0.7, 0.4, 0, 1.38);
  // Layered lamellar plates, gold belt and shoulder guards.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) box(body, r % 2 ? a.armor : '#8c8773', 0.13, 0.1, 0.035, -0.24 + c * 0.16, 1.15 + r * 0.13, 0.222);
  box(body, '#b29c60', 0.72, 0.09, 0.46, 0, 1.05);
  for (const x of [-0.47, 0.47]) {
    mesh(body, new T.SphereGeometry(0.24, 8, 6), a.armor, x, 1.6);
    box(body, a.cloth, 0.22, 0.48, 0.25, x, 1.3);
    mesh(body, new T.SphereGeometry(0.12, 8, 6), a.skin, x, 1.02, 0.02);
  }
  const cape = box(body, a.cloth, 0.76, 1.15, 0.045, 0, 1.14, -0.29); cape.rotation.x = -0.14;
  mesh(body, new T.SphereGeometry(0.26, 12, 10), a.skin, 0, 1.99);
  box(body, '#242527', 0.38, 0.2, 0.16, 0, 2.05, -0.17);
  box(body, a.skin, 0.07, 0.09, 0.09, 0, 1.99, 0.24);
  for (const x of [-0.1, 0.1]) box(body, '#262322', 0.075, 0.025, 0.025, x, 2.04, 0.234);
  if (a.beard > 0) {
    const beard = mesh(body, new T.ConeGeometry(0.17, 0.15 + a.beard * 0.5, 7), officer.id === 'huangzhong' ? '#cbc4b7' : '#292a2b', 0, 1.78 - a.beard * 0.12, 0.15);
    beard.rotation.z = Math.PI;
  }
  if (a.helmet === 'scholar') {
    box(body, '#303437', 0.42, 0.4, 0.36, 0, 2.28);
    box(body, '#8b8060', 0.46, 0.06, 0.4, 0, 2.13);
  } else {
    mesh(body, new T.SphereGeometry(0.29, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), a.helmet === 'crown' ? a.cloth : a.armor, 0, 2.1);
    box(body, '#b19a5e', 0.08, 0.35, 0.08, 0, 2.29);
    if (a.helmet === 'plume') for (const x of [-0.14, 0.14]) {
      const plume = mesh(body, new T.ConeGeometry(0.065, 0.95, 6), '#a24437', x, 2.69, -0.05);
      plume.rotation.x = -0.4; plume.rotation.z = -x * 1.6;
    }
  }
  const weapon = new T.Group(); body.add(weapon); weapon.position.set(0.57, 0, 0.17);
  if (a.weapon === 'fan') {
    const fan = mesh(weapon, new T.CircleGeometry(0.48, 9, 0, Math.PI), '#dfd7bb', 0, 1.33, 0.08); fan.rotation.z = -0.2;
    box(weapon, '#78634b', 0.055, 0.4, 0.055, 0, 1.1);
  } else if (a.weapon === 'bow') {
    const bow = mesh(weapon, new T.TorusGeometry(0.48, 0.035, 5, 16, Math.PI), '#a88a55', 0, 1.38); bow.rotation.z = -Math.PI / 2;
    box(weapon, '#cec6b1', 0.015, 0.96, 0.015, 0, 1.38);
  } else {
    const long = a.weapon !== 'sword';
    box(weapon, '#70543a', 0.055, long ? 2.45 : 0.55, 0.055, 0, long ? 1.2 : 1.1);
    mesh(weapon, new T.ConeGeometry(a.weapon === 'blade' ? 0.18 : 0.085, long ? 0.6 : 0.75, 4), '#d1d8d4', 0, long ? 2.55 : 1.7);
    if (a.weapon === 'sword') box(weapon, '#bda160', 0.32, 0.05, 0.09, 0, 1.3);
  }
  return root;
}

export function disposeObject(root: T.Object3D) {
  root.traverse(o => {
    if (o instanceof T.Mesh || o instanceof T.Sprite || o instanceof T.LineSegments) {
      if ('geometry' in o) o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if ('map' in m && m.map instanceof T.Texture) m.map.dispose();
        m.dispose();
      }
    }
  });
}
