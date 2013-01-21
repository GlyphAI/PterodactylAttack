
Ptero.scene_game = (function() {
	var enemies = [];
	var numEnemies = 20;

	function sortEnemies() {
		enemies.sort(function(a,b) {
			return b.path.state.pos.z - a.path.state.pos.z;
		});
	};

	function init() {

		Ptero.background.setImage(Ptero.assets.images.desert);

		var i;
		for (i=0; i<numEnemies; i++) {
			enemies.push(new Ptero.Enemy);
		}

		Ptero.orb.init();
		Ptero.orb.setTargets(enemies);
        Ptero.orb.setNextOrigin(0,-1);
	};

	function update(dt) {
		var i;
		for (i=0; i<numEnemies; i++) {
			enemies[i].update(dt);
		}
		sortEnemies();
		Ptero.orb.update(dt);
	};

	function draw(ctx) {
		Ptero.background.draw(ctx);
		var i;
		for (i=0; i<numEnemies; i++) {
			enemies[i].draw(ctx);
		}
		Ptero.orb.draw(ctx);
		var point;
		if (Ptero.input.isTouched()) {
			point = Ptero.input.getPoint();
			ctx.fillStyle = "rgba(255,255,255,0.2)";
			ctx.beginPath();
			ctx.arc(point.x, point.y, 30, 0, 2*Math.PI);
			ctx.fill();
		}
	};

	return {
		init: init,
		update: update,
		draw: draw,
	};
})();
