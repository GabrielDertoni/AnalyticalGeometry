// Constants.
const HITBOX = "hitbox";
const NODRAW = "nodraw";

let is_dragging = false; // Global variable to ensure only on object can be dragged at a time.

let show_hitbox = false;

/*
 * The class UserVector extends from p5.Vector wich means it can be used on vector operations
 * from the p5js library.
 *
 * The class also contains a Clickable component that allows the user to drag the vector to
 * a different position of the screen.
 *
 * In UserVector there are two basis vectors used to describe x, y: i and j. Mathematically, if the
 * p5.Vector is v, then v = x * i + y * j. At class inialization i = (1, 0), j = (0, 1) but those
 * can be changed with the set_basis(i, j) function.
 *
 * When the basis vectors i and j are changed, the vector also is transformed according
 * to the change of basis. This meas that the vector has two states to keep track of: the transformed
 * vector that is shown in the screen, and the vector written in the i, j basis, wich can be
 * changed by the user through draggin. On top of that, there are two ways to write each state:
 * in pixels or in units. Units can be several pixels wide and this relation is stored in the global
 * scl variable. Pixels are a fixed unit and have a direct relation to pixel size in html canvas.
 */
class UserVector extends p5.Vector {
	static list = [];
	constructor(x, y, label, clr, weight, movable_origin=false) {
		// The x, y values of the vector will always be written in the u, v basis and in units.
		super(x, y, 0);
		this.label = label !== undefined ? label : "";
		// The color to use to display the vector.
		this.color = clr !== undefined ? clr : color(254, 247, 49);
		this.weight = weight !== undefined ? weight : 3;
		this.tip_size = sqrt(this.weight * 77 / 6) * 2; // Relation with the area of the tip.
		//this.tip_size = pow(this.weight * 310 / 3, 1/3) * 2; // Equation that looks preatty on screen.

		// The starting position of the vector (in pixels);
		this.start = this.copy().mult(scl);

		// The shape of the triangle that acts as a hitbox for the mouse when clicking the vector.
		let shape = new Shape([createVector(-this.tip_size*1.5, this.tip_size/2),
							   createVector(-this.tip_size*1.5, -this.tip_size/2),
							   createVector(0, 0)]);

		// The clickable object that allows the user to drag the vector.
		this.clickable = new Clickable(shape);
		this.movable_origin = movable_origin;
		if (this.movable_origin)
			this.clickable_origin = new Clickable(Shape.rect(0,
															 -this.tip_size / 2,
															 this.mag() * scl - this.tip_size * 1.5,
															 this.tip_size));

		this.i = createVector(1, 0);
		this.j = createVector(0, 1);
		this.o = createVector(0, 0);
		UserVector.list.push(this);
	}
	draw() {
		strokeWeight(this.weight);
		fill(this.color);
		stroke(this.color);
		// Draw the transformed scaled (in pixels) vector with its origin in the global o = (0, 0) vector.
		vector_arrow(this.tscl, this.tsclo, this.label, this.tip_size);
	}

