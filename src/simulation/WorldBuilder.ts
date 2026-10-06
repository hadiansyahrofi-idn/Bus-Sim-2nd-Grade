import * as THREE from 'three';
import { JourneyDirector } from './JourneyDirector';
import {
  createAsphaltTexture,
  getTrafficSignTexture,
  IndonesianSignType,
} from './TrafficSignFactory';

export interface SignCheckpoint {
  id: string;
  type: IndonesianSignType;
  signS: number;
  pauseS: number; // Exact distance where the bus pauses to display the sign explanation
  sceneTitle: string;
}

export interface InteractiveSceneEntities {
  // Ordered list of traffic sign checkpoints where the simulation pauses briefly for educational explanation
  signCheckpoints: SignCheckpoint[];

  // Traffic light bulbs & active glow materials (Scene 12-15)
  trafficLightRed: THREE.MeshBasicMaterial[];
  trafficLightYellow: THREE.MeshBasicMaterial[];
  trafficLightGreen: THREE.MeshBasicMaterial[];
  trafficLightPointLight: THREE.PointLight;

  // Pedestrian at Zebra Cross (Scene 11)
  pedestrianGroup: THREE.Group;
  pedestrianBasePos: THREE.Vector3;
  pedestrianRightVec: THREE.Vector3;
  pedestrianLeftLeg: THREE.Mesh;
  pedestrianRightLeg: THREE.Mesh;
  pedestrianLeftArm: THREE.Mesh;
  pedestrianRightArm: THREE.Mesh;
  zebraCrossS: number;

  // SPBU Attendant & Station (Scene 16-18)
  spbuAttendantGroup: THREE.Group;
  spbuAttendantBasePos: THREE.Vector3;
  spbuAttendantRightVec: THREE.Vector3;
  spbuAttendantArm: THREE.Mesh;
  spbuPumpS: number;

  // Traffic Light Stop Line S (Scene 13-15)
  trafficLightStopS: number;

  // Halte Bus Final Stop S (Scene 21)
  halteStopS: number;

  // Moving Indonesian oncoming traffic vehicles
  oncomingVehicles: {
    mesh: THREE.Group;
    s: number;
    speed: number;
    lateralOffset: number;
  }[];
}

