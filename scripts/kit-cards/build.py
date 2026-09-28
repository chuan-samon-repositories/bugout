"""Build the kit card photos and the depth each one turns with.

    pip install -r scripts/kit-cards/requirements.txt
    python3 scripts/kit-cards/build.py

For each kit, this cuts out the photo of its backpack and writes it to public/images/kit-cards/<slug>.webp,
then works out how far each part of the photo is from the camera, so KitPhotoSwing can turn the real photo
a few degrees with some volume instead of as a flat card. The depths go to
src/presentation/components/kits/kitCardPhotos.generated.ts. At 0° the card shows the photo itself.

The depth comes from an approximate shape of the bag body: every horizontal slice is a superellipse (a
rounded rectangle), sized from the photo silhouettes:

- "three-views" (the Kit 72h's backpack): cut-out side, back and front 3/4 photos. The side photo gives each
  slice's depth, the back photo its width, and the 3/4 photo is the one on the card.
- "one-view" (the Kit 24h's): a single 3/4 product shot on white, cut out here. Its silhouette gives each
  slice's front, with the width and viewing angle assumed.

Straps and buckles outside the body take the depth of the body next to them, a little behind it.
"""
import base64
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from scipy.ndimage import gaussian_filter1d, map_coordinates, median_filter

ROOT = Path(__file__).resolve().parents[2]
PHOTOS = ROOT / "scripts/kit-cards/photos"

KITS = {
    "kit-24h": {
        "kind": "one-view",
        "photo": "front.jpg",
        "calibration": {
            # Rows of the body's top and bottom edge, column of its centre, and the viewing angle (degrees
            # round from the front toward the bag's left side, which the photo shows on the left).
            "top": 160.0,
            "bottom": 742.0,
            "u0": 426.0,
            "theta": 45.0,
            # Column of the back-left corner (the shoulder straps hang beyond it) and the furthest the front
            # may reach (buckles stick out past the pockets).
            "left": 234.0,
            "right_max": 619.0,
            # Half the body width before rounding, in body heights (the front looks this wide at `theta`).
            "half_width": 0.256,
            "top_radius": 0.06,
            "bottom_radius": 0.05,
            # From this row down, anything lighter than the threshold is the floor shadow, not the bag.
            "shadow_from_row": 718,
            "shadow_threshold": 62,
        },
        "exponent": 5.0,
        "height": None,  # output photo height, px (None: the cut-out's own, about 710)
    },
    "kit-72h": {
        "kind": "three-views",
        "photos": {"side": "side.png", "back": "back.png", "front": "front.png"},
        # Side photo: seen from 90 deg (bag front on the right). Back photo: from 180 deg. Front photo (the
        # one on the card): a 3/4 view about 20 deg round from the front toward the side photo.
        "calibration": {
            "side": {"top": 86.0, "bottom": 395.0, "u0": 264.5},
            # Below row `clamp_from` the hanging shoulder straps hide the body's edges: use `clamp` columns.
            "back": {"top": 72.0, "bottom": 436.0, "u0": 221.5, "clamp_from": 285, "clamp": (101, 342)},
            "front": {"top": 102.0, "bottom": 386.0, "u0": 258.0, "theta": 20.0},
            # Body half-width and half-depth limits (body heights), to keep straps out of the shape.
            "limits": {"x": (-0.335, 0.335), "z": (-0.30, 0.31)},
            "bottom_radius": 0.06,
        },
        "exponent": 2.5,
        # The source is small (the bag is 304 px tall) and cards draw it up to about 430 px tall, so retina
        # screens would upscale it: do it here instead, with a better filter than the browser's.
        "height": 912,
    },
}

PROFILE_STEP = 0.004
GRID_COLUMNS = 64  # quads across the photo; rows follow its aspect
STRAP_OFFSET = 0.02  # how far behind the body next to them straps and buckles sit, in body heights
EDGE_SOFTENING = 0.03  # depth smoothing, in body heights


# ---------------------------------------------------------------- photos


