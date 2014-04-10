(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 3000;
  camera.setLens(30);

  VIZ.render = function () {
    renderer.render(scene, camera);
  }

  VIZ.transform = function (layout) {
    var duration = 1000;

    TWEEN.removeAll();

    scene.children.forEach(function (object){
      var newPos = object.element.__data__[layout].position;
      var coords = new TWEEN.Tween(object.position)
            .to({x: newPos.x, y: newPos.y, z: newPos.z}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();

      var newRot = object.element.__data__[layout].rotation;
      var rotate = new TWEEN.Tween(object.rotation)
            .to({x: newRot.x, y: newRot.y, z: newRot.z}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();
    });
    
   var update = new TWEEN.Tween(this)
       .to({}, duration)
       .onUpdate(VIZ.render)
       .start();
  }

  VIZ.animate = function () {
    requestAnimationFrame(VIZ.animate);
    TWEEN.update();
    controls.update();
  }

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  document.getElementById('container').appendChild(renderer.domElement);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 100;
  controls.maxDistance = 6000;
  controls.addEventListener('change', VIZ.render);

  VIZ.onWindowResize = function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    VIZ.render();
  }
  window.VIZ = VIZ;
}())