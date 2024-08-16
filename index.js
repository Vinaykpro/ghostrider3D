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

const clock = new THREE.Clock();
var mixer = null;
const loader = new GLTFLoader();
var dissolveProgress = 0;
var head = null;
var faceMesh = null, others = [];
var starting = true;

loader.load('head.glb', function(gltf) {
    head = gltf.scene;
    const meshes = [];
    head.traverse(function(child) {
        if (child.isMesh) {
            if(child.name == 'avaturn_hair_0_7') {
                faceMesh = child;
            } else {
                others.push(child);
            }
        }
    });
    scene.add(head);
    head.position.set(0,-8.8,0);
    head.scale.set(0.49, 0.49, 0.49);
    setTimeout(()=>{
        dissolveProgress = 1;
        starting = false;
    },200);

});
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

    loader.load('wings.glb', function(gltf) {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0,1,-1.5);
        model.scale.set(2.5, 2.5, 2.5);

        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(animations[0]);
        action.play();
        action.setLoop(THREE.LoopRepeat);
    });
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
        const delta = clock.getDelta();
        if(mixer) mixer.update(delta);
        if (dissolveProgress > 0) {
                head.visible = true;
                dissolveProgress -= 0.01;
                faceMesh.scale.set(1 * dissolveProgress, 1 , 1 * dissolveProgress);
                faceMesh.position.set(0, 0, (dissolveProgress-1)*0.1);
                if (dissolveProgress < 0.8) {
                    if(dissolveProgress<0.3) faceMesh.visible = false;
                    let dp = dissolveProgress + 0.2;
                    for(let obj of others) {
                        if(dp < 0.45) obj.visible = false;
                        obj.scale.set(1 * dp, 1, 1 * (dp));
                        obj.position.set(0, 0, (dp-1)*0.1);
                    }
                }
        } else if(!starting) {
            head.visible = false;
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
