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

var idleAction = null, becomingRiderAction = null, becomingAngelAction = null;
var hellMode = false, heavenMode = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

var bubble = document.getElementById('bubble'), hint = document.getElementsByClassName('bubblehint')[0], bubbletexture = document.getElementsByClassName('texture')[0];
var log = document.getElementById("log");
let bubbleposition = 50;
var widget = document.getElementById('container');

const clock = new THREE.Clock();
let mixer = null, mixer2 = null;
let skull = null, spine = null, wings = null;
const loader = new GLTFLoader();
const  textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('img/sky.jpg');
let dissolveProgress = 0;
let faceMesh = null, others = [];
let emitter = new THREE.Object3D();

const skyGeometry = new THREE.PlaneGeometry(16,10);
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, color : 0xdddddd });
const sky = new THREE.Mesh(skyGeometry, skyMaterial);

sky.scale.set(12, 12, 12);
sky.position.set(0, 80, -250);
scene.add(sky);

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
    idleAction = mixer2.clipAction(animations[0]);
    idleAction.play();
    becomingRiderAction = mixer2.clipAction(animations[3]);
    becomingRiderAction.clampWhenFinished = true;
    becomingRiderAction.setLoop(THREE.LoopOnce);
    becomingAngelAction = mixer2.clipAction(animations[2]);
    becomingAngelAction.clampWhenFinished = true;
    becomingAngelAction.setLoop(THREE.LoopOnce);

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

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 12, 12).normalize();
    scene.add(light);
    const heavenLight = new THREE.DirectionalLight(0xffffff,10);
    heavenLight.position.set(0, 150, 150).normalize();
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    loader.load('wings.glb', function(gltf) {
        const model = gltf.scene;
        wings = model;
        scene.add(model);
        wings.visible = false;
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

    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: textureLoader.load('img/sun.jpg') });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 50, -100);
    scene.add(sun);

    const sunLight = new THREE.DirectionalLight(0xffffff, 5);
    sunLight.position.set(0, 50, -100);
    scene.add(sunLight);

    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        const delta = clock.getDelta();
        if (mixer2) mixer2.update(delta);

        if(heavenMode) {
            if (idleAction && idleAction.isRunning()) {
                idleAction.stop();
            }
            becomingAngelAction.play();
            wings.visible = true;
            if (mixer) mixer.update(delta);
            if(spine && wings) {
                spine.updateWorldMatrix(true, false);
                wings.position.setFromMatrixPosition(spine.matrixWorld);
                const offset = new THREE.Vector3(0, 0, -1);
                wings.position.add(offset);
                wings.rotation.setFromRotationMatrix(spine.matrixWorld);
            }
            if(sun.position.y < 80) {
            sun.position.y += delta * 10;
            sun.position.z += delta * 20;
            }
            if (sunLight.intensity < 25) { sunLight.intensity += delta * 5;
                sunLight.position.y = sun.position.y;
            }
            if(light.intensity < 6) {
              light.intensity += delta * 10;
            }
        }

        if(hellMode) {
        fireEffect.update(0.016);
        if (idleAction && idleAction.isRunning()) {
            idleAction.stop();
        }
        becomingRiderAction.play();
        if (skull) {
            skull.updateWorldMatrix(true, false);
            emitter.position.setFromMatrixPosition(skull.matrixWorld);
            const offset = new THREE.Vector3(0, 0, 0.3);
            emitter.position.add(offset);
            emitter.rotation.setFromRotationMatrix(skull.matrixWorld);
        }

        sun.position.y -= delta * 15;
        sun.position.z -= delta * 20;
        if (sunLight.intensity > 0) sunLight.intensity -= delta * 5;
        sunLight.position.y = sun.position.y;
        if (sunLight.position.y < 30) { 
            scene.remove(sunLight); 
            scene.remove(sun); 
        }
        if(light.intensity > 0.8) {
            light.intensity -= delta * 10;
            skyMaterial.color.setScalar(skyMaterial.color.r - delta * 0.0001);
        }

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
bubble.ontouchmove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const touchX = touch.clientX;
    hint.style.display = 'none';
    let position = touchX/innerWidth * 100;
    update(bubbleposition);
    bubbleposition = position;
    bubble.style.marginLeft = bubbleposition+"vw";
}

