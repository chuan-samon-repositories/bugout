"""Bake the 3D turntable of a backpack from three cut-out photos (side, back and front 3/4).

    pip install -r scripts/turntable/requirements.txt
    python3 scripts/turntable/bake.py            # rebuilds the mochila-30l model

Three photos cannot give a faithful 3D model, so this builds an approximate one:

- Shape: every horizontal slice of the bag body is a superellipse (a rounded rectangle). Its depth at each
  height comes from the side photo and its width from the back photo. Straps, handles and buckles that
  stick out are left out of the shape (they are still painted on it).
- Colour: every surface point takes the colour of the photos that see it most head-on. Mirrored copies of
  the side and 3/4 photos stand in for the side nobody photographed, so the bag is assumed symmetric.

The colour is fixed on the surface, so the bag turns like a solid object. Outputs:

- public/images/turntables/<model>/texture.webp: the colour, unrolled around the bag (column = angle
  around the slice, row = height, top first);
- public/images/turntables/<model>/poster.webp: the bag at its start angle, shown before WebGL takes over
  and instead of it (reduced motion, no WebGL);
- src/presentation/components/kits/turntable/<model>.model.ts: the slices and file paths, read by
  KitTurntable.

Calibrate a new set of photos in CALIBRATION: for each photo, the rows of the body's top and bottom edge
(without the handle or hanging straps) and the column of its centre.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d, median_filter

ROOT = Path(__file__).resolve().parents[2]

MODELS = {
    "mochila-30l": {
        "photos": {"side": "side.png", "back": "back.png", "front": "front.png"},
        # Side photo: seen from 90 deg (bag front on the right). Back photo: seen from 180 deg.
        # Front photo: a 3/4 view, about 20 deg round from the front toward the side photo.
        "calibration": {
            "side": {"top": 86.0, "bottom": 395.0, "u0": 264.5},
            # Below row `clamp_from` the hanging shoulder straps hide the body's edges: use `clamp` columns.
            "back": {"top": 72.0, "bottom": 436.0, "u0": 221.5, "clamp_from": 285, "clamp": (101, 342)},
            "front": {"top": 102.0, "bottom": 386.0, "u0": 258.0, "theta": 20.0},
            # Body half-width and half-depth limits (units of body height), to keep straps out of the shape.
            "limits": {"x": (-0.335, 0.335), "z": (-0.30, 0.31)},
            "bottom_radius": 0.06,
        },
        "exponent": 2.5,
        # Rotation shown by the poster and where the animation starts (degrees; 0 = front, 90 = side photo).
        "start_angle": 30.0,
    }
}

SHARPNESS = 8.0  # how strongly a surface point prefers the photo that sees it most head-on
TARGET_COLOUR = (0.135, 0.137, 0.145)  # mean bag colour every photo is balanced to
FILL = (0.12, 0.125, 0.13)  # colour of surface points no photo shows
TEXTURE_SIZE = (1024, 512)
PROFILE_STEP = 0.004
MESH_ROW_STRIDE = 2  # export every other slice: the mesh needs fewer rows than the texture
POSTER_HEIGHT = 480
MARGIN = 0.02  # empty border around the bag in the viewport, in body heights


# ---------------------------------------------------------------- photos


def load_photo(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0


def balance_colours(photos):
    for p in photos:
        solid = p[..., 3] > 0.9
        gain = np.asarray(TARGET_COLOUR) / p[..., :3][solid].mean(axis=0)
        p[..., :3] = np.clip(p[..., :3] * gain, 0, 1)


def main_run(mask_row):
    """The widest run of opaque pixels in a row: the body, not a strap beside it."""
    xs = np.nonzero(mask_row)[0]
    if len(xs) == 0:
        return None
    breaks = np.nonzero(np.diff(xs) > 1)[0]
    starts = np.concatenate([[xs[0]], xs[breaks + 1]])
    ends = np.concatenate([xs[breaks], [xs[-1]]])
    k = int(np.argmax(ends - starts))
    return int(starts[k]), int(ends[k])


class Photo:
    """A cut-out photo taken from rotation `theta` (degrees).

    Units: the bag body is 1 tall, from y = 0 (bottom) to y = 1 (top); x is its width and z its depth (front
    positive). A point projects to column u = u0 + s * (x cos theta + z sin theta) and row v = bottom - s * y.
    """

    def __init__(self, rgba, theta, top, bottom, u0, mirror=False, weight=1.0):
        if mirror:  # the view from -theta of a symmetric bag
            rgba = rgba[:, ::-1]
            u0 = rgba.shape[1] - 1 - u0
            theta = -theta
        premultiplied = rgba.copy()
        premultiplied[..., :3] *= premultiplied[..., 3:4]
        self.rgba = premultiplied
        self.theta = math.radians(theta)
        self.scale = bottom - top
        self.bottom, self.u0, self.weight = bottom, u0, weight
        self.toward_camera = np.array([-math.sin(self.theta), math.cos(self.theta)])

    def sample(self, x, z, y):
        u = self.u0 + self.scale * (x * math.cos(self.theta) + z * math.sin(self.theta))
        v = self.bottom - self.scale * y
        return bilinear(self.rgba, u, v)


def bilinear(img, u, v):
    h, w = img.shape[:2]
    u = np.clip(u, 0, w - 1.001)
    v = np.clip(v, 0, h - 1.001)
    u0, v0 = np.floor(u).astype(int), np.floor(v).astype(int)
    fu, fv = (u - u0)[..., None], (v - v0)[..., None]
    top = img[v0, u0] * (1 - fu) + img[v0, u0 + 1] * fu
    bottom = img[v0 + 1, u0] * (1 - fu) + img[v0 + 1, u0 + 1] * fu
    return top * (1 - fv) + bottom * fv


# ---------------------------------------------------------------- shape


def body_profile(side, back, cal):
    """Slices [y, x0, x1, z0, z1] from bottom to top: body width (back photo) and depth (side photo)."""
    s_side = cal["side"]["bottom"] - cal["side"]["top"]
    s_back = cal["back"]["bottom"] - cal["back"]["top"]
    ys = np.arange(-0.04, 1.08, PROFILE_STEP)
    edges = np.full((len(ys), 4), np.nan)
    for k, y in enumerate(ys):
        rs = int(round(cal["side"]["bottom"] - y * s_side))
        rb = int(round(cal["back"]["bottom"] - y * s_back))
        if not (0 <= rs < side.shape[0] and 0 <= rb < back.shape[0]):
            continue
        z_run = main_run(side[rs, :, 3] > 0.5)
        x_run = cal["back"]["clamp"] if rb >= cal["back"]["clamp_from"] else main_run(back[rb, :, 3] > 0.5)
        if z_run is None or x_run is None or z_run[1] - z_run[0] < 3 or x_run[1] - x_run[0] < 3:
            continue
        edges[k] = [
            (cal["back"]["u0"] - (x_run[1] + 1)) / s_back,  # the back view mirrors x
            (cal["back"]["u0"] - x_run[0]) / s_back,
            (z_run[0] - cal["side"]["u0"]) / s_side,
            (z_run[1] + 1 - cal["side"]["u0"]) / s_side,
        ]
    known = np.nonzero(~np.isnan(edges[:, 0]))[0]
    ys, edges = ys[known.min() : known.max() + 1], edges[known.min() : known.max() + 1]
    for c in range(4):
        col = edges[:, c]
        gap = np.isnan(col)
        col[gap] = np.interp(np.nonzero(gap)[0], np.nonzero(~gap)[0], col[~gap])
    lim = cal["limits"]
    edges[:, 0] = np.maximum(edges[:, 0], lim["x"][0])
    edges[:, 1] = np.minimum(edges[:, 1], lim["x"][1])
    edges[:, 2] = np.maximum(edges[:, 2], lim["z"][0])
    edges[:, 3] = np.minimum(edges[:, 3], lim["z"][1])
    for c in range(4):
        edges[:, c] = gaussian_filter1d(median_filter(edges[:, c], size=13, mode="nearest"), 3.0, mode="nearest")
    # Round the bottom corners of the back outline (the straps hide them in the photo).
    r = cal["bottom_radius"]
    for k, y in enumerate(ys):
        d = y - ys[0]
        if d < r:
            inset = r - math.sqrt(max(r * r - (r - d) ** 2, 0.0))
            edges[k, 0] += inset
            edges[k, 1] -= inset

    # Close the shape with slices shrunk to the centre just below the bottom and above the top.
    def shrunk(e, f):
        cx, cz = (e[0] + e[1]) / 2, (e[2] + e[3]) / 2
        return [cx + (e[0] - cx) * f, cx + (e[1] - cx) * f, cz + (e[2] - cz) * f, cz + (e[3] - cz) * f]

    step = PROFILE_STEP
    rows = [[ys[0] - step, *shrunk(edges[0], 0.0)], [ys[0] - step * 0.5, *shrunk(edges[0], 0.7)]]
    rows += [[y, *e] for y, e in zip(ys, edges)]
    rows += [[ys[-1] + step * 0.5, *shrunk(edges[-1], 0.7)], [ys[-1] + step, *shrunk(edges[-1], 0.0)]]
    return np.asarray(rows, dtype=np.float64)


def surface(profile, n, t, y):
    """Point and horizontal outward normal on the slice at height y, superellipse parameter t (radians)."""
    e = np.stack([np.interp(y, profile[:, 0], profile[:, c]) for c in range(1, 5)], axis=-1)
    cx, cz = (e[..., 0] + e[..., 1]) / 2, (e[..., 2] + e[..., 3]) / 2
    a = np.maximum((e[..., 1] - e[..., 0]) / 2, 1e-4)
    b = np.maximum((e[..., 3] - e[..., 2]) / 2, 1e-4)
    c, s = np.cos(t), np.sin(t)
    ex = np.sign(c) * np.abs(c) ** (2.0 / n)
    ez = np.sign(s) * np.abs(s) ** (2.0 / n)
    nx = np.sign(ex) * np.abs(ex) ** (n - 1) / a
    nz = np.sign(ez) * np.abs(ez) ** (n - 1) / b
    length = np.hypot(nx, nz) + 1e-9
    return cx + a * ex, cz + b * ez, nx / length, nz / length


def colour(photos, x, z, nx, nz, y):
    """Blend of the photos that see each point, weighted by how head-on they see it."""
    acc = np.zeros(x.shape + (4,), np.float32)
    for p in photos:
        w = np.clip(nx * p.toward_camera[0] + nz * p.toward_camera[1], 0, 1) ** SHARPNESS * p.weight
        if not np.any(w > 1e-6):
            continue
        c = p.sample(x, z, y)
        w = w * np.clip(c[..., 3] * 1.25 - 0.25, 0, 1)  # trust solid photo pixels only
        acc += c * w[..., None]
    rgb = np.empty(x.shape + (3,), np.float32)
    seen = acc[..., 3] > 1e-6
    rgb[seen] = acc[seen, :3] / acc[seen, 3:4]
    rgb[~seen] = FILL
    return rgb


def viewport(profile, n):
    """Box (units) the bag stays inside at every rotation: width, height and the height of its centre."""
    t = np.linspace(0, 2 * np.pi, 720, endpoint=False)
    radius = 0.0
    for row in profile:
        x, z, _, _ = surface(profile, n, t, np.full_like(t, row[0]))
        radius = max(radius, float(np.hypot(x, z).max()))
    y0, y1 = float(profile[0, 0]), float(profile[-1, 0])
    return {"width": 2 * (radius + MARGIN), "height": y1 - y0 + 2 * MARGIN, "centerY": (y0 + y1) / 2}


# ---------------------------------------------------------------- outputs


def bake_texture(profile, n, photos):
    width, height = TEXTURE_SIZE
    y_top, y_bottom = profile[-1, 0], profile[0, 0]
    t = (np.arange(width) + 0.5) / width * 2 * np.pi
    y = y_top - (np.arange(height) + 0.5) / height * (y_top - y_bottom)
    T, Y = np.meshgrid(t, y)
    x, z, nx, nz = surface(profile, n, T, Y)
    return colour(photos, x, z, nx, nz, Y)


def render(profile, n, photos, angle, view, height, supersample=3, samples=2048):
    """Orthographic view at rotation `angle` (degrees) framed like KitTurntable's canvas. RGBA, straight alpha."""
    width = int(round(height * view["width"] / view["height"]))
    phi = math.radians(angle)
    toward_camera = np.array([-math.sin(phi), math.cos(phi)])
    scale = height * supersample / view["height"]
    W, H = width * supersample, height * supersample
    out = np.zeros((H, W, 4), np.float32)
    t = np.linspace(0, 2 * np.pi, samples, endpoint=False)
    columns = (np.arange(W) + 0.5 - W / 2) / scale
    for row in range(H):
        y = view["centerY"] + (H / 2 - row - 0.5) / scale
        if y > profile[-1, 0] or y < profile[0, 0]:
            continue
        x, z, nx, nz = surface(profile, n, t, np.full_like(t, y))
        visible = nx * toward_camera[0] + nz * toward_camera[1] > 0
        if visible.sum() < 2:
            continue
        u = x[visible] * math.cos(phi) + z[visible] * math.sin(phi)
        order = np.argsort(u)
        u = u[order]
        inside = (columns >= u[0]) & (columns <= u[-1])
        if not inside.any():
            continue
        c = columns[inside]
        X, Z = np.interp(c, u, x[visible][order]), np.interp(c, u, z[visible][order])
        NX, NZ = np.interp(c, u, nx[visible][order]), np.interp(c, u, nz[visible][order])
        length = np.hypot(NX, NZ) + 1e-9
        out[row, inside, :3] = colour(photos, X, Z, NX / length, NZ / length, np.full_like(X, y))
        out[row, inside, 3] = 1
    out = out.reshape(height, supersample, width, supersample, 4).mean(axis=(1, 3))
    alpha = out[..., 3:4]
    rgb = np.where(alpha > 0, out[..., :3] / np.maximum(alpha, 1e-6), 0)
    return np.concatenate([rgb, alpha], axis=-1)


