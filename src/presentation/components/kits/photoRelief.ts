/**
 * A kit card photo with the depth it turns with: a grid of vertices over the photo, each pushed toward or away
 * from the camera, so turning it a little round a vertical axis looks like turning the bag. The photo and the
 * depths come from scripts/kit-cards/build.py.
 */

export interface PhotoRelief {
  /** Vertices across and down the photo. */
  columns: number;
  rows: number;
  /** Where the vertical axis the bag turns round crosses the photo, as a fraction of its width. */
  axis: number;
  /** Depth of each vertex toward the camera, row by row from the top: base64 bytes, depthMin + byte × depthStep. */
  depth: string;
  /** In photo heights. */
  depthMin: number;
  depthStep: number;
}

/** A cut-out photo (transparent background) in public/images/kit-cards/ and its relief. */
export interface KitCardImage {
  src: string;
  width: number;
  height: number;
  relief: PhotoRelief;
}

export interface ReliefMesh {
  /** x, y, z per vertex in photo heights: x from the turning axis, y up from the middle, z toward the camera. */
  positions: Float32Array<ArrayBuffer>;
  /** u, v per vertex: 0..1 across and down the photo. */
  uvs: Float32Array<ArrayBuffer>;
  indices: Uint16Array<ArrayBuffer>;
}

export function decodeDepth(relief: PhotoRelief): Float32Array {
  const bytes = Uint8Array.from(atob(relief.depth), (char) => char.charCodeAt(0));
  if (bytes.length !== relief.columns * relief.rows) throw new RangeError("Relief depth does not match its grid");
  return Float32Array.from(bytes, (byte) => relief.depthMin + byte * relief.depthStep);
}

export function buildReliefMesh(image: KitCardImage): ReliefMesh {
  const { columns, rows, axis } = image.relief;
  if (columns < 2 || rows < 2 || columns * rows > 0xffff) throw new RangeError("Unsupported relief grid");
  const depth = decodeDepth(image.relief);
  const aspect = image.width / image.height;
  const positions = new Float32Array(columns * rows * 3);
  const uvs = new Float32Array(columns * rows * 2);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const k = row * columns + column;
      const u = column / (columns - 1);
      const v = row / (rows - 1);
      positions.set([(u - axis) * aspect, 0.5 - v, depth[k]], k * 3);
      uvs.set([u, v], k * 2);
    }
  }
  const indices = new Uint16Array((columns - 1) * (rows - 1) * 6);
  let n = 0;
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const a = row * columns + column;
      const b = a + columns;
      indices.set([a, b, a + 1, a + 1, b, b + 1], n);
      n += 6;
    }
  }
  return { positions, uvs, indices };
}

/**
 * How the unturned photo sits in a canvas of `width` × `height` pixels, like CSS `object-fit: contain` places
 * the still photo: the clip-space size of one photo height (x, y) and the clip-space x of the turning axis.
 */
export function reliefPlacement(image: KitCardImage, width: number, height: number) {
  const aspect = image.width / image.height;
  const photoHeight = Math.min(height, width / aspect); // pixels
  const scale: [number, number] = [(2 * photoHeight) / width, (2 * photoHeight) / height];
  const axisX = (image.relief.axis - 0.5) * aspect * scale[0];
  return { scale, axisX };
}
