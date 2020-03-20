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

let font;

let eps = 0.0001; // Small value used for comparisons with floating point values.
let u, v, o; // u and v are base vectors. o is the origin vector aka. o = (0, 0).

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
	draw_fixed_grid_checkbox.position(10, 10);
	show_hitbox_checkbox = createCheckbox('Hitbox', show_hitbox);
	show_hitbox_checkbox.changed(() => show_hitbox = show_hitbox_checkbox.checked());
	show_hitbox_checkbox.position(10, 35);
	space_size_slider = createSlider(1, 10, 2, 0);
	space_size_slider.style('width', '80px');
	let lbl = createElement('label', 'Space size')
	let div = createDiv();
	space_size_slider.parent(div);
	lbl.parent(div);
	div.position(10, 65);

	textFont(font);

	// Assigns values to all variables set as global and not initialized.
	o = createVector(0, 0);

	top_bound = -height / 2;
	left_bound = -width / 2;
	bottom_bound = height / 2;
	right_bound = width / 2;
	down = createVector(0, 1);
	right = createVector(1, 0);

	// Sets the scale variable. That is how many pixels a unit has.
	scl = 80;

	u = new UserVector(1, 0, "î", color(133, 192, 104), 5);
	v = new UserVector(0, 1, "ĵ", color(235, 92, 79), 5);

	user_vectors.push(new UserVector(1, 1, "v", DEFAULT_COLOR, 3));

	createUserVector(createVector(0, 1), createVector(1, 0), "w");
}

function draw() {
	// Update the slider values.
	space_size = space_size_slider.value();

	background(0);
	translate(width/2, height/2);
	scale(1, -1); // Invert the y coordinates so the + direction is upwards.

	// Draw fixed grid.
	if (draw_fixed_grid) {
		strokeWeight(1);
		//stroke(70);
		stroke(63, 106, 115, 100);
		for (let x = 0; x <= width / 2; x += scl / 2) {
			paralel_line(down, createVector(x, 0).add(o));
			if (x != 0)
				paralel_line(down, createVector(-x, 0).add(o));
		}
		for (let y = 0; y <= height / 2; y += scl / 2) {
			paralel_line(right, createVector(0, y).add(o));
			if (y != 0)
				paralel_line(right, createVector(0, -y).add(o));
		}
	}

	// Draw transformed grid.
	strokeWeight(3.5);
	stroke(63, 106, 115);
	for (let i = 1; i < width / (scl * 2 / space_size); i++) {
		paralel_line_space(v, p5.Vector.mult(u, i * scl).add(o));
		paralel_line_space(v, p5.Vector.mult(u, -i * scl).add(o));
	}
	for (let i = 1; i < height / (scl * 2 / space_size); i++) {
		paralel_line_space(u, p5.Vector.mult(v, i * scl).add(o));
		paralel_line_space(u, p5.Vector.mult(v, -i * scl).add(o));
	}

	// Draw more strongly the lines that pass throgh the origin and are
	// parelel to u and v.
	strokeWeight(3.5);
	stroke(150);
	paralel_line_space(u, o);
	paralel_line_space(v, o);

	translate(o.x, o.y);

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

}

function createUserVector(origin, vector, label, clr, weight) {
	let vec = new UserVector(vector.x, vector.y, label, clr, weight);
	vec.set_origin(origin);
	user_vectors.push(vec);
}

