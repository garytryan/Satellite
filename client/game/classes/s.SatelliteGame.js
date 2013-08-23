s.SatelliteGame = new Class( {
    toString: 'SatelliteGame',
    extend: s.Game,

	// Models that should be loaded
	models: [
		'phobos_hifi',
		'phobos_lofi',
        'human_ship_heavy',
		'human_ship_light',

	],

	initialize: function() {
		var that = this;

		// No gravity
		this.scene.setGravity(new THREE.Vector3(0, 0, 0));

        // Ambient light
        this.ambientLight = new THREE.AmbientLight( 0x382828 );
        this.scene.add( this.ambientLight );

        // Directional light
        this.light = new THREE.DirectionalLight( 0xEEEEEE, 2 );
        this.light.position.set( -100000, 0, 0 );
        this.scene.add( this.light );

        // Add moon
        this.moon = new s.Moon( {
            game: this
        } );

        // Add a ship
        this.player = new s.Player( {
            game: this,
            shipClass: 'human_ship_light',
            position: new THREE.Vector3( 10000, 2000, 10000 ),
            rotation: new THREE.Vector3( 0, Math.PI / 4, 0 )
        } );

        // Root camera to the player's position
        this.player.root.add( this.camera );

        //// Setup camera: Cockpit view; COMMENT OUT FOR CHASE CAM
        this.camera.position.set( 0, 0, 23 );
        //// Setup camera: Chase view
        //this.camera.position.set(0,35,350);

        // Planet camera
        // this.scene.add(this.camera);
        // this.camera.position.set(10000,2000,10000);

        // Add skybox
        this.addSkybox( );

        // lazd: Dust is kinda lame. But I want some sort of thing that shows you're moving
        this.addDust( );

        this.HUD = new s.HUD( {
            game: this
        } );

        // Fly controls
        this.controls = new s.Controls( {
            game: this,
            player: this.player,
            camera: this.camera,
            HUD: this.HUD
        } );

        // Dependent on controls; needs to be below s.Controls
        this.radar = new s.Radar( {
            game: this
            //controls: this.controls
        } );

        window.addEventListener( 'mousemove', function ( e ) {
            that.HUD.targetX = e.pageX;
            that.HUD.targetY = e.pageY;
        } );
        window.addEventListener( 'mousedown', function ( ) {
            that.controls.firing = true;
        } );
        window.addEventListener( 'mouseup', function ( ) {
            that.controls.firing = false;
        } );
        /******************
        Enemy setup
        ******************/
        this.enemies = {
            _list: [ ],
            _map: {}, // new WeakMap()
            get: function ( nameOrId ) {
                if ( typeof nameOrId == 'string' ) {
                    return this._map[ nameOrId ]; // return enemies._map.get(nameOrId);
                } else if ( typeof nameOrId == 'number' ) {
                    return this._list( nameOrId );
                }
            },
            has: function ( nameOrId ) {
                return !!this.get( nameOrId );
            },
            execute: function ( nameOrId, operation, args ) {
                var enemy = this.get( nameOrId );
                if ( enemy ) {
                    enemy[ operation ].apply( enemy, args );
                    return true;
                }
                return false;
            },
            forEach: function ( callback ) {
                this._list.forEach( callback );
            },
            list: function ( ) {
                return this._list;
            },
            delete: function ( nameOrId ) {
                var enemy = this.get( nameOrId );
                if ( enemy ) {
                    // Remove from map
                    delete this._map[ enemy.name ]; // this._map.delete(enemy.name);

                    // Remove from array
                    var enemyIndex = this._list.indexOf( enemy );
                    if ( ~enemyIndex )
                        this._list.splice( enemyIndex, 1 );

                    // destroy
                    enemy.destruct( );

                    return true;
                }
                return false;
            },
            add: function ( enemyInfo ) {
                if ( this.has( enemyInfo.name ) ) {
                    this.delete( enemyInfo.name );
                    console.error( 'Bug: Player %s added twice', enemyInfo.name );
                } else {
                    if ( enemyInfo.name === null ) {
                        console.error( 'Bug: enemyInfo contained null player name' );
                        console.log( enemyInfo );
                        console.trace(  );
                    }
                    console.log( '%s has joined the fray', enemyInfo.name );
                }

                // TODO: include velocities?
                var enemyShip = new s.Ship( {
                    game: that,
                    shipClass: 'human_ship_light',
                    name: enemyInfo.name,
                    position: new THREE.Vector3( enemyInfo.pos[ 0 ], enemyInfo.pos[ 1 ], enemyInfo.pos[ 2 ] ),
                    rotation: new THREE.Vector3( enemyInfo.rot[ 0 ], enemyInfo.rot[ 1 ], enemyInfo.rot[ 2 ] ),
                } );

                this._list.push( enemyShip );
                console.log(this._list);
                this._map[ enemyInfo.name ] = enemyShip; // this._map.set(enemyInfo.name, otherShip);
            }
        };
        this.pilot = {};
        this.pilot.name = navigator.platform + ' ' + ~~( new Date( ).getTime( ) / 100 % 1000 ) + Math.floor( Math.random( ) * 100 );

        this.comm = new s.Comm( {
            game: that,
            pilot: that.pilot,
            player: this.player,
            server: window.location.hostname + ':1337'
        } );

        this.comm.on( 'player list', that.handlePlayerList );
        this.comm.on( 'join', that.handleJoin );
        this.comm.on( 'leave', that.handleLeave );
        this.comm.on( 'move', that.handleMove );

        this.HUD.controls = this.controls;

        this.comm.connected( );

        this.start();
    },

    render: function ( _super, time ) {
        _super.call( this, time );
        this.controls.update( );
    },

    addSkybox: function ( ) {
        var urlPrefix = "game/textures/skybox/Purple_Nebula_";
        var urls = [
            urlPrefix + "right1.png", urlPrefix + "left2.png",
            urlPrefix + "top3.png", urlPrefix + "bottom4.png",
            urlPrefix + "front5.png", urlPrefix + "back6.png"
        ];

        var textureCube = THREE.ImageUtils.loadTextureCube( urls );
        textureCube.format = THREE.RGBFormat;
        var shader = THREE.ShaderLib.cube;

        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
        uniforms.tCube.value = textureCube;

        var material = new THREE.ShaderMaterial( {
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: uniforms,
            side: THREE.BackSide
        } );

        this.skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 200000, 200000, 200000, 1, 1, 1, null, true ), material );
        this.scene.add( this.skyboxMesh );
    },

    addDust: function ( ) {
        var starSprite = THREE.ImageUtils.loadTexture( 'game/textures/particle.png' );
        var geometry = new THREE.Geometry( );

        // Set to false for "dust", true for stars
        var outer = true;

        // Spec size
        var radius = 100000;
        var size = 100;
        var count = 1000;

        for ( var i = 0; i < count; i++ ) {

            var vertex = new THREE.Vector3( );

            if ( outer ) {
                // Distribute "stars" on the outer bounds of far space
                vertex.x = Math.random( ) * 2 - 1;
                vertex.y = Math.random( ) * 2 - 1;
                vertex.z = Math.random( ) * 2 - 1;
                vertex.multiplyScalar( radius );
            } else {
                // Distribute "dust" throughout near space
                vertex.x = Math.random( ) * radius - radius / 2;
                vertex.y = Math.random( ) * radius - radius / 2;
                vertex.z = Math.random( ) * radius - radius / 2;
            }

            geometry.vertices.push( vertex );

        }

        var material = new THREE.ParticleBasicMaterial( {
            size: size,
            map: starSprite,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            transparent: true
        } );

        var particles = new THREE.ParticleSystem( geometry, material );

        this.scene.add( particles );
    },

    handleJoin: function ( message ) {
        s.game.enemies.add( message );
    },
    handleLeave: function ( message ) {
        if ( s.game.enemies.delete( message.name ) ) {
            console.log( '%s has left', message.name );
        }
    },
    handleMove: function ( message ) {
        if ( message.name == s.game.player.name ) {
            // server told us to move
            console.log( 'Server reset position' );

            // Return to center
            s.game.player.setPosition( message.pos, message.rot, message.tRot, message.aVeloc, message.lVeloc, false ); // Never interpolate our own movement
        } else {
            // Enemy moved
            if ( !s.game.enemies.execute( message.name, 'setPosition', [ message.pos, message.rot, message.tRot, message.aVeloc, message.lVeloc, message.interp ] ) ) {
                s.game.enemies.add( message );
            }
        }
    },
    handlePlayerList: function ( message ) {
        for ( var otherPlayerName in message ) {
            // don't add self
            if ( otherPlayerName == s.game.player.name ) continue;

            var otherPlayer = message[ otherPlayerName ];
            s.game.enemies.add( otherPlayer );
        }
    }

} );