	update() {
		let angle = atan2(this.tscl.y, this.tscl.x);

		push();
		translate(this.tsclo.x, this.tsclo.y);

		if (this.clickable_origin) {
			if (is_dragging && !this.clickable_origin.drag) {
				this.clickable_origin.bounding_box = Shape.rect(0, -this.tip_size / 2,
																max(this.tscl.mag() - this.tip_size * 1.5, 0),
																this.tip_size);
			}
			this.clickable_origin.bounding_box.rotate_to(angle);
			this.clickable_origin.update();
		}

		// Translates the clickable object to the tip of the vector.
		// In this case its the starting position of the vector (in pixels)
		// since this is the translation that always will need to be done,
		// from the base of the vector to its tip. Any other translations are
		// handled by the clickable object itself, since the user will have to
		// drag the vector manually.
		translate(this.start.x, this.start.y);

		// Rotates the bounding box to match the arrow of the vector.
		this.clickable.bounding_box.rotate_to(angle);

		// Updates the clickable object.
		this.clickable.update();
		pop();

		// If the clickable is not beeing dragged, change the drag offset of the
		// clickable object to be in line with the u, v transformations.
		if (!this.clickable.drag)
			this.clickable.drag_offset = this.tscl.sub(this.start);
 
		// The user will see the transformed vector and will be able to change only it,
		// and not the vector in the u, v basis. So, in order to preserve the vector in
		// the right basis and since now the dragged vector may be in its transformed
		// position, the new x, y values in the u, v basis may be obtained by inverting
		// the transformation on the vector shown in the screen.
		if (this.clickable.drag) {
			let inverted = this.get_invt();
			this.x = inverted.x;
			this.y = inverted.y;
		}

		if (this.clickable_origin) {
			if (this.clickable_origin.drag) {
				let inverted = this.get_invto();
				this.o.x = inverted.x;
				this.o.y = inverted.y;
			}
		}
	}
	// The vector in the u, v basis in units. To get this vector, get_invt() multiplies the
	// vector shown in screen written in units by the inverse of the transformation matrix.
	get_invt() {
		// Determinant of the transformation matrix, used to calculate the inverse matrix.
		let det = this.i.x * this.j.y - this.i.y * this.j.x;
		let tvec = this.screen.div(scl);
		// The resulting vector from the inverse matrix multiplied by the vector.
		return createVector(tvec.x *  this.j.y / det + tvec.y * -this.j.x / det,
							tvec.x * -this.i.y / det + tvec.y *  this.i.x / det);
	}
	get_invto() {
		// Determinant of the transformation matrix, used to calculate the inverse matrix.
		let det = this.i.x * this.j.y - this.i.y * this.j.x;
		let tvec = this.screen_origin.div(scl);
		// The resulting vector from the inverse matrix multiplied by the vector.
		return createVector(tvec.x *  this.j.y / det + tvec.y * -this.j.x / det,
							tvec.x * -this.i.y / det + tvec.y *  this.i.x / det);
	}
	set_basis(i, j) {
		this.i = i;
		this.j = j;
	}
	set_origin(o) {
		this.o = o;
	}

	// The non transformed vector in pixels. Aka the vector in the u, v basis in pixels.
	get scl() {
		return p5.Vector.mult(this, scl);
	}
	// Get non transformed origin in pixels. Aka the origin in the u, v basis in pixels.
	get sclo() {
		return p5.Vector.mult(this.o, scl);
	}
	// Get the transformed vector in units.
	get t() {
		return createVector(this.x * this.i.x + this.y * this.j.x,
							this.x * this.i.y + this.y * this.j.y);
	}
	// Get the transformed origin in units.
	get to() {
		return createVector(this.o.x * this.i.x + this.o.y * this.j.x,
							this.o.x * this.i.y + this.o.y * this.j.y);
	}
	// The transformed vector in pixel values. In this case, its just exactly what is
	// shown in the screen.
	get tscl() {
		return p5.Vector.mult(this.t, scl);
	}
	// The transformed origin in pixel values.
	get tsclo() {
		return p5.Vector.mult(this.to, scl);
	}
	// The vector that is actually beeing show on screen. Written in pixel values.
	get screen() {
		return p5.Vector.add(this.start, this.clickable.drag_offset);
	}
	get screen_origin() {
		return p5.Vector.add(this.tsclo, this.clickable_origin.drag_offset);
	}
}

/*
 * The Clickable class allows the user to drag and drop objects that have a given bounding box
 * and draw function. The draw function is run every time the clickable object is updated.
 *
 * The bounding box needs to be a class with some hover() function that returns true if the
 * mouse is above the object and false if not.
 * The update function has to be a function with no return value that draws the object. This
 * function needs to draw things translatable with the translate() function within p5js.
 */
class Clickable {
	constructor(bounding_box, update) {
		this.bounding_box = bounding_box;
		this.draw = update;
		this.drag = false;
		// x and y offsets from the where the objects initiated.
		this.offset = createVector(0, 0);

		this.mouse_offset = createVector(0, 0);
		this.mouse_drag = createVector(0, 0);
	}
	
