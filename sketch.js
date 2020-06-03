/*
 * This program is meant to be a visualization of a few concepts in linear algebra
 * and analytical geometry. It implements some concepts such as basis vectors,
 * change of basis, linear transformations and may be a source for study and contemplation
 * of a visual context of these concepts. Also, the way it looks is heavily inspired by
 * 3Blue1Brown, a YouTube channel that does amazing content on visualizing mathematics.
 *
 * The program uses the p5.js library for drawing in an html canvas. Also, it uses the p5.Vector
 * class as a representation for vectors.
 *
 * In the implementation there are two ways of measuring distance: units and pixels. Pixels are
 * directly related to html canvas pixels and do not change. However, units can be several
 * pixels wide and can change over time. The unit size determines the ammount of "zoom", and
 * the size in pixels of a unit vector. In practice, the user should only have to worry about
 * units.
 *
 * Author: Gabriel Dertoni
 * GitHub: github.com/GabrielDertoni
 */

const DEFAULT_COLOR = "rgba(254, 247, 49, 1)";

let show_hitbox_checkbox;
let draw_fixed_grid = true;
let draw_fixed_grid_checkbox;
let space_size;
let space_size_slider;
let add_vector = false;
let add_vector_checkbox;

let mouse_over_group;

let font;

let eps = 0.0001; // Small value used for comparisons with floating point values.
let u, v, o; // u and v are base vectors. o is the origin vector aka. o = (0, 0).
let clickable_origin;
let rotation; // Used to denote the overall rotation of the basis.

// Animation parameters
let is_playing;
let rotation_from;
let rotation_to;
let origin_from;
let origin_to;
let anim_step = 0.005;
let anim_prog = 0;

let g;

let top_bound; // Top boundary of the screen (y value).
let left_bound; // Left boundary of the screen (x value).
let bottom_bound; // Bottom boundary of the screen (y value).
let right_bound; // Right boundary of the screen (x value).

let down; // A unit vector that points down.
let right; // A unit vector that points right.

let scl; // The size of the vectors in pixels. Size of a unit in pixels.

let user_vectors = [] // List of user created vectors.

function preload() {
	font = loadFont('fonts/cmunti.otf');
}

function setup() {
	// Creates the html canvas on wich to draw all things.
	createCanvas(windowWidth, windowHeight);

	// Setup all of the html interactive inputs (slidesrs, checkboxes, etc).
	draw_fixed_grid_checkbox = createCheckbox('Grid', draw_fixed_grid);
	draw_fixed_grid_checkbox.changed(() => draw_fixed_grid = draw_fixed_grid_checkbox.checked());
	//draw_fixed_grid_checkbox.position(10, 10);
	show_hitbox_checkbox = createCheckbox('Hitbox', show_hitbox);
	show_hitbox_checkbox.changed(() => show_hitbox = show_hitbox_checkbox.checked());
	//show_hitbox_checkbox.position(10, 35);
	space_size_slider = createSlider(1, 10, 2, 0);
	space_size_slider.style('width', '80px');
	let space_size_slider_lbl = createElement('label', 'Space size')
	let space_size_slider_div = createDiv();
	space_size_slider.parent(space_size_slider_div);
	space_size_slider_lbl.parent(space_size_slider_div);
	//div.position(10, 65);
	add_vector_checkbox = createCheckbox('Add vector', add_vector);
	add_vector_checkbox.changed(() => add_vector = add_vector_checkbox.checked());

	rotation_slider = createSlider(0, 360, 0, 0);
	rotation_slider.style('width', '180px');
	let rotation_slider_lbl = createElement('label', 'Rotation');
	let rotation_slider_div = createDiv();
	rotation_slider.parent(rotation_slider_div);
	rotation_slider_lbl.parent(rotation_slider_div);

	let group = createElement('ol');
	let list_items = [
		draw_fixed_grid_checkbox,
		show_hitbox_checkbox,
		space_size_slider_div,
		add_vector_checkbox,
		rotation_slider_div
	];

	for (let i = 0; i < list_items.length; i++) {
		let li = createElement('li');
		list_items[i].parent(li);
		li.parent(group);
	}
	group.position(10, 10);
	group.mouseOver(() => mouse_over_group = true);
	group.mouseOut(() => mouse_over_group = false);

	textFont(font);

	// Assigns values to all variables set as global and not initialized.
	clickable_origin = new Clickable(Shape.regular_polygon(0, 0, 10, 6));
	o = createVector(0, 0);

	top_bound = -height / 2;
	left_bound = -width / 2;
	bottom_bound = height / 2;
	right_bound = width / 2;
	down = createVector(0, 1);
	right = createVector(1, 0);

	// Sets the scale variable. That is how many pixels a unit has.
	scl = 80;
	rotation = 0;
	is_playing = false;

	origin_from = createVector(0,0);
	origin_to = createVector(2,1);
	rotation_from = 0;
	rotation_to = PI / 6;

	u = new UserVector(1, 0, "î", color(133, 192, 104), 5);
	v = new UserVector(0, 1, "ĵ", color(235, 92, 79), 5);

	user_vectors.push(new UserVector(1, 1, "v", DEFAULT_COLOR, 3));

  createUserVector(createVector(0, 1), createVector(1, 0), "w");
  

  g = new Locus(4, -4, 7, 12, 6, -9);
}

