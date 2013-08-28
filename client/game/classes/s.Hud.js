s.HUD = new Class({
	toString: "HUD",

	construct: function(options){

        // DELETE ME!!! //////////////////////////
        this.dummyData = [];
        // DELETE THAT! //////////////////////////

		this.game = options.game;
		this.controls = options.controls;


		this.canvas = document.createElement('canvas');

		this.canvas.height = window.innerHeight;
		this.canvas.width = window.innerWidth;

		this.canvas.style.position = 'absolute';
		this.canvas.style.top = '0';
		this.canvas.style.left = '0';

		this.ctx = this.canvas.getContext('2d');

		this.crosshairs = new Image();
		this.crosshairs.src = 'game/textures/crosshairs.png';

		this.subreticle = new Image();
		this.subreticle.src = 'game/textures/Subreticle.png';

		this.targetX = 0;
		this.targetY = 0;

		this.subreticleBound = {};

		this.update = this.update.bind(this);
		this.game.hook(this.update);
		document.body.appendChild(this.canvas);

	},
	update: function(){

        ///////////////////////
        // RADIAL SUBRETICLE //
        ///////////////////////

        var velocity = this.controls.options.thrustImpulse/10,
            height = window.innerHeight,
            width = window.innerWidth,
            centerX = width/ 2,
            centerY = height/2;

        this.canvas.height = height;
        this.canvas.width = width;
        this.ctx.clearRect(0, 0, height, width);

        // Vector for cursor location centered around the center of the screen
        this.cursorVector = new THREE.Vector2(this.targetX - centerX, this.targetY - centerY);

		var borderWidth = width/8;

		var borderHeight = height/8;

		this.ctx.fillStyle = '#5DFC0A';
		this.ctx.font = '20px Futura';
		this.ctx.fillRect(100, 50, velocity, 10);
        this.ctx.fillRect(100,50,200,1);
        this.ctx.fillText("THROTTLE",100,40);
        this.ctx.font = '10px Futura';
        this.ctx.fillText("SET",95 + velocity,75);

        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = '20px Futura';
        this.ctx.fillRect(100, 170, (this.game.player.hull/s.config.ship.hull) * 200, 10);
        this.ctx.fillRect(100,170,200,1);
        this.ctx.fillText("HULL",100,160);


        this.ctx.fillStyle = '#00FFFF';

        this.ctx.font= '20px Futura';
        this.ctx.fillRect(100, 110, (this.game.player.shields/s.config.ship.shields) * 200, 10);
        this.ctx.fillRect(100,110,200,1);
        this.ctx.fillText("SHIELDS",100,100);

        this.subreticleBound.radius = width/8;
        this.ctx.beginPath();
        this.ctx.arc( centerX, centerY, this.subreticleBound.radius, 0, 2*Math.PI, false);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#5DFC0A';
        this.ctx.stroke();


        if (this.cursorVector.length() > this.subreticleBound.radius) {
            this.cursorVector.normalize().multiplyScalar(this.subreticleBound.radius);
            this.targetX = this.cursorVector.x+centerX;
            this.targetY = this.cursorVector.y+centerY;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = '#5DFC0A';
        this.ctx.arc(this.targetX, this.targetY, 5, 0, 2 * Math.PI, false);

        this.ctx.fill();


		this.ctx.drawImage(this.crosshairs,centerX - this.crosshairs.width/2,centerY - this.crosshairs.height/2);




        //////////////////////////////
        ///  ENEMY-LOCK INDICATOR  ///
        //////////////////////////////

        /**
         Get 2D coordinates from a Vector3

         @param {THREE.Vector3} objVector  Vector representing the object position
         @param {Number} width  Width of canvas
         @param {Number} height  Height of canvas
         */
        // TODO: Fix the z-axis messing up the result

        this.lockedOn = true;
        if ( this.lockedOn ){

            this.target = s.game.enemies.list()[1] || s.game.moon;
            this.target = this.target.root;
            var vector3D = this.target.position.clone();
            var vector2D = s.projector.projectVector(vector3D, s.game.camera);

            // Targeting box
            if ( Math.abs(vector2D.x) <= 0.95 && Math.abs(vector2D.y) <= 0.95 && vector2D.z < 1 ){
                v2D = vector2D.clone();
                v2D.x =  ( width  + v2D.x*width  )/2;
                v2D.y = -(-height + v2D.y*height )/2;

                var size = 50;

                this.ctx.strokeRect( v2D.x-size, v2D.y-size, size*2, size*2 );
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#5DFC0A';

            // Radial direction marker
            } else {

                var v2D = new THREE.Vector2(vector2D.x, vector2D.y);
                v2D.multiplyScalar(1/v2D.length()).multiplyScalar(this.subreticleBound.radius+12);

                this.ctx.beginPath();
                if (vector2D.z > 1)
                    this.ctx.arc( -v2D.x+centerX, (-v2D.y+centerY), 10, 0, 2*Math.PI, false);
                else
                    this.ctx.arc( v2D.x+centerX, -(v2D.y-centerY), 10, 0, 2*Math.PI, false);

                this.ctx.fillStyle = "black";
                this.ctx.fill();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#5DFC0A';
                this.ctx.stroke();

            }


            /////////////////////////////////
            // PREDICTIVE TARGETING SYSTEM //
            /////////////////////////////////

         // t = ( (a ev cos[beta]) + sqrt[(a ev cos[beta])^2 + (bv^2-ev^2)(a^2)] )  / (bv^2 - ev^2)

            // PARAMETERS
            // a    = distance between self and target
            // eV   = magnitude of enemy's current velocity vector
            // bV   = magnitude of bullet's velocity vector
            // beta = angle between a and eV, via dot product
            // angD = angular differential; scales down with increased beta
            // velD = velocity
            // top  = upper quotient for quadratic solution
            // bot  = lower quotient for quadratic solution
            // t    = time at which player bullet and enemy ship will simultaneously reach a given location
            if ( s.game.enemies.list()[1] && this.target == s.game.enemies.list()[1].root && Math.abs(vector2D.x) <= 0.95 && Math.abs(vector2D.y) <= 0.95 ){

                var enemyV3D = this.target.position.clone();
                if (enemyV3D){

                    var aV = enemyV3D.add( s.game.player.root.position.clone().multiplyScalar(-1) );
                    var a  = aV.length();
                    var eV = this.target.getLinearVelocity();
                    var e  = eV.length();
                    var pV = s.game.player.root.getLinearVelocity();
                    var b = 5000+pV.length();

                    //if (Math.abs(beta) > Math.PI/2)
                    //    debugger;

                    if (eV && b && aV){

                        //var beta = Math.acos(aV.dot(eV)/(a*e));
                        //var angD1 = a*e*Math.cos(beta);

                        var angD = aV.dot(eV);
                        var velD = (b*b - e*e);
                        var t = angD/velD + Math.sqrt( angD*angD + velD*a*a )/velD;

                        if (t < 4){

                            var enemyV2D = s.projector.projectVector(this.target.position.clone().add(eV.multiplyScalar(t)), s.game.camera);
                            enemyV2D.x =  ( width  + enemyV2D.x*width  )/2;
                            enemyV2D.y = -(-height + enemyV2D.y*height )/2;
                            this.ctx.beginPath();
                            this.ctx.arc(enemyV2D.x, enemyV2D.y, 10, 0, 2*Math.PI, false);
                            this.ctx.fillStyle = "black";
                            this.ctx.fill();
                            this.ctx.lineWidth = 5;
                            this.ctx.strokeStyle = '#5DFC0A';
                            this.ctx.stroke();
                        }
                    }
                }
            }

        } else {

        }

	}

});
