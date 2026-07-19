import { useEffect, useRef } from "react";

/*
 * Hand-written 3D brick renderer. True perspective projection, painter's
 * algorithm for depth, flat-shaded faces with solid ink edges and projected
 * studs — the moulded-plastic language of the rest of the page, in three
 * dimensions. No 3D library; the whole thing is ~200 lines of math.
 *
 * Bricks drop in to build a tower, hold, then rebuild. Under reduced motion
 * the scene renders one settled frame and never animates.
 */

interface Brick {
  /** Centre position in brick units, y up. */
  x: number;
  y: number;
  z: number;
  /** Half-extents. */
  w: number;
  h: number;
  d: number;
  color: [number, number, number];
  /** Seconds into the loop when this brick starts falling. */
  delay: number;
  /** Studs across x and z. */
  studs: [number, number];
}

const YELLOW: [number, number, number] = [245, 197, 24];
const PAPER: [number, number, number] = [238, 241, 248];
const RED: [number, number, number] = [232, 69, 47];
const GREEN: [number, number, number] = [61, 201, 106];
const LIFT: [number, number, number] = [74, 99, 232];

const BRICKS: Brick[] = [
  { x: 0, y: 0, z: 0, w: 1.6, h: 0.42, d: 1.1, color: LIFT, delay: 0, studs: [3, 2] },
  { x: -0.3, y: 0.84, z: 0, w: 1.2, h: 0.42, d: 1.1, color: PAPER, delay: 0.45, studs: [2, 2] },
  { x: 0.55, y: 0.84, z: 0, w: 0.55, h: 0.42, d: 1.1, color: RED, delay: 0.9, studs: [1, 2] },
  { x: 0.2, y: 1.68, z: 0, w: 1.35, h: 0.42, d: 1.1, color: YELLOW, delay: 1.35, studs: [2, 2] },
  { x: -0.75, y: 1.68, z: 0, w: 0.55, h: 0.42, d: 1.1, color: GREEN, delay: 1.8, studs: [1, 2] },
  { x: -0.1, y: 2.52, z: 0, w: 1.0, h: 0.42, d: 1.1, color: PAPER, delay: 2.25, studs: [2, 2] },
  { x: 0.1, y: 3.36, z: 0, w: 0.55, h: 0.42, d: 0.55, color: YELLOW, delay: 2.7, studs: [1, 1] },
];

const LOOP = 7.5;
const FALL_FROM = 6;
const GRAVITY = 26;
const INK = "#161b2e";

type Vec3 = [number, number, number];

/** Cube corners in unit half-extents, ordered so faces index cleanly. */
const CORNERS: Vec3[] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

/** Face vertex indices with outward normals. */
const FACES: { idx: [number, number, number, number]; normal: Vec3 }[] = [
  { idx: [4, 5, 6, 7], normal: [0, 0, 1] },
  { idx: [1, 0, 3, 2], normal: [0, 0, -1] },
  { idx: [5, 1, 2, 6], normal: [1, 0, 0] },
  { idx: [0, 4, 7, 3], normal: [-1, 0, 0] },
  { idx: [3, 7, 6, 2], normal: [0, 1, 0] },
  { idx: [0, 1, 5, 4], normal: [0, -1, 0] },
];

const LIGHT: Vec3 = [-0.35, 0.86, 0.37];

