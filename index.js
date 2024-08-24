import * as THREE from "three";
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.143.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { getParticleSystem } from "./getParticleSystem.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var becomingRiderAction = null, becomingAngelAction = null;
var hellMode = false, heavenMode = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const clock = new THREE.Clock();
let mixer = null, mixer2 = null;
let skull = null, spine = null, wings = null;
const loader = new GLTFLoader();
let dissolveProgress = 0;
let faceMesh = null, others = [];
let emitter = new THREE.Object3D();

loader.load('bg.glb', function(gltf) {
    const land = gltf.scene;
    scene.add(land);
    land.position.set(120,-9, 50);
    land.scale.set(5, 5, 5);
    land.rotation.y = Math.PI / 1;
});

loader.load('rider.glb', (gltf) => {
    const character = gltf.scene;
    character.position.set(0, -9, 0);
    character.scale.set(0.5, 0.5, 0.5);  
    scene.add(character);

    const animations = gltf.animations;
    mixer2 = new THREE.AnimationMixer(character);
    becomingRiderAction = mixer2.clipAction(animations[3]);
    becomingRiderAction.play();
    becomingRiderAction.setLoop(THREE.LoopOnce);

    character.traverse(function(child) {
        if (child.isMesh) {
            console.log(child.name);
            if(child.name === 'avaturn_hair_0_7') {
                faceMesh = child;
            }
            else if(child.name != 'body' && child.name != 'skull') {
                others.push(child);
            }
        }
        if(child.isBone) {
            console.log(child.name);
            if(child.name === 'mixamorigHead') skull = child;
            if(child.name === 'mixamorigSpine2') spine = child;
        }
    });

    setTimeout(() => {
        dissolveProgress = 1;
    }, 200);

    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(0, 12, 12).normalize();
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    loader.load('wings.glb', function(gltf) {
        const model = gltf.scene;
        wings = model;
        scene.add(model);
        model.position.set(0,1,-1.5);
        model.scale.set(2.5, 2.5, 2.5);

        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(animations[0]);
        action.play();
        action.setLoop(THREE.LoopRepeat);
    });

    if (skull) {
        skull.add(emitter);
    }

    const fireEffect = getParticleSystem({
        camera,
        emitter: emitter,
        parent: scene,
        rate: 80.0,
        texture: 'img/fire.png',
    });

    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xeaba12 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 50, -100);
    scene.add(sun);

    const sunLight = new THREE.DirectionalLight(0xffffff, 10);
    sunLight.position.set(0, 50, -100);
    scene.add(sunLight);

    function animate() {
        requestAnimationFrame(animate);

        fireEffect.update(0.016);
        controls.update();

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        if (mixer2) mixer2.update(delta);

        if (skull) {
            skull.updateWorldMatrix(true, false);
            emitter.position.setFromMatrixPosition(skull.matrixWorld);
            const offset = new THREE.Vector3(0, 0, 0.3);
            emitter.position.add(offset);
            emitter.rotation.setFromRotationMatrix(skull.matrixWorld);
        }

        if(spine && wings) {
            spine.updateWorldMatrix(true, false);
            wings.position.setFromMatrixPosition(spine.matrixWorld);
            const offset = new THREE.Vector3(0, 0, -1);
            wings.position.add(offset);
            wings.rotation.setFromRotationMatrix(spine.matrixWorld);
        }

        sun.position.y -= delta * 10;
        sun.position.z -= delta * 20;
        if (sunLight.intensity > 0) sunLight.intensity -= delta * 5;
        sunLight.position.y = sun.position.y;
        if (sunLight.position.y < 30) { 
            scene.remove(sunLight); 
            scene.remove(sun); 
        }
        if(light.intensity > 0.8) light.intensity -= delta * 10;

        if (dissolveProgress > 0) {
            dissolveProgress -= 0.01;
            if (dissolveProgress < 0.8) {
                if(dissolveProgress < 0.3) faceMesh.visible = false;
                let dp = dissolveProgress + 0.2;
                for(let obj of others) {
                    if(dp < 0.45) obj.visible = false;
                    obj.scale.set(1 * dp, 1, 1 * dp);
                    obj.position.set(0, 0, (dp-1)*0.1);
                }
            }
        }
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
window.onclick = () => {
    becomingRiderAction.play();
}
