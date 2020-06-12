class Basis extends math.DenseMatrix {
  static screen = math.identity(2);
	static fromAngle(ang) {
		return new Basis(
			[[ cos(ang), sin(ang)],
			 [-sin(ang), cos(ang)]]
		);
	}
	static fromMatrix(mat) { return mat instanceof math.Matrix ? new Basis(mat.toArray()) : new Basis(mat); }
	constructor(vecs) {
		vecs = math.transpose(vecs.map(el => el instanceof p5.Vector ? Vector.vec2d(el.x, el.y) : el));
		super(vecs)
		if (math.det(this) == 0)
			console.warn("Bases can't have linearly dependent vectors.");
		
		if (this.size()[0] != this.size()[1])
			throw new Error("Dimention missmatch, basis matrix must be square.");
	}
	copy() {
		return new Basis(math.transpose(math.matrix(this).toArray()));
	}
	get i() {
		return new Vector(this.subset(math.index(math.range(0, this.size()[1]), 0)).reshape([this.size()[1]]));
	}
	get j() {
		return new Vector(this.subset(math.index(math.range(0, this.size()[0]), 1)).reshape([this.size()[1]]));
	}
	set i(val) {
		if (val instanceof p5.Vector) val = math.matrix([val.x, val.y]);
		this.subset(math.index(math.range(0, this.size()[1]), 0), val);
	}
	set j(val) {
		if (val instanceof p5.Vector) val = math.matrix([val.x, val.y]);
		this.subset(math.index(math.range(0, this.size()[0]), 1), val);
	}
}

class CoordinateSystem extends math.DenseMatrix {
	static screen = math.identity(3);
	static lerp(from, to, val) {
		return CoordinateSystem.fromMatrix(math.add(from, math.multiply(math.subtract(to, from), val)));
	}
	static fromMatrix(mat) {
		mat = math.matrix(mat);
		return new CoordinateSystem(
			new Vector(
				mat.subset(math.index(math.range(0, mat.size()[0]-1), mat.size()[1]-1)).reshape([mat.size()[0]-1])
			),
			Basis.fromMatrix(
				math.transpose(mat.subset(math.index(math.range(0, mat.size()[0]-1), math.range(0, mat.size()[1]-1))))
			)
		);
	}
	constructor(origin, basis) {
		let mat = math.concat(basis, origin.reshape([basis.size()[0], 1]), 1);
		mat = math.concat(mat, math.zeros([1, mat.size()[1]]), 0)
		mat = math.subset(mat, math.index(mat.size()[0]-1, mat.size()[1]-1), 1);
		super(mat);
		this.origin = origin;
		this.basis = basis;
	}
	update(origin, basis) {
		let mat = math.concat(basis, origin.reshape([basis.size()[0], 1]), 1);
		mat = math.concat(mat, math.zeros([1, mat.size()[1]]), 0)
		mat = math.subset(mat, math.index(mat.size()[0]-1, mat.size()[1]-1), 1);
		this._data = mat.toArray();
		this.origin = new Vector(origin);
		this.basis = new Basis(basis);
	}
	copy() {
		return new CoordinateSystem(this.origin.copy(), this.basis.copy());
	}
	inv() { return CoordinateSystem.fromMatrix(math.inv(this)); }
}

class Vector extends math.DenseMatrix {
	static screenOrigin = math.matrix([0, 0]);
	static vec2d(x, y, basis) {
		return new Vector([x, y], basis);
	}
	constructor(vec, basis) {
		super(vec);
		this.reshape([max(this.size())]);
		if (basis) this.basis = basis;
		else this.basis = Basis.screen;
	}
	get x() {
		this.reshape([max(this.size())]);
		return this._data[0];
	}
	get y() {
		this.reshape([max(this.size())]);
		return this._data[1];
	}
	get z() {
		this.reshape([max(this.size())]);
		return this._data[2];
	}
	get w() { return this._data[3]; }
	set x(val) { this._data[0] = val; }
	set y(val) { this._data[1] = val; }
	set z(val) { this._data[2] = val; }
	set w(val) { this._data[3] = val; }
	set_basis(basis) {
		this.basis = basis;
	}
	transform(basis) {
		return new Vector(math.multiply(
			basis,
			this
		));
	}
	copy() { return new Vector(math.matrix(this), this.basis); }
	multiply(val) { return new Vector(math.multiply(this, val), this.basis); }
	mult(val) { return this.multiply(val); }
	add(val) { return new Vector(math.add(this, val), this.basis); }
	divide(val) { return new Vector(math.divide(this, val), this.basis); }
	div(val) { return this.divide(val); }
	p5Vector() { return createVector(this.x, this.y); }
}

class Point2D {
	constructor(x, y, coord_sys) {
		this.x = x;
		this.y = y;
		if (coord_sys) this.coord_sys = coord_sys;
		else this.coord_sys = CoordinateSystem.screen;
	}
	transform(coord_sys) {
		const result = math.multiply(
			coord_sys,
			[this.x, this.y, 1]
		).toArray();
		return new Point2D(result[0], result[1], coord_sys);
	}
}