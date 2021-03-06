//version 1.2
Ptero.scene_highscore = (function(){

	var buttonList;

	function cleanup() {
		buttonList.disable();
	}

	function init() {

		buttonList = new Ptero.ButtonList(Ptero.assets.json["btns_highscore"]);

		var btns = buttonList.namedButtons;

		var ranks = Ptero.settings.rankGet();
		btns["player"+"1"].text  = (ranks[0].rankNum + ranks[0].player_name.toString());
		btns["difficulty1"].text = ranks[0].difficulty.toString();
	/*	btns["kills"].text    = Ptero.settings.get("high_kills").toString();
		btns["caps"].text     = Ptero.settings.get("high_captures").toString();
		btns["bounties"].text = Ptero.settings.get("high_bounties").toString();
    */
		btns["erase"].onclick = function() {
			Ptero.setScene(Ptero.scene_erasehighscore);
		};

		btns["settings"].onclick = function() {
			Ptero.setScene(Ptero.scene_options);
		};

		btns["trophy"].onclick = function() {
			//Ptero.setScene(Ptero.scene_highscore);
		};

		btns["localPhone"].onclick = function() {
			//do nothing for now
		};

		btns["gplus"].onclick = function() {
			//do nothing for now
		};

		btns["fb"].onclick = function() {
			//do nothing for now
		};
		var b = btns["back"];
		b.isClickDelay = true;
		b.onclick = function() {
			Ptero.setScene(Ptero.scene_menu);
		};

		buttonList.enable();
	}

	function update(dt) {
	}

	function draw(ctx) {
		Ptero.deferredSprites.draw(ctx);
		buttonList.draw(ctx);
	}

	return {
		init: init,
		update: update,
		draw: draw,
		cleanup:cleanup,
	};

})();
