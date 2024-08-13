import * as THREE from "three";
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { getParticleSystem } from "./getParticleSystem.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const loader = new GLTFLoader();
loader.load('rider.glb', (gltf) => {
    const character = gltf.scene;
    character.position.set(0, -9, 0);
    character.scale.set(0.5, 0.5, 0.5);  
    scene.add(character);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 12, 5).normalize();
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const emitter = new THREE.Object3D();
    scene.add(emitter);
    emitter.position.set(0, 2, 0.2);

    const fireEffect = getParticleSystem({
        camera,
        emitter: emitter,
        parent: scene,
        rate: 50.0,
        texture: 'img/fire.png',
    });

    function animate() {
        requestAnimationFrame(animate);
        fireEffect.update(0.016);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
});

function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
