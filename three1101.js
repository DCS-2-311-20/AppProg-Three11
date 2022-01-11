//
// 応用プログラミング 課題12 (three1101.js)  G084002020 拓殖太郎
//
"use strict"; // 厳格モード

let scene;
let camera;
let camera2;
let renderer;
let renderer2;
let clock;
let rigidBodies = [];
let ball;
let stage;
let stageQuaternion;
let tmpTrans;
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();

let ammoTmpPos;
let ammoTmpQuat;
let physicsWorld;
let collisionConfiguration;
let dispatcher;
let overlappingPairCache;
let solver;

const rollSpeed = 0.02;
const ballPosition = new THREE.Vector3(-2, 10, 4);
const cameraPosition = new THREE.Vector3(0, 6, 14);
//const cameraPosition = new THREE.Vector3(0, 6, 30);
const followCameraPosition = new THREE.Vector3();
followCameraPosition.copy(ballPosition);

const FLAGS = {CF_KINEMATIC_OBJECT: 2};
const STATE = {DISABLE_DEACTIVATION: 4};

const textureLoader = new THREE.TextureLoader();

// 物理空間の設定
function setupPhysicsWorld() {
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  overlappingPairCache = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache);
  physicsWorld.setGravity(new Ammo.btVector3(0, -1, 0));
}

// 描画空間の設定
function setupGraphics() {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x204060);

  camera = new THREE.PerspectiveCamera(60,
    0.5 * window.innerWidth / window.innerHeight, 0.3, 1000);

  camera2 = new THREE.PerspectiveCamera(60,
    0.5 * window.innerWidth / window.innerHeight, 0.3, 1000);
  camera2.position.copy(cameraPosition);
  camera2.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(-10, 17, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 13500;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor(0x204060);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(0.5 * window.innerWidth, window.innerHeight);
  document.getElementById("WebGL-output1").appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;

  renderer2 = new THREE.WebGLRenderer({antialias: true});
  renderer2.setClearColor(0x204060);
  renderer2.setPixelRatio(window.devicePixelRatio);
  renderer2.setSize(0.5 * window.innerWidth, window.innerHeight);
  document.getElementById("WebGL-output2").appendChild(renderer2.domElement);
  renderer2.shadowMap.enabled = true;
}

// ステージを構成するための箱
function createBox( pos, texture, normal, mass) {
  // 箱の描画のための設定
  const box = new THREE.Mesh(
    new THREE.BoxBufferGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial()
  );
  box.material.map = texture;
  box.material.normalMap = normal;
  box.material.normalScale.set(0.3,0.3);
  box.translateX(pos.x);
  box.translateY(pos.y);
  box.translateZ(pos.z);
  box.castShadow = true;
  box.receiveShadow = true;
  stage.add(box);

  // 箱の物理演算のための設定
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(
    pos.x, pos.y, pos.z
  ));

  const motionState
   = new Ammo.btDefaultMotionState(transform);
  const colShape
   = new Ammo.btBoxShape(new Ammo.btVector3(0.5, 0.5, 0.5));
  const localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass, motionState, colShape, localInertia);
  const body = new Ammo.btRigidBody(rbInfo);
  body.setActivationState( STATE.DISABLE_DEACTIVATION );
  body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );
  physicsWorld.addRigidBody(body);

  // 描画設定と物理設定の関連付け
  box.userData.physicsBody = body;
}

