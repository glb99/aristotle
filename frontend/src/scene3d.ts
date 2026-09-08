/**
 * The layered scene, in three dimensions.
 *
 * Accepted in [dialogue 15] Q3 over a recommendation to refuse, and sequenced
 * behind `above` — which shipped, so this is the part that was waiting. It is
 * the console's **second** runtime dependency, and the first taken for a
 * picture rather than for a contract; [dialogue 10] set that budget at one and
 * this spends the increase deliberately.
 *
 * What the third axis buys, and the whole case rests on these two:
 *
 * - **An import running against the stated order climbs.** In the band diagram
 *   it is a red line among red lines. Here it leaves a dais and arrives at what
 *   rests on the dais, and the geometry says "wrong way" before the colour does.
 * - **A package nobody has placed has no ground under it.** Flat could only
 *   mark that with a dash and hope it was read. Here the drop line falls into
 *   empty space, which is exactly what the model knows and nothing more.
 *
 * Everything else — what is stated, what is derived, agreed against proposed —
 * carries the same meaning it carries in `architecture.ts`. A second projection
 * of one model, not a second model.
 */

import * as THREE from "three";

import type { Edge, Pkg } from "./architecture";

/** Vertical gap between one stated layer and the next. */
const DAIS_GAP = 3.4;
const DAIS_RADIUS = 13;

const VOID = 0x12141b;
const HOLO = 0x4fd6e8;
const ALARM = 0xf2664f;
const GHOST = 0x626c7c;
const TABLE = 0x6aa832;

/** What the caller must call before drawing anything else into the host. */
export interface Scene3d {
  stop: () => void;
}

interface Placed extends Pkg {
  at: THREE.Vector3;
  crown: number;
}

function surface(color: number, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.12,
    transparent: opacity < 1,
    opacity,
  });
}

/** A thin ring, which is how an edge reads at this scale without a light on it. */
function halo(radius: number, at: THREE.Vector3, color: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.07, 8, 84),
    new THREE.MeshBasicMaterial({ color }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(at);
  return ring;
}

/**
 * Draw the scene into `host`, returning the handle that stops it.
 *
 * **The caller must `stop()` before replacing the host's children.** A
 * `requestAnimationFrame` loop over a detached canvas keeps a WebGL context and
 * every geometry in it alive, and switching views four times would leak four
 * scenes — the browser caps contexts and quietly drops the oldest, so the
 * symptom is the *first* view going black rather than the fourth failing.
 */
