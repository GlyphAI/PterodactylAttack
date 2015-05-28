
Ptero.Ptalaga.LivePane = function() {
	this.scene = Ptero.Ptalaga.scene_crater;
};

Ptero.Ptalaga.LivePane.prototype = {

	/* COORDINATE FUNCTIONS */

	windowToSpace: function(x,y,spaceZ) {
		var frustum = Ptero.frustum;
		var spacePos = Ptero.screen.windowToSpace({x:x,y:y});
		spacePos = frustum.projectToZ(spacePos, spaceZ);
		return {
			x: spacePos.x,
			y: spacePos.y,
		};
	},

	spaceToWindow: function(pos) {
		return Ptero.screen.spaceToWindow(pos);
	},

	screenToAngle: function(x,y,cx,cy) {
		x -= cx;
		y -= cy;
		var dist = Math.sqrt(x*x+y*y);
		y /= dist;
		y = -y;
		var a = Math.acos(y);
		if (x <= 0) {
			a = -a;
		}
		return a;
	},

	/* INPUT FUNCTIONS */

	// Determine if the given coord is inside the selection rectangle
	// of the given path knot index. Return an offset object if true.
	getNodeSelectOffset: function(x,y,index) {
		if (index == undefined) {
			return;
		}

		var enemy_model = Ptero.Ptalaga.enemy_model;
		var nodeSprite = enemy_model.nodeSprites[index];
		var spaceCenter = enemy_model.points[index];
		var spaceClick = this.windowToSpace(x,y,spaceCenter.z);
		if (enemy_model.enemy.sprite.getBillboard().isInsideWindowRect(x,y,spaceCenter)) {
			return {
				index: index,
				offset_x: spaceCenter.x - spaceClick.x,
				offset_y: spaceCenter.y - spaceClick.y,
			}
		}
	},

	getNodeInfoFromCursor: function(x,y) {

		var enemy_model = Ptero.Ptalaga.enemy_model;

		function getPointDistSq(x0,y0,x1,y1) {
			var dx,dy,dist_sq;
			dx = x0-x1;
			dy = y0-y1;
			return dx*dx + dy*dy;
		}
		
		
		if (enemy_model.selectedIndex != undefined) {
			var point = enemy_model.getSelectedPoint();
			if (enemy_model.enemy.sprite.getBillboard().isOverRotationHandle(x,y,point)) {
				var p = Ptero.screen.spaceToWindow(point);
				var click_angle = this.screenToAngle(x,y,p.x,p.y);
				return {
					index: enemy_model.selectedIndex,
					offset_angle: point.angle - click_angle,
				};
			}
		}
		

		// First, see if any of the knots are clicked.
		var min_dist_sq = this.nodeRadius*this.nodeRadius;
		var nodes = Ptero.Ptalaga.enemy_model.points;
		var i,len = nodes.length;
		var node,pos;
		var closest_index;
		var offset_x, offset_y;
		for (i=0; i<len; i++) {
			node = nodes[i];
			pos = this.spaceToWindow(node);
			dist_sq = getPointDistSq(pos.x,pos.y,x,y);
			if (dist_sq < min_dist_sq) {
				closest_index = i;
				min_dist_sq = dist_sq;
			}
		}

		var node_offset;

		// If a knot is clicked, return the offset from that knot.
		if (node_offset = this.getNodeSelectOffset(x,y,closest_index)) {
			return node_offset;
		}

		// Else, return the offset from the selected node our click is inside a selection rectangle.
		else if (node_offset = this.getNodeSelectOffset(x,y,enemy_model.selectedIndex)) {
			return node_offset;
		}

		// Finally, return the offset from an unselected node rectangle if our click is inside one.
		for (i=0; i<len; i++) {
			if (node_offset = this.getNodeSelectOffset(x,y,i)) {
				return node_offset;
			}
		}

		// Return an empty object if we cannot deduce a click selection.
		return {};
		
	},

	selectNode: function(index,offset_x,offset_y,offset_angle) {
		Ptero.Ptalaga.enemy_model.selectPoint(index);
		this.selectedOffsetX = offset_x;
		this.selectedOffsetY = offset_y;
		this.selectedOffsetAngle = offset_angle;

		if (index == null) {
			this.startPoint = null;
		}
		else {
			Ptero.Ptalaga.enemy_model_list.pause();
			var p = Ptero.Ptalaga.enemy_model.points[index];
			this.sourcePoint = p;
			this.startPoint = {
				x: p.x,
				y: p.y,
				z: p.z,
			};
			this.movedPoint = false;
		}
	},

	updateNodePosition: function(x,y) {
		var enemy_model = Ptero.Ptalaga.enemy_model;
		var point = enemy_model.getSelectedPoint();
		if (point) {
			if (this.selectedOffsetAngle != undefined) {
				// rotate
				var point = enemy_model.getSelectedPoint();
				var p = Ptero.screen.spaceToWindow(point);
				var click_angle = this.screenToAngle(x,y,p.x,p.y);
				point.angle = click_angle + this.selectedOffsetAngle;
			}
			else {
				// move
				var spaceClick = this.windowToSpace(x,y,point.z);
				point.x = spaceClick.x + this.selectedOffsetX;
				point.y = spaceClick.y + this.selectedOffsetY;
			}
			Ptero.Ptalaga.enemy_model.refreshPath();
			this.movedPoint = true;
		}
	},

	mouseStart: function(x,y) {
		var p = Ptero.screen.canvasToWindow(x,y);
		x = p.x;
		y = p.y;
		var i = this.getNodeInfoFromCursor(x,y);
		this.selectNode(i.index, i.offset_x, i.offset_y, i.offset_angle);
	},

	mouseMove: function(x,y) {
		var p = Ptero.screen.canvasToWindow(x,y);
		x = p.x;
		y = p.y;
		this.updateNodePosition(x,y);
	},

	mouseEnd: function(x,y) {
		var p = Ptero.screen.canvasToWindow(x,y);
		x = p.x;
		y = p.y;
		if (this.startPoint && this.movedPoint) {
			var sourcePoint = this.sourcePoint;
			var curX = sourcePoint.x;
			var curY = sourcePoint.y;
			var curZ = sourcePoint.z;
			var prevX = this.startPoint.x;
			var prevY = this.startPoint.y;
			var prevZ = this.startPoint.z;
			var model = Ptero.Ptalaga.enemy_model;
			Ptero.Ptalaga.enemy_model_list.recordForUndo({
				model: model,
				undo: function() {
					sourcePoint.x = prevX;
					sourcePoint.y = prevY;
					sourcePoint.z = prevZ;
					model.refreshPath();
				},
				redo: function() {
					sourcePoint.x = curX;
					sourcePoint.y = curY;
					sourcePoint.z = curZ;
					model.refreshPath();
				},
			});
		}
	},

	/* PAINTER FUNCTIONS */

	transform: function(pos) {
		// for now, just assume the vector is a 3d space vector.
		return this.spaceToWindow(pos);
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

	drawModel: function(ctx, model) {
	},

	drawModelNodes: function(ctx, model) {
		var nodes = model.points;
		var i,len = nodes.length;
		var selectedIndex = model.selectedIndex;
		for (i=0; i<len; i++) {
			if (selectedIndex != i) {
				this.fillCircle(ctx, nodes[i], this.nodeRadius, "#555");
			}
		}
		var selectedPoint = model.getSelectedPoint();
		if (selectedPoint) {
			this.fillCircle(ctx, selectedPoint, this.nodeRadius, "#F00");
			model.nodeSprites[selectedIndex].drawBorder(ctx, selectedPoint, "rgba(255,0,0,0.2)");
		}
		else {
			var pos = model.enemy.getPosition();
			if (pos) {
				this.fillCircle(ctx, pos, this.nodeRadius, "#00F");
			}
		}
	},

	drawModelPath: function(ctx, model) {
		var interp = model.interp;
		var totalTime = interp.totalTime;
		var numPoints = 70;
		var step = totalTime/numPoints;

		var r = 4;
		var that = this;
		function getPoints(t0,t1) {
			var maxLevel = 3;

			var p0 = {p:interp(t0)};
			var p1 = {p:interp(t1)};
			if (!p0.p || !p1.p) {
				return;
			}
			p0.next = p1;
			p1.prev = p0;

			function isCloseEnough(p0,p1) {
				var s0 = that.spaceToWindow(p0.p);
				var s1 = that.spaceToWindow(p1.p);
				var dx = s0.x - s1.x;
				var dy = s0.y - s1.y;
				return dx*dx + dy*dy < r*r;
			}

			function insertPoint(p0,p1,t0,t1,level) {
				if (level > maxLevel) {
					return;
				}

				var t = t0+(t1-t0)/2;
				var p = {p:interp(t)};

				p.prev = p0;
				p.next = p1;
				p0.next = p1.prev = p;

				if (!isCloseEnough(p,p0)) {
					insertPoint(p0,p,t0,t,level+1);
				}
				if (!isCloseEnough(p,p1)) {
					insertPoint(p,p1,t,t1,level+1);
				}
			}

			if (!isCloseEnough(p0,p1)) {
				insertPoint(p0,p1,t0,t1,0);
			}

			return p0;
		}

		ctx.beginPath();
		for (t=0; t<=totalTime-step; t+=1.4*step) {
			var p0 = getPoints(t,t+step);
			if (!p0) {
				continue;
			}
			this.moveTo(ctx, p0.p);
			while (p0 = p0.next) {
				this.lineTo(ctx, p0.p);
			}
		}
		ctx.strokeStyle = "#777";
		ctx.lineWidth = 2 * this.hudScale;
		ctx.stroke();
	},

	draw: function(ctx) {
		ctx.save();
		Ptero.screen.transformToWindow();
		this.scene.draw(ctx);
		if (!Ptero.Ptalaga.enemy_model_list.isPreview) {
			var models = Ptero.Ptalaga.enemy_model_list.models;
			var i,len = models.length;
			for (i=0; i<len; i++) {
				var e = models[i];
				if (e == Ptero.Ptalaga.enemy_model) {
					this.drawModelNodes(ctx, e);
					this.drawModelPath(ctx, e);
				}
				else if (e.visible) {
					ctx.globalAlpha = 0.5;
					this.drawModelPath(ctx, e);
					ctx.globalAlpha = 1;
				}
			}
		}

		var p = Ptero.painter;
		var f = Ptero.frustum;
		ctx.fillStyle = "rgba(0,0,0,0.5)";
		ctx.beginPath();
		p.moveTo(ctx, { x: f.nearLeft, y: f.nearTop, z: f.near });
		p.lineTo(ctx, { x: f.nearLeftA, y: f.nearTop, z: f.near });
		p.lineTo(ctx, { x: f.nearLeftA, y: f.nearBottom, z: f.near });
		p.lineTo(ctx, { x: f.nearLeft, y: f.nearBottom, z: f.near });
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		p.moveTo(ctx, { x: f.nearRight, y: f.nearTop, z: f.near });
		p.lineTo(ctx, { x: f.nearRightA, y: f.nearTop, z: f.near });
		p.lineTo(ctx, { x: f.nearRightA, y: f.nearBottom, z: f.near });
		p.lineTo(ctx, { x: f.nearRight, y: f.nearBottom, z: f.near });
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	},

	update: function(dt) {
		this.scene.update(dt);
	},

	init: function() {
		this.scene.init();

		this.hudScale = Ptero.screen.getWindowHeight() / Ptero.Ptalaga.screen.getPaneHeight();
		this.nodeRadius = 4 * this.hudScale;
	},
};