bubble.onmousemove = (e) => {
    e.preventDefault();
    const touchX = e.clientX;
    hint.style.display = 'none';
    let position = touchX/innerWidth * 100;
    update(bubbleposition);
    bubbleposition = position;
    bubble.style.marginLeft = bubbleposition+"vw";
}

function update(position) {
        if (position < 50) {
            bubbletexture.style.display = 'block';
            bubbletexture.src = 'img/sun.jpg';
            bubbletexture.style.opacity = (60 - position) + '%';
        } else if(position > 50) {
            bubbletexture.style.display = 'block';
            bubbletexture.src = 'img/moon.jpg';
            bubbletexture.style.opacity = (position - 20) + '%';
        } else {
            bubbletexture.style.display = 'none';
            hint.style.display = 'inline';
        }
        log.innerHTML = Math.round(position)+'%';
}

bubble.onmouseleave = () => {
    if(bubbleposition > 50) {
        if(bubbleposition < 70) { bubbleposition = 50; hellMode = false; dissolveProgress = 0;
            bubble.style.marginLeft = bubbleposition+'vw';
        }
        else { bubbleposition = 95; hellMode = true; dissolveProgress = 1; skyMaterial.color.set(0x333333);
        bubble.style.marginLeft = 'calc(100vw - 54px)';
        widget.style.animation = '0.5s fadeAway ease-out forwards';
        }
    } else {
        if(bubbleposition > 30) { bubbleposition = 50;
            bubble.style.marginLeft = bubbleposition+'vw';
        }
        else { bubbleposition = 0; heavenMode = true; dissolveProgress = 0;  skyMaterial.color.set(0xffffff);
        bubble.style.marginLeft = 30 + 'px';
        widget.style.animation = '0.5s fadeAway ease-out forwards';
        }
    }
    update(bubbleposition);
}

bubble.ontouchend = () => {
    if(bubbleposition > 50) {
        if(bubbleposition < 70) { bubbleposition = 50; hellMode = false; dissolveProgress = 0; heavenMode = false;
            bubble.style.marginLeft = bubbleposition+'vw';
        }
        else { bubbleposition = 95; hellMode = true; dissolveProgress = 1; heavenMode = false; skyMaterial.color.set(0x333333);
        bubble.style.marginLeft = 'calc(100vw - 54px)';
        widget.style.animation = '0.5s fadeAway ease-out forwards';
        }
    } else {
        if(bubbleposition > 30) { bubbleposition = 50; hellMode = false; heavenMode = false; dissolveProgress = 0;
            bubble.style.marginLeft = bubbleposition+'vw';
        }
        else { bubbleposition = 0; heavenMode = true; dissolveProgress = 0; hellMode = false; skyMaterial.color.set(0xffffff);
        bubble.style.marginLeft = 30 + 'px';
        widget.style.animation = '0.5s fadeAway ease-out forwards';
        }
    }
    update(bubbleposition);
}
function keydown (e) {
    if (e.key === 'ArrowRight') {
        hint.style.display = 'none';
        bubble.style.animation = '0.5s swipeRight ease-in-out';
        document.removeEventListener('keydown', keydown);
        setTimeout(()=>{
            bubbleposition = 95; hellMode = true; dissolveProgress = 1; heavenMode = false; skyMaterial.color.set(0x333333);
            bubble.style.marginLeft = 'calc(100vw - 54px)';
            update(bubbleposition)
            widget.style.animation = '0.5s fadeAway ease-out forwards';
        },200);
    } else if (e.key === 'ArrowLeft') {
        hint.style.display = 'none';
        bubble.style.animation = '0.5s swipeLeft ease-in-out';
        document.removeEventListener('keydown', keydown);
        setTimeout(()=>{
            bubbleposition = 0; heavenMode = true; dissolveProgress = 0; hellMode = false;
            bubble.style.marginLeft = 30 + 'px';
            update(bubbleposition)
            widget.style.animation = '0.5s fadeAway ease-out forwards';
        },200);
    }
}

document.addEventListener('keydown', keydown);
