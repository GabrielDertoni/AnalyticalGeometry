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
let global_coordinate_system;
let clickable_origin;
let rotation; // Used to denote the overall rotation of the basis.

// Animation parameters
let is_playing;

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
	
	// show_hitbox_checkbox = createCheckbox('Hitbox', show_hitbox);
	// show_hitbox_checkbox.changed(() => show_hitbox = show_hitbox_checkbox.checked());
	
	space_size_slider = createSlider(1, 10, 2, 0);
	space_size_slider.style('width', '80px');
	
	// add_vector_checkbox = createCheckbox('Add vector', add_vector);
	// add_vector_checkbox.changed(() => add_vector = add_vector_checkbox.checked());

	rotation_slider = createSlider(0, 360, 0, 0);
	rotation_slider.style('width', '180px');
  
	// g = new Conic(4, -4, 7, 12, 6, -8); // Elipse
	// g = new Conic(0, 0, -1, 1, 0, 0); // Parábola
	// g = new Conic(0, 0, 0, 1, -1, 0); // Uma reta
	// g = new Conic(1, -4, 4, -6, 12, 8); // Duas retas
	// g = new Conic(4, -4, 1, -8*sqrt(5), -16*sqrt(5), 0); // Parábola
	// g = new Conic(1.22, 2.8, - 1, 1, 5.66, - 2.05); // Hipérbole Cagada
	g = new Conic(4, -4, 1, -8*sqrt(5), -10, 0); // Parábola bugada
	
	// g = new Conic(32, 52, -7, 0, 0, 180);
	// g = new Conic(7, -6*sqrt(3), 13, 0, 0, -16);
	// g = new Conic(4, -5, -11, -1, 37, 52);
	// g = new Conic(1, 1, -2, -8*sqrt(2), -8*sqrt(2), 0);
	// g = new Conic(17, -12, 8, 0, 0, 0);
	// g = new Conic(1, 0, -1, 0, 0, -1);

	solve_btn = createButton("Resolver");
	solve_btn.mouseClicked(() => {
		is_playing = true;
		g.animateCoordSystemChange(global_coordinate_system, 0.005, () => is_playing = false);
	});

	// attatch_btn = createButton("Usar como base");
	// attatch_btn.mouseClicked(() => {
	// 	g.set_coordinate_system(global_coordinate_system);
	// })

	let group = new p5.Element(document.getElementById("controls"));
	let list_items = [
		draw_fixed_grid_checkbox,
		createNumberInput(g.a, "a", 5, val => { g.a = val; g.recalculate(); }),
		createNumberInput(g.b, "b", 5, val => { g.b = val; g.recalculate(); }),
		createNumberInput(g.c, "c", 5, val => { g.c = val; g.recalculate(); }),
		createNumberInput(g.d, "d", 5, val => { g.d = val; g.recalculate(); }),
		createNumberInput(g.e, "e", 5, val => { g.e = val; g.recalculate(); }),
		createNumberInput(g.f, "f", 5, val => { g.f = val; g.recalculate(); }),
		wrapDiv(solve_btn)
	]
	
	for (let i = 0; i < list_items.length; i++) {
		let li = createElement('li');
		list_items[i].parent(li);
		li.parent(group);
	}
	group.position(10, 10);
	group.mouseOver(() => mouse_over_group = true);
	group.mouseOut(() => mouse_over_group = false);

	equation_text = new p5.Element(document.getElementById("equation"));
	equation_info = new p5.Element(document.getElementById("equation-info"));
	equation_info.mouseClicked(() => {
		function printInfo(info) {
			let str = "";
			Object.keys(info).forEach(key => {
				if (typeof info[key] == "string")
					str += `${key}: ${info[key]}\n`;
				else {
					str += `${key}:\n`;
					info[key].forEach((el, i) => {
						str += `  ${(i + 1).toString()}. ${el}\n`;
					});
				}
				str += '\n';
			});
			return str;
		}
		alert(printInfo(g.info));
	});

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

	u = new UserVector(1, 0, "î", color(133, 192, 104), 5, "static");
	v = new UserVector(0, 1, "ĵ", color(235, 92, 79), 5, "static");

	global_coordinate_system = new CoordinateSystem(Vector.vec2d(o.x, o.y), new Basis([u, v]));

	// g = new Conic(4, -4, 7, 12, 6, -9);
}

