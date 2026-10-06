import * as THREE from 'three';

export interface BusCockpitRig {
  rootGroup: THREE.Group;
  camera: THREE.PerspectiveCamera;
  steeringWheelGroup: THREE.Group;
  speedometerNeedlePivot: THREE.Group;
  leftBlinkerMat: THREE.MeshStandardMaterial;
  rightBlinkerMat: THREE.MeshStandardMaterial;
}

/**
 * Generates a realistic high-resolution backlit analog speedometer dial texture (0 - 120 km/h)
 * embedded naturally inside the bus instrument cluster binnacle.
 */
function createSpeedometerDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;
  const radius = 232;

  // Deep instrument dial face with subtle radial vignette
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
  bgGrad.addColorStop(0, '#131c2e');
  bgGrad.addColorStop(0.82, '#0b101b');
  bgGrad.addColorStop(1, '#060911');

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Metallic outer bezel ring
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  // Safe green speed zone arc (0 to 80 km/h) & amber/red warning arc (80 to 120 km/h)
  // Dial angles: 0 km/h is at 135 deg (bottom-left), sweeping clockwise 270 deg to 405 deg (bottom-right)
  const startDeg = 135;
  const totalSweepDeg = 270;
  const maxKmh = 120;

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  // Subtle green eco/safe band (20 - 80 km/h)
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    radius - 24,
    degToRad(startDeg + (20 / maxKmh) * totalSweepDeg),
    degToRad(startDeg + (80 / maxKmh) * totalSweepDeg)
  );
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.38)';
  ctx.stroke();

  // Red high-speed band (90 - 120 km/h)
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    radius - 24,
    degToRad(startDeg + (90 / maxKmh) * totalSweepDeg),
    degToRad(startDeg + totalSweepDeg)
  );
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.stroke();

  // Tick marks & numerals from 0 to 120 km/h
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let kmh = 0; kmh <= maxKmh; kmh += 5) {
    const frac = kmh / maxKmh;
    const angle = degToRad(startDeg + frac * totalSweepDeg);
    const isMajor = kmh % 20 === 0;
    const isMedium = kmh % 10 === 0 && !isMajor;

    const outerR = radius - 18;
    const innerR = isMajor ? outerR - 28 : isMedium ? outerR - 18 : outerR - 10;

    const x1 = cx + Math.cos(angle) * outerR;
    const y1 = cy + Math.sin(angle) * outerR;
    const x2 = cx + Math.cos(angle) * innerR;
    const y2 = cy + Math.sin(angle) * innerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = isMajor ? 6 : isMedium ? 3.5 : 2;
    ctx.strokeStyle = kmh >= 100 ? '#f87171' : '#f8fafc';
    ctx.stroke();

    if (isMajor) {
      const textR = radius - 72;
      const tx = cx + Math.cos(angle) * textR;
      const ty = cy + Math.sin(angle) * textR;
      ctx.font = 'bold 34px sans-serif';
      ctx.fillStyle = kmh >= 100 ? '#fca5a5' : '#e2e8f0';
      ctx.fillText(String(kmh), tx, ty);
    }
  }

  // "km/h" label in the center-bottom of the dial
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('km/h', cx, cy + 78);

  ctx.font = '600 17px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TRANS KOTA', cx, cy - 58);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Builds a consistent, photorealistic modern Indonesian City Bus driver cabin
 * from the exact eye position of the right-hand-drive (RHD) bus driver.
 * Includes a physical, non-intrusive analog speedometer needle inside the dashboard
 * binnacle that rotates smoothly according to the bus's real-time speed in km/h.
 */
