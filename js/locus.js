const IMPOSSIBLE_SYSTEM = null;
const INDETERMINATE_SYSTEM = "indeterminate";

class Conic {
	constructor(a, b, c, d, e, f) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.e = e;
		this.f = f;
		this.is_playing = false;
		this.coord_sys_from;
		this.coord_sys_to;
		this.recalculate();
	}
	recalculate() {
		this.mat = math.matrix(
			[[this.a    , this.b / 2, this.d / 2],
			 [this.b / 2, this.c    , this.e / 2],
			 [this.d / 2, this.e / 2, this.f    ]]
		);
		const check = this.b * this.b - 4 * this.a * this.c;
		if (check < 0) this.type = "eliptical";
		else if (check > 0) this.type = "hyperbolical";
		else this.type = "parabolical";
		
		const translation = this.solve_translation();
		if (translation === IMPOSSIBLE_SYSTEM) {
			[this.new_a, this.new_c, this.rotation] = this.solve_rotation();
			const new_d =  this.d * cos(this.rotation) + this.e * sin(this.rotation);
			const new_e = -this.d * sin(this.rotation) + this.e * cos(this.rotation);
			if (new_d != 0 || new_e != 0) {
				// Retry to solve translation.
				if (this.new_a === 0) {
					let transl = this.solve_vertex(-this.new_c / new_d, -new_e / new_d, -this.f / new_d);
					transl = Vector.vec2d(transl.y, transl.x);
					transl = transl.transform(Basis.fromAngle(this.rotation));
					this.new_d = new_d;
					this.coord_sys = new CoordinateSystem(transl, Basis.fromAngle(this.rotation));
					this.new_e = 0;
				} else {
					let transl = this.solve_vertex(-this.new_a / new_e, -new_d / new_e, -this.f / new_e);
					transl = transl.transform(Basis.fromAngle(this.rotation));
					this.new_e = new_e;
					this.coord_sys = new CoordinateSystem(transl, Basis.fromAngle(this.rotation));
					this.new_d = 0;
				}
				this.new_f = 0;
			}
		} else if (translation === INDETERMINATE_SYSTEM) {
			[this.new_a, this.new_c, this.rotation] = this.solve_rotation();
			if (this.b != 0) {
				this.coord_sys = new CoordinateSystem(Vector.vec2d(0, -this.d / this.b), Basis.fromAngle(this.rotation));
				const x = 0;
				const y = -this.d / this.b;
				this.new_f = this.d / 2 * x + this.e / 2 * y + this.f;
				this.new_d = 0;
				this.new_e = 0;
			} else if (this.a != 0) {
				this.coord_sys = new CoordinateSystem(Vector.vec2d(-this.d / (2 * this.a), 0), Basis.fromAngle(this.rotation));
				const x = -this.d / (2 * this.a);
				const y = 0;
				this.new_f = this.d / 2 * x + this.e / 2 * y + this.f;
				this.new_d = 0;
				this.new_e = 0;
			} else {
				this.coord_sys = new CoordinateSystem(Vector.vec2d(0, 0), Basis.fromAngle(this.rotation));
				this.new_f = this.f;
				this.new_d = this.d;
				this.new_e = this.e;
			}
		} else {
			this.new_f = this.d / 2 * translation.x + this.e / 2 * translation.y + this.f;
			[this.new_a, this.new_c, this.rotation] = this.solve_rotation();
			this.coord_sys = new CoordinateSystem(translation, Basis.fromAngle(this.rotation));
			this.new_d = 0;
			this.new_e = 0;
		}
		this.new_b = 0;
	}
	toString(decimals) {
		let variables = [this.a, this.b, this.c, this.d, this.e, this.f];
		let names = ['x²', 'xy', 'y²', 'x', 'y', ''];
		let str = "";
		for (let i = 0; i < variables.length; i++) {
			if (abs(variables[i]) > 0.01) {
				if (variables[i] > 0 && str.length > 0) str += " + ";
				else if (variables[i] < 0)
					if (str.length > 0) str += " - ";
					else str += "-";
				
				if (abs(roundTo(variables[i], 2)) - 1 != 0 || names[i] === '')
					if (decimals) str += abs(variables[i]).toFixed(decimals);
					else str += abs(roundTo(variables[i], 2)).toString();
				
				str += names[i];
			}
		}
		str += " = 0";
		return str;
	}
	// Find the vertex of a quadratic equation.
	solve_vertex = (a, b, c) => new Vector([-b / (2 * a), (4 * a * c - pow(b, 2)) / (4 * a)]);
	solve_translation() {
		const submatrix = this.mat.subset(math.index([0,1], [0,1]));
		// Solve translation.
		// The vector representing what each line of the system equals to [-d / 2, -e / 2]
		const equals = math.multiply(-1, this.mat.subset(math.index([0, 1], 2)));
		const result = solveLinear(submatrix, equals);
		if (result === INDETERMINATE_SYSTEM || result === IMPOSSIBLE_SYSTEM) return result;
		return new Vector(result);
	}
	solve_rotation() {
		// Solve rotation.
		if (this.b == 0) {
			this.new_a = this.a;
			this.new_c = this.c;
			const rotation = 0;
			return [this.a, this.c, rotation];
		} else {
			const cotg = (this.a - this.c) / this.b;
			const rotation = atan(sqrt(1 + pow(cotg, 2)) - cotg);
			const result = solveLinear(
				math.matrix(
					[[1, 1],
					 [1, -1]]
				),
				math.matrix(
					[this.a + this.c,
					 sqrt(1 + pow(cotg, 2)) * this.b]
				)
			);
			return result.concat(rotation);
		}
	}
	// set_coordinate_system(coord_sys) {
	// 	this.space_coord_sys = coord_sys;
	// 	[this.a, this.b, this.c, this.d, this.e, this.f] = this.get_equation_for(global_coordinate_system);
	// 	this.recalculate();
	// 	this.coord_sys = coord_sys;
	// }
	// Given a x value, calculate the y value(s) for that x.
	sampleY(x) {
		if (this.new_c != 0) {
			const a = this.new_c;
			const b = this.new_b * x + this.new_e;
			const c = this.new_a * pow(x, 2) + this.new_d * x + this.new_f;
			const delta = pow(b, 2) - 4 * a * c;
			if (delta >= 0) {
				return [
					(-b + sqrt(delta)) / (2*a),
					(-b - sqrt(delta)) / (2*a)
				];
			} else {
				return [];
			}
		} else {
			return [
				-(this.new_a * pow(x, 2) + this.new_d * x + this.new_f) / (this.new_b * x + this.new_e),
				-(this.new_a * pow(x, 2) + this.new_d * x + this.new_f) / (this.new_b * x + this.new_e)
			]
		}
	}
	// Given a y value, calculate the x value(s) for that y.
	sampleX(y) {
		if (this.new_a != 0) {
			const a = this.new_a;
			const b = this.new_b * y + this.new_d;
			const c = this.new_c * pow(y, 2) + this.new_e * y + this.new_f;
			const delta = pow(b, 2) - 4 * a * c;
			if (delta >= 0) {
				return [
					(-b + sqrt(delta)) / (2*a),
					(-b - sqrt(delta)) / (2*a)
				];
			} else {
				return [];
			}
		} else {
			return [
				-(this.new_c * pow(y, 2) + this.new_e * y + this.new_f) / (this.new_b * y + this.new_d),
				-(this.new_c * pow(y, 2) + this.new_e * y + this.new_f) / (this.new_b * y + this.new_d)
			];
		}
	}
	// Given a number n of points, try to sample n points scattered in the x or y axis of the screen.
	// Returns a list with two lists of points. Each list contains the points of one of the solutions to
	// the quadratic equations.
	sample(n) {
		let figWidth = width;
		let figHeight = height;
		if (this.type == "eliptical")
			figWidth = scl * 2 * sqrt(-this.new_f / this.new_a);
		
		figWidth *= 2;
		figHeight *= 2;

		const plst1 = [];
		const plst2 = [];
		for (let i = 0; i < n; i++) {
			let v;
			if ((this.type === "hyperbolical" && this.new_c * this.new_f > 0) ||
				(this.type === "parabolical"  && this.new_c != 0 && this.new_d != 0)) {
				v = (i / n) * (figHeight / scl) - (figHeight / (2*scl));
			} else {
				v = (i / n) * (figWidth / scl) - (figWidth / (2*scl));
			}
			if ((this.type === "hyperbolical" && this.new_c * this.new_f > 0) ||
				(this.type === "parabolical"  && this.new_c != 0 && this.new_d != 0)) {
				const xs = this.sampleX(v);
				if (xs.length > 0) {
					plst1.push([xs[0], v].map(scaled));
					plst2.push([xs[1], v].map(scaled));
				}
			} else {
				const ys = this.sampleY(v);
				if (ys.length > 0) {
					plst1.push([v, ys[0]].map(scaled));
					plst2.push([v, ys[1]].map(scaled));
				}
			}
		}
		return [plst1, plst2];
	}
	get transformationMatrix() {
		return this.coord_sys;
	}
	// Classify the conic by type
	get classification() {
		const t = this.a + this.c;
		const d11 = (this.c/2 * this.f) - (this.e/2 * this.e/2);
		const d22 = (this.a   * this.f) - (this.d/2 * this.d/2);
		const d33 = (this.a   * this.c) - (this.b/2 * this.b/2);
		
		const det = math.det(this.mat);

		if (d33 > 0)
			if (det != 0)
				if (t * det > 0) return "void";
				else return "ellipse";
			else return "point";
		else if (d33 < 0)
			if (det != 0) return "hyperbole";
			else return "competing_lines";
		else if (det != 0) return "parable";
		else if (d11 + d22 == 0) return "line";
		else if(d11 + d22 > 0) return "void";
		else if (this.a == 0 && this.b/2 == 0 && this.c == 0) return "line";
		else return "paralel_lines";
	}
	get info() {
		/*
			Classificação: <texto>
			Centro?: <centro>
			Focos?:
				1. <foco1>
				2. <foco2>
				...
			
			Vértice?:
				1. <vertice1>
				2. <vertice2>
				...
			
			Assíntotas?:
				1. <formula1>
				2. <formula2>
			
			Eixo?: <equação>
		*/
		const info = {};
		if (this.classification === "void")
			info["Classificação"] = "Conjunto Vazio";
		else if (this.classification === "ellipse") {
			info["Classificação"] = "Elipse";
			info["Centro"] = `C = (${roundTo(this.coord_sys.origin.x, 2)}, ${roundTo(this.coord_sys.origin.y, 2)})`;
			const a = sqrt(-this.new_f / this.new_a);
			const b = sqrt(-this.new_f / this.new_c);
			let f1, f2;
			if (a > b) {
				const c = sqrt(pow(a, 2) - pow(b, 2));
				f1 = new Point2D( c, 0);
				f2 = new Point2D(-c, 0);
			} else {
				const c = sqrt(pow(b, 2) - pow(a, 2));
				f1 = new Point2D(0, c);
				f2 = new Point2D(0, -c);
			}
			f1 = f1.transform(this.coord_sys);
			f2 = f2.transform(this.coord_sys);
			info["Focos"] = [
				`F1 = (${roundTo(f1.x, 2)}, ${roundTo(f1.y, 2)})`,
				`F2 = (${roundTo(f2.x, 2)}, ${roundTo(f2.y, 2)})`
			];
			const a1 = (new Point2D( a, 0)).transform(this.coord_sys);
			const a2 = (new Point2D(-a, 0)).transform(this.coord_sys);
			const b1 = (new Point2D(0, b)).transform(this.coord_sys);
			const b2 = (new Point2D(0,-b)).transform(this.coord_sys);
			info["Vértices"] = [
				`A1 = (${roundTo(a1.x, 2)}, ${roundTo(a1.y, 2)})`,
				`A2 = (${roundTo(a2.x, 2)}, ${roundTo(a2.y, 2)})`,
				`B1 = (${roundTo(b1.x, 2)}, ${roundTo(b1.y, 2)})`,
				`B2 = (${roundTo(b2.x, 2)}, ${roundTo(b2.y, 2)})`
			];
		} else if (this.classification === "hyperbole") {
			info["Classificação"] = "Hipérbole";
			info["Centro"] = `C = (${roundTo(this.coord_sys.origin.x, 2)}, ${roundTo(this.coord_sys.origin.y, 2)})`;
			const a = sqrt(abs(this.new_f / this.new_a));
			const b = sqrt(abs(this.new_f / this.new_c));
			const c = sqrt(pow(a, 2) + pow(b, 2));
			let f1, f2, v1, v2;
			if (Math.sign(this.new_c) * Math.sign(this.new_f) > 0) {
				f1 = new Point2D( c, 0);
				f2 = new Point2D(-c, 0);
				v1 = new Point2D( a, 0);
				v2 = new Point2D(-a, 0);
			} else {
				f1 = new Point2D(0, c);
				f2 = new Point2D(0,-c);
				v1 = new Point2D(0, b);
				v2 = new Point2D(0,-b);
			}
			f1 = f1.transform(this.coord_sys);
			f2 = f2.transform(this.coord_sys);
			v1 = v1.transform(this.coord_sys);
			v2 = v2.transform(this.coord_sys);
			info["Focos"] = [
				`F1 = (${roundTo(f1.x, 2)}, ${roundTo(f1.y, 2)})`,
				`F2 = (${roundTo(f2.x, 2)}, ${roundTo(f2.y, 2)})`
			];
			info["Vértices"] = [
				`V1 = (${roundTo(v1.x, 2)}, ${roundTo(v1.y, 2)})`,
				`V2 = (${roundTo(v2.x, 2)}, ${roundTo(v2.y, 2)})`
			];
			let [coefs1, coefs2] = this.get_asymptotes();
			info["Assíntotas"] = [
				"r: y = " + coefs2str([coefs1[0], coefs1[2]], ['x', ''], 2),
				"s: y = " + coefs2str([coefs2[0], coefs2[2]], ['x', ''], 2)
			];
		} else if (this.classification === "parable") {
			info["Classificação"] = "Parábola";
			let f;
			if (this.new_d != 0) {
				const p = this.new_d / 4;
				f = (new Point2D(p, 0)).transform(this.coord_sys);
			} else {
				const p = this.new_e / 4;
				f = (new Point2D(0, p)).transform(this.coord_sys);
			}
			
			info["Foco"] = `F = (${roundTo(f.x, 2)}, ${roundTo(f.y, 2)})`;
			info["Vértice"] = `V = (${roundTo(this.coord_sys.origin.x, 2)}, ${roundTo(this.coord_sys.origin.y, 2)})`;
			const coefs1 = vec2coef(this.coord_sys.origin, this.coord_sys.basis.i);
			const coefs2 = vec2coef(this.coord_sys.origin, this.coord_sys.basis.j);
			info["Eixos"] = [
				"r: y = " + coefs2str([coefs1[0], coefs1[2]], ['x', ''], 2),
				"s: y = " + coefs2str([coefs2[0], coefs2[2]], ['x', ''], 2)
			];
		} else if (this.classification === "competing_lines") {
			info["Classificação"] = "Retas Concorrentes";
		} else if (this.classification === "paralel_lines") {
			info["Classificação"] = "Retas Paralelas";
		} else if (this.classification === "line") {
			info["Classificação"] = "Reta";
		} else if (this.classification === "point") {
			info["Classificação"] = "Ponto";
		}
		return info;
	}
	retransform(plst) {
		plst = math.concat(plst, math.ones([plst.length, 1]), 1);
		return math.transpose( // Transpose list of points to original shape
			math.multiply( // Apply the rotatin matrix to all points
				this.new_coord_sys,
				math.transpose(plst) // Transpose the list of points for dot product.
			)
		).toArray();
	}
	transform(plst) {
		plst = math.concat(plst, math.ones([plst.length, 1]), 1);
		return math.transpose( // Transpose list of points to original shape
			math.multiply( // Apply the rotation matrix to all points.
				this.transformationMatrix,
				math.transpose( // Transpose the list of points for dot product.
					plst // Get points in the retransformed (original) form.
				)
			)
		).toArray()
	}
	applyMatrix() {
		let mat = this.transformationMatrix.toArray();
		applyMatrix(
			mat[0][0], mat[1][0],
			mat[0][1], mat[1][1],
			scaled(mat[0][2]), scaled(mat[1][2]),
		);
	}
	draw() {
		push();
		this.applyMatrix();
		if (this.classification == "ellipse") {
			const A = 2 * sqrt(-this.new_f / this.new_a);
			const B = 2 * sqrt(-this.new_f / this.new_c);
			ellipse(0, 0, scaled(A), scaled(B));
		} else if (this.classification === "point") {
			strokeWeight(10);
			point(0, 0);
		} else {
			const n = 1000;
			let [plst1, plst2] = this.sample(n);
			if (this.type == "hyperbolical") {
				beginShape();
				plst1.forEach(vec => curveVertex(vec[0], vec[1]));
				endShape();
				beginShape();
				plst2.forEach(vec => curveVertex(vec[0], vec[1]));
				endShape();
			} else {
				beginShape();
				plst1.forEach(vec => curveVertex(vec[0], vec[1]));
				endShape();
				beginShape();
				plst2.forEach(vec => curveVertex(vec[0], vec[1]));
				endShape();
			}
		}
		pop();
	}
	animateCoordSystemChange(coord_sys_to, step, finish_callback, lerp=0) {
		if (coord_sys_to) {
			this.coord_sys_from = this.coord_sys.copy();
			this.coord_sys_to = coord_sys_to;
			this.is_playing = true;
		} else {
			this.coord_sys = CoordinateSystem.lerp(this.coord_sys_from, this.coord_sys_to, lerp);
			[this.a, this.b, this.c, this.d, this.e, this.f] = this.get_equation_for(this.coord_sys_to);
		}
		if (lerp < 1) window.requestAnimationFrame(() => this.animateCoordSystemChange(null, step, finish_callback, lerp + step));
		else {
			this.is_playing = false;
			[this.a, this.b, this.c, this.d, this.e, this.f] = this.get_equation_for(this.coord_sys_to);
			this.recalculate();
			
			if (finish_callback) window.requestAnimationFrame(finish_callback);
		}
	}
	get_asymptotes() {
		if (this.classification != "hyperbole") return null;
		const a = sqrt(abs(this.new_f / this.new_a));
		const b = sqrt(abs(this.new_f / this.new_c));
		const m = b / a;

		const w = Vector.vec2d(1, m);
		const t = Vector.vec2d(1,-m);

		const w_s = w.transform(this.coord_sys.basis);
		const t_s = t.transform(this.coord_sys.basis);

		return [
			vec2coef(this.coord_sys.origin, w_s),
			vec2coef(this.coord_sys.origin, t_s)
		];
	}
	get_equation_for(new_coord_sys) {
		// const coord_sys_s = this.coord_sys.inv();
		const sys = CoordinateSystem.fromMatrix(math.multiply(
			this.coord_sys.inv(),
			new_coord_sys
		));
		// const sys = new_coord_sys.inv();

		// const sys = new_coord_sys.inv();
		const i = sys.basis.i;
		const j = sys.basis.j;
		const o = sys.origin;

		const a = this.new_a * pow(i.x, 2) + this.new_b * i.x * i.y + this.new_c * pow(i.y, 2);
		const b = 2 * this.new_a * i.x * j.x + this.new_b * (i.x * j.y + i.y * j.x) + 2 * this.new_c * i.y * j.y;
		const c = this.new_a * pow(j.x, 2) + this.new_b * j.x * j.y + this.new_c * pow(j.y, 2);
		const d = 2 * this.new_a * o.x * i.x + this.new_b * (o.x * i.y + o.y * i.x) + 2 * this.new_c * o.y * i.y + this.new_d * i.x + this.new_e * i.y;
		const e = 2 * this.new_a * o.x * j.x + this.new_b * (o.x * j.y + o.y * j.x) + 2 * this.new_c * o.y * j.y + this.new_d * j.x + this.new_e * j.y;
		const f = this.new_a * pow(o.x, 2) + this.new_b * o.x * o.y + this.new_c * pow(o.y, 2) + this.new_d * o.x + this.new_e * o.y + this.new_f;
		return [a, b, c, d, e, f];
	}
}

function vec2coef(point, vec) {
	return [vec.y / vec.x, -1, -point.x * (vec.y / vec.x) + point.y];
}

function coefs2str(coefs, names, decimals) {
	let str = "";
	for (let i = 0; i < coefs.length; i++) {
		if (abs(coefs[i]) > 0.01) {
			if (coefs[i] > 0 && str.length > 0) str += " + ";
			else if (coefs[i] < 0)
				if (str.length > 0) str += " - ";
				else str += "-";
			
			if (abs(roundTo(coefs[i], 2)) - 1 != 0 || names[i] === '')
				if (decimals) str += abs(coefs[i]).toFixed(decimals);
				else str += abs(roundTo(coefs[i], 2)).toString();
			
			str += names[i];
		}
	}
	return str;
}