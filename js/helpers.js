

function transform_mouse() {
	let transform = window.drawingContext.getTransform();
	let mouse = createVector(mouseX, mouseY);
	// Apply the translate transformations.
	mouse.x -= transform.e;
	mouse.y -= transform.f;
	
	// Apply the other transformations like scaling and shear.
	mouse.x = mouse.x * transform.a + mouse.y * transform.c;
	mouse.y = mouse.x * transform.b + mouse.y * transform.d;
	return mouse;
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