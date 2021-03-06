Ptero.setScene = function(scene) {
	Ptero.prevScene = Ptero.scene;
	if (Ptero.scene && Ptero.scene.cleanup) {
		Ptero.scene.cleanup();
	}
	Ptero.scene = scene;
	scene.init();
};

Ptero.executive = (function(){

	var lastTime;
	var minFps = 20;

    var fps;
	var updateFps = (function(){
        var length = 60;
        var times = [];
        var startIndex = 0;
        var endIndex = -1;
        var filled = false;

        return function updateFps(now) {
            if (filled) {
                startIndex = (startIndex+1) % length;
            }
            endIndex = (endIndex+1) % length;
            if (endIndex == length-1) {
                filled = true;
            }

            times[endIndex] = now;

            var seconds = (now - times[startIndex]) / 1000;
            var frames = endIndex - startIndex;
            if (frames < 0) {
                frames += length;
            }
            fps = frames / seconds;
        };
    })();
	var showFps = false;
	function drawFps(ctx) {
		if (!showFps) {
			return;
		}
		if (Ptero.scene == Ptero.scene_fact) {
			return;
		}
		ctx.font = "30px Arial";
		ctx.fillStyle = "#FFF";
		ctx.textBaseline = "bottom";
		ctx.textAlign = "left";
		var pad = 5;
		var x = pad;
		var y = Ptero.screen.getWindowHeight() - pad;
		ctx.fillText(Math.floor(fps)+" fps", x, y);
	};

	function tick(time) {
		try {
			updateFps(time);

			var dt = (lastTime == undefined) ? 0 : Math.min((time-lastTime)/1000, 1/minFps);
			lastTime = time;
			var scene = Ptero.scene;

			if (!freeze) {
				Ptero.screen.update(dt);
				Ptero.audio.update(dt);

				Ptero.deferredSprites.clear();
				if (Ptero.background) {
					Ptero.background.update(dt);
				}
				scene.update(isPaused ? 0 : dt*speedScale); // this condition could wrap this whole block if we want proper pausing
				Ptero.deferredSprites.finalize();
			}

			var ctx = Ptero.screen.getCtx();
			ctx.save();
			Ptero.screen.transformToWindow();
			scene.draw(ctx);
			drawFps(ctx);
			requestAnimationFrame(tick);
			ctx.restore();
		}
		catch (e) {
			console.error(e.message + "@" + e.sourceURL);
			console.error(e.stack);
		}
	};

	var isPaused = false;
	function pause() {
		isPaused = true;
	};
	function resume() {
		isPaused = false;
	};

	var freeze = false;
	function start() {
		window.addEventListener('keydown', function(e) {
			if (e.keyCode == 48) {
				freeze = !freeze;
			}
		});
		requestAnimationFrame(tick);
	};

	var speedScale = 1.0;
	function slowmo() {
		speedScale = 0.25;
	};
	function regmo() {
		speedScale = 1.0;
	};

	return {
		start: start,
		pause: pause,
		isPaused: function() { return isPaused; },
		toggleFps: function() {
			showFps = !showFps;
		},
		togglePause: function() {
			if (isPaused) {
				resume();
			}
			else {
				pause();
			}
		},
		slowmo: slowmo,
		regmo: regmo,
		resume: resume,
	};
})();
