import Vector from './Vector';

// TODO:
//      - generalize this for mat2, mat3 and mat4

export default class Matrix {
    constructor(m, type) {
        this.dim = 3;
        this.value = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]];
        if (m) {
            this.set(m, type);
        }
    }

    set (m, type) {
        if (m.value[0][0]) {
            this.value = m.value;
            this.dim = m.dim;
        }
        else if (m[0][0]) {
            this.value = m;
        }
    }

    rotateX (theta) {
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let T = [
            [1, 0, 0],
            [0, c, -s],
            [0, s, c]];

        this.value = this.getTransform(T);
    }

    rotateY (theta) {
        let c = Math.cos(theta);
        let s = Math.sin(theta);
        let T = [
            [c, 0, s],
            [0, 1, 0],
            [-s, 0, c]];

        this.value = this.getTransform(T);
    }

    getMult (v) {
        if (v[0][0] || (v.value && v.value[0][0])) {
            // TODO: what If v is a matrix
            console.log('TODO: what If v is a matrix');
        }
        else {
            // If v is a vector
            let A = new Vector(v);
            let B = [];
            for (let i = 0; i < A.dim; i++) {
                B.push(A.value[0] * this.value[i][0] + A.value[1] * this.value[i][1] + A.value[2] * this.value[i][2]);
            }
            return new Vector(B);
        }
    }

    getTransform (m) {
        let newMatrix = [];
        for (let row in m) {
            let t = m[row];
            let newRow = [];
            newRow.push(t[0] * this.value[0][0] + t[1] * this.value[1][0] + t[2] * this.value[2][0]);
            newRow.push(t[0] * this.value[0][1] + t[1] * this.value[1][1] + t[2] * this.value[2][1]);
            newRow.push(t[0] * this.value[0][2] + t[1] * this.value[1][2] + t[2] * this.value[2][2]);
            newMatrix.push(newRow);
        }
        return newMatrix;
    }

    getInv() {
        let M = new Matrix();
        let determinant = this.value[0][0] * (this.value[1][1] * this.value[2][2] - this.value[2][1] * this.value[1][2]) -
                            this.value[0][1] * (this.value[1][0] * this.value[2][2] - this.value[1][2] * this.value[2][0]) +
                            this.value[0][2] * (this.value[1][0] * this.value[2][1] - this.value[1][1] * this.value[2][0]);
        let invdet = 1 / determinant;
        M.value[0][0] = (this.value[1][1] * this.value[2][2] - this.value[2][1] * this.value[1][2]) * invdet;
        M.value[0][1] = -(this.value[0][1] * this.value[2][2] - this.value[0][2] * this.value[2][1]) * invdet;
        M.value[0][2] = (this.value[0][1] * this.value[1][2] - this.value[0][2] * this.value[1][1]) * invdet;
        M.value[1][0] = -(this.value[1][0] * this.value[2][2] - this.value[1][2] * this.value[2][0]) * invdet;
        M.value[1][1] = (this.value[0][0] * this.value[2][2] - this.value[0][2] * this.value[2][0]) * invdet;
        M.value[1][2] = -(this.value[0][0] * this.value[1][2] - this.value[1][0] * this.value[0][2]) * invdet;
        M.value[2][0] = (this.value[1][0] * this.value[2][1] - this.value[2][0] * this.value[1][1]) * invdet;
        M.value[2][1] = -(this.value[0][0] * this.value[2][1] - this.value[2][0] * this.value[0][1]) * invdet;
        M.value[2][2] = (this.value[0][0] * this.value[1][1] - this.value[1][0] * this.value[0][1]) * invdet;
        return M;
    }
}
