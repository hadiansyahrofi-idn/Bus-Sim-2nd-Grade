import * as THREE from 'three';

export interface BusCockpitRig {
  rootGroup: THREE.Group;
  camera: THREE.PerspectiveCamera;
  steeringWheelGroup: THREE.Group;
  leftBlinkerMat: THREE.MeshStandardMaterial;
  rightBlinkerMat: THREE.MeshStandardMaterial;
}

/**
 * Builds a consistent, photorealistic modern Indonesian City Bus driver cabin
 * from the exact eye position of the right-hand-drive (RHD) bus driver.
 * Only a subtle portion of the lower dashboard, steering wheel top rim,
 * A-pillars, and side mirrors are visible so the panoramic windshield view
 * remains completely unobstructed.
 */
export function createBusCockpitRig(aspect: number): BusCockpitRig {
  const rootGroup = new THREE.Group();

  // Driver eye camera (Right-hand drive in Indonesia: -0.46m is right side when facing +Z forward, 2.24m eye height)
  const camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 480);
  camera.position.set(-0.46, 2.24, 0.0);
  // In Three.js, Object3D.lookAt() aligns +Z with the forward target, whereas Camera looks down its local -Z.
  // Rotating camera Y by Math.PI makes the camera look forward along +Z, and X by +0.035 tilts slightly downward toward the road.
  camera.rotation.order = 'YXZ';
  camera.rotation.set(-0.035, Math.PI, 0);
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
    color: 0x0284c7, // Consistent Modern Indonesian Trans Kota Blue Bus Livery
    roughness: 0.35,
    metalness: 0.25,
  });

  // 1. LOWER DASHBOARD DECK (Subtly visible at the bottom 12% of the frame, +Z is forward)
  const dashDeck = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.38, 0.72), darkDashMat);
  dashDeck.position.set(0, 1.56, 0.92);
  rootGroup.add(dashDeck);

  // Driver instrument binnacle hood right in front of the driver (-0.46m X is Right side when facing +Z)
  const binnacle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.42, 24, 1, false, 0, Math.PI),
    trimMat
  );
  binnacle.rotation.z = Math.PI / 2;
  binnacle.rotation.y = Math.PI / 2;
  binnacle.position.set(-0.46, 1.72, 0.82);
  rootGroup.add(binnacle);

  // Physical Turn Signal (Lampu Sein) Stalk Indicator LEDs embedded on top of binnacle
  // (Not a game HUD — physical dashboard bulbs that blink when bus turns or pulls into SPBU/Halte)
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

  const indGeo = new THREE.SphereGeometry(0.014, 12, 12);
  // Facing +Z: Left is +X, Right is -X
  const leftInd = new THREE.Mesh(indGeo, leftBlinkerMat);
  leftInd.position.set(-0.39, 1.78, 0.77);
  const rightInd = new THREE.Mesh(indGeo, rightBlinkerMat);
  rightInd.position.set(-0.53, 1.78, 0.77);
  rootGroup.add(leftInd, rightInd);

  // 2. STEERING WHEEL (Top arc visible at bottom-right driver position)
  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(-0.46, 1.62, 0.64);
  // Tilted toward the driver (who is at Z=0 looking toward +Z)
  steeringWheelGroup.rotation.x = 0.58;

  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.022, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 })
  );
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 20), trimMat);
  wheelHub.rotation.x = Math.PI / 2;

  const spokeGeo = new THREE.BoxGeometry(0.42, 0.028, 0.02);
  const spokeHorizontal = new THREE.Mesh(spokeGeo, trimMat);
  const spokeCenter = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.21, 0.02), trimMat);
  spokeCenter.position.y = -0.1;

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
    leftBlinkerMat,
    rightBlinkerMat,
  };
}
