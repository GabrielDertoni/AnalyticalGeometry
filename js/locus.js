const IMPOSSIBLE_SYSTEM = null;
const INDETERMINATE_SYSTEM = NaN;

class Locus {
	constructor(a, b, c, d, e, f) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.e = e;
		this.f = f;
		this.i = createVector(1, 0);
		this.j = createVector(0, 1);
		this.o = createVector(0, 0);
		this.recalculate();
	}
	recalculate() {
		this.mat = math.matrix(
			[[this.a    , this.b / 2, this.d / 2],
			 [this.b / 2, this.c    , this.e / 2],
			 [this.d / 2, this.e / 2, this.f    ]]
		);
		const check = this.b * this.b - 4 * this.a * this.c;
		if (check < 0) {
			// console.log("Elíptico");
			this.type = "eliptical";
		} else if (check > 0) {
			// console.log("Hiperbólico");
			this.type = "hyperbolical";
		} else {
			// console.log("Parabólico");
			this.type = "parabolical";
		}
		const translation = this.solve_translation();

		if (translation == IMPOSSIBLE_SYSTEM) {
			// throw new Error("Impossible to translate!");
			[this.new_a, this.new_c, this.rotation] = this.solve_rotation();
			const new_d =  this.d * cos(this.rotation) + this.e * sin(this.rotation);
			const new_e = -this.d * sin(this.rotation) + this.e * cos(this.rotation);
			console.log(this.new_a, 0, this.new_c, new_d, new_e, this.f);
			if (new_d != 0 || new_e != 0) {
				// Retry to solve translation.
				if (this.new_a == 0) {
					const transl = this.solve_vertex(-this.new_c / new_d, -new_e / new_d, -this.f / new_d);
					this.center = createVector(transl[1], transl[0]);
					this.new_f = 0;
					this.new_d = new_d;
					this.new_e = 0;
				} else {
					const transl = this.solve_vertex(-this.new_a / new_e, -new_d / new_e, -this.f / new_e);
					this.center = createVector(transl[0], transl[1]);
					this.new_f = 0;
					this.new_e = new_e;
					this.new_d = 0;
				}
			}
		} else if (translation == INDETERMINATE_SYSTEM) {
			// throw new Error("Infinite translations are possible.");
		} else {
			this.center = createVector(translation[0], translation[1]);
			this.new_f = this.d / 2 * this.center.x + this.e / 2 * this.center.y + this.f;
			[this.new_a, this.new_c, this.rotation] = this.solve_rotation();

		}
	}
	solve_vertex = (a, b, c) => [-b / (2 * a), (4 * a * c - pow(b, 2)) / (4 * a)];
	solve_translation() {
		const submatrix = this.mat.subset(math.index([0,1], [0,1]));
		// Solve translation.
		// The vector representing what each line of the system equals to [-d / 2, -e / 2]
		const equals = math.multiply(-1, this.mat.subset(math.index([0, 1], 2)));
		return solveLinear(submatrix, equals);
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
	set_basis(i, j) {
		this.i = i;
		this.j = j;
	}
	set_origin(o) {
		this.o = o;
	}
	sampleY(x) {
		if (this.type === "parabolical") {
			if (this.new_a != 0) {
				const inner = -this.new_a * pow(x, 2) / this.new_e;
				return [inner, inner];
			} else {
				const inner = -this.new_d * x / this.new_c;
				if (inner >= 0) return [sqrt(inner), -sqrt(inner)];
				return [];
			}
		} else {
			const inner = (this.new_a * pow(x, 2) + this.new_f) / -this.new_c;
			if (inner >= 0) return [sqrt(inner), -sqrt(inner)];
			return [];
		}
	}
	sampleX(y) {
		if (this.type === "parabolical") {
			if (this.new_a != 0) {
				const inner = -this.new_e * y / -this.new_a;
				return [sqrt(inner), -sqrt(inner)];
			} else {
				const inner = -this.new_c * pow(y, 2) / this.new_d;
				if (inner >= 0) return [inner, inner];
				return [];
			}
		} else {
			const inner = (this.new_c * pow(y, 2) + this.new_f) / -this.new_a;
			if (inner >= 0) return [sqrt(inner), -sqrt(inner)];
			return [];
		}
	}
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
				(this.type === "parabolical"  && this.new_c != 0)) {
				v = (i / n) * (height / scl) - (height / (2*scl));
			} else {
				v = (i / n) * (figWidth / scl) - (figWidth / (2*scl));
			}
			if ((this.type === "hyperbolical" && this.new_c * this.new_f > 0) ||
				(this.type === "parabolical"  && this.new_c != 0)) {
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
	get localTransformationMatrix() {
		return math.matrix([[ cos(this.rotation), -sin(this.rotation), this.scenter.x],
							[ sin(this.rotation),  cos(this.rotation), this.scenter.y],
							[          0        ,           0        ,      1       ]]);
	}
	// Transformation matrix in order to transform according to some basis.
	get spaceTransformationMatrix() {
		return math.matrix([[this.i.x, this.j.x, scaled(this.o.x)],
							[this.i.y, this.j.y, scaled(this.o.y)],
							[     0  ,      0  ,      1          ]]);
	}
	get transformationMatrix() {
		return math.multiply(this.spaceTransformationMatrix,
							 this.localTransformationMatrix);
	}
	get scenter() { return scaled(this.center); }
	/*
	plst
   [[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]
	[ x, y ]]

	plst transposta
	[[x, x, x, x, x, x, x, x]
	 [y, y, y, y, y, y, y, y]]

	[[cos(t), -sen(t)]   *  [[x, x, x, x, x, x, x, x]
	 [sen(t),  cos(t)]]		 [y, y, y, y, y, y, y, y]]
	*/
	retransform(plst) {
		plst = math.concat(plst, math.ones([plst.length, 1]), 1);
		return math.transpose( // Transpose list of points to original shape
			math.multiply( // Apply the rotatin matrix to all points
				this.localTransformationMatrix,
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
			mat[0][2], mat[1][2],
		);
	}
	draw() {
		push();
		this.applyMatrix();
		if (this.type == "eliptical") {
			const A = 2 * sqrt(-this.new_f / this.new_a);
			const B = 2 * sqrt(-this.new_f / this.new_c);
			ellipse(0, 0, scaled(A), scaled(B));
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
}

function solveLinear(mat, vec) {
	if (mat.size().length != 2)
		throw new Error("Matrix must be 2 dimentional.");
	if (mat.size()[0] != mat.size()[1])
		throw new Error("Matrix must be square.");
	if (vec.size().length == 1 && mat.size()[1] != vec.size()[0])
		throw new Error(`Dimesion missmatch in second argument of solveLinear(), expected ${mat.size()[1]} but got ${vec.size()[0]}.`);

	const result = [];
	const D = math.det(mat);
	for (let i = 0; i < mat.size()[0]; i++) {
		// Select the desired row of the matrix and replace it with the "answer vector".
		const partialMat = math.subset(
			mat,
			math.index(math.range(0, mat.size()[1]), i),
			vec
		);
		const partialDet = math.det(partialMat);
		if (D == 0 && partialDet != 0) {
			console.warn("Impossible system.")
			return IMPOSSIBLE_SYSTEM;
		} else if (D != 0) {
			result.push(partialDet / D);
		}
	}
	if (D == 0) {
		console.warn("Indeterminate system.");
		return INDETERMINATE_SYSTEM;
	}
	return result;
}