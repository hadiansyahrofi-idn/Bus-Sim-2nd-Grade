import * as THREE from 'three';

export interface RouteSegmentInfo {
  id: number;
  title: string;
  startS: number;
  endS: number;
}

/**
 * Continuous 3D Road Spline & Choreography Manager for all 21 Scenes.
 * Guarantees generous spacing between traffic signs (~260m-350m per scene),
 * smooth realistic curvature, natural hill elevation (Turunan & Tanjakan),
 * U-turn geometry, SPBU fuel station driveway loop, and Halte Bus bay pull-in.
 */
export class JourneyDirector {
  public readonly curve: THREE.CatmullRomCurve3;
  public readonly totalLength: number;

  public constructor() {
    // Coordinate System Note (Three.js Right-Handed World):
    // When bus moves along +Z (0, 0, +1) with Up = (0, 1, 0):
    //   Right = Tangent x Up = (-1, 0, 0) -> -X is RIGHT, +X is LEFT!
    // When bus moves along -X (-1, 0, 0) with Up = (0, 1, 0):
    //   Right = Tangent x Up = (0, 0, -1) -> -Z is RIGHT, +Z is LEFT!
    // When bus moves along -Z (0, 0, -1) with Up = (0, 1, 0):
    //   Right = Tangent x Up = (+1, 0, 0) -> +X is RIGHT, -X is LEFT!
    const rawPoints: [number, number, number][] = [
      // SCENE 1: Mulai Perjalanan (Depot Pull-out onto Jalan Raya, heading +Z) [0 to 260m]
      [0, 0, 0],
      [0, 0, 90],
      [0, 0, 200],

      // SCENE 2: Rambu Wajib Belok Kanan (Heading +Z -> Turn RIGHT toward -X at Z=340)
      [0, 0, 310],
      [-10, 0, 334],
      [-36, 0, 342],
      [-150, 0, 342],
      [-260, 0, 342],

      // SCENE 3: Rambu Wajib Belok Kiri (Heading -X -> Turn LEFT toward +Z at X=-380)
      [-350, 0, 342],
      [-374, 0, 350],
      [-382, 0, 376],
      [-382, 0, 500],
      [-382, 0, 620],

      // SCENE 4: Rambu Putar Balik / U-Turn (Heading +Z -> Wide 180 U-Turn to the RIGHT (-X) at Z=740 -> heading -Z)
      [-382, 0, 720],
      [-390, 0, 775],
      [-436, 0, 800],
      [-482, 0, 775],
      [-490, 0, 720],
      [-490, 0, 580],

      // SCENE 5: Rambu Dilarang Parkir (Busy Ruko Commercial District, heading -Z, well-spaced straight avenue)
      [-490, 0, 420],
      [-490, 0, 260],

      // SCENE 6: Rambu Dilarang Belok Kanan (Intersection with right branch at Z=20, bus goes straight along -Z)
      [-490, 0, 60],
      [-490, 0, -80],

      // SCENE 7: Rambu Dilarang Belok Kiri (Intersection with left branch at Z=-260, bus goes straight along -Z)
      [-490, 0, -240],
      [-490, 0, -380],

      // SCENE 8: Turunan (Warning sign before downhill at Z=-500 -> realistic downhill slope y: 0 -> -18m)
      [-490, 0, -500],
      [-490, -6.5, -600],
      [-490, -15.5, -720],
      [-490, -18.0, -820],

      // SCENE 9: Tanjakan (Warning sign before uphill at Z=-940 -> realistic uphill climb y: -18m -> 0m)
      [-490, -18.0, -940],
      [-490, -11.5, -1050],
      [-490, -3.5, -1160],
      [-490, 0, -1260],

      // SCENE 10: Jalan Berkelok (Heading -Z: Warning sign at Z=-1400 -> S-curve Left (-X) then Right (+X))
      [-490, 0, -1400],
      [-538, 1.5, -1510],
      [-538, 2.0, -1600],
      [-442, 1.5, -1710],
      [-442, 0.5, -1800],
      [-490, 0, -1910],

      // SCENE 11: Zebra Cross & Pejalan Kaki (Urban area, Zebra cross at Z=-2120)
      [-490, 0, -2060],
      [-490, 0, -2200],

      // SCENE 12-15: Persimpangan Besar & Lampu Lalu Lintas (Stop line at Z=-2450)
      [-490, 0, -2380],
      [-490, 0, -2560],

      // SCENE 16-18: Memasuki SPBU, Mengisi Bahan Bakar, Keluar SPBU
      // Heading -Z: Left side of the road is -X! Pull left into SPBU island at X=-505, Z=-2820
      [-490, 0, -2710],
      [-498, 0, -2765],
      [-505, 0, -2805],
      [-505, 0, -2840], // SPBU pump stop around Z=-2822
      [-498, 0, -2880],
      [-490, 0, -2935],

      // SCENE 19: Rangkaian Rambu Berurutan (Well-spaced sequential signs every 165m!)
      [-490, 0, -3100], // 19a: Petunjuk Jurusan
      [-490, 0, -3270], // 19b: Peringatan
      [-490, 0, -3440], // 19c: Larangan Parkir
      [-490, 0, -3610], // 19d: Wajib Belok Kanan approach
      // Rambu Wajib Belok Kanan at end of Scene 19: Heading -Z -> Turn RIGHT toward +X!
      [-480, 0, -3642],
      [-448, 0, -3650],
      [-280, 0, -3650],

      // SCENE 20 & 21: Menuju Halte Bus & Berhenti Sempurna di Halte
      // Heading +X: Left side of the road is -Z! Pull slightly left into Halte Bus bay (-3654.5)
      [-120, 0, -3650],
      [-50, 0, -3654.2],
      [20, 0, -3654.5],
      [75, 0, -3654.5],
    ];

    const vectors = rawPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.25);
    this.totalLength = this.curve.getLength();
  }

  /**
   * Finds the exact arc-length parameter `s` (in meters) closest to a 3D world point
   */
  public findClosestS(target: THREE.Vector3, minU = 0, maxU = 1, steps = 2500): number {
    let bestU = minU;
    let bestDist = Infinity;
    for (let i = 0; i <= steps; i++) {
      const u = minU + (i / steps) * (maxU - minU);
      const pt = this.curve.getPointAt(u);
      const d = pt.distanceToSquared(target);
      if (d < bestDist) {
        bestDist = d;
        bestU = u;
      }
    }
    return bestU * this.totalLength;
  }

  /**
   * Minimum squared distance from any 2D (X, Z) point to the road centerline spline.
   * Used to guarantee buildings and trees never spawn on the asphalt road even near corners or U-turns.
   */
  public getMinDistanceToRoadXZ(x: number, z: number, sampleStepMeters = 8): number {
    let minDistSq = Infinity;
    const numSamples = Math.ceil(this.totalLength / sampleStepMeters);
    for (let i = 0; i <= numSamples; i++) {
      const u = i / numSamples;
      const pt = this.curve.getPointAt(u);
      // Center of the two-way asphalt road is offset ~3.2m to the right of our left-lane spline
      const dx = x - pt.x;
      const dz = z - pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
      }
    }
    return Math.sqrt(minDistSq);
  }

  /**
   * Evaluates 3D position, forward tangent, right normal, up vector, and steering curvature at distance `s`
   */
  public sampleAtDistance(s: number): {
    position: THREE.Vector3;
    tangent: THREE.Vector3;
    right: THREE.Vector3;
    up: THREE.Vector3;
    curvature: number; // positive = turning right, negative = turning left
    pitchSlope: number; // positive = uphill, negative = downhill
  } {
    const clampedS = Math.max(0, Math.min(this.totalLength - 0.1, s));
    const u = clampedS / this.totalLength;
    const position = this.curve.getPointAt(u);
    const tangent = this.curve.getTangentAt(u).normalize();

    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, worldUp).normalize();
    const up = new THREE.Vector3().crossVectors(right, tangent).normalize();

    // Sample slightly ahead to measure horizontal steering curvature
    const aheadS = Math.min(this.totalLength - 0.01, clampedS + 7.5);
    const tangentAhead = this.curve.getTangentAt(aheadS / this.totalLength).normalize();

    // 3D cross product (tangent x tangentAhead).y:
    // Negative Y means turning Right (clockwise from above), Positive Y means turning Left (counter-clockwise).
    // Therefore: t1.z * t2.x - t1.x * t2.z is POSITIVE when turning RIGHT, and NEGATIVE when turning LEFT.
    const flatT1 = new THREE.Vector2(tangent.x, tangent.z).normalize();
    const flatT2 = new THREE.Vector2(tangentAhead.x, tangentAhead.z).normalize();
    const turnRightValue = flatT1.y * flatT2.x - flatT1.x * flatT2.y;
    const curvature = THREE.MathUtils.clamp(turnRightValue * 16, -1.2, 1.2);

    const pitchSlope = tangent.y;

    return { position, tangent, right, up, curvature, pitchSlope };
  }
}
