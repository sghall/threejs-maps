(function(){
  var VIZ ={};
  var camera, renderer, controls, scene = new THREE.Scene();
  var width = window.innerWidth, height = window.innerHeight;
  var svgWidth = 800, svgHeight = 400;

  VIZ.state = 'grid', VIZ.activeMap;

  camera = new THREE.PerspectiveCamera(40, width/height , 1, 10000);
  camera.position.z = 4500;
  camera.setLens(30);

 VIZ.drawD3Maps = function (mapList, data) {
    VIZ.count = mapList.length;

    var elements = d3.selectAll('.map-div')
      .data(mapList).enter()
      .append("div")
        .attr("class", "map-div")
        .each(function (d) {

          d3.select(this).append("div")
            .attr("class", "map-title")
            .html(function (d) { 
              var text = " - 2010 Incidence Rates by State"
              return d.title + text; 
            });

          d3.select(this).append("div")
            .attr("class", "map-caption")
            .html("2010 CDC Cancer Data");

          d3.select(this).append("div")
            .attr("class", function (d) { return d.elem + " map-rollover"; });

          d3.select(this).append("svg")
            .attr("class", "map-svg")
            .attr("width", svgWidth + "px")
            .attr("height", svgHeight + "px")
            .attr("id", function (d) { return d.elem; });

          VIZ.drawD3Map(data, d.elem);
        })

    elements.each(setData);
    elements.each(addToScene);
  }

  VIZ.drawD3Map = function (data, elemID) {
    var projection = d3.geo.albersUsa()
        .scale(800)
        .translate([svgWidth / 2, svgHeight / 2]);

    var path = d3.geo.path().projection(projection);
    var format = d3.format(".1f");

    var scale = d3.scale.quantile()
      .range(["#e4baa2","#d79873","#c97645","#bc5316","#8d3f11"]);

    var values = data.features.map(function (d) {
     return d.properties.data[elemID].inc;
    });

    scale.domain(d3.extent(values.filter(function (d) {
      return d >= 0;
    })));

    d3.select("#" + elemID).selectAll("path")
      .data(data.features)
     .enter().append("svg:path")
       .attr("d", path)
       .style("fill", function (d) { 
        return scale(d.properties.data[elemID].inc)
       })
       .on("mouseover", function (d) {
        d3.event.preventDefault();
        var state = d.properties.name;
        var irate = d.properties.data[elemID].inc;
        var selector = "." + elemID + ".map-rollover";
        d3.select(selector)
          .html(state + " - " + (irate < 0 ? "No Data": format(irate)));
       })
       .on("mouseout", function (d) {
          d3.event.preventDefault();
          var selector = "." + elemID + ".map-rollover";
          d3.select(selector).html("");
        });
  }

  var addToScene = function (d) {
    var object = new THREE.CSS3DObject(this);
    object.position = d.random.position;
    object.name = d.elem;
    scene.add(object);
  }

  var setData = function (d, i) {
    var vector, phi, theta;
    var random, sphere, grid;

    random = new THREE.Object3D();
    random.position.x = Math.random() * 4000 - 2000;
    random.position.y = Math.random() * 4000 - 2000;
    random.position.z = Math.random() * 4000 - 2000;
    d['random'] = random;

    sphere = new THREE.Object3D();
    phi = Math.acos( -1 + ( 2 * i ) / VIZ.count );
    theta = Math.sqrt( VIZ.count * Math.PI ) * phi;
    vector = new THREE.Vector3();
    sphere.position.x = 1200 * Math.cos( theta ) * Math.sin( phi );
    sphere.position.y = 1200 * Math.sin( theta ) * Math.sin( phi );
    sphere.position.z = 1200 * Math.cos( phi );
    vector.copy( sphere.position ).multiplyScalar( 2 );
    sphere.lookAt( vector );
    d['sphere'] = sphere;

    grid = new THREE.Object3D();
    grid.position.x = (( i % 5 ) * 1050) - 2000;
    grid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 650 ) + 800;
    grid.position.z = 0;
    d['grid'] = grid;
  }

  VIZ.render = function () {
    renderer.render(scene, camera);
  }

  VIZ.transform = function () {
    var arr, duration = 1000;
    if (arguments.length > 0) {
      arr = Array.prototype.slice.call(arguments, 0);
      controls.reset();
    }else {
      arr = scene.children;
    }

    TWEEN.removeAll();

    arr.forEach(function (object){
      var newPos, newRot, coords, rotate, update;

      if (object.newPos) {
        newPos = object.newPos.position;
        newRot = object.newPos.rotation;
      } else {
        newPos = object.element.__data__[VIZ.state].position;
        newRot = object.element.__data__[VIZ.state].rotation;
      }

      coords = new TWEEN.Tween(object.position)
        .to({x: newPos.x, y: newPos.y, z: newPos.z}, duration)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();

      rotate = new TWEEN.Tween(object.rotation)
        .to({x: newRot.x, y: newRot.y, z: newRot.z}, duration)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();
    });
    
   update = new TWEEN.Tween(this)
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