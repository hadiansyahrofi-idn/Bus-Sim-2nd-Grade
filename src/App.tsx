import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BusSoundEngine } from './audio/BusSoundEngine';
import { EndLearningModal, IntroModal } from './components/LearningPanels';
import { createBusCockpitRig } from './simulation/BusCockpit';
import { JourneyDirector } from './simulation/JourneyDirector';
import {
  getTrafficSignDataUrl,
  SIGN_EDUCATIONAL_DATABASE,
  SignEducationalData,
} from './simulation/TrafficSignFactory';
import { buildIndonesianEnvironment, SignCheckpoint } from './simulation/WorldBuilder';

interface ActiveSignPopup {
  checkpoint: SignCheckpoint;
  eduData: SignEducationalData;
  imageUrl: string;
}

/**
 * Immersive Educational First-Person Bus Driving Experience (Indonesia)
 * Designed specifically for Papan Interaktif Digital (PID).
 *
 * Runs automatically from Scene 1 to Scene 21 as a continuous photorealistic
 * first-person journey from the bus driver's eye perspective.
 * Whenever a traffic sign appears ahead, the simulation pauses briefly and displays
 * the sign illustration along with its explanation, then automatically resumes.
 */
export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeSignPopup, setActiveSignPopup] = useState<ActiveSignPopup | null>(null);
  const [isJourneyFinished, setIsJourneyFinished] = useState(false);
  const startTriggerRef = useRef<(() => void) | null>(null);
  const restartTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. INITIALIZE RENDERER (High-DPI 16:9 Photorealistic Tone Mapping)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. INITIALIZE SCENE, TROPICAL INDONESIAN DAYLIGHT SKY & ATMOSPHERIC HAZE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0xc8e6f5, 0.0026);

    // Procedural Tropical Indonesian Daylight Sky Dome
    const skyGeo = new THREE.SphereGeometry(480, 32, 24);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext('2d')!;
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#1d63b8');
    skyGrad.addColorStop(0.42, '#5ca4e6');
    skyGrad.addColorStop(0.52, '#d8eef9');
    skyGrad.addColorStop(1, '#94a3b8');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 512, 512);

    // Soft tropical cumulus clouds
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    for (let i = 0; i < 36; i++) {
      const cx = (i * 97) % 512;
      const cy = 150 + ((i * 43) % 85);
      sCtx.beginPath();
      sCtx.ellipse(cx, cy, 38 + (i % 25), 11 + (i % 8), 0, 0, Math.PI * 2);
      sCtx.fill();
    }
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const skyDome = new THREE.Mesh(
      skyGeo,
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    scene.add(skyDome);

    // Natural Tropical Daylight Illumination
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x3b5323, 1.15);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(120, 220, 90);
    scene.add(sunLight);

    // 3. BUILD 21-SCENE SPLINE DIRECTOR, INDONESIAN WORLD & FIRST-PERSON BUS COCKPIT
    const director = new JourneyDirector();
    const env = buildIndonesianEnvironment(scene, director);
    const cockpit = createBusCockpitRig(container.clientWidth / container.clientHeight);
    scene.add(cockpit.rootGroup);

    // 4. INITIALIZE REALISTIC BUS SOUND ENGINE
    const soundEngine = new BusSoundEngine();
    soundEngine.initAndResume();
    const unlockAudio = () => soundEngine.initAndResume();
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    // 5. CONTINUOUS CHOREOGRAPHY STATE (SCENE 1 TO SCENE 21)
    let currentS = 0; // Distance along road in meters
    let currentSpeed = 0; // m/s
    let smoothedSteer = 0;
    let smoothedPitch = 0;

    // Sign Educational Pause State
    const completedSignIds = new Set<string>();
    let activePauseCheckpoint: SignCheckpoint | null = null;
    let signPauseTimer = 0;
    const SIGN_PAUSE_DURATION = 4.6; // Brief 4.6s automatic educational pause per traffic sign

    // Sequence stop timers (in seconds)
    let startEngineIdleTimer = 0; // Scene 1: Engine warm-up idle at start
    let zebraCrossStopTimer = 0; // Scene 11: Stop for pedestrian crossing
    let zebraCrossCompleted = false;

    let trafficLightTimer = 0; // Scene 12-15: Green -> Red (stop) -> Yellow (wait) -> Green (go)
    let trafficLightCompleted = false;

    let spbuRefuelTimer = 0; // Scene 16-18: Stop at SPBU pump while attendant refuels
    let spbuRefuelCompleted = false;

    let halteFinalStopped = false; // Scene 21: Final calm stop at Halte Bus
    let halteCompleteNotified = false;
    let simulationRunning = false; // Waits at Scene 1 until user clicks "Mulai Simulasi"

    let prevTime = performance.now();
    let elapsedTotal = 0;
    let animFrameId = 0;

    // Position the bus at Scene 1 start point immediately so the 3D cabin & road are visible behind the title screen
    const initSample = director.sampleAtDistance(0);
    cockpit.rootGroup.position.copy(initSample.position);
    cockpit.rootGroup.lookAt(initSample.position.clone().add(initSample.tangent));
    // Set speedometer needle to 0 km/h (+2.356 rad)
    cockpit.speedometerNeedlePivot.rotation.z = (135 * Math.PI) / 180;

    // Register start function so clicking "Mulai Simulasi" begins the journey and activates audio
    startTriggerRef.current = () => {
      simulationRunning = true;
      setHasStarted(true);
      soundEngine.initAndResume();
    };

    // Register restart function so clicking "Ulangi dari Awal" smoothly resets the entire journey
    restartTriggerRef.current = () => {
      currentS = 0;
      currentSpeed = 0;
      smoothedSteer = 0;
      smoothedPitch = 0;
      completedSignIds.clear();
      activePauseCheckpoint = null;
      signPauseTimer = 0;
      startEngineIdleTimer = 0;
      zebraCrossStopTimer = 0;
      zebraCrossCompleted = false;
      trafficLightTimer = 0;
      trafficLightCompleted = false;
      spbuRefuelTimer = 0;
      spbuRefuelCompleted = false;
      halteFinalStopped = false;
      halteCompleteNotified = false;
      simulationRunning = true;
      setActiveSignPopup(null);
      setIsJourneyFinished(false);
      setHasStarted(true);
      soundEngine.initAndResume();
    };

    const animate = (nowMs: number) => {
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min(0.05, (nowMs - prevTime) / 1000);
      prevTime = nowMs;

      // Keep sky dome centered on bus
      skyDome.position.copy(cockpit.rootGroup.position);

      // If waiting on the intro screen before "Mulai Simulasi" is clicked, render subtle idle cabin view
      if (!simulationRunning) {
        renderer.render(scene, cockpit.camera);
        return;
      }

      // ========================================================================
      // CHECK IF BUS REACHED AN EDUCATIONAL TRAFFIC SIGN PAUSE CHECKPOINT
      // ========================================================================
      if (!activePauseCheckpoint) {
        for (const cp of env.signCheckpoints) {
          if (!completedSignIds.has(cp.id) && currentS >= cp.pauseS) {
            activePauseCheckpoint = cp;
            signPauseTimer = 0;
            currentS = cp.pauseS;
            currentSpeed = 0;

            const eduData = SIGN_EDUCATIONAL_DATABASE[cp.type];
            const imageUrl = getTrafficSignDataUrl(cp.type);
            setActiveSignPopup({
              checkpoint: cp,
              eduData,
              imageUrl,
            });
            break;
          }
        }
      }

      // If currently paused for a traffic sign educational explanation:
      if (activePauseCheckpoint) {
        signPauseTimer += dt;
        // Smoothly settle analog speedometer needle to 0 km/h while paused
        const zeroAngleRad = (135 * Math.PI) / 180;
        cockpit.speedometerNeedlePivot.rotation.z = THREE.MathUtils.lerp(
          cockpit.speedometerNeedlePivot.rotation.z,
          zeroAngleRad,
          Math.min(1, dt * 8)
        );
        // Keep engine idling gently while paused so audio feels natural
        soundEngine.update({
          speedKmh: 0,
          pitchSlope: 0,
          blinker: 'off',
          isBraking: false,
          isRefueling: false,
          elapsedSec: elapsedTotal,
        });

        renderer.render(scene, cockpit.camera);

        if (signPauseTimer >= SIGN_PAUSE_DURATION) {
          completedSignIds.add(activePauseCheckpoint.id);
          activePauseCheckpoint = null;
          setActiveSignPopup(null);
        }
        return;
      }

      elapsedTotal += dt;

      // Determine current sample on road
      const sample = director.sampleAtDistance(currentS);

      // ========================================================================
      // DETERMINE TARGET SPEED & BEHAVIOR FOR ALL 21 SCENES (FASTER & SMOOTH TURNS)
      // ========================================================================
      let targetSpeed = 29.5; // Faster realistic cruising speed
      let blinker: 'off' | 'left' | 'right' = 'off';
      let isRefueling = false;

      // SCENE 1: Mulai Perjalanan (Quick, responsive launch once Mulai Simulasi is clicked)
      if (currentS < 6) {
        startEngineIdleTimer += dt;
        if (startEngineIdleTimer < 0.8) {
          targetSpeed = 8.0;
        } else {
          targetSpeed = 18.5;
          blinker = 'right'; // Pulling out into lane
        }
      } else if (currentS < 45) {
        targetSpeed = 24.0;
      }

      // Smoothly decelerate just before reaching the next unvisited traffic sign pause point
      for (const cp of env.signCheckpoints) {
        if (!completedSignIds.has(cp.id)) {
          const distToPause = cp.pauseS - currentS;
          if (distToPause > 0 && distToPause < 32) {
            targetSpeed = Math.min(targetSpeed, Math.max(9.5, (distToPause / 32) * 26.0));
          }
          break;
        }
      }

      // SCENE 2 (Belok Kanan), SCENE 3 (Belok Kiri), SCENE 4 (U-Turn), SCENE 10 (Jalan Berkelok)
      // Keep a brisk, natural turning speed (~21.5 m/s) so turns never feel sluggish
      const absCurve = Math.abs(sample.curvature);
      if (absCurve > 0.16) {
        targetSpeed = Math.min(targetSpeed, 21.5);
        if (sample.curvature > 0.2) blinker = 'right';
        if (sample.curvature < -0.2) blinker = 'left';
      }

      // SCENE 8: Turunan (Controlled brisk downhill grade)
      if (sample.pitchSlope < -0.04) {
        targetSpeed = Math.min(targetSpeed, 21.0);
      }

      // SCENE 9: Tanjakan (Steady uphill climb with heavier engine load)
      if (sample.pitchSlope > 0.04) {
        targetSpeed = Math.min(targetSpeed, 19.5);
      }

      // ========================================================================
      // SCENE 11: ZEBRA CROSS & PEJALAN KAKI MENYEBERANG
      // ========================================================================
      const distToZebra = env.zebraCrossS - 7.5 - currentS;
      if (!zebraCrossCompleted && distToZebra < 48 && distToZebra > -4) {
        if (distToZebra > 0.45) {
          // Smooth braking to stop before Zebra Cross
          targetSpeed = Math.min(targetSpeed, Math.max(1.5, (distToZebra / 48) * 18.0));
        } else {
          // Bus stops completely while pedestrian crosses
          targetSpeed = 0;
          currentSpeed = 0;
          zebraCrossStopTimer += dt;
          if (zebraCrossStopTimer >= 5.0) {
            zebraCrossCompleted = true;
          }
        }
      }

      // Update Pedestrian position & walking animation across Zebra Cross
      let pedWalkProgress = -3.8; // Waiting on left sidewalk
      if (!zebraCrossCompleted && distToZebra < 35) {
        // Walk from left sidewalk (-3.6m) across to right sidewalk (+7.2m)
        const walkPhase = THREE.MathUtils.clamp((zebraCrossStopTimer + 0.8) / 4.8, 0, 1);
        pedWalkProgress = -3.6 + walkPhase * 10.8;

        // Swing legs and arms while walking
        const swing = Math.sin(elapsedTotal * 7.8) * 0.55;
        env.pedestrianLeftLeg.rotation.x = swing;
        env.pedestrianRightLeg.rotation.x = -swing;
        env.pedestrianLeftArm.rotation.x = -swing * 0.7;
        env.pedestrianRightArm.rotation.x = swing * 0.7;
      } else if (zebraCrossCompleted) {
        pedWalkProgress = 7.4; // Safely on far sidewalk
        env.pedestrianLeftLeg.rotation.x = 0;
        env.pedestrianRightLeg.rotation.x = 0;
        env.pedestrianLeftArm.rotation.x = 0;
        env.pedestrianRightArm.rotation.x = 0;
      }

      const pedWorldPos = env.pedestrianBasePos
        .clone()
        .addScaledVector(env.pedestrianRightVec, pedWalkProgress);
      env.pedestrianGroup.position.copy(pedWorldPos);
      env.pedestrianGroup.lookAt(pedWorldPos.clone().add(env.pedestrianRightVec));

      // ========================================================================
      // SCENE 12, 13, 14, 15: LAMPU LALU LINTAS (HIJAU -> MERAH -> KUNING -> HIJAU)
      // Top bulb = MERAH (#FF0022), Middle bulb = KUNING (#FFBB00), Bottom bulb = HIJAU (#00FF55)
      // ========================================================================
      const distToStopLine = env.trafficLightStopS - 6.5 - currentS;
      let tlState: 'GREEN' | 'RED' | 'YELLOW' = 'GREEN';

      if (!trafficLightCompleted && distToStopLine < 85 && distToStopLine > -5) {
        if (distToStopLine > 48) {
          // SCENE 12: Approaching intersection while light is clearly GREEN
          tlState = 'GREEN';
          targetSpeed = Math.min(targetSpeed, 18.5);
        } else if (distToStopLine > 0.5) {
          // SCENE 13: Light changes from GREEN to RED as bus approaches -> smooth braking before stop line
          tlState = 'RED';
          targetSpeed = Math.min(targetSpeed, Math.max(1.4, (distToStopLine / 48) * 16.5));
        } else {
          // Bus stopped right before the white stop line
          targetSpeed = 0;
          currentSpeed = 0;
          trafficLightTimer += dt;

          if (trafficLightTimer < 4.2) {
            // SCENE 13: Stopped on vivid RED
            tlState = 'RED';
          } else if (trafficLightTimer < 6.6) {
            // SCENE 14: RED changes to YELLOW (Bus stays stopped and prepares to move, does NOT move on yellow)
            tlState = 'YELLOW';
          } else {
            // SCENE 15: YELLOW changes to GREEN -> Bus moves smoothly through intersection
            tlState = 'GREEN';
            trafficLightCompleted = true;
          }
        }
      }

      // Apply authentic high-contrast colors to Traffic Light 3D bulbs (Top=Red, Middle=Yellow, Bottom=Green)
      for (let i = 0; i < env.trafficLightRed.length; i++) {
        env.trafficLightRed[i].color.setHex(tlState === 'RED' ? 0xff0022 : 0x240404);
        env.trafficLightYellow[i].color.setHex(tlState === 'YELLOW' ? 0xffbb00 : 0x241904);
        env.trafficLightGreen[i].color.setHex(tlState === 'GREEN' ? 0x00ff55 : 0x04240d);
      }
      env.trafficLightPointLight.color.setHex(
        tlState === 'RED' ? 0xff0022 : tlState === 'YELLOW' ? 0xffbb00 : 0x00ff55
      );

      // ========================================================================
      // SCENE 16, 17, 18: MEMASUKI SPBU, MENGISI BAHAN BAKAR, KELUAR SPBU
      // ========================================================================
      const distToSPBU = env.spbuPumpS - currentS;
      if (!spbuRefuelCompleted && distToSPBU < 65 && distToSPBU > -35) {
        if (distToSPBU > 0.5) {
          // SCENE 16: Signal left and pull smoothly into SPBU island
          blinker = 'left';
          targetSpeed = Math.min(targetSpeed, Math.max(1.5, Math.min(12.0, (distToSPBU / 50) * 14.0)));
        } else {
          // SCENE 17: Stopped at fuel pump for realistic refueling
          targetSpeed = 0;
          currentSpeed = 0;
          blinker = 'off';
          isRefueling = true;
          spbuRefuelTimer += dt;
          if (spbuRefuelTimer >= 5.5) {
            spbuRefuelCompleted = true;
          }
        }
      } else if (spbuRefuelCompleted && distToSPBU <= 0.5 && distToSPBU > -48) {
        // SCENE 18: Leaving SPBU smoothly, signaling right to merge back into left highway lane
        blinker = 'right';
        targetSpeed = Math.min(targetSpeed, 13.5);
      }

      // Animate SPBU Attendant approaching bus during Scene 17 (attendant stands on the left pump island at -7.8m and approaches bus left side at -5.2m)
      const attLateral = isRefueling
        ? THREE.MathUtils.lerp(-7.8, -5.2, Math.min(1, spbuRefuelTimer / 1.5))
        : -7.8;
      const attPos = env.spbuAttendantBasePos
        .clone()
        .addScaledVector(env.spbuAttendantRightVec, attLateral);
      env.spbuAttendantGroup.position.copy(attPos);
      env.spbuAttendantGroup.lookAt(attPos.clone().add(env.spbuAttendantRightVec));
      env.spbuAttendantArm.rotation.x = isRefueling
        ? -0.85 + Math.sin(elapsedTotal * 4) * 0.08
        : 0;

      // ========================================================================
      // SCENE 20 & 21: MENUJU HALTE BUS & BERHENTI SEMPURNA DI HALTE (ENDING)
      // ========================================================================
      const distToHalte = env.halteStopS - currentS;
      if (distToHalte < 75) {
        if (distToHalte > 0.35 && !halteFinalStopped) {
          // SCENE 20: Slow down, turn on left turn signal, pull into Halte Bus bay
          blinker = 'left';
          targetSpeed = Math.min(targetSpeed, Math.max(1.1, Math.min(13.0, (distToHalte / 65) * 15.0)));
        } else {
          // SCENE 21: Berhenti sempurna di Halte Bus, sejajar dengan tepi jalan, mesin hidup lembut
          halteFinalStopped = true;
          targetSpeed = 0;
          currentSpeed = 0;
          blinker = 'off';
          if (!halteCompleteNotified) {
            halteCompleteNotified = true;
            setIsJourneyFinished(true);
          }
        }
      }

      // ========================================================================
      // SMOOTH REALISTIC BUS ACCELERATION & BRAKING PHYSICS
      // ========================================================================
      const isBraking = targetSpeed < currentSpeed - 0.5;
      const accelRate = targetSpeed > currentSpeed ? 3.5 : 5.2;
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, Math.min(1, dt * accelRate));
      if (targetSpeed === 0 && currentSpeed < 0.08) {
        currentSpeed = 0;
      }

      currentS += currentSpeed * dt;

      // ========================================================================
      // UPDATE FIRST-PERSON BUS CABIN POSITION, NATURAL SUSPENSION & STEERING
      // ========================================================================
      const updatedSample = director.sampleAtDistance(currentS);
      const { position, tangent, up, curvature, pitchSlope } = updatedSample;

      // Natural road micro-vibration & air-suspension gentle sway
      const speedKmh = currentSpeed * 3.6;
      const engineIdleVib = Math.sin(elapsedTotal * 28) * 0.0014;
      const roadBumpY =
        (Math.sin(currentS * 0.45) * 0.012 + Math.cos(currentS * 1.1) * 0.005) *
        Math.min(1, speedKmh / 28);

      const busWorldPos = position.clone().addScaledVector(up, roadBumpY + engineIdleVib);
      cockpit.rootGroup.position.copy(busWorldPos);

      // Orient bus smoothly along the 3D road tangent & slope
      smoothedPitch = THREE.MathUtils.lerp(smoothedPitch, pitchSlope, Math.min(1, dt * 4.5));
      const lookTarget = busWorldPos
        .clone()
        .add(tangent)
        .addScaledVector(up, smoothedPitch * 0.15);
      cockpit.rootGroup.lookAt(lookTarget);

      // Subtle body roll on curves
      smoothedSteer = THREE.MathUtils.lerp(smoothedSteer, curvature, Math.min(1, dt * 5.5));
      cockpit.rootGroup.rotateZ(smoothedSteer * 0.018);

      // Rotate physical steering wheel smoothly matching road curvature
      cockpit.steeringWheelGroup.rotation.z = smoothedSteer * 1.65;

      // Rotate physical analog speedometer needle accurately reflecting current speed in km/h (0 - 120 km/h scale)
      // Realistic city bus speed display (mapping simulation speed to realistic 0 - 80 km/h city bus speed range)
      const displayedKmh = THREE.MathUtils.clamp(currentSpeed * 2.4, 0, 120);
      const needleAngleRad = ((135 - (displayedKmh / 120) * 270) * Math.PI) / 180;
      cockpit.speedometerNeedlePivot.rotation.z = THREE.MathUtils.lerp(
        cockpit.speedometerNeedlePivot.rotation.z,
        needleAngleRad,
        Math.min(1, dt * 10)
      );

      // Blink physical turn signal indicator LEDs on dashboard binnacle
      const blinkOn = Math.floor(elapsedTotal / 0.42) % 2 === 0;
      cockpit.leftBlinkerMat.emissiveIntensity = blinker === 'left' && blinkOn ? 2.5 : 0;
      cockpit.rightBlinkerMat.emissiveIntensity = blinker === 'right' && blinkOn ? 2.5 : 0;

      // ========================================================================
      // UPDATE ONCOMING INDONESIAN TRAFFIC VEHICLES (OPPOSITE LANE)
      // ========================================================================
      for (const veh of env.oncomingVehicles) {
        veh.s -= veh.speed * dt;
        if (veh.s < 25) {
          veh.s = director.totalLength - 45;
        }
        const vSample = director.sampleAtDistance(veh.s);
        const vPos = vSample.position.clone().addScaledVector(vSample.right, veh.lateralOffset);
        veh.mesh.position.copy(vPos);
        veh.mesh.lookAt(vPos.clone().sub(vSample.tangent));
      }

      // ========================================================================
      // UPDATE REALISTIC SOUND DESIGN
      // ========================================================================
      soundEngine.update({
        speedKmh,
        pitchSlope,
        blinker,
        isBraking,
        isRefueling,
        elapsedSec: elapsedTotal,
      });

      renderer.render(scene, cockpit.camera);
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cockpit.camera.aspect = w / h;
      cockpit.camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      soundEngine.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none ${
        !hasStarted || isJourneyFinished ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Pure 16:9 First-Person Bus Windshield Viewport */}
      <div ref={containerRef} className="w-full h-full relative" />

      {/* Subtle realistic windshield optical reflection & anti-glare top sun-strip */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-black/15"
      />

      {/* Engaging Initial Screen for Grade 2 SD Students */}
      {!hasStarted && <IntroModal onStart={() => startTriggerRef.current?.()} />}

      {/* Automatic Educational Traffic Sign Overlay (Only Sign Image + Name + Explanation) */}
      {activeSignPopup && !isJourneyFinished && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-end pr-8 md:pr-14 lg:pr-20 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-200">
          <div className="w-full max-w-xl bg-slate-900/95 border border-white/15 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 bg-white/95 rounded-xl p-2.5 flex items-center justify-center shadow-md">
                <img
                  src={activeSignPopup.imageUrl}
                  alt={activeSignPopup.eduData.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-sky-400">
                  <span>{activeSignPopup.eduData.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>RAMBU LALU LINTAS INDONESIA</span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                  {activeSignPopup.eduData.name}
                </h2>
                <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                  {activeSignPopup.eduData.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive End Screen: Newly Learned Signs, Grade 2 SD Quiz & 4P Reflection */}
      {isJourneyFinished && (
        <EndLearningModal onRestart={() => restartTriggerRef.current?.()} />
      )}
    </div>
  );
}
