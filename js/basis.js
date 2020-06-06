class Basis {
	constructor(u, v) {
		this.u = u;
		this.v = v;
	}
	get changeMatrix() {
		return math.matrix(
			[[this.u.x, this.u.y],
			 [this.v.x, this.v.y]]
		);
	}
	get invChangeMatrix() { return math.inv(this.changeMatrix); }
}

class CoordinateSystem {
	constructor(origin, basis) {
		this.origin = origin;
		this.basis = basis;
	}
	get transformationMatrix() {
		return math.matrix(
			[[this.basis.u.x, this.basis.v.x, this.origin.x],
			 [this.basis.u.y, this.basis.u.y, this.origin.y],
			 [     0        ,      0        ,      1       ]]
		);
	}
	get invTransformationMatrix() { return math.inv(this.transformationMatrix); }
}

class Vector {
	static fromArray(vec, basis) {
		return new Vector(vec, basis);
	}
	constructor(x, y, basis) {
		this.vec = [x, y];
		if (basis) this.basis = basis;
		else this.basis = screenBasis;
	}
	transform(basis) {
		const res = math.multiply(
			basis.changeMatrix,
			this.vec
		);
		return new Vector(res, basis);
	}
	invTransform(basis) {
		const res = math.multiply(
			basis.invChangeMatrix,
			[this.x, this.y]
		);
		return new Vector(res, basis)
	}
}

class Point {
	constructor(x, y, coord_sys) {
		this.x = x;
		this.y = y;
		if (coord_sys) this.coord_sys = coord_sys;
		else this.coord_sys = screenCoordSys;
	}
	transform(coord_sys) {
		return math.multiply
	}
}