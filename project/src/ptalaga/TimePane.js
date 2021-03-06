
Ptero.Ptalaga.TimePane = function(w,h,maxTime) {
	this.pixelW = w;
	this.pixelH = h;
	this.maxTime = maxTime;

	this.loopStartTime = 0;
	this.loopEndTime = Ptero.Ptalaga.enemy_model_list.maxTime;
	this.loopRegionHeight = 20;


	this.timeStartY = 30;
	this.timeEndY = this.pixelH-this.loopRegionHeight-20;
	this.timeHeight = this.timeEndY - this.timeStartY;

	this.timeStartX = 100;
	this.timeEndX = this.pixelW - 50;
	this.timeLenX = this.timeEndX - this.timeStartX;
	this.scale = this.timeLenX / maxTime;
	this.zoom(this.scale, 0, this.timeStartX);

	this.timeY = this.pixelH / 2;

	this.nodeRadius = 4;
	this.isDragTogether = false;
	var that = this;
	window.addEventListener("keydown", function(e) {
		if (e.keyCode == 16) {
			that.isDragTogether = true;
		}
		if (e.keyCode == 18) {
			that.isZoomPanKey = true;
		}
	});
	window.addEventListener("keyup", function(e) {
		if (e.keyCode == 16) {
			that.isDragTogether = false;
		}
		if (e.keyCode == 18) {
			that.isZoomPanKey = false;
		}
	});
};

