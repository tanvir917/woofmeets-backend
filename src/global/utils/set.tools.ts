/**
 *
 * @param {Set<T>} a
 * @param {Set<T>} b
 * @description - Difference (a \ b): create a set that contains those elements of set a
 *  that are **not** in set b
 * @returns
 */
export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((i) => !b.has(i)));
}

/**
 *
 * @param {Set<T>} a
 * @param {Set<T>} b
 * @description - Intersection (a ∩ b):
 * create a set that contains those elements of set a that are also in set b.
 * @returns
 */
export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((i) => b.has(i)));
}

/**
 *
 * @param {Set<T>} a
 * @param {Set<T>} b
 * @description - Union (a ∪ b):
 * create a set that contains the elements of both set a and set b.
 * @returns
 */
export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a, ...b]);
}
