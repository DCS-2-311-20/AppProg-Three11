//
// 応用プログラミング 課題12 (three1001.js)
// $Id$
//
"use strict"; // 厳格モード

// ３Ｄページ作成関数の定義
function init() {
  // レンダラの設定
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x4080a0);
    document.getElementById("WebGL-output").appendChild(renderer.domElement);
  }

  // シーン作成
  const scene = new THREE.Scene();

  // カメラの作成
  const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth/window.innerHeight, 0.1, 2000);
  {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.position.set(200,200,500);
  }

  // OrbitControls の導入
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0,100,200);
  controls.update();

  // 光源の設定
  { // 環境ライト
    const light = new THREE.AmbientLight();
//    light.intensity = 0.5;
    light.position.set(0, 0, 0);
    scene.add(light);
  }
  { // ポイントライト
    const light = new THREE.PointLight();
    light.position.set(0, 200, 1000);
    scene.add(light);
  }


  // モデルの読み込み
  const qt1 = new THREE.Quaternion();
  qt1.setFromAxisAngle(new THREE.Vector3(1,0,-1).normalize(), -Math.PI/2);
  const qt2 = new THREE.Quaternion();
  qt2.setFromAxisAngle(new THREE.Vector3(0,1,0).normalize(), Math.PI);
  const qt3 = new THREE.Quaternion();
  qt3.setFromAxisAngle(new THREE.Vector3(0,0,1).normalize(), Math.PI);

  let mixer;
  const fbxLoader = new THREE.FBXLoader();
  fbxLoader.load(
    "../models/patoap.fbx",
    (fbx) => {
      console.log(fbx);
      mixer = new THREE.AnimationMixer(fbx);
      const action = mixer.clipAction(fbx.animations[1]);
      action.play();
      scene.add(fbx);
    },
    (progress) => console.log("Loading model...", 100.0 * (progress.loaded/progress.total), "%"),
    (error) => console.error(error)
  );

  // グリッッドの表示
  const gridHelper = new THREE.GridHelper(1000, 20);
  scene.add(gridHelper);
  // 座標軸の表示
  const axisHelper = new THREE.AxesHelper(500);
  scene.add(axisHelper);

  // Window サイズの変更に対応
  window.addEventListener("resize",
  ()=> {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },false );

  // 描画ループ
  const clock = new THREE.Clock();
  function update() {
    const delta = clock.getDelta();
    controls.update();
    if (mixer) {
      mixer.update(delta);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

document.onload = init();
