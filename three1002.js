//
// 応用プログラミング 課題12 (three1002.js)
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
    camera.position.set(1, 1.7, 2.5);
  }
  // カメラ目線の目標

  // OrbitControls の導入
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0,1,0);
  controls.update();

  // 光源の設定
  {
    const light = new THREE.AmbientLight();
    light.intensity = 0.3;
    light.position.set(0, 0, 0);
    scene.add(light);
  }
  {
    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 20, 10 );
    scene.add( light );
  }

  // 平面の設定

  // 姿勢制御のためのQuaternion

  // モデルの読み込み
  let model;
  let mixer;
  const fbxLoader = new THREE.FBXLoader();
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load(
    "../models/three-vrm-girl.vrm", // モデルのファイル
    (gltf) => {
      THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);
      THREE.VRM.from(gltf).then((vrm) => {
        console.log(vrm);

        model = vrm;
        scene.add(vrm.scene);
        fbxLoader.load("../models/fw.fbx", // 動きのファイル
        (fbx) => {
          console.log(fbx);
          mixer = new THREE.AnimationMixer(vrm.scene);
          let v;
          // 体の位置
          // 腰の角度
          // 背骨から頭の角度
          // 左の腕の角度
          // 右の腕の角度
          // 左の脚の角度

          // 右の脚の角度

          // アニメーションクリップの設定
          const clip = new THREE.AnimationClip("test", -1, [
          ]);
          const action = mixer.clipAction(clip);
          action.play();
        });});},
    (progress) => console.log("Loading model...", 100.0 * (progress.loaded/progress.total), "%"),
    (error) => console.error(error)
  );

  // グリッッドの表示
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);
  //gridHelper.visible = false;
  // 座標軸の表示
  const axisHelper = new THREE.AxesHelper(5);
  scene.add(axisHelper);
  //axisHelper.visible = false;

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
      // アニメーションの処理
      mixer.update(delta);
      // まばたきの処理

      // モデルの更新
      model.update(delta);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

document.onload = init();
