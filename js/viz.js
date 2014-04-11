(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 3000;
  camera.setLens(30);

  VIZ.drawMap = function (data, yVar, rVar, cVar) {
    var leafletMap = L.mapbox.map(cVar, 'delimited.ho6391dg')
          .setView([33, 0], 2);

    var geoLayer = L.geoJson(data, {
            style: getStyle(yVar, rVar),
            onEachFeature: onEachFeature
          }).addTo(leafletMap);

    function colors (d) {
      return d >= 0.9 ? '#703f29' :
             d >= 0.8 ? '#955436' :
             d >= 0.7 ? '#b05e32' :
             d >= 0.6 ? '#d56c2a' :
             d >= 0.5 ? '#ea8435' :
             d >= 0.4 ? '#f89e5d' :
             d >= 0.3 ? '#fbb885' :
             d >= 0.2 ? '#fdd3b1' :
             d >= 0.1 ? '#fee6d3' :
             d  > 0.0 ? '#fff3ea' :
                        '#8b8682';
    }

    function getColor (data, year, relig) {
      var hex = '#000000';
      if (data === undefined) {
        return hex;
      } else {
        data.forEach(function (item, i) {
          if (item.name === year) {
            hex = colors(item.children[0][relig]);
          }
        });
        return hex;
      }
    }

    function getStyle(year, relig) {
      return function (feature) {
        var data = feature.properties.data;
        return {
          fillColor: getColor(data, year, relig),
          weight: 1,
          opacity: 1,
          color: 'grey',
          dashArray: '3',
          fillOpacity: .6
        };
      }
    }

    function onEachFeature(feature, layer) {
      layer.on({
          mouseover: highlightFeature,
          mouseout: mouseout
      });
    }

    function highlightFeature(e) {
      var layer = e.target;
      layer.setStyle({
          weight: 2,
          color: 'tomato',
          dashArray: '',
          fillOpacity: 0.5
      });
      if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
      }
    }

    function mouseout(e) {
      var layer = e.target;
      layer.setStyle({
          weight: 2,
          color: 'grey',
          dashArray: '3',
          fillOpacity: 0.6
      });
      if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
      }
    } 
  }



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
/*
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 100;
  controls.maxDistance = 6000;
  controls.addEventListener('change', VIZ.render);
*/
  VIZ.onWindowResize = function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    VIZ.render();
  }
  window.VIZ = VIZ;
}())