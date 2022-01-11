//
// 応用プログラミング 課題12 (three1101.js)  G084002020 拓殖太郎
//
"use strict"; // 厳格モード

let scene;
let camera;
let renderer;
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
const cameraPosition = new THREE.Vector3(0, 6, 30);

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
    window.innerWidth / window.innerHeight, 0.3, 1000);

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
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("WebGL-output").appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
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
}

function createStage() {
  /*
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
  */
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
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      pos.x = j - 6;
      pos.z = i - 6;
      pos.y = -0.5;
      createBox(pos, texture[0], normal[0], 30);
    }
  }
  scene.add(stage);
}

// ボールの作成
function createBall() {
  const radius = 0.4;
  const quat = {x: 0, y: 0, z: 0, w: 1};
  const mass = 0.3;

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

  if (ball.position.y < -100) {
    gameReset();
  }
}

// ステージを傾ける処理
function tilt(delta) {
}

// 回転ベクトルの設定
const moveState = { pitchUp: 0, pitchDown: 0, rollLeft: 0, rollRight: 0 };
const rotationVector = new THREE.Vector3(0, 0, 0);
function updateRotationVector() {
  rotationVector.x = ( - moveState.pitchUp + moveState.pitchDown );
  rotationVector.z = ( - moveState.rollLeft + moveState.rollRight );
}

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
}

// フレームの描画
function renderFrame() {
  const delta = clock.getDelta();
  tilt(delta); // ステージの傾き
  updatePhysics(delta); // 物理演算
  updateCamera(); // カメラの移動
  renderer.render(scene, camera); // 描画
  renderer2.render(scene, camera2); // 第二画面の描画
  requestAnimationFrame(renderFrame); // 次フレームの描画予約
}

// 物理エンジンの初期化
Ammo().then(start);

// 処理の開始
function start() {
  ammoTmpPos = new Ammo.btVector3();
  ammoTmpQuat = new Ammo.btQuaternion();
  tmpTrans = new Ammo.btTransform();
  setupPhysicsWorld(); // 物理空間の設定
  setupGraphics(); // 描画空間の設定
  //createStage(); // ステージの作成
  createBall(); // ボールの作成
  renderFrame(); // フレーム描画の開始
}