def load_photo(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0


def cut_out(path, shadow_from_row, shadow_threshold):
    """RGBA of a dark product shot on white: open and enclosed white areas and the floor shadow (rows from
    `shadow_from_row` lighter than `shadow_threshold`) become transparent."""
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    lum = rgb.mean(axis=2)
    rows = np.arange(lum.shape[0])[:, None]
    light = (lum > 200) | ((rows >= shadow_from_row) & (lum > shadow_threshold))
    labels, count = ndimage.label(light)
    sizes = ndimage.sum(light, labels, range(1, count + 1))
    means = ndimage.mean(lum, labels, range(1, count + 1))
    border = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    background = [i + 1 for i in range(count) if i + 1 in border or (sizes[i] > 20 and means[i] > 225)]
    solid = ~np.isin(labels, background)
    labels, count = ndimage.label(solid)
    solid = labels == 1 + int(np.argmax(ndimage.sum(solid, labels, range(1, count + 1))))
    edge = solid & ~ndimage.binary_erosion(solid, iterations=2)
    alpha = solid.astype(np.float32)
    alpha[edge] = np.clip((235 - lum[edge]) / (235 - 90), 0, 1)
    alpha = np.where(solid, ndimage.gaussian_filter(alpha, 0.6), 0)
    # Edge pixels are part bag, part white background: keep only the bag's share of their colour.
    safe = np.maximum(alpha, 0.05)[..., None]
    rgb = np.clip((rgb - (1 - alpha[..., None]) * 255) / safe, 0, 255)
    return np.dstack([rgb / 255, alpha]).astype(np.float32)


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


# ---------------------------------------------------------------- shape


def corner_inset(distance, radius):
    """How far a rounded corner of `radius` pulls an edge in, `distance` from the end of the body."""
    if distance >= radius:
        return 0.0
    return radius - math.sqrt(max(radius * radius - (radius - distance) ** 2, 0.0))


def closed(ys, edges):
    """Rows [y, x0, x1, z0, z1], closed with slices shrunk to the centre just below the bottom and above the top."""

    def shrunk(e, f):
        cx, cz = (e[0] + e[1]) / 2, (e[2] + e[3]) / 2
        return [cx + (e[0] - cx) * f, cx + (e[1] - cx) * f, cz + (e[2] - cz) * f, cz + (e[3] - cz) * f]

    step = PROFILE_STEP
    rows = [[ys[0] - step, *shrunk(edges[0], 0.0)], [ys[0] - step * 0.5, *shrunk(edges[0], 0.7)]]
    rows += [[y, *e] for y, e in zip(ys, edges)]
    rows += [[ys[-1] + step * 0.5, *shrunk(edges[-1], 0.7)], [ys[-1] + step, *shrunk(edges[-1], 0.0)]]
    return np.asarray(rows, dtype=np.float64)


def three_view_profile(side, back, cal):
    """Slices from bottom to top: body width from the back photo and depth from the side photo."""
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
    for k, y in enumerate(ys):  # round the bottom corners of the back outline (straps hide them)
        inset = corner_inset(y - ys[0], cal["bottom_radius"])
        edges[k, 0] += inset
        edges[k, 1] -= inset
    return closed(ys, edges)


def superellipse_reach(a, b, theta, n):
    """Half the projected width of a superellipse with semi-axes a, b seen from rotation theta (radians)."""
    q = n / (n - 1)
    return ((a * abs(math.cos(theta))) ** q + (b * abs(math.sin(theta))) ** q) ** (1 / q)


def one_view_profile(photo, cal, n):
    """Slices from a single 3/4 photo seen from `theta`: the back-left corner projects to the `left` column and
    the front-right corner to the silhouette's right edge, row by row, with the width assumed."""
    s = cal["bottom"] - cal["top"]
    th = math.radians(cal["theta"])
    ys = np.arange(0.0, 1.0 + 1e-9, PROFILE_STEP)
    right = np.full(len(ys), np.nan)
    for k, y in enumerate(ys):
        run = main_run(photo[int(round(cal["bottom"] - y * s)), :, 3] > 0.5)
        if run is not None and run[1] > cal["left"] + 20:
            right[k] = min(run[1] + 1, cal["right_max"])
    known = ~np.isnan(right)
    right[~known] = np.interp(np.nonzero(~known)[0], np.nonzero(known)[0], right[known])
    right = gaussian_filter1d(median_filter(right, size=9, mode="nearest"), 2.0, mode="nearest")
    edges = []
    for k, y in enumerate(ys):
        inset = corner_inset(y, cal["bottom_radius"]) + corner_inset(1.0 - y, cal["top_radius"])
        a = cal["half_width"] - inset
        z0 = ((cal["left"] - cal["u0"]) / s + a * math.cos(th)) / math.sin(th)
        z1 = ((right[k] - cal["u0"]) / s - a * math.cos(th)) / math.sin(th)
        cz, b = (z0 + z1) / 2, max((z1 - z0) / 2 - inset, 0.01)
        # A superellipse reaches less far than its box: grow it until it fills the same silhouette.
        grow = (a * math.cos(th) + b * math.sin(th)) / superellipse_reach(a, b, th, n)
        edges.append([-a * grow, a * grow, cz - b * grow, cz + b * grow])
    return closed(ys, np.asarray(edges))


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


# ---------------------------------------------------------------- depth


def body_depth(shape, profile, n, view, samples=2048):
    """Depth toward the camera (body heights) of the body surface behind each photo pixel; NaN off the body."""
    height, width = shape
    s = view["bottom"] - view["top"]
    th = math.radians(view["theta"])
    toward = np.array([-math.sin(th), math.cos(th)])
    t = np.linspace(0, 2 * np.pi, samples, endpoint=False)
    depth = np.full((height, width), np.nan, np.float32)
    columns = (np.arange(width) + 0.5 - view["u0"]) / s
    for row in range(height):
        y = (view["bottom"] - (row + 0.5)) / s
        if y < profile[0, 0] or y > profile[-1, 0]:
            continue
        x, z, nx, nz = surface(profile, n, t, np.full_like(t, y))
        visible = nx * toward[0] + nz * toward[1] > 0
        if visible.sum() < 2:
            continue
        u = x[visible] * math.cos(th) + z[visible] * math.sin(th)
        d = x[visible] * toward[0] + z[visible] * toward[1]
        order = np.argsort(u)
        u, d = u[order], d[order]
        inside = (columns >= u[0]) & (columns <= u[-1])
        depth[row, inside] = np.interp(columns[inside], u, d)
    return depth


def full_depth(depth, scale):
    """Off the body, take the depth of the nearest body pixel, a little behind; then smooth (over about 3 % of
    the body height, `scale` px), so the relief bends instead of tearing where a strap meets the body, and the
    rounded edges do not drop away so steeply that turning smears them."""
    known = ~np.isnan(depth)
    rows, cols = ndimage.distance_transform_edt(~known, return_distances=False, return_indices=True)
    out = np.where(known, depth, depth[rows, cols] - STRAP_OFFSET)
    return ndimage.gaussian_filter(out, EDGE_SOFTENING * scale).astype(np.float32)


# ---------------------------------------------------------------- build


def build(slug):
    kit = KITS[slug]
    source = PHOTOS / slug
    n = kit["exponent"]
    if kit["kind"] == "three-views":
        cal = kit["calibration"]
        side, back, photo = (load_photo(source / kit["photos"][k]) for k in ("side", "back", "front"))
        profile = three_view_profile(side, back, cal)
        view = cal["front"]
    else:
        cal = kit["calibration"]
        photo = cut_out(source / kit["photo"], cal["shadow_from_row"], cal["shadow_threshold"])
        profile = one_view_profile(photo, cal, n)
        view = cal
    depth = full_depth(body_depth(photo.shape[:2], profile, n, view), view["bottom"] - view["top"])

    # crop to the bag (2 px margin), then scale
    ys, xs = np.nonzero(photo[..., 3] > 0.03)
    x0, y0 = max(xs.min() - 2, 0), max(ys.min() - 2, 0)
    x1, y1 = min(xs.max() + 3, photo.shape[1]), min(ys.max() + 3, photo.shape[0])
    crop = photo[y0:y1, x0:x1]
    image = Image.fromarray((np.clip(crop, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
    if kit["height"]:
        image = image.resize((round(image.width * kit["height"] / image.height), kit["height"]), Image.LANCZOS)
    # a light unsharp mask on the colour only (sharpening the alpha would halo the cut-out edge)
    *colour, alpha = image.split()
    colour = Image.merge("RGB", colour).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    image = Image.merge("RGBA", (*colour.split(), alpha))
    out = ROOT / "public/images/kit-cards" / f"{slug}.webp"
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, quality=90, alpha_quality=95, method=6)

    # depth at the grid's vertices, in photo heights, relative to the vertical axis the bag turns round
    crop_depth = depth[y0:y1, x0:x1]
    h, w = crop_depth.shape
    columns = GRID_COLUMNS + 1
    rows = round(GRID_COLUMNS * h / w) + 1
    gy, gx = np.meshgrid(np.linspace(0, h - 1, rows), np.linspace(0, w - 1, columns), indexing="ij")
    grid = map_coordinates(crop_depth, [gy, gx], order=1) * (view["bottom"] - view["top"]) / h
    low, high = float(grid.min()), float(grid.max())
    step = (high - low) / 255 or 1.0
    quantised = np.clip(np.round((grid - low) / step), 0, 255).astype(np.uint8)
    return {
        "src": f"/images/kit-cards/{slug}.webp",
        "width": image.width,
        "height": image.height,
        "relief": {
            "columns": columns,
            "rows": rows,
            "axis": round((view["u0"] - x0) / w, 4),
            "depthMin": round(low, 5),
            "depthStep": round(step, 7),
            "depth": base64.b64encode(quantised.tobytes()).decode(),
        },
    }


def main():
    images = {slug: build(slug) for slug in sorted(KITS)}
    module = ROOT / "src/presentation/components/kits/kitCardPhotos.generated.ts"
    body = json.dumps(images, indent=2)
    module.write_text(
        "// Generated by scripts/kit-cards/build.py from scripts/kit-cards/photos. Do not edit by hand.\n"
        'import type { KitCardImage } from "./photoRelief";\n\n'
        f"export const KIT_CARD_IMAGES = {body} satisfies Record<string, KitCardImage>;\n"
    )
    for slug, image in images.items():
        relief = image["relief"]
        print(f"{slug}: {image['width']}x{image['height']}, relief {relief['columns']}x{relief['rows']}")


if __name__ == "__main__":
    main()
