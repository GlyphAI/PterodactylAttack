
Ptero.Ptalaga = Ptero.Ptalaga || {};

window.onload = function() {

	// Create the canvas element.
	var canvas = document.getElementById('canvas');

	console.log("initing screen");
	Ptero.Ptalaga.screen.init(canvas);

	console.log('starting loading scene');
	Ptero.setScene(Ptero.scene_loading);
	Ptero.Ptalaga.executive.start();

	Ptero.assets.load(function() {
		console.log('creating backgrounds');
		Ptero.createBackgrounds();

		console.log('populating enemy type menu');

		(function() {
			var enemyType;
			var str="";
			for (enemyType in Ptero.enemyTypes) {
				str += "<li><a onclick=\"Ptero.Ptalaga.enemy_model.setType('" + enemyType + "')\" href=\"#\">" + enemyType + "</a></li>";
			}
			$('#enemyTypeMenu').html(str);
		})();

		(function() {
			var bgType;
			var str="";
			for (bgType in Ptero.backgrounds) {
				str += "<li><a onclick=\"Ptero.setBackground('" + bgType + "')\" href=\"#\">" + bgType + "</a></li>";
			}
			$('#bgTypeMenu').html(str);
		})();


		console.log("initing input");
		Ptero.input.init();
		console.log("initing enemy model");
		Ptero.Ptalaga.enemy_model_list = new Ptero.Ptalaga.EnemyModelList();

		$(document).keydown(function(e){
			if (e.which == 90 && e.ctrlKey) {
				Ptero.Ptalaga.enemy_model_list.undo();
			}
			else if (e.which == 89 && e.ctrlKey) {
				Ptero.Ptalaga.enemy_model_list.redo();
			}
		});

		var ignoreState = false;
		if (!ignoreState && Ptero.Ptalaga.loader.restore()) {
			console.log("restored previous state");
		}
		else {
			console.log("creating new blank state");
			Ptero.Ptalaga.loader.reset();
		}

		Ptero.Ptalaga.enemy_model_list.play();
		window.addEventListener("keydown", function(e) {
			if (e.keyCode == 192) {  // tilde = 192. using for now while reconfiguring linux friendly keyCodes
			//	e.preventDefault();  //use preventDefault to prevent spacebar from scrolling the browser screen.
				Ptero.Ptalaga.enemy_model_list.togglePlay();
			}
			else if (e.keyCode == 80) { // 'P'=80
				Ptero.Ptalaga.enemy_model_list.togglePreview();
			}
		});

		console.log("setting scene");
		Ptero.setScene(Ptero.Ptalaga.panes);
	});
};
