import { buildTurntableMesh, viewportScale, type TurntableShape } from "./mesh";

/** Draws a turntable model with WebGL: an unlit, textured mesh seen straight on (orthographic). */
export interface TurntableRenderer {
  /** Resizes the drawing buffer to the canvas' CSS size times `pixelRatio`. */
  resize(pixelRatio: number): void;
  /** Draws the model turned `angle` radians (0 = front, increasing turns its front to the right). */
  draw(angle: number): void;
  dispose(): void;
}

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aUv;
uniform vec2 uRotation;
uniform vec2 uScale;
uniform float uCenterY;
varying vec2 vUv;
void main() {
  float x = aPosition.x * uRotation.x + aPosition.z * uRotation.y;
  float towardCamera = aPosition.z * uRotation.x - aPosition.x * uRotation.y;
  gl_Position = vec4(x * uScale.x, (aPosition.y - uCenterY) * uScale.y, -towardCamera, 1.0);
  vUv = aUv;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uTexture, vUv).rgb, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGLRenderingContext): WebGLProgram | null {
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

function buffer(gl: WebGLRenderingContext, target: number, data: BufferSource): WebGLBuffer | null {
  const created = gl.createBuffer();
  if (!created) return null;
  gl.bindBuffer(target, created);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return created;
}

/**
 * Sets up WebGL on `canvas` for `shape`, painted with the decoded `texture` image. Returns null when WebGL is
 * unavailable or fails to set up, so the caller keeps showing the poster.
 */
export function createTurntableRenderer(
  canvas: HTMLCanvasElement,
  shape: TurntableShape,
  texture: TexImageSource,
): TurntableRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const program = link(gl);
  if (!program) return null;
  const mesh = buildTurntableMesh(shape);
  const positions = buffer(gl, gl.ARRAY_BUFFER, mesh.positions);
  const uvs = buffer(gl, gl.ARRAY_BUFFER, mesh.uvs);
  const indices = buffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
  const image = gl.createTexture();
  if (!positions || !uvs || !indices || !image) return null;

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
  gl.bindTexture(gl.TEXTURE_2D, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture);
  // The baked texture is a power of two, so it can be mipmapped and wrap round the seam.
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
  gl.uniform1f(gl.getUniformLocation(program, "uCenterY"), shape.viewport.centerY);

  const rotation = gl.getUniformLocation(program, "uRotation");
  const scale = gl.getUniformLocation(program, "uScale");
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
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
      gl.uniform2fv(scale, viewportScale(shape, width, height));
    },
    draw(angle) {
      gl.uniform2f(rotation, Math.cos(angle), Math.sin(angle));
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    },
    dispose() {
      gl.deleteBuffer(positions);
      gl.deleteBuffer(uvs);
      gl.deleteBuffer(indices);
      gl.deleteTexture(image);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