def to_uint8(arr):
    return (np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)


def write_model_module(path, name, model, profile, view, poster_size):
    rows = profile[::MESH_ROW_STRIDE]
    if rows[-1, 0] != profile[-1, 0]:
        rows = np.vstack([rows, profile[-1]])
    lines = ",\n".join("      [" + ", ".join(f"{v:.4f}" for v in r) + "]" for r in rows)
    export = "".join(part.capitalize() if i else part for i, part in enumerate(name.split("-")))
    path.write_text(
        f"""// Generated by scripts/turntable/bake.py from scripts/turntable/photos/{name}. Do not edit by hand.
import type {{ TurntableModel }} from "./models";

export const {export}: TurntableModel = {{
  texture: "/images/turntables/{name}/texture.webp",
  poster: {{ src: "/images/turntables/{name}/poster.webp", width: {poster_size[0]}, height: {poster_size[1]} }},
  shape: {{
    exponent: {model["exponent"]},
    startAngle: {model["start_angle"]},
    viewport: {{ width: {view["width"]:.4f}, height: {view["height"]:.4f}, centerY: {view["centerY"]:.4f} }},
    rows: [
{lines},
    ],
  }},
}};
"""
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("model", nargs="?", default="mochila-30l", choices=sorted(MODELS))
    args = parser.parse_args()
    name, model = args.model, MODELS[args.model]
    source = ROOT / "scripts/turntable/photos" / name
    side, back, front = (load_photo(source / model["photos"][k]) for k in ("side", "back", "front"))
    balance_colours((side, back, front))
    cal = model["calibration"]
    photos = [
        Photo(side, 90, cal["side"]["top"], cal["side"]["bottom"], cal["side"]["u0"]),
        Photo(back, 180, cal["back"]["top"], cal["back"]["bottom"], cal["back"]["u0"]),
        Photo(side, 90, cal["side"]["top"], cal["side"]["bottom"], cal["side"]["u0"], mirror=True),
        Photo(front, cal["front"]["theta"], cal["front"]["top"], cal["front"]["bottom"], cal["front"]["u0"]),
        # The mirrored 3/4 photo only fills in what the real one cannot see.
        Photo(front, cal["front"]["theta"], cal["front"]["top"], cal["front"]["bottom"], cal["front"]["u0"],
              mirror=True, weight=0.15),
    ]
    n = model["exponent"]
    profile = body_profile(side, back, cal)
    view = viewport(profile, n)

    out = ROOT / "public/images/turntables" / name
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray(to_uint8(bake_texture(profile, n, photos))).save(out / "texture.webp", quality=85, method=6)
    poster = render(profile, n, photos, model["start_angle"], view, POSTER_HEIGHT)
    Image.fromarray(to_uint8(poster), "RGBA").save(out / "poster.webp", quality=85, alpha_quality=90, method=6)
    module = ROOT / "src/presentation/components/kits/turntable" / f"{name}.model.ts"
    module.parent.mkdir(parents=True, exist_ok=True)
    write_model_module(module, name, model, profile, view, (poster.shape[1], poster.shape[0]))
    print(f"{name}: texture {TEXTURE_SIZE}, poster {poster.shape[1]}x{poster.shape[0]}, {module.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
