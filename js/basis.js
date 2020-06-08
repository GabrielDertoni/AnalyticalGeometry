class Basis extends math.DenseMatrix {
  static screen = math.identity(2);
	static fromAngle(ang) {
		return new Basis(
			[[cos(ang), -sin(ang)],
			 [sin(ang),  cos(ang)]]
		);
	}
	constructor(vecs) {
		super(vecs)
		if (math.det(this) == 0)
			console.warn("Bases can't have linearly dependent vectors.");
		
		if (this.size()[0] != this.size()[1])
			throw new Error("Dimention missmatch, basis matrix must be square.");
  }
  get i() {
    return this.subset(math.index(math.range(0, this.size()[1]), 0)).reshape([this.size()[1]]);
  }
  get j() {
    return this.subset(math.index(math.range(0, this.size()[1]), 1)).reshape([this.size()[1]]);
  }
}

class CoordinateSystem extends math.DenseMatrix {
	constructor(origin, basis) {
		let mat = math.concat(basis, origin.reshape([basis.size()[0], 1]), 1);
		mat = math.concat(mat, math.zeros([1, mat.size()[1]]), 0)
		mat = math.subset(mat, math.index(mat.size()[0]-1, mat.size()[1]-1), 1);
		super(mat);
		this.origin = origin;
		this.basis = basis;
	}
}

class Vector extends math.DenseMatrix {
  static screenOrigin = math.matrix([0, 0]);
  static vec2d(x, y, basis) {
    return new Vector([x, y], basis);
  }
	constructor(vec, basis) {
		super(vec);
		
		if (basis) this.basis = basis;
		else this.basis = Basis.screen;
	}
	get x() { return this._data[0]; }
	get y() { return this._data[1]; }
	get z() { return this._data[2]; }
	get w() { return this._data[3]; }
	set x(val) { this._data[0] = val; }
	set y(val) { this._data[1] = val; }
	set z(val) { this._data[2] = val; }
	set w(val) { this._data[3] = val; }
	transform(basis) {
		const res = math.multiply(
			basis.changeMatrix,
			this
		);
		return new Vector(res, basis);
	}
	invTransform(basis) {
		const res = math.multiply(
			basis.invChangeMatrix,
			this.vec
		);
		return new Vector(res, Basis.fromMatrix(invChangeMatrix))
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