export function invertMatrix(matrix: readonly number[]): number[] {
    const det =
        matrix[0] * (matrix[4] * matrix[8] - matrix[7] * matrix[5]) -
        matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
        matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);

    return [
        (matrix[4] * matrix[8] - matrix[7] * matrix[5]) / det,
        (matrix[2] * matrix[7] - matrix[1] * matrix[8]) / det,
        (matrix[1] * matrix[5] - matrix[2] * matrix[4]) / det,
        (matrix[5] * matrix[6] - matrix[3] * matrix[8]) / det,
        (matrix[0] * matrix[8] - matrix[2] * matrix[6]) / det,
        (matrix[3] * matrix[2] - matrix[0] * matrix[5]) / det,
        (matrix[3] * matrix[7] - matrix[6] * matrix[4]) / det,
        (matrix[6] * matrix[1] - matrix[0] * matrix[7]) / det,
        (matrix[0] * matrix[4] - matrix[3] * matrix[1]) / det,
    ];
}