export function BrickScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let start = performance.now();
    let visible = true;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rotate(p: Vec3, ay: number, ax: number): Vec3 {
      const [x, y, z] = p;
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y1, z2];
    }

    /** Perspective projection to screen space. */
    function project(p: Vec3, scale: number, cx: number, cy: number) {
      const fov = 9;
      const k = (fov * scale) / (fov + p[2]);
      return { x: cx + p[0] * k, y: cy - p[1] * k, k };
    }

    function shade(color: [number, number, number], n: Vec3) {
      const d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      // High ambient floor: against a saturated cobalt ground, a wide shading
      // range reads as grey plastic rather than as moulded colour.
      const f = 0.78 + 0.22 * Math.max(0, d);
      return `rgb(${Math.round(color[0] * f)},${Math.round(color[1] * f)},${Math.round(
        color[2] * f,
      )})`;
    }

    function draw(now: number) {
      const elapsed = reduced ? LOOP - 1 : ((now - start) / 1000) % LOOP;

      ctx!.clearRect(0, 0, width, height);

      // The tower spans roughly -2 to +2.2 world units; this keeps the whole
      // stack inside the canvas at every aspect ratio instead of clipping the base.
      const scale = Math.min(width, height) * 0.15;
      const cx = width / 2;
      const cy = height / 2 + scale * 0.85;

      const spin = reduced ? -0.72 : -0.72 + Math.sin((elapsed / LOOP) * Math.PI * 2) * 0.22;
      const tilt = 0.42;

      // Collect every face from every brick, then sort once, globally.
      const polys: {
        pts: { x: number; y: number }[];
        depth: number;
        fill: string;
        studs?: { cx: number; cy: number; rx: number; ry: number; sx: number; sy: number }[];
      }[] = [];

      for (const brick of BRICKS) {
        let drop = 0;
        let alpha = 1;

        if (!reduced) {
          const t = elapsed - brick.delay;
          if (t < 0) {
            alpha = 0;
          } else {
            // Free-fall from FALL_FROM, clamped at the resting position.
            const fallTime = Math.sqrt((2 * FALL_FROM) / GRAVITY);
            if (t < fallTime) {
              drop = FALL_FROM - 0.5 * GRAVITY * t * t;
              alpha = Math.min(1, t / 0.12);
            }
          }
        }

        if (alpha === 0) continue;

        const origin: Vec3 = [brick.x, brick.y + drop - 1.6, brick.z];
        const verts = CORNERS.map((c) =>
          rotate(
            [
              origin[0] + c[0] * brick.w,
              origin[1] + c[1] * brick.h,
              origin[2] + c[2] * brick.d,
            ],
            spin,
            tilt,
          ),
        );
        const screen = verts.map((v) => project(v, scale, cx, cy));

        for (const face of FACES) {
          const n = rotate(face.normal, spin, tilt);
          // Backface cull: the camera looks down -z, so keep faces pointing at it.
          const centre: Vec3 = [0, 0, 0];
          for (const i of face.idx) {
            centre[0] += verts[i][0] / 4;
            centre[1] += verts[i][1] / 4;
            centre[2] += verts[i][2] / 4;
          }
          const view: Vec3 = [-centre[0], -centre[1], -(centre[2] + 9)];
          if (n[0] * view[0] + n[1] * view[1] + n[2] * view[2] <= 0) continue;

          const pts = face.idx.map((i) => screen[i]);
          const poly: (typeof polys)[number] = {
            pts,
            depth: centre[2],
            fill: shade(brick.color, n),
          };

          // Studs sit on the +y face only.
          if (face.normal[1] === 1) {
            poly.studs = [];
            const [nx, nz] = brick.studs;
            for (let i = 0; i < nx; i++) {
              for (let j = 0; j < nz; j++) {
                const sxLocal = brick.w * (-1 + ((2 * i + 1) / nx) * 1);
                const szLocal = brick.d * (-1 + ((2 * j + 1) / nz) * 1);
                const r = Math.min(brick.w / nx, brick.d / nz) * 0.42;

                const base: Vec3 = [
                  origin[0] + sxLocal,
                  origin[1] + brick.h,
                  origin[2] + szLocal,
                ];
                const top: Vec3 = [base[0], base[1] + 0.13, base[2]];

                const pc = project(rotate(top, spin, tilt), scale, cx, cy);
                const pxr = project(rotate([top[0] + r, top[1], top[2]], spin, tilt), scale, cx, cy);
                const pzr = project(rotate([top[0], top[1], top[2] + r], spin, tilt), scale, cx, cy);
                const pb = project(rotate(base, spin, tilt), scale, cx, cy);

                poly.studs.push({
                  cx: pc.x,
                  cy: pc.y,
                  rx: Math.hypot(pxr.x - pc.x, pxr.y - pc.y),
                  ry: Math.hypot(pzr.x - pc.x, pzr.y - pc.y),
                  sx: pb.x - pc.x,
                  sy: pb.y - pc.y,
                });
              }
            }
          }

          polys.push(poly);
        }
      }

      polys.sort((a, b) => b.depth - a.depth);

      ctx!.lineJoin = "round";
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = INK;

      for (const poly of polys) {
        ctx!.beginPath();
        ctx!.moveTo(poly.pts[0].x, poly.pts[0].y);
        for (let i = 1; i < poly.pts.length; i++) ctx!.lineTo(poly.pts[i].x, poly.pts[i].y);
        ctx!.closePath();
        ctx!.fillStyle = poly.fill;
        ctx!.fill();
        ctx!.stroke();

        for (const stud of poly.studs ?? []) {
          // Cylinder wall, then the cap, so the stud reads as raised.
          ctx!.beginPath();
          ctx!.ellipse(stud.cx + stud.sx, stud.cy + stud.sy, stud.rx, stud.ry, 0, 0, Math.PI * 2);
          ctx!.fillStyle = poly.fill;
          ctx!.fill();
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.ellipse(stud.cx, stud.cy, stud.rx, stud.ry, 0, 0, Math.PI * 2);
          ctx!.fillStyle = poly.fill;
          ctx!.fill();
          ctx!.stroke();
        }
      }
    }

    function frame(now: number) {
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    resize();

    if (reduced) {
      draw(performance.now());
    } else {
      // Only burn frames while the scene is actually on screen.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !visible) {
            visible = true;
            start = performance.now();
            raf = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && visible) {
            visible = false;
            cancelAnimationFrame(raf);
          }
        },
        { threshold: 0 },
      );
      io.observe(canvas);
      raf = requestAnimationFrame(frame);

      const onResize = () => {
        resize();
        draw(performance.now());
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }

    const onResize = () => {
      resize();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Plastic bricks dropping into place to build a tower"
    />
  );
}
