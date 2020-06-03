
class Matrix {
  static id(ord) {
    const result = new Array(ord);
    for (let i = 0; i < ord; i++) {
      result[i] = new Array(ord);
      for (let j = 0; j < ord; j++) {
        result[i][j] = i == j ? 1 : 0;
      }
    }
    return result;
  }
  static matmul(mat1, mat2) {
    if (mat1 instanceof Matrix) mat1 = mat1.mat;
    if (mat2 instanceof Matrix) mat2 = mat2.mat;
    const result = new Array(mat1.length);
    for(let i = 0; i < mat1.length; i++) {
      result[i] = new Array(mat2[0].length);
      for(let j = 0; j < mat2[0].length; j++) {
        let tmp = 0;
        for(let x = 0; x < mat2.length; x++) {
          tmp +=  mat1[i][x] * mat2[x][j];
        }
        result[i][j] = tmp;
      }
    }
    return result;
  }
  constructor(mat) {
    this.mat = mat;
    this.dim = [this.mat.length, this.mat[0].length];
  }
  copy() {
    const duplicate = [];
    for (const i of this.mat)
      duplicate.push(i.slice());

    return duplicate;
  }
  transpose() {
    return this.mat.map((l, i, all) => l.map((v, j) => all[j][i]));
  }
  det() {
    if (arrEq(this.dim, [2, 2])) {
      return this.mat[0][0] * this.mat[1][1] - this.mat[0][1] * this.mat[1][0];
    } else if (arrEq(this.dim, [3, 3])) {
      return (this.mat[0][0] * this.mat[1][1] * this.mat[2][2] +
              this.mat[0][1] * this.mat[1][2] * this.mat[2][0] +
              this.mat[0][2] * this.mat[1][0] * this.mat[2][1]) -
             (this.mat[2][0] * this.mat[1][1] * this.mat[0][2] +
              this.mat[2][1] * this.mat[1][2] * this.mat[0][0] +
              this.mat[2][2] * this.mat[1][0] * this.mat[0][1]);
    } else {
      throw new Error("Not supported.");
    }
  }
}

class Locus {
  constructor(a, b, c, d, e, f) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    this.mat = new Matrix(
      [[a, b / 2, d / 2],
       [b / 2, c, e / 2],
       [d / 2, e / 2, f]]
    );
    this.subm = new Matrix (
      [[a, b / 2],
       [b / 2, c]]
    );
    this.verify = b*b - 4*a*c;
    if (this.verify < 0) {
      console.log("Elíptico");
    } else if (this.verify > 0) {
      console.log("Hiperbólico");
    } else {
      console.log("Parabólico");
    }

    // Solve translation.
    const translatable = this.subm.det() != 0;
    if (!translatable) {
      if ((new Matrix([[-d / 2, b / 2],
                       [-e / 2, c    ]])).det() != 0 ||
          (new Matrix([[a    , -d / 2],
                       [b / 2, -e / 2]])).det() != 0) {
        throw new Error("Impossible to translate!");
      } else {
        throw new Error("Infinite translations are possible.");
      }
    } else {
      const [h, k] = solve2x2([a, b / 2, -d / 2], [b / 2, c, -e / 2])
      this.center = createVector(h, k);
      this.new_f = d / 2 * h + e / 2 * k + f;

      // Solve rotation.
      const cotg = (a - c) / b;
      this.rotation = atan(1 / cotg) / 2;
      const [new_a, new_c] = solve2x2([1, 1, a + c], [1, -1, sqrt(1 + pow(cotg, 2)) * b]);
      this.new_a = new_a;
      this.new_c = new_c;
    }
  }
  draw() {
    const a = 2*sqrt(-this.new_f / this.new_a);
    const b = 2*sqrt(-this.new_f / this.new_c);
    push();
    translate(this.center.x * scl, this.center.y * scl);
    rotate(this.rotation);
    ellipse(0, 0, a*scl, b*scl);
    pop();
  }
}

function solve2x2(eq1, eq2) {
  const mat = new Matrix([[eq1[0], eq1[1]],
                          [eq2[0], eq2[1]]]);

  const matx = new Matrix([[eq1[2], eq1[1]],
                           [eq2[2], eq2[1]]]);

  const maty = new Matrix([[eq1[0], eq1[2]],
                           [eq2[0], eq2[2]]]);

  const D = mat.det();
  const Dx = matx.det();
  const Dy = maty.det();
  console.assert(D != 0, "ERROR: D must be different from 0");
  
  const x = Dx / D;
  const y = Dy / D;
  return [x, y];
}