export function buildIndonesianEnvironment(
  scene: THREE.Scene,
  director: JourneyDirector
): InteractiveSceneEntities {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // 1. CONTINUOUS INDONESIAN HIGHWAY RIBBON (LEFT-HAND TRAFFIC)
  // Our bus travels along the spline in the LEFT LANE.
  // The road surface spans from -3.4m (left curb of our lane) to +9.8m (right curb of oncoming lane),
  // making the road center divider at +3.2m to the right of our bus's centerline.
  const steps = 2200;
  const roadLeftEdge = -3.4;
  const roadRightEdge = 9.8;
  const sidewalkWidth = 3.2;

  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUVs: number[] = [];
  const roadIndices: number[] = [];

  const curbPositions: number[] = [];
  const curbNormals: number[] = [];
  const curbColors: number[] = [];
  const curbIndices: number[] = [];

  const markPositions: number[] = [];
  const markNormals: number[] = [];
  const markIndices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * director.totalLength;
    const sample = director.sampleAtDistance(s);
    const { position, right, up } = sample;

    // Road left and right vertices
    const pLeft = position.clone().addScaledVector(right, roadLeftEdge);
    const pRight = position.clone().addScaledVector(right, roadRightEdge);

    roadPositions.push(pLeft.x, pLeft.y, pLeft.z, pRight.x, pRight.y, pRight.z);
    roadNormals.push(up.x, up.y, up.z, up.x, up.y, up.z);
    roadUVs.push(0, s * 0.08, 1, s * 0.08);

    if (i < steps) {
      const base = i * 2;
      roadIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }

    // Indonesian Black & White Striped Sidewalk Curbs (Trotoar) on both sides
    const pSidewalkLeftOuter = position
      .clone()
      .addScaledVector(right, roadLeftEdge - sidewalkWidth)
      .addScaledVector(up, 0.16);
    const pSidewalkLeftInner = position
      .clone()
      .addScaledVector(right, roadLeftEdge)
      .addScaledVector(up, 0.16);

    const pSidewalkRightInner = position
      .clone()
      .addScaledVector(right, roadRightEdge)
      .addScaledVector(up, 0.16);
    const pSidewalkRightOuter = position
      .clone()
      .addScaledVector(right, roadRightEdge + sidewalkWidth)
      .addScaledVector(up, 0.16);

    const isWhiteStripe = Math.floor(s / 1.8) % 2 === 0;
    const cVal = isWhiteStripe ? 0.92 : 0.15;

    curbPositions.push(
      pSidewalkLeftOuter.x,
      pSidewalkLeftOuter.y,
      pSidewalkLeftOuter.z,
      pSidewalkLeftInner.x,
      pSidewalkLeftInner.y,
      pSidewalkLeftInner.z,
      pSidewalkRightInner.x,
      pSidewalkRightInner.y,
      pSidewalkRightInner.z,
      pSidewalkRightOuter.x,
      pSidewalkRightOuter.y,
      pSidewalkRightOuter.z
    );

    for (let k = 0; k < 4; k++) {
      curbNormals.push(up.x, up.y, up.z);
      curbColors.push(cVal, cVal, cVal);
    }

    if (i < steps) {
      const b = i * 4;
      curbIndices.push(b, b + 1, b + 4, b + 1, b + 5, b + 4);
      curbIndices.push(b + 2, b + 3, b + 6, b + 3, b + 7, b + 6);
    }

    // Dashed White Center Line Marking (Marka Jalan Indonesia) at offset +3.2m
    const isDash = Math.floor(s / 5.0) % 2 === 0;
    if (isDash && i < steps) {
      const nextSample = director.sampleAtDistance(((i + 1) / steps) * director.totalLength);
      const m1L = position.clone().addScaledVector(right, 3.12).addScaledVector(up, 0.025);
      const m1R = position.clone().addScaledVector(right, 3.28).addScaledVector(up, 0.025);
      const m2L = nextSample.position
        .clone()
        .addScaledVector(nextSample.right, 3.12)
        .addScaledVector(nextSample.up, 0.025);
      const m2R = nextSample.position
        .clone()
        .addScaledVector(nextSample.right, 3.28)
        .addScaledVector(nextSample.up, 0.025);

      const mIdx = markPositions.length / 3;
      markPositions.push(
        m1L.x,
        m1L.y,
        m1L.z,
        m1R.x,
        m1R.y,
        m1R.z,
        m2L.x,
        m2L.y,
        m2L.z,
        m2R.x,
        m2R.y,
        m2R.z
      );
      for (let k = 0; k < 4; k++) markNormals.push(up.x, up.y, up.z);
      markIndices.push(mIdx, mIdx + 1, mIdx + 2, mIdx + 1, mIdx + 3, mIdx + 2);
    }
  }

  // Build Road Mesh
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIndices);

  const asphaltTex = createAsphaltTexture();
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.86,
    metalness: 0.05,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  worldGroup.add(roadMesh);

  // Build Sidewalk / Curbs Mesh
  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
  curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
  curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
  curbGeo.setIndex(curbIndices);
  const curbMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
  });
  worldGroup.add(new THREE.Mesh(curbGeo, curbMat));

  // Build Road Markings Mesh
  const markGeo = new THREE.BufferGeometry();
  markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markPositions, 3));
  markGeo.setAttribute('normal', new THREE.Float32BufferAttribute(markNormals, 3));
  markGeo.setIndex(markIndices);
  const markMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
  });
  worldGroup.add(new THREE.Mesh(markGeo, markMat));

  // Green Tropical Ground Skirt following road elevation so hills (Turunan/Tanjakan) have solid ground
  const terrainPositions: number[] = [];
  const terrainNormals: number[] = [];
  const terrainIndices: number[] = [];
  const terrainSteps = 550;
  for (let i = 0; i <= terrainSteps; i++) {
    const s = (i / terrainSteps) * director.totalLength;
    const { position, right, up } = director.sampleAtDistance(s);
    const tLeft = position
      .clone()
      .addScaledVector(right, -110)
      .addScaledVector(up, -0.15);
    const tRight = position
      .clone()
      .addScaledVector(right, 110)
      .addScaledVector(up, -0.15);
    terrainPositions.push(tLeft.x, tLeft.y, tLeft.z, tRight.x, tRight.y, tRight.z);
    terrainNormals.push(0, 1, 0, 0, 1, 0);
    if (i < terrainSteps) {
      const b = i * 2;
      terrainIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }
  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(terrainPositions, 3));
  terrainGeo.setAttribute('normal', new THREE.Float32BufferAttribute(terrainNormals, 3));
  terrainGeo.setIndex(terrainIndices);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x3b6e38,
    roughness: 0.96,
  });
  worldGroup.add(new THREE.Mesh(terrainGeo, terrainMat));

  // Helper to place a 3D object oriented relative to the road at arc-length `s`
  function placeAlongRoad(
    obj: THREE.Object3D,
    s: number,
    lateralOffset: number,
    heightOffset = 0,
    faceTowardsBus = true
  ) {
    const sample = director.sampleAtDistance(s);
    const pos = sample.position
      .clone()
      .addScaledVector(sample.right, lateralOffset)
      .addScaledVector(sample.up, heightOffset);
    obj.position.copy(pos);

    const lookDir = faceTowardsBus ? sample.tangent.clone().negate() : sample.tangent.clone();
    const target = pos.clone().add(lookDir);
    obj.lookAt(target);
    worldGroup.add(obj);
    return sample;
  }

  // Helper to create a realistic 3D Indonesian Traffic Sign on a metallic post
  // Strictly placed on the left sidewalk (-4.3m lateral offset)
  function addTrafficSign(
    type: IndonesianSignType,
    s: number,
    lateralOffset = -4.3,
    scale = 1.45
  ) {
    const group = new THREE.Group();

    // Galvanized steel pole
    const poleGeo = new THREE.CylinderGeometry(0.055, 0.065, 3.4, 12);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.35,
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.7;
    group.add(pole);

    // Sign plate facing approaching bus driver
    const signTex = getTrafficSignTexture(type);
    const boardGeo = new THREE.PlaneGeometry(scale, scale);
    const boardMat = new THREE.MeshStandardMaterial({
      map: signTex,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 3.1, 0.07);
    group.add(board);

    // Metallic backing plate
    const backGeo = new THREE.CircleGeometry(scale * 0.44, 24);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 3.1, 0.04);
    group.add(back);

    placeAlongRoad(group, s, lateralOffset, 0, true);
  }

  // Helper to add perpendicular side-road branches at intersections so signs have real visual context
  function addSideRoadBranch(s: number, direction: 'left' | 'right' | 'both') {
    const sample = director.sampleAtDistance(s);
    const branchMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.86,
    });

    if (direction === 'right' || direction === 'both') {
      const rightStub = new THREE.Mesh(new THREE.PlaneGeometry(11, 32), branchMat);
      rightStub.rotation.x = -Math.PI / 2;
      const pos = sample.position
        .clone()
        .addScaledVector(sample.right, 24)
        .addScaledVector(sample.up, -0.01);
      rightStub.position.copy(pos);
      const angle = Math.atan2(sample.tangent.x, sample.tangent.z);
      rightStub.rotation.z = -angle + Math.PI / 2;
      worldGroup.add(rightStub);
    }

    if (direction === 'left' || direction === 'both') {
      const leftStub = new THREE.Mesh(new THREE.PlaneGeometry(11, 32), branchMat);
      leftStub.rotation.x = -Math.PI / 2;
      const pos = sample.position
        .clone()
        .addScaledVector(sample.right, -18)
        .addScaledVector(sample.up, -0.01);
      leftStub.position.copy(pos);
      const angle = Math.atan2(sample.tangent.x, sample.tangent.z);
      leftStub.rotation.z = -angle + Math.PI / 2;
      worldGroup.add(leftStub);
    }
  }

  // ============================================================================
  // LOCATE EXACT ARC-LENGTH `s` FOR EVERY SCENE MILESTONE (EXPANDED ROUTE)
  // ============================================================================
  const sScene2Turn = director.findClosestS(new THREE.Vector3(0, 0, 310), 0.02, 0.12);
  const sScene3Turn = director.findClosestS(new THREE.Vector3(-350, 0, 342), 0.08, 0.22);
  const sScene4UTurn = director.findClosestS(new THREE.Vector3(-382, 0, 680), 0.12, 0.28);
  const sScene5NoPark = director.findClosestS(new THREE.Vector3(-490, 0, 420), 0.22, 0.36);
  const sScene6NoRight = director.findClosestS(new THREE.Vector3(-490, 0, 60), 0.28, 0.42);
  const sScene7NoLeft = director.findClosestS(new THREE.Vector3(-490, 0, -240), 0.32, 0.48);
  const sScene8Downhill = director.findClosestS(new THREE.Vector3(-490, 0, -500), 0.36, 0.54);
  const sScene9Uphill = director.findClosestS(new THREE.Vector3(-490, -18, -940), 0.44, 0.62);
  const sScene10Winding = director.findClosestS(new THREE.Vector3(-490, 0, -1400), 0.5, 0.68);
  const sScene11Zebra = director.findClosestS(new THREE.Vector3(-490, 0, -2060), 0.6, 0.78);
  const sScene13TrafficLight = director.findClosestS(new THREE.Vector3(-490, 0, -2380), 0.66, 0.84);
  const sScene16SPBUPump = director.findClosestS(new THREE.Vector3(-505, 0, -2810), 0.72, 0.9);
  const sScene19Seq1 = director.findClosestS(new THREE.Vector3(-490, 0, -3100), 0.76, 0.94);
  const sScene19Seq2 = director.findClosestS(new THREE.Vector3(-490, 0, -3270), 0.78, 0.95);
  const sScene19Seq3 = director.findClosestS(new THREE.Vector3(-490, 0, -3440), 0.8, 0.96);
  const sScene19TurnRight = director.findClosestS(new THREE.Vector3(-490, 0, -3610), 0.84, 0.97);
  const sScene21HalteStop = director.findClosestS(new THREE.Vector3(20, 0, -3654.5), 0.92, 0.999);

  const signCheckpoints: SignCheckpoint[] = [];
  function registerSignWithCheckpoint(
    id: string,
    sceneTitle: string,
    type: IndonesianSignType,
    signS: number,
    lateralOffset = -4.3,
    scale = 1.45,
    shouldPause = true
  ) {
    addTrafficSign(type, signS, lateralOffset, scale);
    if (shouldPause) {
      // Pause 14 meters before the sign so the 3D sign is clearly visible on the left sidewalk through the windshield
      signCheckpoints.push({
        id,
        type,
        signS,
        pauseS: signS - 14,
        sceneTitle,
      });
    }
  }

  // ============================================================================
  // PLACE ALL 21 SCENES' TRAFFIC SIGNS & INTERSECTIONS (WELL-SPACED ON SIDEWALK)
  // ============================================================================

  // SCENE 2: Rambu Wajib Belok Kanan (Road turns RIGHT)
  registerSignWithCheckpoint(
    'scene-2-belok-kanan',
    'SCENE 2 — RAMBU WAJIB BELOK KANAN',
    'WAJIB_BELOK_KANAN',
    sScene2Turn - 18,
    -4.3,
    1.5
  );

  // SCENE 3: Rambu Wajib Belok Kiri (Road turns LEFT)
  registerSignWithCheckpoint(
    'scene-3-belok-kiri',
    'SCENE 3 — RAMBU WAJIB BELOK KIRI',
    'WAJIB_BELOK_KIRI',
    sScene3Turn - 18,
    -4.3,
    1.5
  );

  // SCENE 4: Rambu Putar Balik (U-Turn) placed cleanly on left sidewalk before U-Turn loop
  registerSignWithCheckpoint(
    'scene-4-putar-balik',
    'SCENE 4 — RAMBU PUTAR BALIK (U-TURN)',
    'PUTAR_BALIK',
    sScene4UTurn - 22,
    -4.3,
    1.5
  );

  // SCENE 5: Rambu Dilarang Parkir (in front of busy Ruko shops, no parked cars blocking)
  registerSignWithCheckpoint(
    'scene-5-dilarang-parkir',
    'SCENE 5 — RAMBU DILARANG PARKIR',
    'DILARANG_PARKIR',
    sScene5NoPark - 12,
    -4.3,
    1.5
  );

  // SCENE 6: Rambu Dilarang Belok Kanan + Right Side Street (Bus goes straight)
  addSideRoadBranch(sScene6NoRight + 16, 'right');
  registerSignWithCheckpoint(
    'scene-6-dilarang-belok-kanan',
    'SCENE 6 — RAMBU DILARANG BELOK KANAN',
    'DILARANG_BELOK_KANAN',
    sScene6NoRight - 14,
    -4.3,
    1.5
  );

  // SCENE 7: Rambu Dilarang Belok Kiri + Left Side Street (Bus goes straight)
  addSideRoadBranch(sScene7NoLeft + 16, 'left');
  registerSignWithCheckpoint(
    'scene-7-dilarang-belok-kiri',
    'SCENE 7 — RAMBU DILARANG BELOK KIRI',
    'DILARANG_BELOK_KIRI',
    sScene7NoLeft - 14,
    -4.3,
    1.5
  );

  // SCENE 8: Rambu Peringatan Turunan (before downhill grade)
  registerSignWithCheckpoint(
    'scene-8-peringatan-turunan',
    'SCENE 8 — RAMBU PERINGATAN TURUNAN',
    'PERINGATAN_TURUNAN',
    sScene8Downhill - 18,
    -4.3,
    1.55
  );

  // SCENE 9: Rambu Peringatan Tanjakan (before uphill grade)
  registerSignWithCheckpoint(
    'scene-9-peringatan-tanjakan',
    'SCENE 9 — RAMBU PERINGATAN TANJAKAN',
    'PERINGATAN_TANJAKAN',
    sScene9Uphill - 18,
    -4.3,
    1.55
  );

  // SCENE 10: Rambu Peringatan Jalan Berkelok (before S-curve)
  registerSignWithCheckpoint(
    'scene-10-jalan-berkelok',
    'SCENE 10 — RAMBU PERINGATAN JALAN BERKELOK',
    'JALAN_BERKELOK',
    sScene10Winding - 18,
    -4.3,
    1.55
  );

  // SCENE 11: Zebra Cross & Pejalan Kaki
  registerSignWithCheckpoint(
    'scene-11-zebra-cross',
    'SCENE 11 — RAMBU PENYEBERANGAN PEJALAN KAKI',
    'ZEBRA_CROSS',
    sScene11Zebra - 24,
    -4.3,
    1.5
  );

  // Build 3D Zebra Cross Stripes on the road at sScene11Zebra
  const zebraSample = director.sampleAtDistance(sScene11Zebra);
  const zebraGroup = new THREE.Group();
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  for (let zIdx = 0; zIdx < 9; zIdx++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 4.4), stripeMat);
    stripe.position.set(-2.4 + zIdx * 1.35, 0.02, 0);
    zebraGroup.add(stripe);
  }
  placeAlongRoad(zebraGroup, sScene11Zebra, 0, 0, false);

  // Build Animated Pedestrian (Pejalan Kaki) at Zebra Cross
  const pedestrianGroup = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a17c, roughness: 0.7 });
  const batikShirtMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), skinMat);
  head.position.y = 1.62;
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  hair.position.y = 1.64;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.58, 0.22), batikShirtMat);
  torso.position.y = 1.15;

  const legGeo = new THREE.BoxGeometry(0.14, 0.75, 0.16);
  legGeo.translate(0, -0.35, 0);
  const pedestrianLeftLeg = new THREE.Mesh(legGeo, pantsMat);
  pedestrianLeftLeg.position.set(-0.09, 0.82, 0);
  const pedestrianRightLeg = new THREE.Mesh(legGeo, pantsMat);
  pedestrianRightLeg.position.set(0.09, 0.82, 0);

  const armGeo = new THREE.BoxGeometry(0.11, 0.56, 0.12);
  armGeo.translate(0, -0.25, 0);
  const pedestrianLeftArm = new THREE.Mesh(armGeo, batikShirtMat);
  pedestrianLeftArm.position.set(-0.25, 1.38, 0);
  const pedestrianRightArm = new THREE.Mesh(armGeo, batikShirtMat);
  pedestrianRightArm.position.set(0.25, 1.38, 0);

  pedestrianGroup.add(
    head,
    hair,
    torso,
    pedestrianLeftLeg,
    pedestrianRightLeg,
    pedestrianLeftArm,
    pedestrianRightArm
  );
  worldGroup.add(pedestrianGroup);

  // ============================================================================
  // SCENE 12-15: PERSIMPANGAN BESAR & LAMPU LALU LINTAS (TRAFFIC LIGHT GANTRY)
  // Top = MERAH (Red), Middle = KUNING (Yellow/Amber), Bottom = HIJAU (Green)
  // Ultra-vivid high-contrast LED colors so RED stands out unmistakably in daylight
  // ============================================================================
  addSideRoadBranch(sScene13TrafficLight + 16, 'both');

  // Stop Line (Garis Berhenti Putih Tebal) before the traffic light
  const stopLineMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.045, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  placeAlongRoad(stopLineMesh, sScene13TrafficLight, -0.1, 0, false);

  // Overhead & Side Traffic Light Assembly
  // Placed directly on the LEFT sidewalk (`lateralOffset = -4.6`) using placeAlongRoad.
  // Because `faceTowardsBus = true`, local +X is the LEFT side (away from the road) and local -X is toward the road center!
  const tlGroup = new THREE.Group();
  const tlPoleMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Main pole planted firmly on the left sidewalk (x = 0 relative to tlGroup at -4.6m)
  const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 6.4, 16), tlPoleMat);
  mainPost.position.set(0, 3.2, 0);
  // Cantilever arm extending from the left sidewalk pole (-X direction) over the left lane
  const overheadArm = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.2, 0.2), tlPoleMat);
  overheadArm.position.set(-2.2, 5.85, 0);
  tlGroup.add(mainPost, overheadArm);

  const trafficLightRed: THREE.MeshBasicMaterial[] = [];
  const trafficLightYellow: THREE.MeshBasicMaterial[] = [];
  const trafficLightGreen: THREE.MeshBasicMaterial[] = [];

  function createSignalHead(x: number, y: number, scale = 1): THREE.Group {
    const headBox = new THREE.Group();
    headBox.position.set(x, y, 0);
    headBox.scale.setScalar(scale);

    // High-contrast white reflective border & deep matte black signal housing
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 2.38, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 2.26, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 })
    );
    headBox.add(rim, housing);

    // Unlit MeshBasicMaterial guarantees pure, unmistakable traffic light colors unaffected by sun glare
    const rMat = new THREE.MeshBasicMaterial({ color: 0x2a0505 });
    const yMat = new THREE.MeshBasicMaterial({ color: 0x2a1c05 });
    const gMat = new THREE.MeshBasicMaterial({ color: 0x00ff55 });

    trafficLightRed.push(rMat);
    trafficLightYellow.push(rMat ? yMat : yMat);
    trafficLightGreen.push(gMat);

    const bulbGeo = new THREE.SphereGeometry(0.27, 24, 24);
    const hoodGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.28, 20, 1, true, 0, Math.PI);

    // 1. TOP BULB: MERAH (RED)
    const rBulb = new THREE.Mesh(bulbGeo, rMat);
    rBulb.position.set(0, 0.68, 0.16);
    const rHood = new THREE.Mesh(
      hoodGeo,
      new THREE.MeshStandardMaterial({ color: 0x05080f, side: THREE.DoubleSide })
    );
    rHood.rotation.x = Math.PI / 2;
    rHood.rotation.z = -Math.PI / 2;
    rHood.position.set(0, 0.68, 0.26);

    // 2. MIDDLE BULB: KUNING (YELLOW / AMBER)
    const yBulb = new THREE.Mesh(bulbGeo, yMat);
    yBulb.position.set(0, 0, 0.16);
    const yHood = rHood.clone();
    yHood.position.set(0, 0, 0.26);

    // 3. BOTTOM BULB: HIJAU (GREEN)
    const gBulb = new THREE.Mesh(bulbGeo, gMat);
    gBulb.position.set(0, -0.68, 0.16);
    const gHood = rHood.clone();
    gHood.position.set(0, -0.68, 0.26);

    headBox.add(rBulb, rHood, yBulb, yHood, gBulb, gHood);
    return headBox;
  }

  // Primary signal head mounted on the left sidewalk post + high overhead signal head above the lane
  tlGroup.add(createSignalHead(0, 3.6, 1.1));
  tlGroup.add(createSignalHead(-3.6, 5.4, 1.15));

  const trafficLightPointLight = new THREE.PointLight(0x00ff55, 3.5, 25);
  trafficLightPointLight.position.set(0, 3.6, 1.2);
  tlGroup.add(trafficLightPointLight);

  // Place tlGroup on the left sidewalk (-4.6m lateral offset)
  placeAlongRoad(tlGroup, sScene13TrafficLight + 9, -4.6, 0, true);

  // ============================================================================
  // SCENE 16-18: SPBU INDONESIA (FUEL STATION CANOPY, PUMPS, ATTENDANT)
  // Placed strictly off the road to the LEFT (`lateralOffset = -6.5m`).
  // Inside spbuGroup (with `faceTowardsBus = true`), +X moves even further left away from the road!
  // ============================================================================
  registerSignWithCheckpoint(
    'scene-16-spbu',
    'SCENE 16 — RAMBU PETUNJUK SPBU',
    'PETUNJUK_SPBU',
    sScene16SPBUPump - 68,
    -4.3,
    1.5
  );

  const spbuGroup = new THREE.Group();

  // Concrete apron slab on the LEFT side of the road (extending from 0 to +14m left of -6.5m)
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.15, 48),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
  );
  apron.position.set(6.0, 0.01, 0);
  spbuGroup.add(apron);

  // Iconic Indonesian Red & White SPBU Canopy Roof (High and off to the left side of the road)
  const canopyRoof = new THREE.Mesh(
    new THREE.BoxGeometry(12.5, 0.95, 24),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 })
  );
  canopyRoof.position.set(4.5, 5.8, 0);
  const canopyWhiteStripe = new THREE.Mesh(
    new THREE.BoxGeometry(12.65, 0.28, 24.1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  canopyWhiteStripe.position.set(4.5, 5.6, 0);
  spbuGroup.add(canopyRoof, canopyWhiteStripe);

  // Canopy Columns planted on the pump island (x = +2.5m inside spbuGroup -> -9.0m from bus)
  const colMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  for (const zOff of [-7, 7]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.7, 16), colMat);
    col.position.set(2.5, 2.85, zOff);
    spbuGroup.add(col);
  }

  // Fuel Dispenser Island & Digital Pump Unit safely on the left side (never on the road!)
  const islandBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.25, 18),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
  );
  islandBase.position.set(2.5, 0.15, 0);
  spbuGroup.add(islandBase);

  const pumpBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.15, 1.35),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
  );
  pumpBody.position.set(2.2, 1.25, 0);
  const pumpScreen = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.55, 0.85),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
    })
  );
  pumpScreen.position.set(2.15, 1.65, 0);
  spbuGroup.add(pumpBody, pumpScreen);

  // Roadside SPBU Totem Sign (Red & White Pillar on left sidewalk edge)
  const totem = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 6.5, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
  );
  totem.position.set(1.2, 3.25, 18);
  spbuGroup.add(totem);

  // Anchor spbuGroup at -6.2m lateral offset (strictly on the left side outside the road!)
  placeAlongRoad(spbuGroup, sScene16SPBUPump, -6.2, 0, true);

  // SPBU Attendant (Petugas SPBU in Red Uniform)
  const spbuAttendantGroup = new THREE.Group();
  const redUniformMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
  const attHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), skinMat);
  attHead.position.y = 1.62;
  const attCap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16), redUniformMat);
  attCap.position.y = 1.74;
  const attTorso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 0.24), redUniformMat);
  attTorso.position.y = 1.15;
  const attLegs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.78, 0.18), pantsMat);
  attLegs.position.y = 0.45;
  const spbuAttendantArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.55, 0.12),
    redUniformMat
  );
  spbuAttendantArm.position.set(0.24, 1.25, 0.1);
  spbuAttendantGroup.add(attHead, attCap, attTorso, attLegs, spbuAttendantArm);
  worldGroup.add(spbuAttendantGroup);

  const spbuSample = director.sampleAtDistance(sScene16SPBUPump);

  // ============================================================================
  // SCENE 19: RANGKAIAN RAMBU BERURUTAN (WELL-SPACED 165m APART)
  // ============================================================================
  // 1. Rambu Petunjuk (Green Highway Direction Board: Pusat Kota / Halte Terpadu)
  registerSignWithCheckpoint(
    'scene-19-petunjuk-kota',
    'SCENE 19 — RAMBU PETUNJUK JURUSAN',
    'PETUNJUK_KOTA',
    sScene19Seq1,
    -4.3,
    1.75
  );
  // 2. Rambu Peringatan / Fasilitas Penyeberangan
  registerSignWithCheckpoint(
    'scene-19-peringatan',
    'SCENE 19 — RAMBU FASILITAS PENYEBERANGAN',
    'ZEBRA_CROSS',
    sScene19Seq2,
    -4.3,
    1.5
  );
  // 3. Rambu Larangan (Red Circle: Dilarang Parkir — bus continues smoothly)
  registerSignWithCheckpoint(
    'scene-19-larangan',
    'SCENE 19 — RAMBU LARANGAN PARKIR',
    'DILARANG_PARKIR',
    sScene19Seq3,
    -4.3,
    1.5
  );
  // 4. Rambu Perintah Arah (Blue Circle: Wajib Belok Kanan — bus turns right at the junction!)
  registerSignWithCheckpoint(
    'scene-19-perintah-kanan',
    'SCENE 19 — RAMBU WAJIB BELOK KANAN',
    'WAJIB_BELOK_KANAN',
    sScene19TurnRight - 18,
    -4.3,
    1.55
  );

  // ============================================================================
  // SCENE 20 & 21: HALTE BUS MODERN INDONESIA (BUS STOP SHELTER ON LEFT CURB)
  // Note: Since halteGroup is placed with faceTowardsBus=true, +X in local space is the LEFT side of the road!
  // ============================================================================
  registerSignWithCheckpoint(
    'scene-20-halte-bus',
    'SCENE 20 — RAMBU TEMPAT PEMBERHENTIAN BUS (HALTE)',
    'HALTE_BUS',
    sScene21HalteStop - 52,
    -4.3,
    1.5
  );
  addTrafficSign('HALTE_BUS', sScene21HalteStop + 4, -4.1, 1.35);

  const halteGroup = new THREE.Group();
  // Elevated boarding platform on the LEFT curb (halteGroup anchored at -5.8m left of bus centerline)
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.32, 18),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 })
  );
  platform.position.set(0, 0.16, 0);
  halteGroup.add(platform);

  // Modern Blue Canopy Shelter Roof
  const shelterRoof = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })
  );
  shelterRoof.position.set(0, 3.25, 0);
  halteGroup.add(shelterRoof);

  // Glass back wall & steel pillars (+X is away from the road)
  const glassWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 2.6, 11.2),
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    })
  );
  glassWall.position.set(1.1, 1.75, 0);
  halteGroup.add(glassWall);

  // Passenger waiting bench
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.55, 6.5),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  bench.position.set(0.4, 0.5, 0);
  halteGroup.add(bench);

  // Anchor halteGroup at -5.8m lateral offset (strictly on the left sidewalk outside the road!)
  placeAlongRoad(halteGroup, sScene21HalteStop, -5.8, 0, true);

  // ============================================================================
  // INDONESIAN URBAN ENVIRONMENT: RUKO SHOPS, HOUSES, TROPICAL TREES, STREETLIGHTS
  // Strictly validated against `director.getMinDistanceToRoadXZ()` so NO building,
  // tree, or pole can ever appear on the asphalt road near corners or U-turns!
  // ============================================================================
  const rukoColors = [0xfef3c7, 0xe0f2fe, 0xfce7f3, 0xf1f5f9, 0xffedd5, 0xdcfce7];
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
  const poleSteelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.6,
    roughness: 0.4,
  });

  for (let s = 28; s < director.totalLength - 30; s += 26) {
    const sample = director.sampleAtDistance(s);
    // Skip curved corners automatically
    if (Math.abs(sample.curvature) > 0.08) continue;

    const nearSPBU = Math.abs(s - sScene16SPBUPump) < 55;
    const nearHalte = Math.abs(s - sScene21HalteStop) < 35;
    const nearSideRoad =
      Math.abs(s - sScene6NoRight) < 28 ||
      Math.abs(s - sScene7NoLeft) < 28 ||
      Math.abs(s - sScene13TrafficLight) < 32;

    if (nearSideRoad) continue;

    const isHillyNatureSection = s > sScene8Downhill - 25 && s < sScene10Winding + 320;

    // Tropical Trees (Pepohonan Tropis Rindang) on both sides
    for (const side of ['left', 'right'] as const) {
      if (side === 'left' && (nearSPBU || nearHalte)) continue;

      const lat = side === 'left' ? -8.5 : 15.5;
      const candidatePos = sample.position.clone().addScaledVector(sample.right, lat);

      // Verify candidate tree position is at least 7.5m away from ANY point on the spline
      if (director.getMinDistanceToRoadXZ(candidatePos.x, candidatePos.z) < 7.5) continue;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 3.6, 8), trunkMat);
      trunk.position.y = 1.8;
      const crown1 = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.1, 1),
        s % 52 === 0 ? foliageMat1 : foliageMat2
      );
      crown1.position.y = 4.4;
      const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), foliageMat1);
      crown2.position.set(0.6, 5.4, 0.3);
      treeGroup.add(trunk, crown1, crown2);
      placeAlongRoad(treeGroup, s, lat, 0, true);
    }

    // Streetlights & Utility Poles (Tiang Listrik & Lampu Jalan Indonesia) every 52m
    if (s % 52 === 28 && !nearSPBU && !nearHalte) {
      const lampLat = -4.5;
      const lampPos = sample.position.clone().addScaledVector(sample.right, lampLat);
      if (director.getMinDistanceToRoadXZ(lampPos.x, lampPos.z) >= 4.2) {
        const lampGroup = new THREE.Group();
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 7.2, 8), poleSteelMat);
        post.position.y = 3.6;
        // Since faceTowardsBus=true, -X extends toward the road center
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), poleSteelMat);
        arm.position.set(-0.85, 7.0, 0);
        lampGroup.add(post, arm);
        placeAlongRoad(lampGroup, s, lampLat, 0, true);
      }
    }

    // Indonesian Ruko (Shophouses) & Residential Houses in urban sections
    if (!isHillyNatureSection) {
      for (const side of ['left', 'right'] as const) {
        if (side === 'left' && (nearSPBU || nearHalte)) continue;
        const lat = side === 'left' ? -16.0 : 23.0;
        const bldgPos = sample.position.clone().addScaledVector(sample.right, lat);

        // Strict clearance check: ensure building center is at least 14.5m away from all road segments
        if (director.getMinDistanceToRoadXZ(bldgPos.x, bldgPos.z) < 14.5) continue;

        const bldgGroup = new THREE.Group();
        const height = 6.5 + ((s * 7) % 5);
        const width = 7.5;
        const depth = 9.0;

        const wallColor = rukoColors[Math.floor(s / 26) % rukoColors.length];
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 })
        );
        body.position.y = height / 2;

        // Pitched terracotta roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, 2.2, 4), roofMat);
        roof.position.y = height + 1.1;
        roof.rotation.y = Math.PI / 4;

        // Storefront awning / signage band
        const awningColor = s % 78 === 0 ? 0x0284c7 : s % 52 === 0 ? 0x16a34a : 0xd97706;
        const awning = new THREE.Mesh(
          new THREE.BoxGeometry(width + 0.3, 0.85, depth + 0.3),
          new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.5 })
        );
        awning.position.y = 3.2;

        bldgGroup.add(body, roof, awning);
        placeAlongRoad(bldgGroup, s, lat, 0, true);
      }
    }
  }

  // ============================================================================
  // INDONESIAN ONCOMING TRAFFIC (MOBIL, BUS, SEPEDA MOTOR DI LAJUR BERLAWANAN)
  // Safely traveling in the opposite lane (+6.4m lateral offset)
  // ============================================================================
  const oncomingVehicles: InteractiveSceneEntities['oncomingVehicles'] = [];
  const carColors = [0xffffff, 0xcbd5e1, 0x1e293b, 0xdc2626, 0x0284c7, 0xfacc15];

  for (let i = 0; i < 32; i++) {
    const startS = 180 + i * 155;
    if (startS >= director.totalLength - 80) break;

    const vGroup = new THREE.Group();
    const isMotorbike = i % 3 === 0;
    const isBus = i % 7 === 0;

    if (isMotorbike) {
      const bikeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 1.75), bikeMat);
      body.position.y = 0.55;
      const rider = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.75, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      rider.position.set(0, 1.15, -0.1);
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 })
      );
      helmet.position.set(0, 1.68, -0.1);
      const headlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfef08a,
          emissiveIntensity: 1.5,
        })
      );
      headlight.position.set(0, 0.82, 0.88);
      vGroup.add(body, rider, helmet, headlight);
    } else if (isBus) {
      const busMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.95, 9.2), busMat);
      cabin.position.y = 1.65;
      const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 1.25, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
      );
      windshield.position.set(0, 2.0, 4.61);
      vGroup.add(cabin, windshield);
    } else {
      const cColor = carColors[i % carColors.length];
      const carMat = new THREE.MeshStandardMaterial({
        color: cColor,
        roughness: 0.3,
        metalness: 0.2,
      });
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.75, 4.2), carMat);
      lower.position.y = 0.55;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.65, 2.3), carMat);
      upper.position.set(0, 1.2, -0.2);
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.14, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      plate.position.set(0, 0.42, 2.12);
      vGroup.add(lower, upper, plate);
    }

    worldGroup.add(vGroup);
    oncomingVehicles.push({
      mesh: vGroup,
      s: startS,
      speed: isMotorbike ? 16.5 : 14.5,
      lateralOffset: isMotorbike ? 7.6 : 6.1,
    });
  }

  return {
    signCheckpoints,
    trafficLightRed,
    trafficLightYellow,
    trafficLightGreen,
    trafficLightPointLight,
    pedestrianGroup,
    pedestrianBasePos: zebraSample.position.clone(),
    pedestrianRightVec: zebraSample.right.clone(),
    pedestrianLeftLeg,
    pedestrianRightLeg,
    pedestrianLeftArm,
    pedestrianRightArm,
    zebraCrossS: sScene11Zebra,
    spbuAttendantGroup,
    spbuAttendantBasePos: spbuSample.position.clone(),
    spbuAttendantRightVec: spbuSample.right.clone(),
    spbuAttendantArm,
    spbuPumpS: sScene16SPBUPump,
    trafficLightStopS: sScene13TrafficLight,
    halteStopS: sScene21HalteStop,
    oncomingVehicles,
  };
}
