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

let screenCenter;
let screenBasis;

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

let equation_text;

function preload() {
	font = loadFont('fonts/cmunti.otf');
}

function setup() {
	// Creates the html canvas on wich to draw all things.
	createCanvas(windowWidth, windowHeight);
	
	// Setup all of the html interactive inputs (slidesrs, checkboxes, etc).
	draw_fixed_grid_checkbox = createCheckbox('Grid', draw_fixed_grid);
	draw_fixed_grid_checkbox.changed(() => draw_fixed_grid = draw_fixed_grid_checkbox.checked());
	
	show_hitbox_checkbox = createCheckbox('Hitbox', show_hitbox);
	show_hitbox_checkbox.changed(() => show_hitbox = show_hitbox_checkbox.checked());
	
	space_size_slider = createSlider(1, 10, 2, 0);
	space_size_slider.style('width', '80px');
	//div.position(10, 65);
	add_vector_checkbox = createCheckbox('Add vector', add_vector);
	add_vector_checkbox.changed(() => add_vector = add_vector_checkbox.checked());

	rotation_slider = createSlider(0, 360, 0, 0);
	rotation_slider.style('width', '180px');
  
	a_slider = createSlider(-5, 5, 4, 0);
	a_slider.style('width', '180px');

	b_slider = createSlider(-5, 5, -4, 0);
	b_slider.style('width', '180px');

	c_slider = createSlider(-10, 10, 7, 0);
	c_slider.style('width', '180px');
  
 	d_slider = createSlider(-20, 20, 12, 0);
	d_slider.style('width', '180px');
  
	e_slider = createSlider(-10, 10, 6, 0);
	e_slider.style('width', '180px');
  
	f_slider = createSlider(-12, 12, -9, 0);
	f_slider.style('width', '180px');

	solve_btn = createButton("Resolver");
	solve_btn.mouseClicked(() => {
		rotation_from = rotation;
		rotation_to = g.rotation;
		origin_from = o.copy();
		origin_to = g.center;
		is_playing = true;
	});

	attatch_btn = createButton("Usar como base");
	attatch_btn.mouseClicked(() => {
		g.set_basis(u, v);
		g.set_origin(o);
	})

  // let group = createElement('ol');
  let group = new p5.Element(document.getElementById("controls"));
	let list_items = [
		draw_fixed_grid_checkbox,
		show_hitbox_checkbox,
		wrapDiv(space_size_slider, label("Space size")),
		add_vector_checkbox,
		wrapDiv(rotation_slider, label("Rotation")),
		wrapDiv(a_slider, label("a")),
		wrapDiv(b_slider, label("b")),
		wrapDiv(c_slider, label("c")),
		wrapDiv(d_slider, label("d")),
		wrapDiv(e_slider, label("e")),
		wrapDiv(f_slider, label("f")),
		wrapDiv(solve_btn),
		wrapDiv(attatch_btn)
	];

	for (let i = 0; i < list_items.length; i++) {
		let li = createElement('li');
		list_items[i].parent(li);
		li.parent(group);
	}
	group.position(10, 10);
	group.mouseOver(() => mouse_over_group = true);
	group.mouseOut(() => mouse_over_group = false);

	equation_text = new p5.Element(document.getElementById("equation"));

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

	u = new UserVector(1, 0, "î", color(133, 192, 104), 5, false);
	v = new UserVector(0, 1, "ĵ", color(235, 92, 79), 5, false);
	
	// createUserVector(createVector(0, 0), createVector(1, 1), "w", color(255), 2);

	g = new Conic(4, -4, 7, 12, 6, -9);
}

function draw() {
	equation_text.elt.textContent = g.toString();
	// if (abs(g.a - a_slider.value()) > eps ||
	// 	abs(g.b - b_slider.value()) > eps ||
	// 	abs(g.c - c_slider.value()) > eps ||
	// 	abs(g.d - d_slider.value()) > eps ||
	// 	abs(g.e - e_slider.value()) > eps ||
	// 	abs(g.f - f_slider.value()) > eps) {
	// 	g.a = a_slider.value();
	// 	g.b = b_slider.value();
	// 	g.c = c_slider.value();
	// 	g.d = d_slider.value();
	// 	g.e = e_slider.value();
	// 	g.f = f_slider.value();
	// 	g.recalculate();
	// }
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
		o.set(p5.Vector.lerp(origin_from, origin_to, anim_prog));
		clickable_origin.drag_offset = scaled(o);
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
  
	noFill();
	stroke(DEFAULT_COLOR);
	strokeWeight(2);
	g.draw();

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
	
	pop();
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
	vec.set_basis(u, v);
	user_vectors.push(vec);
	return vec;
}

function scaled(val) { return val instanceof p5.Vector ? p5.Vector.mult(val, scl) : val * scl; }
function unscaled(val) { return val instanceof p5.Vector ? p5.Vector.div(val, scl) : val * scl; }