	update() {
		push(); // Create a separate set of transformations.
		// Translate by an offset that can be changed.
		// This offset always starts at 0 and it represents the ammount that
		// the object has moved from its starting position.
		translate(this.offset.x, this.offset.y); 
		// Calculate the position of the mouse taking into consideration the offset.
		let mouse = transform_mouse();
		// If the mouse is hovering the object, drag it.
		if (this.bounding_box.hover() && mouseIsPressed && !this.drag && !is_dragging) {
			this.mouse_offset.x = mouse.x;
			this.mouse_offset.y = mouse.y;
			this.drag = true;
			is_dragging = true;
		}

		// If the object is beeing dragged, translate the mouse so its 0 position
		// is at the place the mouse press happend. Then, offset the object by the
		// position of this relative mouse position.
		if (this.drag) {
			push();
			translate(this.mouse_offset.x, this.mouse_offset.y);
			mouse = transform_mouse();
			pop();

			this.mouse_drag = mouse.copy();
			translate(mouse.x, mouse.y);

			if (!mouseIsPressed) {
				this.offset = p5.Vector.add(this.offset, mouse);
				this.mouse_offset = createVector(0, 0);
				this.drag = false;
				// is_dragging = false;
				this.mouse_drag = createVector(0, 0);
			}
		}

		// Draw the object.
		if (typeof this.draw == "function")
			this.draw();
		else if (show_hitbox)
			this.bounding_box.draw();

		pop();
	}
	get drag_offset() {
		return p5.Vector.add(this.mouse_drag, this.offset);
	}
	set drag_offset(val) {
		this.offset = val;
	}
}

/*
 * The Shape class defines a poligonal shape that has a number of vertices.
 * The constructor takes in a vertices parameter that must be an array of objects
 * with x, y attributes to be used as the x and y positions of each vertex.
 * The shape may not have holes, its only the connection of its vertices.
 *
 * The hover() function returs true if the transformed mouse is inside of the shape
 * and false otherwise. The draw function draws the shape in magenta.
 */
class Shape {
	// Returns a Shape object of some regular polygon.
	// x, y: the coordinates of the center of the polygon.
	// r: the radius of the circle circunscribed by the polygon.
	// n: the number of sides of the poligon.
	// rot: the rotation of the polygon around the center. (default: 0)
	static regular_polygon(x, y, r, n, rot=0) {
		let pos = createVector(x, y);
		let vert = [];
		for (let i = 0; i < n; i++) {
			let ang = i * TWO_PI / n + rot;
			let vec = p5.Vector.fromAngle(ang).mult(r);
			vert.push(p5.Vector.add(vec, pos));
		}
		return new Shape(vert);
	}
	static rect(x, y, w, h, mode=CORNER) {
		let vert;
		if (mode == CORNER)
			vert = [createVector(x, y), createVector(x+w, y),
					createVector(x+w, y+h), createVector(x, y+h)];
		else
			vert = [createVector(x-w/2, y-h/2), createVector(x+w/2, y-h/2),
					createVector(x+w/2, y+h/2), createVector(x-w/2, y+h/2)]

		return new Shape(vert);
	}
	constructor(vertices) {
		this.vertices = vertices;
		this.rotation = 0;
	}
	hover() {
		let mouse = transform_mouse();
		let count = 0;
		for (let i = 0; i < this.vertices.length; i++) {
			let next = (i + 1) % this.vertices.length;
			if (min(this.vertices[i].y, this.vertices[next].y) < mouse.y &&
				max(this.vertices[i].y, this.vertices[next].y) > mouse.y) {
				let slope = (this.vertices[next].x - this.vertices[i].x) / (this.vertices[next].y - this.vertices[i].y);
				let intersection = slope * mouse.y + this.vertices[i].x - slope * this.vertices[i].y;
				if (intersection > mouse.x)
					count++;
			}
		}
		return count % 2 == 1;
	}
	draw() {
		strokeWeight(1);
		stroke(255, 0, 255);
		noFill();
		beginShape();
		for (let i = 0; i < this.vertices.length; i++) {
			vertex(this.vertices[i].x, this.vertices[i].y);
		}
		endShape(CLOSE);
	}
	// Rotate all vertices by some angle.
	rotate_to(ang) {
		let rot = ang - this.rotation;
		for (let i = 0; i < this.vertices.length; i++) {
			let x = this.vertices[i].x * cos(rot) - this.vertices[i].y * sin(rot);
			let y = this.vertices[i].x * sin(rot) + this.vertices[i].y * cos(rot);
			this.vertices[i].x = x;
			this.vertices[i].y = y;
		}
		this.rotation = ang;
	}
}
