
Ptero.Crater = Ptero.Crater || {};

window.onload = function() {

	// Create the canvas element.
	var canvas = document.getElementById('canvas');

	Ptero.assets.load(function(){
		console.log("initing screen");
		Ptero.Crater.screen.init(canvas);
		console.log("initing input");
		Ptero.input.init();
		console.log("initing enemy model");
		Ptero.Crater.enemy_model_list = new Ptero.Crater.EnemyModelList();
		Ptero.Crater.enemy_model_list.createNew();
		console.log("setting scene");
		Ptero.setScene(Ptero.Crater.panes);
		console.log("starting exec");
		Ptero.Crater.executive.start();
	});
};
