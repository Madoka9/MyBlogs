const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

//Light
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0xff6b6b, 1.5, 100);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x4ecdc4, 1.5, 100);
pointLight2.position.set(-10, -10, -10);
scene.add(pointLight2);

// Add custom Yin-Yang sphere shader
const Radius = 1.0;
const geometry = new THREE.SphereGeometry(Radius, 128, 64);

const textureLoader = new THREE.TextureLoader();
const yinYangTexture = textureLoader.load('Textures/uv_map_reference.jpg');
const yinYangMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTwistAngle: { value: 3.14 },
    uRadius: { value: Radius },
    uTexture: { value: yinYangTexture },
    uColorA: { value: new THREE.Color(0xffffff) },
    uColorB: { value: new THREE.Color(0xff0000) },
  },
  vertexShader: yinYangVertexShader,
  fragmentShader: yinYangFragmentShader
});

const mesh = new THREE.Mesh(geometry, yinYangMaterial);
scene.add(mesh);

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 20;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

container.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

container.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaMove = {
    x: e.clientX - previousMousePosition.x,
    y: e.clientY - previousMousePosition.y
  };

  mesh.rotation.y += deltaMove.x * 0.01;
  mesh.rotation.x += deltaMove.y * 0.01;

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

container.addEventListener('mouseup', () => isDragging = false);
container.addEventListener('mouseleave', () => isDragging = false);

container.addEventListener('wheel', (e) => {
  camera.position.z += e.deltaY * 0.01;
  camera.position.z = Math.max(2, Math.min(15, camera.position.z));
});

// 滑块控制 uTwistAngle
const twistSlider = document.getElementById('twist-slider');
const twistValue = document.getElementById('twist-value');
if (twistSlider) {
  twistSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    yinYangMaterial.uniforms.uTwistAngle.value = value;
    twistValue.textContent = value.toFixed(2);
  });
}

const resetRotationBtn = document.getElementById('reset-rotation');
if (resetRotationBtn) {
  resetRotationBtn.addEventListener('click', () => {
    mesh.rotation.set(0, 0, 0);
  });
}

let autoRotate = true;
const autoRotateCheckbox = document.getElementById('auto-rotate');
if (autoRotateCheckbox) {
  autoRotateCheckbox.checked = true;
  autoRotateCheckbox.addEventListener('change', (e) => {
    autoRotate = e.target.checked;
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (autoRotate && !isDragging) {
    mesh.rotation.y += 0.005;
    mesh.rotation.x += 0.003;
  }
  
  // Update shader time uniform
  //yinYangMaterial.uniforms.uTime.value += 0.02;
  
  //torus.rotation.z += 0.002;
  //torus.rotation.x = Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.2;
  
  particlesMesh.rotation.y += 0.0005;
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
