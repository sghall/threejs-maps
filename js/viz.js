(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 5000;
  camera.setLens(30);

  VIZ.createMaps = function (list, data) {

    VIZ.count = data.length;

    var MAPS = d3.selectAll('.mapDiv')
      .data(list).enter()
      .append("div")
        .attr("class", "mapDiv")
        .attr("id", function (d) { return d.elem; })
        .each(function (d) {
          VIZ.drawMap(data, d.year, d.relg, d.elem);
        })
      //.append("div")
      //  .attr("class", "mapDiv back")
      //  .attr("transform", "rotateY(180deg)");
      
    MAPS.each(setData);
    MAPS.each(addToScene);

    // MOVE ZOOM CONTROLS IN FRONT OF MAP
    d3.selectAll(".leaflet-top.leaflet-left")
      .style("transform", "translate3d(0px, 0px, 5px)")
      .style("-webkit-transform", "translate3d(0px, 0px, 5px)")
  }

  VIZ.drawMap = function (data, year, relig, elemID) {

    var mainMap = L.map(elemID).setView([33, 0], 2);
    var tileLayer = L.mapbox.tileLayer('delimited.ho6391dg', {noWrap: true}).addTo(mainMap);

    // FIX LINES BETWEEN TILES IN SAFARI
    tileLayer.on('load', function () {
      d3.select('#' + elemID).selectAll(".leaflet-tile")
        .each(function (d) {
          var e = d3.select(this);
          var m = e.style("-webkit-transform");
          var r = /\(([^)]+)\)/;
          var a = m === 'none' ? []: r.exec(m)[1].split(",");
          if (a.length > 0) {
            e.style({
              "-webkit-transform": null,
              "left": +a[4] + "px",
              "top": +a[5] + "px"
            });
          }
        });
    });

    //mainMap.dragging.disable();
    mainMap.touchZoom.disable();
    mainMap.doubleClickZoom.disable();
    mainMap.scrollWheelZoom.disable();

    var geoLayer = L.geoJson(data, {
      style: getStyle(year, relig),
      onEachFeature: onEachFeature
    }).addTo(mainMap);
  }

  function addToScene(d) {
    var object = new THREE.CSS3DObject(this);
    object.position = d.random.position;
    scene.add(object);
  }

  function setData(d, i) {
    var vector, phi, theta;

    var random = new THREE.Object3D();
    random.position.x = Math.random() * 4000 - 2000;
    random.position.y = Math.random() * 4000 - 2000;
    random.position.z = Math.random() * 4000 - 2000;
    d['random'] = random;

    var sphere = new THREE.Object3D();
    phi = Math.acos( -1 + ( 2 * i ) / 10 );
    theta = Math.sqrt( 10 * Math.PI ) * phi;
    vector = new THREE.Vector3();
    sphere.position.x = 1000 * Math.cos( theta ) * Math.sin( phi );
    sphere.position.y = 1000 * Math.sin( theta ) * Math.sin( phi );
    sphere.position.z = 1000 * Math.cos( phi );
    vector.copy( sphere.position ).multiplyScalar( 2 );
    sphere.lookAt( vector );
    d['sphere'] = sphere;

    var helix = new THREE.Object3D();
    vector = new THREE.Vector3();
    phi = i * 0.250 + Math.PI;
    helix.position.x = 4000 * Math.sin(phi);
    helix.position.y = - i + 2000;
    helix.position.z = 4000 * Math.cos(phi);
    vector.x = helix.position.x * 2;
    vector.y = helix.position.y;
    vector.z = helix.position.z * 2;
    helix.lookAt(vector);
    d['helix'] = helix;

    var grid = new THREE.Object3D();
    grid.position.x = (( i % 5 ) * 1050) - 2000;
    grid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
    grid.position.z = 0;
    d['grid'] = grid;

    d3.select(this).datum(d);
  }

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
        fillOpacity: 0.6
      };
    }
  }

  function onEachFeature(feature, layer) {
    layer.on({
        mouseover: mouseover,
        mouseout: mouseout
    });
  }

  function mouseover(e) {
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
        weight: 1,
        opacity: 1,
        color: 'grey',
        dashArray: '3',
        fillOpacity: 0.6
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
  }

  d3.select("#menu").selectAll('button')
    .data(['sphere', 'helix', 'grid']).enter()
      .append('button')
      .html(function (d) { return d; })
      .on('click', function (d) { VIZ.transform(d); })

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