function draw() {
	if (g.is_playing)
		equation_text.elt.textContent = g.toString(1);
	else
		equation_text.elt.textContent = g.toString();
	
	// updateSliders();
	// Update the slider values.
	space_size = space_size_slider.value();

	if (!is_playing) {
		const val = map(rotation_slider.value(), 0, 360, 0, TWO_PI);
		if (abs(val - rotation) > eps) {
			u.rotate(rotation - val);
			v.rotate(rotation - val);
			rotation = val;
			is_dragging = true;
		}
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
	global_coordinate_system.update(Vector.vec2d(o.x, o.y), new Basis([u, v]));
	// Draw the vectors.
	u.draw();
	v.draw();

	for (let i = 0; i < user_vectors.length; i++)
		user_vectors[i].draw();
	
  
	noFill();
	stroke(DEFAULT_COLOR);
	strokeWeight(2);
	g.draw();
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

function updateSliders() {
	if (abs(g.a - a_slider.value()) > eps ||
		abs(g.b - b_slider.value()) > eps ||
		abs(g.c - c_slider.value()) > eps ||
		abs(g.d - d_slider.value()) > eps ||
		abs(g.e - e_slider.value()) > eps ||
		abs(g.f - f_slider.value()) > eps) {
		if (!is_playing) {
			g.a = a_slider.value();
			g.b = b_slider.value();
			g.c = c_slider.value();
			g.d = d_slider.value();
			g.e = e_slider.value();
			g.f = f_slider.value();
			g.recalculate();
		} else {
			a_slider.elt.min = min(a_slider.elt.min, g.a);
			a_slider.elt.max = max(a_slider.elt.max, g.a);
			a_slider.value(g.a);
			
			b_slider.elt.min = min(b_slider.elt.min, g.b);
			b_slider.elt.max = max(b_slider.elt.max, g.b);
			b_slider.value(g.b);
			
			c_slider.elt.min = min(c_slider.elt.min, g.c);
			c_slider.elt.max = max(c_slider.elt.max, g.c);
			c_slider.value(g.c);
			
			d_slider.elt.min = min(d_slider.elt.min, g.d);
			d_slider.elt.max = max(d_slider.elt.max, g.d);
			d_slider.value(g.d);
			
			e_slider.elt.min = min(e_slider.elt.min, g.e);
			e_slider.elt.max = max(e_slider.elt.max, g.e);
			e_slider.value(g.e);
			
			f_slider.elt.min = min(f_slider.elt.min, g.f);
			f_slider.elt.max = max(f_slider.elt.max, g.f);
			f_slider.value(g.f);
		}
	}
}

function scaled(val) { return val instanceof p5.Vector ? p5.Vector.mult(val, scl) : val * scl; }
function unscaled(val) { return val instanceof p5.Vector ? p5.Vector.div(val, scl) : val * scl; }

function createNumberInput(val, lbl, legroom=5, callback=null) {
	const slider = createSlider(val - legroom, val + legroom, val, 0);
	const input = createInput(roundTo(val, 2).toString(), "number");
	input.changed(() => {
		slider.elt.min = min(slider.elt.min, input.value());
		slider.elt.max = max(slider.elt.max, input.value());
		slider.value(input.value());
		if (callback) callback(parseFloat(input.value()));
		input.value(roundTo(input.value(), 2));
	});
	slider.input(() => {
		input.value(roundTo(slider.value(), 2));
		if (callback) callback(parseFloat(slider.value()));
	})
	return wrapDiv(slider, input, label(lbl));
}