function createStage() {
  const stageMap = [
    [ 2,2,0,0,0,0,0,0,0,0,0,0,0,2,2 ],
    [ 2,1,1,1,1,1,1,1,1,1,1,1,1,1,2 ],
    [ 0,1,1,1,1,1,1,1,1,1,1,1,1,1,0 ],
    [ 0,1,1,0,1,1,1,1,1,1,1,0,1,1,0 ],
    [ 0,1,1,1,1,3,1,1,1,3,1,1,1,1,0 ],
    [ 0,1,1,1,3,0,1,1,1,0,3,1,1,1,0 ],
    [ 0,1,1,1,1,1,1,1,1,1,1,1,1,1,0 ],
    [ 0,1,1,1,1,1,1,3,1,1,1,1,1,1,0 ],
    [ 0,1,1,1,1,1,1,1,1,1,1,1,1,1,0 ],
    [ 0,1,1,1,3,0,1,1,1,0,3,1,1,1,0 ],
    [ 0,1,1,1,1,3,1,1,1,3,1,1,1,1,0 ],
    [ 0,1,1,0,1,1,1,1,1,1,1,0,1,1,0 ],
    [ 0,1,1,1,1,1,1,1,1,1,1,1,1,1,0 ],
    [ 2,1,1,1,1,1,1,1,1,1,1,1,1,1,2 ],
    [ 2,2,0,0,0,0,0,0,0,0,0,0,0,2,2 ],
  ]
  stage = new THREE.Group();
  stageQuaternion = new THREE.Quaternion(0, 0, 0, 1);
  const pos = {};
  const texture = [];
  const normal = [];
  texture[0] = textureLoader.load("textures/img_stone_diffuse.jpg");
  normal[0] = textureLoader.load("textures/img_stone_normal.jpg");
  texture[1] = textureLoader.load("textures/img_pillar_diffuse.jpg");
  normal[1] = textureLoader.load("textures/img_pillar_normal.jpg");
  texture[2] = textureLoader.load("textures/img_crate_diffuse.jpg");
  normal[2] = textureLoader.load("textures/img_crate_normal.jpg");
  for (let i = 0; i < stageMap.length; i++) {
    for (let j = 0; j < stageMap[i].length; j++) {
      pos.x = j - (stageMap[i].length - 1)/2;
      pos.z = i - (stageMap.length - 1)/2;
      switch ( stageMap[i][j] ) {
      case 0:
        break;
      case 1:
        pos.y = -0.5;
        createBox(pos, texture[0], normal[0], 30);
        break;
      case 2:
        pos.y = 0.5;
        createBox(pos, texture[1], normal[1], 30);
        pos.y = -0.5;
        createBox(pos, texture[0], normal[0], 30);
        break;
      case 3:
        pos.y = 0.5;
        createBox(pos, texture[2], normal[2], 30);
        pos.y = -0.5;
        createBox(pos, texture[0], normal[0], 30);
        break;
      }
    }
  }
  scene.add(stage);
}

// ボールの作成
function createBall() {
  const radius = 0.4;
  const quat = {x: 0, y: 0, z: 0, w: 1};
  const mass = 1.0;

  // ボール描画のための設定
  const ballDiffuseMap = textureLoader.load("textures/img_ball_diffuse.jpg");
  const ballNormalMap = textureLoader.load("textures/img_ball_normal.jpg");
  ball = new THREE.Mesh(
    new THREE.SphereBufferGeometry(radius, 32, 32),
    new THREE.MeshPhongMaterial({specular:0x808000})
  );
  ball.material.map = ballDiffuseMap;
  ball.normalMap = ballNormalMap;
  ball.position.copy(ballPosition);
  ball.castShadow = true;
  ball.receiveShadow = true;
  scene.add(ball);

  // ボールの物理演算のための設定
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(
    ball.position.x, ball.position.y, ball.position.z
  ));
  transform.setRotation(new Ammo.btQuaternion(
    quat.x, quat.y, quat.z, quat.w
  ));
  const motionState
   = new Ammo.btDefaultMotionState(transform);
  const colShape
   = new Ammo.btSphereShape(radius, 32, 32);
  const localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(0.2 * mass, localInertia);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass, motionState, colShape, localInertia);
  const body = new Ammo.btRigidBody(rbInfo);
  body.setActivationState( STATE.DISABLE_DEACTIVATION );
  physicsWorld.addRigidBody(body);

  // 描画設定と物理設定の関連付け
  ball.userData.physicsBody = body;
  rigidBodies.push(ball);
}

// 領域開放
function gameReset() {
  Ammo.destroy(ammoTmpPos);
  Ammo.destroy(ammoTmpQuat);
  Ammo.destroy(physicsWorld);
  Ammo.destroy(collisionConfiguration);
  Ammo.destroy(dispatcher);
  Ammo.destroy(overlappingPairCache);
  Ammo.destroy(solver);
}

