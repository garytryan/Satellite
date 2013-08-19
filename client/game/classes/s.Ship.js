s.Ship = new Class({
	extend: s.GameObject,

	construct: function(options) {
		// handle parameters
		this.options = options = jQuery.extend({
			position: new THREE.Vector3(0, 0, 0),
			rotation: new THREE.Vector3(0, 0, 0)
		}, options);

		var geometry = s.models[options.shipClass].geometry;
		var materials = s.models[options.shipClass].materials;

		this.root = new Physijs.ConvexMesh(geometry, new THREE.MeshFaceMaterial(materials), 100);
		this.root.position.copy(options.position);
		this.root.rotation.copy(options.rotation);

        this.crosshair();
    },

    crosshair: function() {

        this.crosshair = new Physijs.SphereMesh(new THREE.SphereGeometry(10,20,20), new THREE.MeshNormalMaterial());
        this.root.add(this.crosshair);
        this.crosshair.position.set(0,0,-500);
        this.crosshair.__dirtyPosition = true;

    }
});
