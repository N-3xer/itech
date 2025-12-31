// Three.js hero scene with particle system and mouse parallax
let threeInitialized = false;
// Toggle: set to true to enable the particle system (disabled -> CSS gradient fallback)
// Default: enabled with a conservative density to balance visual fidelity and performance.
const USE_PARTICLES = true;

// Particle density mode: 'conservative' or 'dense'.
// conservative -> fewer particles (recommended for production/performance)
// dense -> many more particles for a heavier visual effect (may impact mobile)
const PARTICLE_DENSITY = 'conservative';
function initThreeScene() {
  if (threeInitialized) return; threeInitialized = true;
  const container = document.getElementById('three-container');
  if (!container) return;

  // fallback: if particles are disabled, apply subtle gradient background and exit
  if (!USE_PARTICLES) {
    container.style.background = 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #2D2626 100%)';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 80;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // Create the renderer and guard against WebGL initialization failures.
  try {
    renderer.setSize(container.clientWidth, container.clientHeight);
  } catch (err) {
    // If WebGL can't initialize, fall back to a subtle gradient background and exit gracefully.
    console.warn('WebGL failed to initialize, falling back to gradient background', err);
    container.style.background = 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #2D2626 100%)';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Particles
  // Refined particle system — smaller, fewer, subtle glow and slower movement
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  // Choose counts based on density mode. These defaults keep the scene light by default.
  const particleCount = (PARTICLE_DENSITY === 'dense') ? (isMobile ? 600 : 1200) : (isMobile ? 150 : 500);
  const particleSize = isMobile ? 1.0 : 1.6;
  const particleOpacity = 0.28; // subtle opacity so particles don't compete with text
  // Use brand colors from the spec (coral, burgundy, deep burgundy)
  const particleColors = [0xEA5250, 0x8C3130, 0x7A2120];

  // create a soft round sprite for a glow effect
  // Create a soft radial sprite used as a particle texture to give a glow effect.
  // Using a canvas texture avoids loading external assets and provides a small, efficient sprite.
  function makeSprite() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(size/2, size/2, 1, size/2, size/2, size/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.2, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,size,size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++){
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 220;
    positions[i3+1] = (Math.random() - 0.5) * 140;
    positions[i3+2] = (Math.random() - 0.5) * 220;

    const colHex = particleColors[Math.floor(Math.random()*particleColors.length)];
    const col = new THREE.Color(colHex);
    colors[i3] = col.r; colors[i3+1] = col.g; colors[i3+2] = col.b;

    // Each particle gets a small random speed used for subtle per-particle drift
    speeds[i] = 0.0002 + Math.random() * 0.0008; // gentle motion
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const sprite = makeSprite();
  const material = new THREE.PointsMaterial({ size: particleSize, map: sprite, vertexColors: true, transparent: true, opacity: particleOpacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // subtle fog and background color — keeps particles readable but not distracting
  scene.fog = new THREE.FogExp2('#2D2626', 0.002);

  // mouse parallax
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width - 0.5;
    mouse.y = (e.clientY - rect.top) / rect.height - 0.5;
  });

  // Resize handler keeps camera aspect and renderer in sync with container size
  function onResize(){
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  let rot = 0;
  const posAttr = geometry.getAttribute('position');
  function animate(){
    rot += 0.00015; // much slower overall rotation
    points.rotation.y = rot + mouse.x * 0.25;
    points.rotation.x = mouse.y * 0.12;

    // gentle per-particle drift and slow fade/pulse
    const time = Date.now();
    for (let i = 0; i < particleCount; i++){
      const i3 = i * 3;
      // We are directly mutating the underlying Float32Array used by the BufferAttribute.
      // This is an efficient way to animate many particles on the CPU side; after mutating
      // the array we mark `needsUpdate = true` so Three.js uploads the new positions to the GPU.
      posAttr.array[i3] += Math.sin(time * speeds[i] + i) * 0.0005;
      posAttr.array[i3+1] += Math.cos(time * speeds[i] + i) * 0.00035;
    }
    posAttr.needsUpdate = true;

    // subtle pulsate on opacity to make particles feel alive
    points.material.opacity = particleOpacity * (0.85 + Math.sin(time * 0.0006) * 0.12);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Basic cleanup hint (not used here, but good practice)
  return { scene, camera, renderer };
}

// Lazy init when hero is near viewport
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero');
  if (!hero) return initThreeScene();
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        initThreeScene();
        o.disconnect();
      }
    });
  }, { rootMargin: '200px' });
  obs.observe(hero);
});
