import { buildReliefMesh, reliefPlacement, type KitCardImage } from "./photoRelief";

/** Draws a kit card photo turned round its vertical axis with WebGL, over a transparent background. */
export interface PhotoReliefRenderer {
  /** Resizes the drawing buffer to the canvas' CSS size times `pixelRatio`. */
  resize(pixelRatio: number): void;
  /** Draws the photo turned `angle` radians (0 = as photographed; positive turns its front to the right). */
  draw(angle: number): void;
  dispose(): void;
}

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aUv;
uniform vec2 uRotation;
uniform vec2 uScale;
uniform float uAxisX;
varying vec2 vUv;
void main() {
  float x = aPosition.x * uRotation.x + aPosition.z * uRotation.y;
  float towardCamera = aPosition.z * uRotation.x - aPosition.x * uRotation.y;
  gl_Position = vec4(uAxisX + x * uScale.x, aPosition.y * uScale.y, -towardCamera * 0.5, 1.0);
  vUv = aUv;
}`;

// Two passes: solid pixels first (writing depth), then the soft cut-out edges blended over them. The -0.5 mipmap
// bias keeps the photo as sharp as the still <img>: plain trilinear filtering blends in the half-size level early.
const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uPhoto;
uniform float uEdges;
varying vec2 vUv;
void main() {
  vec4 colour = texture2D(uPhoto, vUv, -0.5);
  if (uEdges < 0.5 ? colour.a < 0.98 : (colour.a >= 0.98 || colour.a < 0.01)) discard;
  gl_FragColor = colour;
}`;

type GL = WebGLRenderingContext | WebGL2RenderingContext;

function compile(gl: GL, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: GL): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (program && gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  if (program) gl.deleteProgram(program);
  return null;
}

function buffer(gl: GL, target: number, data: BufferSource): WebGLBuffer | null {
  const created = gl.createBuffer();
  if (!created) return null;
  gl.bindBuffer(target, created);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return created;
}

/**
 * The photo WebGL 1 can mipmap: redrawn at a power-of-two size (WebGL 2 mipmaps the photo as it is, which keeps it
 * sharper, as nothing is resampled before the GPU draws it).
 */
function powerOfTwo(photo: HTMLImageElement): TexImageSource {
  const size = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(n, 1)));
  const canvas = document.createElement("canvas");
  canvas.width = size(photo.naturalWidth);
  canvas.height = size(photo.naturalHeight);
  const context = canvas.getContext("2d");
  if (context) {
    context.imageSmoothingQuality = "high";
    context.drawImage(photo, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/**
 * Sets up WebGL on `canvas` for `image`, painted with the decoded `photo`. Returns null when WebGL is unavailable
 * or fails to set up, so the caller keeps showing the still photo.
 */
export function createPhotoReliefRenderer(
  canvas: HTMLCanvasElement,
  image: KitCardImage,
  photo: HTMLImageElement,
): PhotoReliefRenderer | null {
  const attributes: WebGLContextAttributes = {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  };
  const gl: GL | null = canvas.getContext("webgl2", attributes) ?? canvas.getContext("webgl", attributes);
  if (!gl) return null;
  const webgl2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

  const program = link(gl);
  if (!program) return null;
  const mesh = buildReliefMesh(image);
  const positions = buffer(gl, gl.ARRAY_BUFFER, mesh.positions);
  const uvs = buffer(gl, gl.ARRAY_BUFFER, mesh.uvs);
  const indices = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
  const texture = gl.createTexture();
  if (!positions || !uvs || !indices || !texture) return null;

  gl.useProgram(program);
  const bind = (name: string, data: WebGLBuffer, size: number) => {
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, data);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };
  bind("aPosition", positions, 3);
  bind("aUv", uvs, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); // blend and mipmap the cut-out edges cleanly
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, webgl2 ? photo : powerOfTwo(photo));
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "uPhoto"), 0);

  const rotation = gl.getUniformLocation(program, "uRotation");
  const scale = gl.getUniformLocation(program, "uScale");
  const axisX = gl.getUniformLocation(program, "uAxisX");
  const edges = gl.getUniformLocation(program, "uEdges");
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return {
    resize(pixelRatio) {
      const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      const placement = reliefPlacement(image, width, height);
      gl.uniform2fv(scale, placement.scale);
      gl.uniform1f(axisX, placement.axisX);
    },
    draw(angle) {
      gl.uniform2f(rotation, Math.cos(angle), Math.sin(angle));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.depthMask(true);
      gl.uniform1f(edges, 0);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(false);
      gl.uniform1f(edges, 1);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    },
    dispose() {
      gl.deleteBuffer(positions);
      gl.deleteBuffer(uvs);
      gl.deleteBuffer(indices);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
