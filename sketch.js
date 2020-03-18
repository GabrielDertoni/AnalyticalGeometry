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

let draw_fixed_grid = false;

let eps = 0.0001; // Small value used for comparisons with floating point values.
let u, v, o; // u and v are base vectors. o is the origin vector aka. o = (0, 0).

let top_bound; // Top boundary of the screen (y value).
let left_bound; // Left boundary of the screen (x value).
let bottom_bound; // Bottom boundary of the screen (y value).
let right_bound; // Right boundary of the screen (x value).

let down; // A unit vector that points down.
let right; // A unit vector that points right.

let scl; // The size of the vectors in pixels. Size of a unit in pixels.

function setup() {
	// Creates the html canvas on wich to draw all things.
	createCanvas(windowWidth, windowHeight);

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

	u = new UserVector(1, 0, color(133, 192, 104));
	v = new UserVector(0, 1, color(235, 92, 79));
	vectr = new UserVector(1, 1);
}

function draw() {
	background(0);
	translate(width/2, height/2);
	scale(1, -1); // Invert the y coordinates so the + direction is upwards.

	// Draw fixed grid.
	if (draw_fixed_grid) {
		strokeWeight(1);
		stroke(70);
		for (let x = 0; x <= width / 2; x += scl) {
			paralel_line(down, createVector(x, 0));
			if (x != 0)
				paralel_line(down, createVector(-x, 0));
		}
		for (let y = 0; y <= height / 2; y += scl) {
			paralel_line(right, createVector(0, y));
			if (y != 0)
				paralel_line(right, createVector(0, -y));
		}
	}

	// Draw transformed grid.
	strokeWeight(3.5);
	stroke(63, 106, 115);
	for (let i = 0; i < width / (2 * scl); i++) {
		paralel_line_space(v, p5.Vector.mult(u, i * scl));
		if (i != 0)
			paralel_line_space(v, p5.Vector.mult(u, -i * scl));
	}
	for (let i = 0; i < height / (2 * scl); i++) {
		paralel_line_space(u, p5.Vector.mult(v, i * scl));
		if (i != 0)
			paralel_line_space(u, p5.Vector.mult(v, -i * scl));
	}

	// Draw half size transformed grid.
	strokeWeight(1);
	stroke(63, 106, 115, 100);
	for (let i = 0; i < width / scl; i++) {
		paralel_line_space(v, p5.Vector.mult(u, i * scl / 2));
		if (i != 0)
			paralel_line_space(v, p5.Vector.mult(u, -i * scl / 2));
	}
	for (let i = 0; i < height / scl; i++) {
		paralel_line_space(u, p5.Vector.mult(v, i * scl / 2));
		if (i != 0)
			paralel_line_space(u, p5.Vector.mult(v, -i * scl / 2));
	}

	stroke(122);
	paralel_line_space(u, o);
	paralel_line_space(v, o);

	u.draw();
	v.draw();
	vectr.draw();

	vectr.set_basis(u, v);
}


