"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Original 3D "working at the desk" scene (three.js).
 * A toy-style character types on a laptop, breathes, blinks, glances up at the
 * visitor and waves now and then; the chair sways and the coffee steams.
 * Rendering pauses off-screen; reduced-motion users get a still frame.
 */

const C = {
  skin: "#f1c6a2",
  hair: "#2a201b",
  sweater: "#ea7a2c",
  pants: "#3b404c",
  shoe: "#24262d",
  chair: "#2f3340",
  chairMetal: "#9aa0ab",
  desk: "#f6f3ef",
  deskSide: "#ddd5cc",
  laptop: "#c9ccd3",
  mug: "#ffffff",
  pot: "#d9774b",
  leaf: "#4f9d69",
  paper: "#fbfaf7",
  accent: "#fe4f02",
};

const mat = (color: string, rough = 0.62, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

const STATUSES = ["Invoice sent ✓", "CRM record updated", "Workflow automated", "Report ready"];

export function DeskScene({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(0);
  const [showStatus, setShowStatus] = useState(false);

  // Cycle the little status chip above the scene.
  useEffect(() => {
    let i = 0;
    const show = () => {
      setStatus(i++ % STATUSES.length);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 2600);
    };
    const first = setTimeout(show, 1800);
    const t = setInterval(show, 4800);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ───── Renderer / camera ───── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    const camBase = new THREE.Vector3(2.3, 1.85, 3.3);
    const lookAt = new THREE.Vector3(0, 0.66, -0.2);

    /* ───── Lights ───── */
    scene.add(new THREE.HemisphereLight("#fff6ee", "#d6ccc2", 1.25));
    const key = new THREE.DirectionalLight("#fff1e2", 2.1);
    key.position.set(2.5, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -2.5;
    key.shadow.camera.right = 2.5;
    key.shadow.camera.top = 2.5;
    key.shadow.camera.bottom = -2.5;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#dfe8ff", 0.6);
    fill.position.set(-3, 2, 1);
    scene.add(fill);

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    /* ───── Floor shadow catcher + soft contact glow ───── */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.13 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 128;
    const g = glowCanvas.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(120,90,60,0.22)");
    grad.addColorStop(1, "rgba(120,90,60,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.002, -0.2);
    scene.add(glow);

    /* ───── Desk ───── */
    const desk = new THREE.Group();
    scene.add(desk);
    add(desk, new RoundedBoxGeometry(1.7, 0.06, 0.8, 4, 0.025), mat(C.desk, 0.5), 0, 0.72, 0);
    const sideGeo = new RoundedBoxGeometry(0.06, 0.69, 0.72, 3, 0.02);
    add(desk, sideGeo, mat(C.deskSide), -0.78, 0.345, 0);
    // drawer unit on the right
    add(desk, new RoundedBoxGeometry(0.42, 0.62, 0.7, 3, 0.03), mat(C.deskSide), 0.6, 0.33, 0.0);
    for (let i = 0; i < 3; i++) add(desk, new RoundedBoxGeometry(0.16, 0.02, 0.02, 2, 0.008), mat("#b9b0a6"), 0.6, 0.18 + i * 0.19, 0.36);

    /* ───── Laptop (screen faces the character) ───── */
    const laptop = new THREE.Group();
    laptop.position.set(-0.05, 0.75, -0.12);
    desk.add(laptop);
    add(laptop, new RoundedBoxGeometry(0.5, 0.025, 0.34, 3, 0.01), mat(C.laptop, 0.35, 0.4), 0, 0.012, 0);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.025, 0.16);
    lidPivot.rotation.x = 0.28;
    laptop.add(lidPivot);
    add(lidPivot, new RoundedBoxGeometry(0.5, 0.33, 0.018, 3, 0.01), mat(C.laptop, 0.35, 0.4), 0, 0.165, 0);
    // logo on the back of the lid
    const logo = add(lidPivot, new THREE.CircleGeometry(0.03, 32), new THREE.MeshBasicMaterial({ color: C.accent }), 0, 0.17, 0.0101);
    logo.castShadow = false;
    // screen glow (faces the character)
    const screenLight = new THREE.PointLight("#9fc4ff", 0.6, 1.2);
    screenLight.position.set(0, 0.2, -0.15);
    lidPivot.add(screenLight);

    /* ───── Props ───── */
    // mug + steam
    const mug = new THREE.Group();
    mug.position.set(-0.4, 0.75, 0.12);
    desk.add(mug);
    add(mug, new THREE.CylinderGeometry(0.048, 0.044, 0.11, 24), mat(C.mug, 0.4), 0, 0.055, 0);
    add(mug, new THREE.CylinderGeometry(0.041, 0.041, 0.005, 24), mat("#5a3a26", 0.3), 0, 0.108, 0);
    const handle = add(mug, new THREE.TorusGeometry(0.03, 0.009, 10, 20, Math.PI), mat(C.mug, 0.4), 0.05, 0.055, 0);
    handle.rotation.z = -Math.PI / 2;
    add(mug, new THREE.CylinderGeometry(0.049, 0.049, 0.02, 24), mat(C.accent, 0.5), 0, 0.07, 0);
    const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false });
    const steam = [0, 1, 2].map((i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), steamMat.clone());
      s.position.set(0, 0.14 + i * 0.07, 0);
      mug.add(s);
      return s;
    });

    // paper stack with an "invoice"
    const papers = new THREE.Group();
    papers.position.set(0.5, 0.75, 0.22);
    desk.add(papers);
    for (let i = 0; i < 5; i++) {
      const p = add(papers, new THREE.BoxGeometry(0.22, 0.008, 0.29), mat(C.paper, 0.9), 0, 0.004 + i * 0.009, 0);
      p.rotation.y = (i % 2 ? 1 : -1) * 0.05 * Math.random();
    }
    const invCanvas = document.createElement("canvas");
    invCanvas.width = 128;
    invCanvas.height = 168;
    const ic = invCanvas.getContext("2d")!;
    ic.fillStyle = "#fbfaf7";
    ic.fillRect(0, 0, 128, 168);
    ic.fillStyle = C.accent;
    ic.fillRect(12, 14, 46, 10);
    ic.fillStyle = "#c9c3bb";
    for (let r = 0; r < 6; r++) ic.fillRect(12, 40 + r * 16, r % 2 ? 80 : 104, 5);
    ic.fillStyle = "#2f3340";
    ic.fillRect(70, 140, 46, 9);
    const invoice = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.29),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(invCanvas), roughness: 0.9 }),
    );
    invoice.rotation.x = -Math.PI / 2;
    invoice.rotation.z = 0.12;
    invoice.position.set(0, 0.05, 0);
    invoice.receiveShadow = true;
    papers.add(invoice);

    // plant
    const plant = new THREE.Group();
    plant.position.set(-0.66, 0.75, -0.18);
    desk.add(plant);
    add(plant, new THREE.CylinderGeometry(0.075, 0.06, 0.13, 24), mat(C.pot, 0.7), 0, 0.065, 0);
    const leafMat = mat(C.leaf, 0.55);
    for (let i = 0; i < 7; i++) {
      const leaf = add(plant, new THREE.SphereGeometry(0.06, 16, 12), leafMat, 0, 0.17, 0);
      const a = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.05, 0.16 + (i % 3) * 0.04, Math.sin(a) * 0.05);
      leaf.scale.set(0.6, 1.4, 0.35);
      leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    }

    /* ───── Chair ───── */
    const chair = new THREE.Group();
    chair.position.set(0, 0, -0.68);
    scene.add(chair);
    const chairMat = mat(C.chair, 0.55);
    const metal = mat(C.chairMetal, 0.3, 0.7);
    add(chair, new RoundedBoxGeometry(0.52, 0.08, 0.5, 4, 0.035), chairMat, 0, 0.46, 0);
    const back = add(chair, new RoundedBoxGeometry(0.5, 0.58, 0.08, 4, 0.035), chairMat, 0, 0.82, -0.25);
    back.rotation.x = -0.1;
    add(chair, new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), metal, 0, 0.27, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = add(chair, new RoundedBoxGeometry(0.3, 0.03, 0.04, 2, 0.012), metal, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15);
      leg.rotation.y = -a;
      add(chair, new THREE.SphereGeometry(0.03, 12, 12), chairMat, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29);
    }

    /* ───── Character (faces +z, sits on the chair) ───── */
    const person = new THREE.Group();
    person.position.set(0, 0, -0.66);
    scene.add(person);
    const skin = mat(C.skin, 0.7);
    const sweater = mat(C.sweater, 0.75);
    const pants = mat(C.pants, 0.8);

    // legs (thighs forward, shins down)
    for (const sx of [-0.1, 0.1]) {
      const thigh = add(person, new THREE.CapsuleGeometry(0.075, 0.28, 6, 12), pants, sx, 0.56, 0.12);
      thigh.rotation.x = Math.PI / 2;
      const shin = add(person, new THREE.CapsuleGeometry(0.065, 0.36, 6, 12), pants, sx, 0.33, 0.3);
      shin.rotation.x = 0.08;
      add(person, new RoundedBoxGeometry(0.11, 0.07, 0.2, 3, 0.03), mat(C.shoe, 0.6), sx, 0.04, 0.36);
    }
    add(person, new THREE.CapsuleGeometry(0.15, 0.12, 6, 14), pants, 0, 0.58, -0.02).rotation.z = Math.PI / 2;

    // torso (pivot at the hips)
    const torso = new THREE.Group();
    torso.position.set(0, 0.6, -0.04);
    person.add(torso);
    add(torso, new THREE.CapsuleGeometry(0.19, 0.3, 8, 18), sweater, 0, 0.24, 0).scale.set(1.08, 1, 0.82);
    add(torso, new THREE.TorusGeometry(0.075, 0.025, 10, 20), sweater, 0, 0.47, 0).rotation.x = Math.PI / 2;

    // head
    const neck = new THREE.Group();
    neck.position.set(0, 0.5, 0.01);
    torso.add(neck);
    add(neck, new THREE.CylinderGeometry(0.05, 0.055, 0.08, 14), skin, 0, 0.03, 0);
    const head = new THREE.Group();
    head.position.set(0, 0.07, 0);
    neck.add(head);
    add(head, new THREE.SphereGeometry(0.17, 32, 24), skin, 0, 0.15, 0).scale.set(1, 1.05, 0.98);
    const hair = add(head, new THREE.SphereGeometry(0.178, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(C.hair, 0.85), 0, 0.165, -0.008);
    hair.rotation.x = -0.32;
    add(head, new THREE.SphereGeometry(0.06, 16, 12), mat(C.hair, 0.85), 0.07, 0.29, 0.06).scale.set(1.4, 0.6, 1); // fringe
    for (const ex of [-0.17, 0.17]) add(head, new THREE.SphereGeometry(0.035, 14, 12), skin, ex, 0.14, -0.01); // ears
    const eyeMat = mat("#1f1a17", 0.3);
    const eyes = [-0.058, 0.058].map((ex) => {
      const e = add(head, new THREE.SphereGeometry(0.02, 14, 12), eyeMat, ex, 0.165, 0.155);
      e.castShadow = false;
      return e;
    });
    const brows = [-0.058, 0.058].map((ex) => {
      const b = add(head, new RoundedBoxGeometry(0.05, 0.012, 0.012, 2, 0.005), mat(C.hair, 0.8), ex, 0.215, 0.152);
      b.castShadow = false;
      return b;
    });
    add(head, new THREE.SphereGeometry(0.018, 12, 10), mat("#e8b08c", 0.7), 0, 0.12, 0.17);
    const smile = add(head, new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI), mat("#7a3b2e", 0.5), 0, 0.085, 0.158);
    smile.rotation.z = Math.PI;
    smile.castShadow = false;
    for (const cx of [-0.1, 0.1]) {
      const cheek = add(head, new THREE.CircleGeometry(0.025, 20), new THREE.MeshBasicMaterial({ color: "#f3a08c", transparent: true, opacity: 0.55 }), cx, 0.11, 0.152);
      cheek.castShadow = false;
    }

    // arms: shoulder → upper arm → elbow → forearm → hand
    type Arm = { shoulder: THREE.Group; elbow: THREE.Group };
    const makeArm = (side: 1 | -1): Arm => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.22, 0.42, 0);
      torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.07, 16, 12), sweater, 0, 0, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.06, 0.16, 6, 12), sweater, 0, -0.12, 0);
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.24, 0);
      shoulder.add(elbow);
      add(elbow, new THREE.CapsuleGeometry(0.052, 0.17, 6, 12), sweater, 0, -0.11, 0);
      add(elbow, new THREE.SphereGeometry(0.05, 14, 12), skin, 0, -0.25, 0).scale.set(1, 0.8, 1.1);
      return { shoulder, elbow };
    };
    const armL = makeArm(1); // character's left (+x, nearer the camera)
    const armR = makeArm(-1);

    /* ───── Pointer parallax ───── */
    const pointer = new THREE.Vector2(0, 0);
    const pointerSmooth = new THREE.Vector2(0, 0);
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ───── Sizing ───── */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      // Pull back a little on narrow screens so the whole desk stays in frame.
      const pull = w / h < 1.2 ? 1.35 : 1;
      camera.position.copy(camBase).multiplyScalar(pull);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    /* ───── Animation ───── */
    const clock = new THREE.Clock();
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const pulse = (t: number, start: number, len: number) => {
      // 0 → 1 → 0 bump over [start, start + len]
      if (t < start || t > start + len) return 0;
      const u = (t - start) / len;
      return smooth(Math.min(1, u * 4)) * smooth(Math.min(1, (1 - u) * 4));
    };

    const pose = (t: number) => {
      const breathe = Math.sin(t * 1.6);
      torso.scale.set(1 + breathe * 0.008, 1 + breathe * 0.012, 1);
      torso.rotation.x = 0.12 + breathe * 0.01;

      // Every 9 s: glance up at the visitor and wave (left hand, nearest the camera).
      const cycle = t % 9;
      const wave = pulse(cycle, 5.2, 2.8);
      const glance = Math.max(wave, pulse(cycle, 1.4, 1.2) * 0.5);

      head.rotation.x = 0.32 - glance * 0.42 + Math.sin(t * 0.7) * 0.02;
      head.rotation.y = glance * 0.42;
      neck.rotation.z = Math.sin(t * 0.5) * 0.03;
      smile.scale.set(1 + glance * 0.35, 1 + glance * 0.6, 1);
      brows.forEach((b) => (b.position.y = 0.215 + glance * 0.012));

      // Blink every ~3.4 s.
      const b = t % 3.4;
      const blink = b > 3.25 ? Math.sin(((b - 3.25) / 0.15) * Math.PI) : 0;
      eyes.forEach((e) => e.scale.set(1, 1 - blink * 0.9, 1));

      // Typing pose (arms reach forward to the keyboard) with alternating taps.
      const tapL = Math.sin(t * 17) * 0.07 * (1 - wave);
      const tapR = Math.sin(t * 17 + Math.PI) * 0.07;
      const typeShoulderX = -0.62;
      const typeElbowX = -0.95;

      armR.shoulder.rotation.set(typeShoulderX, 0, -0.12);
      armR.elbow.rotation.set(typeElbowX + tapR, 0, 0.1);

      // Left arm blends from typing into a raised wave.
      armL.shoulder.rotation.set(
        THREE.MathUtils.lerp(typeShoulderX, -0.35, wave),
        THREE.MathUtils.lerp(0, -0.3, wave),
        THREE.MathUtils.lerp(0.12, 2.5, wave),
      );
      armL.elbow.rotation.set(
        THREE.MathUtils.lerp(typeElbowX + tapL, -0.2, wave),
        0,
        THREE.MathUtils.lerp(-0.1, 0.45 + Math.sin(t * 11) * 0.38, wave),
      );

      // Chair + body sway, gentle bob while typing.
      const sway = Math.sin(t * 0.45) * 0.05;
      chair.rotation.y = sway;
      person.rotation.y = sway * 0.8;
      person.position.y = Math.abs(Math.sin(t * 8.5)) * 0.002;

      // Steam rises and fades.
      steam.forEach((s, i) => {
        const u = (t * 0.35 + i / 3) % 1;
        s.position.set(Math.sin(u * 6 + i) * 0.015, 0.13 + u * 0.22, 0);
        s.scale.setScalar(0.6 + u * 1.2);
        (s.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - u) * Math.min(1, u * 5);
      });

      // Screen flicker.
      screenLight.intensity = 0.55 + Math.sin(t * 3) * 0.05;
    };

    let frame = 0;
    let visible = true;
    const render = () => {
      const t = clock.getElapsedTime();
      pose(t);
      pointerSmooth.lerp(pointer, 0.05);
      const base = camera.position.clone();
      camera.position.x += pointerSmooth.x * 0.25;
      camera.position.y -= pointerSmooth.y * 0.15;
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      camera.position.copy(base);
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (visible && !document.hidden) render();
    };

    if (reduce) {
      pose(0);
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
    } else {
      loop();
    }

    // Pause when off-screen.
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material & { map?: THREE.Texture };
          m.map?.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="absolute inset-0" aria-hidden />
      {/* Status chip */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap sm:top-[3%] rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-[0_10px_30px_-12px_rgb(80_60_40/0.35)] transition-all duration-500 ${
          showStatus ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
        {STATUSES[status]}
      </div>
      <p className="sr-only">Illustration of a person working at a desk with a laptop, invoices and a coffee mug.</p>
    </div>
  );
}
