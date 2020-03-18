/*
 * This files contains a set of functions for drawing lines, arrows, etc.
 */

function vector_arrow(vector, point) {
	let offset = 16;
	let dest = p5.Vector.add(point, vector);
	let end = p5.Vector.sub(dest, dest.copy().normalize().mult(offset * 0.5));
	line(point.x, point.y, end.x, end.y);

	push() //start new drawing state
    let angle = atan2(-vector.y, -vector.x); //gets the angle of the line
    translate(dest.x, dest.y); //translates to the destination vertex
    rotate(angle - HALF_PI); //rotates the arrow point
	noStroke();
    triangle(-offset * 0.5, offset * 1.4, offset * 0.5, offset * 1.4, 0, -offset * 0.1); //draws the arrow point as a triangle
    pop();
}

function paralel_line_space(vector, point) {
	let top_line = line_intersection(vector, point, u, p5.Vector.mult(v, top_bound));
	let bottom_line = line_intersection(vector, point, u, p5.Vector.mult(v, bottom_bound));
	
	// Check whether the line is paralel to the left and right borders.
	if (v.cross(vector).mag() < eps) {
		line(top_line.x, top_line.y, bottom_line.x, bottom_line.y);
		return;
	}

	let left_line = line_intersection(vector, point, v, p5.Vector.mult(u, left_bound));
	let right_line = line_intersection(vector, point, v, p5.Vector.mult(u, right_bound));
	
	line(left_line.x, left_line.y, right_line.x, right_line.y);
}

function straight_line(p1, p2) {
	let vec = p5.Vector.sub(p2, p1);

	paralel_line(vec, p1);
}


function paralel_line(vector, point) {
	// Check whether the line is paralel to the left and right borders.
	if (down.cross(vector).mag() < eps) {
		line(point.x, top_bound, point.x, bottom_bound);
		return;
	}

	// Calculates where the line intersects with the boudary lines of the screen.
	let left_line = line_intersection(vector, point, down, createVector(left_bound, top_bound));
	let right_line = line_intersection(vector, point, down, createVector(right_bound, bottom_bound));
	
	// Check whether the line is outside of the screen.
	if ((left_line.y < top_bound && right_line.y < top_bound) || (left_line.y > bottom_bound && right_line.y > bottom_bound)) {
		return;
	}

	// Decide where the line should sart beeing drawn so that it starts at the begining of the screen.
	let start, end;

	if (left_line.y < top_bound) {
		let top_line = line_intersection(vector, point, createVector(1, 0), createVector(left_bound, top_bound));
		start = createVector(top_line.x, top_bound);
	} else if (left_line.y > bottom_bound) {
		let bottom_line = line_intersection(vector, point, createVector(1, 0), createVector(left_bound, bottom_bound));
		start = createVector(bottom_line.x, bottom_bound);
	} else {
		start = createVector(left_bound, left_line.y);
	}
	
	if (right_line.y < top_bound) {
		let top_line = line_intersection(vector, point, createVector(1, 0), createVector(left_bound, top_bound));
		end = createVector(top_line.x, top_bound);
	} else if (right_line.y > bottom_bound) {
		let bottom_line = line_intersection(vector, point, createVector(1, 0), createVector(left_bound, bottom_bound));
		end = createVector(bottom_line.x, bottom_bound);
	} else {
		end = createVector(right_bound, right_line.y);
	}
	line(start.x, start.y, end.x, end.y);
}

function line_intersection(v1, p1, v2, p2) {
	let dx = p2.x - p1.x;
	let dy = p2.y - p1.y;
	let den = v1.x * v2.y - v1.y * v2.x;
	if (den == 0) {
		if (v1.y * dx > v1.y * dy)
			return {x: v2.x == 0 ? 0 : v2.x * Infinity, y: v2.y == 0 ? 0 : v2.y * Infinity, z: 0};
		else
			return {x: v2.x == 0 ? 0 : v2.x * -Infinity, y: v2.y == 0 ? 0 : v2.y * -Infinity, z: 0};
	}

	let alpha = (v1.y * dx - v1.x * dy) / den;
	//console.log(alpha);
	return p5.Vector.add(p2, p5.Vector.mult(v2, alpha));
}