Ptero.Ptalaga.TimePane.prototype = {

	zoom: function(scale, pos, pixel) {
		this.scale = Math.max(5, scale);
		this.pos = pos;
		var p = Math.max(this.timeStartX, pixel);
		p = Math.min(this.timeEndX, p);
		this.origin = Math.max(0, pos - (p - this.timeStartX) / this.scale);
	},

	/* COORDINATE FUNCTIONS */

	getY: function(model) {
		var len = Ptero.Ptalaga.enemy_model_list.models.length;
		var y;
		if (len == 1) {
			y = 0;
		}
		else {
			y = model.order / (len-1) - 0.5;
			y = -y;
		}
		return y;
	},

	screenToTime: function(x,y) {
		x = Math.max(this.timeStartX, x);
		x = Math.min(this.timeEndX, x);
		x -= this.timeStartX;
		var t = x / this.scale + this.origin;
		return t;
	},

	timeToScreen: function(t) {
		return {
			x: (t-this.origin) * this.scale + this.timeStartX,
			y: this.timeY,
		};
	},

	/* INPUT FUNCTIONS */

	getNodeInfoFromCursor: function(x,y) {
		var min_dist_sq = 100;
		var times = Ptero.Ptalaga.enemy_model.times;
		var i,len = times.length;

		var node,pos;
		var dx,dy,dist_sq;
		var closest_index;
		var offset_x, offset_y;

		// return loop start time handle
		if (y > this.pixelH - this.loopRegionHeight) {
			pos = this.timeToScreen(this.loopStartTime);
			dx = pos.x - x;
			if (Math.abs(dx) < this.nodeRadius*2) {
				return {
					loopStart: true,
					offset_x: dx,
				}
			}

			// return loop end time handle
			pos = this.timeToScreen(this.loopEndTime);
			dx = pos.x - x;
			if (Math.abs(dx) < this.nodeRadius*2) {
				return {
					loopEnd: true,
					offset_x: dx,
				}
			}
		}

		for (i=0; i<len; i++) {
			pos = this.timeToScreen(times[i]);
			pos.y = this.transform({t:0,y:this.getY(Ptero.Ptalaga.enemy_model)}).y;
			dx = pos.x - x;
			dy = pos.y - y;
			dist_sq = dx*dx + dy*dy;
			if (dist_sq < min_dist_sq) {
				closest_index = i;
				min_dist_sq = dist_sq;
				offset_x = dx;
				offset_y = dy;
			}
		}

		return {
			index: closest_index,
			offset_x: offset_x,
			offset_y: offset_y,
		};
	},

	selectNode: function(index,offset_x,offset_y) {
		Ptero.Ptalaga.enemy_model.selectPoint(index);
		this.selectedOffsetX = offset_x;
		this.selectedOffsetY = offset_y;
		if (index == null) {
		}
		else {
			Ptero.Ptalaga.enemy_model_list.pause();
			this.startPoints = [];
			var model = Ptero.Ptalaga.enemy_model;
			var i,len=model.points.length;
			for (i=0; i<len; i++) {
				this.startPoints.push({
					point: model.points[i],
					time: model.times[i],
				});
			}
			this.movedPoint = false;
		}
	},

	updateNodePosition: function(x,y) {
		if (this.selectedLoopHandle) {
			var time = this.screenToTime(x + this.selectedOffsetX);
			time = Math.max(0, time);
			if (this.selectedLoopHandle == "start") {
				this.loopStartTime = time;
				this.freezeAt(time);
			}
			else if (this.selectedLoopHandle == "end") {
				this.loopEndTime = time;
				this.freezeAt(time);
			}

			if (this.loopStartTime > this.loopEndTime) {
				this.selectedLoopHandle = this.selectedLoopHandle == "end" ? "start" : "end";
				var temp = this.loopStartTime;
				this.loopStartTime = this.loopEndTime;
				this.loopEndTime = temp;
			}

			this.loopEndTime = Math.min(Ptero.Ptalaga.enemy_model_list.maxTime, this.loopEndTime);

			return;
		}

		var times = Ptero.Ptalaga.enemy_model.times;
		var delta_times = Ptero.Ptalaga.enemy_model.delta_times;
		var i = Ptero.Ptalaga.enemy_model.selectedIndex;
		if (i == undefined) {
			return;
		}

		var time = this.screenToTime(
			x + this.selectedOffsetX,
			y + this.selectedOffsetY
		);

		times[i] = time;

		if (this.isDragTogether) {
			var j,len = times.length;
			for (j=i+1; j<len; j++) {
				times[j] = times[j-1] + delta_times[j];
			}
		}

		Ptero.Ptalaga.enemy_model.refreshTimes();
		Ptero.Ptalaga.enemy_model.refreshPath();

		Ptero.Ptalaga.enemy_model_list.setTime(time);
		this.movedPoint = true;
	},

	isSeeking: function() {
		return !this.selectedLoopHandle && Ptero.Ptalaga.enemy_model.selectedIndex == undefined;
	},

	freezeAt: function(t) {
		t = Math.max(0, t);
		//t = Math.min(t, Ptero.Ptalaga.enemy_model_list.maxTime);
		Ptero.Ptalaga.enemy_model_list.setTime(t);
		Ptero.Ptalaga.enemy_model_list.isScrubbing = true;
	},

	stopSeek: function() {
		Ptero.Ptalaga.enemy_model_list.isScrubbing = false;
	},

	setFocusPoint: function(x) {
		this.pos = this.screenToTime(x);
	},

	mouseStart: function(x,y) {
		if (this.isZoomPanKey) {
			this.isPanning = true;
			this.setFocusPoint(x);
		}
		else {
			this.isPanning = false;
			var i = this.getNodeInfoFromCursor(x,y);
			if (i.loopStart) {
				this.selectedLoopHandle = "start";
				this.freezeAt(this.loopStartTime);
			}
			else if (i.loopEnd) {
				this.selectedLoopHandle = "end";
				this.freezeAt(this.loopEndTime);
			}
			else {
				this.selectedLoopHandle = null;
			}
			this.selectNode(i.index, i.offset_x, i.offset_y);

			if (this.isSeeking()) {
				this.freezeAt(this.screenToTime(x));
			}
		}
	},
	mouseMove: function(x,y) {
		if (this.isPanning) {
			this.zoom(this.scale, this.pos, x);
		}
		else {
			if (this.isSeeking()) {
				this.freezeAt(this.screenToTime(x));
			}
			else {
				this.updateNodePosition(x,y);
			}
		}
	},
	mouseEnd: function(x,y) {
		this.isPanning = false;
		this.stopSeek();

		if (this.startPoints && this.movedPoint) {
			var model = Ptero.Ptalaga.enemy_model;
			var startPoints = this.startPoints;
			var endTimes = model.times.slice(0);
			var prevToCurrIndex = [];
			var currToPrevIndex = [];
			var len = model.points.length;
			for (i=0; i<len; i++) {
				for (j=0; j<len; j++) {
					if (startPoints[i].point == model.points[j]) {
						prevToCurrIndex[i] = j;
						currToPrevIndex[j] = i;
						break;
					}
				}
			}
			Ptero.Ptalaga.enemy_model_list.recordForUndo({
				model: model,
				undo: function() {
					var i;
					for (i=0; i<len; i++) {
						model.times[i] = startPoints[currToPrevIndex[i]].time;
					}
					model.refreshTimes();
					model.refreshPath();
				},
				redo: function() {
					var i;
					for (i=0; i<len; i++) {
						model.times[i] = endTimes[prevToCurrIndex[i]];
					}
					model.refreshTimes();
					model.refreshPath();
				},
			});
		}
	},
	mouseScroll: function(x,y,delta,deltaX,deltaY) {
		if (this.isZoomPanKey) {
			this.setFocusPoint(x);

			// from: http://stackoverflow.com/questions/2916081/zoom-in-on-a-point-using-scale-and-translate
			var scale = Math.pow(1 + Math.abs(deltaY)/4 , deltaY > 0 ? 1 : -1);

			this.scale *= scale;
			this.zoom(this.scale, this.pos, x);
		}
	},

	/* PAINTER FUNCTIONS */

	transform: function(pos) {
		// Input: pos.t, pos.y
		var s = this.timeToScreen(pos.t);
		var y = pos.y;
		var h = this.timeHeight;
		var result = {
			x: s.x,
			y: (-y * h) + this.timeStartY + h/2,
		};
		return result;
	},
	moveTo: function(ctx,pos) {
		var p = this.transform(pos);
		ctx.moveTo(p.x,p.y);
	},
	lineTo: function(ctx,pos) {
		var p = this.transform(pos);
		ctx.lineTo(p.x,p.y);
	},
	line: function(ctx, p1, p2) {
		ctx.beginPath();
		this.moveTo(ctx, p1);
		this.lineTo(ctx, p2);
		ctx.stroke();
	},
	lines: function(ctx, points) {
		var i,len;
		ctx.beginPath();
		this.moveTo(ctx, points[0]);
		for (i=1,len=points.length; i<len; i++) {
			this.lineTo(ctx, points[i]);
		}
		ctx.closePath();
		ctx.stroke();
	},
	fillCircle: function(ctx, spacePos, radius, color) {
		ctx.beginPath();
		var pos = this.transform(spacePos);
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
		ctx.fillStyle = color;
		ctx.fill();
	},
	strokeCircle: function(ctx, spacePos, radius, color, thickness) {
		ctx.beginPath();
		var pos = this.transform(spacePos);
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
		ctx.lineWidth = thickness;
		ctx.strokeStyle = color;
		ctx.stroke();
	},

	/* DRAWING FUNCTIONS */

	drawAxes: function(ctx) {
		ctx.strokeStyle = "#CCC";
		ctx.lineWidth = 1;

		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.font = '1em serif';
		ctx.fillStyle = "#777";
		var s = {
			x: this.timeStartX,
			y: this.timeStartY,
		};
		ctx.fillText('time (s)', s.x/2, s.y);
		ctx.fillText(Ptero.Ptalaga.enemy_model.enemy.path.time.toFixed(2), s.x/2, s.y+20);

		ctx.fillText('loop', s.x/2, this.pixelH - this.loopRegionHeight);

		ctx.save();
		ctx.beginPath();
		ctx.rect(this.timeStartX-this.nodeRadius, 0, this.timeLenX+2*this.nodeRadius, this.pixelH);
		ctx.clip();

		ctx.textBaseline = 'top';
		ctx.fillStyle = "#BBB";
		ctx.font = '0.8em serif';
		var h = 0.5;
		var startT = Math.ceil(this.origin);
		for (t=startT; t<=startT+this.timeLenX/this.scale; t++) {
			this.line(ctx,
				{t:t, y: h},
				{t:t, y: -h});
			s = this.transform({t:t, y: -h});
			ctx.fillText(t, s.x, s.y+5);
		}

		ctx.strokeStyle = Ptero.Ptalaga.enemy_model_list.isEditing ? "#F00" : "#00F";
		var t = Ptero.Ptalaga.enemy_model_list.time;
		this.line(ctx,
			{t:t, y: h},
			{t:t, y: -h});

	},

	drawModelPath: function(ctx, model) {
		ctx.strokeStyle = "#777";
		ctx.lineWidth = 2;
		var y = this.getY(model);
		this.line(ctx,
			{t:model.enemy.path.startTime, y:y},
			{t:model.enemy.path.totalTime, y:y});
	},

	drawModelNodes: function(ctx, model) {
		var isActive = (model == Ptero.Ptalaga.enemy_model);
		var times = model.times;
		var delta_times = model.delta_times;
		var i,len = times.length;

		if (isActive) {
			var selectedIndex = model.selectedIndex;
			ctx.textBaseline = "bottom";
			ctx.textAlign = "center";
			var y = this.getY(model);
			for (i=0; i<len; i++) {
				if (selectedIndex != i) {
					this.fillCircle(ctx, {t:times[i], y:y}, this.nodeRadius, "#555",2);
				}
				if (i > 0 && model == Ptero.Ptalaga.enemy_model) {
					var pos = this.transform({t:times[i-1]+delta_times[i]/2, y:y+0.1});
					ctx.fillText(delta_times[i].toFixed(2)+"s", pos.x, pos.y);
				}
			}
			var selectedPoint = model.getSelectedPoint();
			if (selectedPoint) {
				for (i=0; i<len; i++) {
					if (selectedIndex == i) {
						this.fillCircle(ctx, {t:times[i], y:y}, this.nodeRadius, "#F00",2);
					}
				}
			}
			else {
				var pos = model.enemy.getPosition();
				if (pos) {
					this.fillCircle(ctx, {t:model.enemy.path.time, y:y}, this.nodeRadius, "#00F",2);
				}
			}
		}
		else {
			if (model.enemy.getPosition()) {
				var y = this.getY(model);
				this.fillCircle(ctx, {t:model.enemy.path.time, y:y}, this.nodeRadius, "#555",2);
			}
		}
	},

	drawLoopRegion: function(ctx) {
		var x0 = this.timeToScreen(this.loopStartTime).x;
		var x1 = this.timeToScreen(this.loopEndTime).x;
		var w = x1-x0;
		//var h = this.nodeRadius*2;
		var h = this.loopRegionHeight;
		var y = this.pixelH-this.loopRegionHeight;

		ctx.fillStyle = "rgba(0,0,255,0.3)";
		ctx.fillRect(x0,y,w,this.loopRegionHeight);

		ctx.fillStyle = "#00F";
		var bottomY = this.pixelH;
		function drawArrow(x) {
			var arrowW = 5;
			ctx.beginPath();
			ctx.moveTo(x,y);
			ctx.lineTo(x+arrowW,y+h);
			//ctx.lineTo(x+arrowW,bottomY);
			//ctx.lineTo(x-arrowW,bottomY);
			ctx.lineTo(x-arrowW,y+h);
			ctx.closePath();
			ctx.fill();
		}

		drawArrow(x0);
		drawArrow(x1);

	},

	/* MAIN FUNCTIONS */

	draw: function(ctx) {
		ctx.fillStyle = "#EEE";
		ctx.fillRect(0,0,this.pixelW,this.pixelH);
		this.drawAxes(ctx);

		var models = Ptero.Ptalaga.enemy_model_list.models;
		var i,len=models.length;
		var e;
		if (len > 1) {
			ctx.globalAlpha = 0.35;
			for (i=0; i<len; i++) {
				var e = models[i];
				if (e != Ptero.Ptalaga.enemy_model && e.visible) {
					this.drawModelPath(ctx, e);
					this.drawModelNodes(ctx, e);
				}
			}
			ctx.globalAlpha = 1;
		}

		e = Ptero.Ptalaga.enemy_model;
		this.drawModelPath(ctx, e);
		this.drawModelNodes(ctx, e);

		this.drawLoopRegion(ctx);

		// remove clipping
		ctx.restore();
	},
	update: function(dt) {
	},
	init: function() {
	},
};
