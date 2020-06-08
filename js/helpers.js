

function transform_mouse() {
	let transform = getMatrix();
	let mouse = createVector(mouseX, mouseY);
	// Apply the translate transformations.
	mouse.x -= transform.e;
	mouse.y -= transform.f;
	
	// Apply the other transformations like scaling and shear.
	mouse.x = mouse.x * transform.a + mouse.y * transform.c;
	mouse.y = mouse.x * transform.b + mouse.y * transform.d;
	return mouse;
}

function getMatrix() {
	return window.drawingContext.getTransform();
}

// Code from: https://stackoverflow.com/questions/27205018/multiply-2-matrices-in-javascript/48694670
function matrixDot (A, B) {
		var result = new Array(A.length).fill(0).map(row => new Array(B[0].length).fill(0));

		return result.map((row, i) => {
				return row.map((val, j) => {
						return A[i].reduce((sum, elm, k) => sum + (elm*B[k][j]) ,0)
				})
		})
}
function matrixTranspose(mat) {
	return mat[0].map((_, colIndex) => mat.map(row => row[colIndex]));
}

function arrEq(arr1, arr2) {
	if (arr1.length != arr2.length) return false;
	for (let i = 0; i < arr1.length; i++)
		if (arr1[i] != arr2[i]) return false;

	return true;
}

function label(text) {
  return createElement('label', text);
}

function wrapDiv(...elts) {
  let div = createDiv();
  elts.forEach(elt => elt.parent(div));
  return div;
}

function roundTo(num, decimals) {
  let power = 1;
  for (let i = 0; i < decimals; i++) power *= 10;
  return Math.round(num * power) / power;
}