function draw() {
	// Update the slider values.
  space_size = space_size_slider.value();

	if (!is_playing) {
		const val = map(rotation_slider.value(), 0, 360, 0, TWO_PI);
		if (abs(val - rotation) > eps) {
			u.rotate(val - rotation);
			v.rotate(val - rotation);
			rotation = val;
			is_dragging = true;
		}
	} else {
		const val = rotation_from + (rotation_to - rotation_from) * anim_prog
		rotation_slider.value(map(val, 0, TWO_PI, 0, 360));
		const new_origin = p5.Vector.add(origin_from, p5.Vector.sub(origin_to, origin_from).mult(anim_prog));
		o.set(new_origin);
		clickable_origin.drag_offset = scaled(new_origin);
		anim_prog += anim_step;
		
		u.rotate(val - rotation);
		v.rotate(val - rotation);
		rotation = val;
		is_dragging = true;

		if (anim_prog >= 1) is_playing = false;
	}

	background(0);
	translate(width/2, height/2);
	scale(1, -1); // Invert the y coordinates so the + direction is upwards.

	// Draw fixed grid.
	if (draw_fixed_grid) {
		strokeWeight(1);
		//stroke(70);
		stroke(63, 106, 115, 100);
		for (let x = 0; x <= width / 2; x += scl / 2) {
			paralel_line(down, createVector(x, 0));
			if (x != 0)
				paralel_line(down, createVector(-x, 0));
		}
		for (let y = 0; y <= height / 2; y += scl / 2) {
			paralel_line(right, createVector(0, y));
			if (y != 0)
				paralel_line(right, createVector(0, -y));
		}
	}

	// Draw transformed grid.
	strokeWeight(3.5);
	stroke(63, 106, 115);
	for (let i = 1; i < width / (scl * 2 / space_size); i++) {
		paralel_line_space(v, p5.Vector.mult(u, scaled(i)).add(scaled(o)));
		paralel_line_space(v, p5.Vector.mult(u, scaled(-i)).add(scaled(o)));
	}
	for (let i = 1; i < height / (scl * 2 / space_size); i++) {
		paralel_line_space(u, p5.Vector.mult(v, scaled(i)).add(scaled(o)));
		paralel_line_space(u, p5.Vector.mult(v, scaled(-i)).add(scaled(o)));
	}

	// Draw more strongly the lines that pass throgh the origin and are
	// parelel to u and v.
	strokeWeight(3.5);
	stroke(150);
	paralel_line_space(u, scaled(o));
	paralel_line_space(v, scaled(o));

	if (!is_playing) {
		clickable_origin.update();
		o.set(unscaled(clickable_origin.drag_offset));
	}

  push();
  translate(scaled(o).x, scaled(o).y);

	// Update the vectors.
	for (let i = 0; i < user_vectors.length; i++)
		user_vectors[i].update();
	
	u.update();
	v.update();

	// Draw the vectors.
	u.draw();
	v.draw();

	for (let i = 0; i < user_vectors.length; i++)
		user_vectors[i].draw();

	// Update the basis vector of vectr.
	for (let i = 0; i < user_vectors.length; i++)
		user_vectors[i].set_basis(u, v);
  
  pop();
  noFill();
  stroke(255);
  g.draw();
}

function mousePressed() {
	if (add_vector && !is_dragging && !mouse_over_group) {
		let vec = createUserVector(transform_mouse().div(scl), createVector(1, 0), "u", color(255), 3);
		vec.clickable.drag = true;
		is_dragging = true;
	}
}

function mouseReleased() {
	is_dragging = false;
}

function createUserVector(origin, vector, label, clr, weight) {
	let vec = new UserVector(vector.x, vector.y, label, clr, weight, true);
	vec.set_origin(origin);
	user_vectors.push(vec);
	return vec;
}

function scaled(val) { return val instanceof p5.Vector ? p5.Vector.mult(val, scl) : val * scl; }
function unscaled(val) { return val instanceof p5.Vector ? p5.Vector.div(val, scl) : val * scl; }