// 物理空間の更新
function updatePhysics(deltaTime) {
  physicsWorld.stepSimulation(deltaTime, 10);
  // 物理演算の結果を描画に反映させる
  rigidBodies.forEach( (objThree) => {
    const objAmmo = objThree.userData.physicsBody;
    const ms = objAmmo.getMotionState();
    if ( ms ) {
      ms.getWorldTransform(tmpTrans);
      const pos = tmpTrans.getOrigin();
      const qua = tmpTrans.getRotation();
      objThree.position.set(pos.x(), pos.y(), pos.z());
      objThree.quaternion.set(qua.x(), qua.y(), qua.z(), qua.w());
    }
  })
  if (ball.position.y < -100) {
    gameReset();
  }
}

// ステージを傾ける処理
function tilt(delta) {
  const rotMult = delta * rollSpeed;
  tmpQuat.set(
    rotationVector.x * rotMult,
    rotationVector.y * rotMult,
    rotationVector.z * rotMult, 1
  ).normalize();
  stage.quaternion.multiply(tmpQuat);
  stage.rotation.setFromQuaternion(stage.quaternion);

  stage.children.forEach( (box) => {
    box.getWorldPosition(tmpPos);
    box.getWorldQuaternion(tmpQuat);
    const ms = box.userData.physicsBody.getMotionState();
    if ( ms ) {
      ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
      ammoTmpQuat.setValue(tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(ammoTmpPos);
      tmpTrans.setRotation(ammoTmpQuat);
      ms.setWorldTransform(tmpTrans);
    }
  })
}
// 回転ベクトルの設定
const moveState = { pitchUp: 0, pitchDown: 0, rollLeft: 0, rollRight: 0 };
const rotationVector = new THREE.Vector3(0, 0, 0);
function updateRotationVector() {
  rotationVector.x = ( - moveState.pitchUp + moveState.pitchDown );
  rotationVector.z = ( - moveState.rollLeft + moveState.rollRight );
}

// マウス入力処理
window.addEventListener("mousemove", (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = event.clientX / window.innerWidth;
  mouse.y = event.clientY / window.innerHeight;
  console.log(mouse.x);
  moveState.rollLeft = 0;
  moveState.rollRight = 0;
  moveState.pitchUp = 0;
  moveState.pitchDown = 0;
  if ( 0 < mouse.x && mouse.x < 0.21 ) {
    moveState.rollRight = 0.5;
  }
  else if ( 0.29 < mouse.x && mouse.x < 0.5 ) {
    moveState.rollLeft = 0.5;
  }
  if ( 0 < mouse.y && mouse.y < 0.46) {
    moveState.pitchUp = 0.5;
  }
  else if ( 0.54 < mouse.y && mouse.y < 1.0 ) {
    moveState.pitchDown = 0.5;
  }
  updateRotationVector();
});

// キー入力処理
window.addEventListener("keydown", (event) => {
  if ( event.altKey ) {
    return;
  }
  console.log(event.keyCode);
  switch ( event.keyCode ) {
    case 37: moveState.rollRight = 1; break;
    case 39: moveState.rollLeft = 1; break;
    case 38: moveState.pitchUp = 1; break;
    case 40: moveState.pitchDown = 1; break;
  }
  updateRotationVector();
});
window.addEventListener("keyup", (event) => {
  switch ( event.keyCode ) {
    case 37: moveState.rollRight = 0; break;
    case 39: moveState.rollLeft = 0; break;
    case 38: moveState.pitchUp = 0; break;
    case 40: moveState.pitchDown = 0; break;
  }
  updateRotationVector();
});

// カメラの更新
function updateCamera() {
  followCameraPosition.lerp(ball.position, 0.5);
  followCameraPosition.y = 5;
  camera.position.copy(followCameraPosition);
  camera.up.set(0, 1, -1);
  camera.lookAt(ball.position);
}

// フレームの描画
function renderFrame() {
  const delta = clock.getDelta();
  tilt(delta);
  updatePhysics(delta);
  updateCamera();
  renderer.render(scene, camera);
  renderer2.render(scene, camera2);
  requestAnimationFrame(renderFrame);
}

Ammo().then(start);

function start() {
  ammoTmpPos = new Ammo.btVector3();
  ammoTmpQuat = new Ammo.btQuaternion();
  tmpTrans = new Ammo.btTransform();
  setupPhysicsWorld();
  setupGraphics();
  createStage();
  createBall();
  renderFrame();
}
