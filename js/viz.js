(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;

  VIZ.center = new THREE.Object3D();
  VIZ.center.position.x = 0;
  VIZ.center.position.y = 0;
  VIZ.center.position.z = 3700;

  VIZ.state = 'grid';
  VIZ.activeMap;

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 4500;
  camera.setLens(30);

 VIZ.drawMapBox = function (mapList, data) {
    // USED FOR SPHERE CALCS
    VIZ.count = mapList.length;

    var elements = d3.selectAll('.mapDiv')
      .data(mapList).enter()
      .append("div")
        .attr("class", "mapDiv")
        .attr("id", function (d) { return d.elem; })
        .each(function (d) {
          VIZ.drawMap(data, d.elem);
        })
        .on("click", function (d) {
          var curActive = VIZ.activeMap;
          var newActive = scene.getObjectByName(d.elem);
          newActive.newPos = VIZ.center;
          if (curActive) {
            if (curActive.name !== d.elem) {
              curActive.newPos = d[VIZ.state].position;
              VIZ.transformZoom(curActive, newActive);
              VIZ.activeMap = newActive;
            } else {
              delete newActive.newPos
              VIZ.transformZoom(newActive);
              VIZ.activeMap = null;
            }
          } else {
            VIZ.transformZoom(newActive);
            VIZ.activeMap = newActive;
          }
        });

    elements.each(setData);
    elements.each(addToScene);

    // MOVE ZOOM CONTROLS IN FRONT OF MAP
    d3.selectAll(".leaflet-top.leaflet-left")
      .style("transform", "translate3d(0px, 0px, 5px)")
      .style("-webkit-transform", "translate3d(0px, 0px, 5px)")
  }

  VIZ.drawMap = function (data, elemID) {

    var scale = d3.scale.quantile()
      .range(["#e4baa2","#d79873","#c97645","#bc5316","#8d3f11"]);

    var values = data.features.map(function (d) {
     return d.properties.data[elemID].inc;
    });

    scale.domain(d3.extent(values.filter(function (d) {
      return d >= 0;
    })));

    var map = L.mapbox.map(elemID)
      .setView([37.8, -96], 4);

    var tileLayer = L.mapbox.tileLayer('delimited.ho6391dg', {noWrap: true})
      .addTo(map);

    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();

    var geoLayer = L.geoJson(data, {
      style: getStyleFun(scale, elemID),
      onEachFeature: onEachFeature
    }).addTo(map);
    
    map.legendControl.addLegend(getLegendHTML());

    function getLegendHTML() {
      var grades = scale.quantiles();
      var labels = [], from, to;

      for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
          '<li><span class="swatch" style="background:' + 
          scale(from) + '"></span> ' +
          from + (to ? '&ndash;' + to : '+') + '</li>');
      }
      return '<span>People per square mile</span><ul>' + labels.join('') + '</ul>';
    }
  }

  function getStyleFun(scale, elemID) {
    return function (feature) {
      var data = feature.properties.data;
      return {
        fillColor: scale(data[elemID].inc),
        weight: 1,
        opacity: 1,
        color: 'grey',
        dashArray: '3',
        fillOpacity: 0.6
      };
    }
  }

  function addToScene(d) {
    var object = new THREE.CSS3DObject(this);
    object.position = d[VIZ.state].position;
    object.name = d.elem;
    scene.add(object);
  }

  function setData(d, i) {
    var vector, phi, theta;

    var sphere = new THREE.Object3D();
    phi = Math.acos( -1 + ( 2 * i ) / VIZ.count );
    theta = Math.sqrt( VIZ.count * Math.PI ) * phi;
    vector = new THREE.Vector3();
    sphere.position.x = 1200 * Math.cos( theta ) * Math.sin( phi );
    sphere.position.y = 1200 * Math.sin( theta ) * Math.sin( phi );
    sphere.position.z = 1200 * Math.cos( phi );
    vector.copy( sphere.position ).multiplyScalar( 2 );
    sphere.lookAt( vector );
    d['sphere'] = sphere;

    var grid = new THREE.Object3D();
    grid.position.x = (( i % 5 ) * 1050) - 2000;
    grid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
    grid.position.z = 0;
    d['grid'] = grid;

    d3.select(this).datum(d);
  }

  function getColor (data, elemID) {
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

  VIZ.render = function () {
    renderer.render(scene, camera);
  }

  VIZ.transformZoom = function () {
    var newPos, newRot, duration = 1000;
    var arr = Array.prototype.slice.call(arguments, 0);

    controls.reset();


    TWEEN.removeAll();

    arr.forEach(function (object){

      if (object.newPos) {
        newPos = object.newPos.position;
        newRot = object.newPos.rotation;
      } else {
        console.log("object", VIZ.state ,object, object.element.__data__);
        newPos = object.element.__data__[VIZ.state].position;
        newRot = object.element.__data__[VIZ.state].rotation;
      }

      var coords = new TWEEN.Tween(object.position)
            .to({x: newPos.x, y: newPos.y, z: newPos.z}, duration)
            .easing(TWEEN.Easing.Sinusoidal.InOut)
            .start();

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

  VIZ.transform = function (layout) {
    VIZ.state = layout;
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

  VIZ.resetControls = controls.reset;

  VIZ.onWindowResize = function () {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    VIZ.render();
  }
  window.VIZ = VIZ;
}())