export function drawScene3d(
  host: HTMLElement,
  packages: Pkg[],
  edges: Edge[],
  onScope: (name: string | null) => void,
  scope: string | null,
): Scene3d {
  // ---- placement ---------------------------------------------------------
  // `layer` already carries the three states `bandsFromOrder` decided: a
  // stated band, one band above every layer for a feature, and one above that
  // for anything unjudged. Reading it again here rather than recomputing keeps
  // the two views from ever disagreeing about where a package belongs.
  const bands = [...new Set(packages.map((p) => p.layer))].sort((a, b) => a - b);

  const isLayer = (p: Pkg) => p.grounded && p.claim === "layer" && p.verdict === "agreed";
  const layers = packages.filter(isLayer);
  const features = packages.filter((p) => p.grounded && !isLayer(p));
  const floating = packages.filter((p) => !p.grounded);

  const placed: Placed[] = [];
  // Only the *layer* bands stack. A feature's band is one above every layer by
  // construction, and giving it a dais of its own would draw a floor nobody
  // stated -- so ranks come from the layers alone and features rest on the top.
  const layerBands = [...new Set(layers.map((p) => p.layer))].sort((a, b) => a - b);
  const rank = new Map(layerBands.map((band, i) => [band, i]));

  // Daises share one footprint, so the order reads as height rather than as
  // spread. Two layers on the same band would sit on one dais, which is the
  // honest picture: nobody said which of them is above the other.
  layers.forEach((p) => {
    const y = (rank.get(p.layer) ?? 0) * DAIS_GAP;
    placed.push({ ...p, at: new THREE.Vector3(0, y, 0), crown: y + 1.1 });
  });

  // The top dais's surface, which is what a feature stands on.
  const deck = Math.max(0, layerBands.length - 1) * DAIS_GAP + 1.1;
  features.forEach((p, i) => {
    const a = -Math.PI / 2 + (i / Math.max(features.length, 1)) * Math.PI * 2;
    const at = new THREE.Vector3(Math.cos(a) * 7.6, deck, Math.sin(a) * 7.6);
    placed.push({ ...p, at, crown: deck + 2.2 + p.modules * 0.17 });
  });

  // Off to one side and at scattered heights. Putting them in a band would
  // claim the model knows where they go, which is the one thing it does not.
  floating.forEach((p, i) => {
    const a = (i / Math.max(floating.length, 1)) * Math.PI * 2;
    const at = new THREE.Vector3(
      26 + Math.cos(a) * 8,
      2.4 + ((i * 5) % 9) * 1.35,
      Math.sin(a) * 11,
    );
    placed.push({ ...p, at, crown: at.y + 0.3 });
  });

  const at = new Map(placed.map((p) => [p.name, p]));
  const bandOf = (p: Placed) => bands.indexOf(p.layer);

  // ---- scene -------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VOID);
  scene.fog = new THREE.Fog(VOID, 80, 230);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const canvas = renderer.domElement;
  canvas.className = "arch-canvas";
  const labels = document.createElement("div");
  labels.className = "arch-labels";
  host.replaceChildren(canvas, labels);

  scene.add(new THREE.AmbientLight(0x8fa6c0, 0.55));
  const keyLight = new THREE.DirectionalLight(0xdff2ff, 0.9);
  keyLight.position.set(26, 46, 20);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(HOLO, 0.32);
  rimLight.position.set(-34, 12, -26);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(180, 45, 0x2a3240, 0x1b212b);
  grid.position.y = -0.02;
  scene.add(grid);

  const pickable: THREE.Mesh[] = [];

  for (const p of placed) {
    const agreed = p.verdict === "agreed";

    if (isLayer(p)) {
      const dais = new THREE.Mesh(
        new THREE.CylinderGeometry(DAIS_RADIUS, DAIS_RADIUS, 1.1, 72),
        surface(0x24505c),
      );
      dais.position.set(0, p.at.y + 0.55, 0);
      dais.userData.pkg = p;
      scene.add(dais);
      pickable.push(dais);
      scene.add(halo(DAIS_RADIUS, new THREE.Vector3(0, p.at.y + 1.13, 0), HOLO));
    } else if (p.grounded) {
      const radius = 1.3 + p.modules * 0.11;
      const height = 2.2 + p.modules * 0.17;
      const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 40),
        surface(0x1f4a55, agreed ? 1 : 0.55),
      );
      drum.position.copy(p.at).setY(p.at.y + height / 2);
      drum.userData.pkg = p;
      scene.add(drum);
      pickable.push(drum);
      scene.add(halo(radius, p.at.clone().setY(p.at.y + height), agreed ? HOLO : GHOST));

      // One cube per table it owns. The flat view wrote this as the text
      // "6 tables", which is a number; a stack is a size.
      for (let i = 0; i < p.tables; i++) {
        const a = (i / Math.max(p.tables, 1)) * Math.PI * 2;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), surface(TABLE));
        cube.material.emissive = new THREE.Color(0x2d4d14);
        cube.position.set(
          p.at.x + Math.cos(a) * radius * 0.55,
          p.at.y + height + 0.5,
          p.at.z + Math.sin(a) * radius * 0.55,
        );
        cube.rotation.y = a;
        scene.add(cube);
      }
    } else {
      const radius = 1.1 + p.modules * 0.16;
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.28, 6),
        surface(0x2b3340, 0.55),
      );
      plate.position.copy(p.at);
      plate.userData.pkg = p;
      scene.add(plate);
      pickable.push(plate);
      scene.add(halo(radius, p.at, GHOST));

      // The whole sentence, and the reason for the third dimension: it stops
      // in mid-air instead of meeting a surface.
      const drop = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p.at.x, p.at.y - 0.4, p.at.z),
          new THREE.Vector3(p.at.x, p.at.y - 2.6, p.at.z),
        ]),
        new THREE.LineDashedMaterial({
          color: GHOST,
          dashSize: 0.16,
          gapSize: 0.18,
          transparent: true,
          opacity: 0.65,
        }),
      );
      drop.computeLineDistances();
      scene.add(drop);
    }
  }

  // ---- imports -------------------------------------------------------------
  const beams: { material: THREE.Material; from: string; to: string; base: number }[] = [];
  for (const edge of edges) {
    const from = at.get(edge.from);
    const to = at.get(edge.to);
    if (!from || !to) continue;
    const a = from.at.clone().setY(from.crown);
    const b = to.at.clone().setY(to.crown);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = Math.max(a.y, b.y) + 2.4 + a.distanceTo(b) * 0.14;
    const against = edge.againstOrder || bandOf(from) < bandOf(to);
    // An edge touching a package nobody has placed is drawn fainter at rest.
    // Ten of nineteen packages are ungrounded here, and the fan they throw
    // across the scene is most of what makes the resting frame unreadable --
    // while carrying the least, because neither end has a height anybody
    // stated. Hover restores it: the information is not removed, only ranked.
    const loose = !from.grounded || !to.grounded;
    const opacity =
      edge.crossed || against ? 0.95 : loose ? 0.07 : edge.deferred ? 0.16 : 0.26;
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(a, mid, b),
        32,
        0.035 + Math.min(edge.weight, 20) * 0.01,
        6,
        false,
      ),
      new THREE.MeshBasicMaterial({
        color: edge.crossed || against ? ALARM : HOLO,
        transparent: true,
        opacity,
      }),
    );
    scene.add(tube);
    beams.push({ material: tube.material, from: edge.from, to: edge.to, base: opacity });
  }

  // ---- labels ---------------------------------------------------------------
  // HTML over the canvas rather than sprites: a sprite blurs at this text size
  // and costs a texture each, and these have to stay legible while orbiting.
  const tags = new Map<string, HTMLElement>();
  for (const p of placed) {
    const tag = document.createElement("div");
    tag.className =
      "arch-tag" +
      (isLayer(p) ? " layer" : p.verdict === "agreed" ? " agreed" : " unjudged") +
      (scope === null || p.name === scope || p.name.startsWith(scope + ".") ? "" : " dim");
    tag.textContent = p.name.split(".").slice(1).join(".");
    labels.appendChild(tag);
    tags.set(p.name, tag);
  }

  // ---- orbit -----------------------------------------------------------------
  // OrbitControls is a second import from the same package and this is twenty
  // lines with no inertia nobody asked for.
  let azimuth = -0.85;
  let elevation = 0.42;
  let distance = 74;
  const target = new THREE.Vector3(6, 8, 0);
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const pointer = new THREE.Vector2(2, 2);

  /**
   * How far the pointer may travel and still count as a click.
   *
   * Without this every orbit is also a scope: `click` fires on pointerup
   * whatever happened in between, so dragging the camera and letting go over a
   * package selected it. The camera looked unchanged in the screenshot because
   * the re-render put it back at the default -- a bug that reads as "orbit does
   * not work" rather than as "click is too eager".
   */
  const SLOP = 5;
  let travelled = 0;

  const onDown = (ev: PointerEvent) => {
    dragging = true;
    travelled = 0;
    lastX = ev.clientX;
    lastY = ev.clientY;
    canvas.classList.add("dragging");
    canvas.setPointerCapture(ev.pointerId);
  };
  const onUp = (ev: PointerEvent) => {
    dragging = false;
    canvas.classList.remove("dragging");
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
  };
  const onMove = (ev: PointerEvent) => {
    if (dragging) {
      travelled += Math.abs(ev.clientX - lastX) + Math.abs(ev.clientY - lastY);
      azimuth -= (ev.clientX - lastX) * 0.006;
      elevation = Math.max(0.05, Math.min(1.45, elevation + (ev.clientY - lastY) * 0.005));
      lastX = ev.clientX;
      lastY = ev.clientY;
    }
    const box = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -((ev.clientY - box.top) / box.height) * 2 + 1;
  };
  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    distance = Math.max(24, Math.min(170, distance + ev.deltaY * 0.05));
  };
  const onClick = () => {
    if (travelled > SLOP) return;
    if (hovered) onScope(hovered.name === scope ? null : hovered.name);
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("click", onClick);

  // ---- loop --------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const projected = new THREE.Vector3();
  let hovered: Placed | null = null;
  let running = true;
  let handle = 0;

  function size() {
    const box = host.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    camera.aspect = box.width / box.height;
    camera.updateProjectionMatrix();
    renderer.setSize(box.width, box.height, false);
  }
  const observer = new ResizeObserver(size);
  observer.observe(host);
  size();

  function frame() {
    if (!running) return;
    camera.position.set(
      target.x + Math.cos(azimuth) * Math.cos(elevation) * distance,
      target.y + Math.sin(elevation) * distance,
      target.z + Math.sin(azimuth) * Math.cos(elevation) * distance,
    );
    camera.lookAt(target);

    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pickable, false)[0];
    const now = (hit?.object.userData.pkg as Placed | undefined) ?? null;
    if (now !== hovered) {
      hovered = now;
      canvas.style.cursor = now ? "pointer" : dragging ? "grabbing" : "grab";
      for (const beam of beams) {
        const touching = !now || beam.from === now.name || beam.to === now.name;
        beam.material.opacity = touching ? (now ? Math.max(beam.base, 0.8) : beam.base) : 0.035;
      }
    }

    const box = canvas.getBoundingClientRect();
    for (const p of placed) {
      const tag = tags.get(p.name);
      if (!tag) continue;
      projected.copy(p.at).setY(p.crown + 1.9).project(camera);
      const visible = projected.z < 1;
      tag.hidden = !visible;
      if (visible) {
        tag.style.left = `${(projected.x * 0.5 + 0.5) * box.width}px`;
        tag.style.top = `${(-projected.y * 0.5 + 0.5) * box.height}px`;
      }
    }

    renderer.render(scene, camera);
    handle = requestAnimationFrame(frame);
  }
  handle = requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(handle);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
      // Geometries and materials are not garbage-collected with the mesh: they
      // hold GPU buffers, and a view switched away from four times would leave
      // four scenes resident.
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