export function createBusCockpitRig(aspect: number): BusCockpitRig {
  const rootGroup = new THREE.Group();

  // Driver eye camera (Right-hand drive in Indonesia: -0.46m is right side when facing +Z forward, 2.24m eye height)
  const camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 480);
  camera.position.set(-0.46, 2.24, 0.0);
  // In Three.js, Object3D.lookAt() aligns +Z with the forward target, whereas Camera looks down its local -Z.
  // Rotating camera Y by Math.PI makes the camera look forward along +Z, and X by -0.055 frames both the road ahead and the top dashboard binnacle.
  camera.rotation.order = 'YXZ';
  camera.rotation.set(-0.055, Math.PI, 0);
  rootGroup.add(camera);

  // Materials
  const darkDashMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.72,
    metalness: 0.12,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x242936,
    roughness: 0.55,
    metalness: 0.2,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
  });
  const bodyBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.25,
  });

  // 1. LOWER DASHBOARD DECK (Subtly visible at the bottom of the frame, +Z is forward)
  const dashDeck = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.38, 0.72), darkDashMat);
  dashDeck.position.set(0, 1.56, 0.92);
  rootGroup.add(dashDeck);

  // Driver instrument binnacle hood right in front of the driver (-0.46m X is Right side when facing +Z)
  const binnacle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.33, 0.42, 28, 1, false, 0, Math.PI),
    trimMat
  );
  binnacle.rotation.z = Math.PI / 2;
  binnacle.rotation.y = Math.PI / 2;
  binnacle.position.set(-0.46, 1.75, 0.84);
  rootGroup.add(binnacle);

  // ============================================================================
  // PHYSICAL ANALOG SPEEDOMETER CLUSTER EMBEDDED IN THE DASHBOARD BINNACLE
  // Positioned at (-0.46, 1.80, 0.78) tilted slightly up toward the driver's eyes
  // so it is clearly readable above the steering wheel rim without blocking the windshield!
  // ============================================================================
  const gaugeClusterGroup = new THREE.Group();
  gaugeClusterGroup.position.set(-0.46, 1.81, 0.79);
  // Rotate Y by Math.PI so its front (+Z local) faces back toward the driver at Z=0, and tilt upward slightly
  gaugeClusterGroup.rotation.order = 'YXZ';
  gaugeClusterGroup.rotation.set(-0.26, Math.PI, 0);

  const dialTex = createSpeedometerDialTexture();
  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.115, 36),
    new THREE.MeshBasicMaterial({ map: dialTex })
  );
  gaugeClusterGroup.add(dialFace);

  // Speedometer Needle Pivot Group
  // In local gauge space (+X right, +Y up):
  // 0 km/h is at 135 deg from +X clockwise (which in standard math counter-clockwise from +Y is +2.356 rad)
  const speedometerNeedlePivot = new THREE.Group();
  speedometerNeedlePivot.position.set(0, 0, 0.004);

  // Glowing Red-Orange Analog Pointer Needle (extends along +Y in pivot local space)
  const needleGeo = new THREE.BoxGeometry(0.0055, 0.088, 0.003);
  needleGeo.translate(0, 0.034, 0); // Offset so pivot is near the base of the needle
  const needleMat = new THREE.MeshBasicMaterial({ color: 0xff3b1d });
  const needleMesh = new THREE.Mesh(needleGeo, needleMat);
  speedometerNeedlePivot.add(needleMesh);

  // Center metallic cap on needle hub
  const capMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16),
    new THREE.MeshBasicMaterial({ color: 0xcbd5e1 })
  );
  capMesh.rotation.x = Math.PI / 2;
  speedometerNeedlePivot.add(capMesh);

  gaugeClusterGroup.add(speedometerNeedlePivot);
  rootGroup.add(gaugeClusterGroup);

  // Physical Turn Signal (Lampu Sein) Stalk Indicator LEDs embedded on top of binnacle flanking the speedometer
  const leftBlinkerMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    emissive: 0x10b981,
    emissiveIntensity: 0,
  });
  const rightBlinkerMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    emissive: 0x10b981,
    emissiveIntensity: 0,
  });

  const indGeo = new THREE.SphereGeometry(0.013, 12, 12);
  // Facing +Z: Left is +X (-0.33), Right is -X (-0.59)
  const leftInd = new THREE.Mesh(indGeo, leftBlinkerMat);
  leftInd.position.set(-0.33, 1.83, 0.77);
  const rightInd = new THREE.Mesh(indGeo, rightBlinkerMat);
  rightInd.position.set(-0.59, 1.83, 0.77);
  rootGroup.add(leftInd, rightInd);

  // 2. STEERING WHEEL (Top arc visible at bottom-right driver position, framed around the speedometer)
  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(-0.46, 1.57, 0.62);
  steeringWheelGroup.rotation.x = 0.62;

  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.02, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 })
  );
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), trimMat);
  wheelHub.rotation.x = Math.PI / 2;

  const spokeGeo = new THREE.BoxGeometry(0.42, 0.026, 0.02);
  const spokeHorizontal = new THREE.Mesh(spokeGeo, trimMat);
  spokeHorizontal.position.y = -0.03;
  const spokeCenter = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.19, 0.02), trimMat);
  spokeCenter.position.y = -0.11;

  steeringWheelGroup.add(wheelRim, wheelHub, spokeHorizontal, spokeCenter);
  rootGroup.add(steeringWheelGroup);

  // 3. LEFT & RIGHT A-PILLARS & UPPER WINDSHIELD SUN VISOR HEADER
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.65, 0.14), pillarMat);
  leftPillar.position.set(1.18, 2.25, 0.95);
  leftPillar.rotation.z = 0.06;

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.65, 0.14), pillarMat);
  rightPillar.position.set(-1.18, 2.25, 0.95);
  rightPillar.rotation.z = -0.06;

  const topHeader = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.18, 0.25), darkDashMat);
  topHeader.position.set(0, 2.98, 0.92);

  // Dual Windshield Wipers parked neatly at base of windshield
  const wiperMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.4 });
  const wiperLeft = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.018, 0.02), wiperMat);
  wiperLeft.position.set(0.45, 1.75, 0.98);
  wiperLeft.rotation.z = -0.05;
  const wiperRight = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.018, 0.02), wiperMat);
  wiperRight.position.set(-0.45, 1.75, 0.98);
  wiperRight.rotation.z = -0.05;

  rootGroup.add(leftPillar, rightPillar, topHeader, wiperLeft, wiperRight);

  // 4. EXTERIOR BUS SIDE MIRRORS (Kaca Spion Bus Kiri & Kanan visible at frame edges)
  const mirrorArmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.92,
    roughness: 0.08,
  });

  // Right Side Mirror (Driver side, -X when facing +Z)
  const rightMirrorGroup = new THREE.Group();
  rightMirrorGroup.position.set(-1.34, 2.28, 0.88);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.035), mirrorArmMat);
  rArm.position.set(0.1, 0.18, 0);
  const rHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.1), bodyBlueMat);
  const rGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.4), mirrorGlassMat);
  rGlass.rotation.y = Math.PI;
  rGlass.position.z = -0.052;
  rHousing.rotation.y = -0.25;
  rGlass.rotation.y = Math.PI - 0.25;
  rightMirrorGroup.add(rArm, rHousing, rGlass);

  // Left Side Mirror (Curb/Halte side, +X when facing +Z)
  const leftMirrorGroup = new THREE.Group();
  leftMirrorGroup.position.set(1.34, 2.28, 0.88);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.035), mirrorArmMat);
  lArm.position.set(-0.1, 0.18, 0);
  const lHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.1), bodyBlueMat);
  const lGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.4), mirrorGlassMat);
  lGlass.rotation.y = Math.PI;
  lGlass.position.z = -0.052;
  lHousing.rotation.y = 0.32;
  lGlass.rotation.y = Math.PI + 0.32;
  leftMirrorGroup.add(lArm, lHousing, lGlass);

  rootGroup.add(rightMirrorGroup, leftMirrorGroup);

  return {
    rootGroup,
    camera,
    steeringWheelGroup,
    speedometerNeedlePivot,
    leftBlinkerMat,
    rightBlinkerMat,
  };
}
