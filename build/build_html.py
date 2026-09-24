"""Fodrer en journal (PDF + kommentarer) ind i showroom-siden.

    python build/build_html.py [build/kommentarer.json]

kommentarer.json angiver PDF'en, evt. Word-filen og en liste af kommentarer. Hver kommentar
peger på et sted i PDF'en med et citat:
    "start": første ord i tekststykket,  "slut": sidste ord (valgfri),
    "boks": true  -> markér som én kasse (til lister, tabeller, ligninger)
eller på et billede:  "billede": 0, 1, 2 ...  (billederne talt i rækkefølge fra forsiden).
Mellemrum og kursiv matematik betyder ikke noget for søgningen.
"""
import base64, html as H, io, json, os, re, sys, unicodedata
import fitz  # pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "build", "kommentarer.json")
cfg = json.load(open(cfg_path, encoding="utf-8"))
rel = lambda p: p if os.path.isabs(p) else os.path.join(ROOT, p)

pdf_path = rel(cfg["pdf"])
doc = fitz.open(pdf_path)
ZOOM = 2
MARGIN = 58  # punkter fra kanten, der regnes som sidehoved/sidefod

def norm(s):
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", s))

# ---- sider som billeder + alle ord i læserækkefølge
pages, words = [], []
for pi, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), alpha=False)
    pages.append({"w": page.rect.width, "h": page.rect.height,
                  "src": "data:image/png;base64," + base64.b64encode(pix.tobytes("png")).decode()})
    for w in page.get_text("words", sort=True):
        if w[3] < MARGIN or w[1] > page.rect.height - MARGIN:
            continue  # sidehoved og sidefod tæller ikke med
        words.append({"p": pi, "r": w[:4], "t": norm(w[4]), "key": (pi, w[5], w[6])})

images = []
for pi, page in enumerate(doc):
    for info in sorted(page.get_image_info(), key=lambda b: (b["bbox"][1], b["bbox"][0])):
        images.append((pi, info["bbox"]))

# ---- samlet tekst uden mellemrum, med tegn -> ord
joined, owner = "", []
for i, w in enumerate(words):
    joined += w["t"]; owner += [i] * len(w["t"])

def find(snippet, frm=0):
    s = norm(snippet)
    i = joined.find(s, frm)
    # kræv ordstart, så "hvor" ikke matcher midt i et ord
    while i > 0 and owner[i - 1] == owner[i]:
        i = joined.find(s, i + 1)
    return i, len(s)

def pct(p, x0, y0, x1, y1, pad=2.5):
    W, H = pages[p]["w"], pages[p]["h"]
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    return [round(100 * x0 / W, 3), round(100 * y0 / H, 3), round(100 * (x1 - x0) / W, 3), round(100 * (y1 - y0) / H, 3)]

out, errors = [], []
for n, c in enumerate(cfg["kommentarer"], 1):
    rects = []  # (side, x0, y0, x1, y1)
    if "billede" in c:
        if c["billede"] >= len(images):
            errors.append(f"#{n}: billede {c['billede']} findes ikke (PDF'en har {len(images)} billeder)"); continue
        p, b = images[c["billede"]]
        rects = [(p,) + tuple(b)]
        mx, my, mp = b[2], b[1] + 10, p
    else:
        i, L = find(c["start"])
        if i < 0:
            errors.append(f"#{n}: kunne ikke finde start-citatet: {c['start']!r}"); continue
        end = i + L
        if c.get("slut"):
            j, L2 = find(c["slut"], i)
            if j < 0:
                errors.append(f"#{n}: kunne ikke finde slut-citatet {c['slut']!r} efter {c['start']!r}"); continue
            end = j + L2
        ids = sorted(set(owner[i:end]))
        lines = {}
        for k in ids:
            w = words[k]; x0, y0, x1, y1 = w["r"]
            key = w["key"] if not c.get("boks") else (w["p"],)
            r = lines.get(key)
            lines[key] = [w["p"], x0, y0, x1, y1] if r is None else [r[0], min(r[1], x0), min(r[2], y0), max(r[3], x1), max(r[4], y1)]
        rects = [tuple(v) for v in lines.values()]
        last = words[ids[-1]]
        mp, mx, my = last["p"], last["r"][2], (last["r"][1] + last["r"][3]) / 2
        if c.get("boks"):
            box = [r for r in rects if r[0] == mp][0]
            mx, my = box[3], box[2] + 8
    item = {
        "n": n, "tekst": c["tekst"],
        "rects": [dict(p=r[0], b=pct(*r)) for r in rects],
        "marker": dict(p=mp, x=round(100 * mx / pages[mp]["w"], 3), y=round(100 * my / pages[mp]["h"], 3)),
    }
    if c.get("typiskFejl"):
        item["typiskFejl"] = c["typiskFejl"]
    if c.get("guide"):
        item["guide"] = c["guide"]
    out.append(item)

if errors:
    print("Fejl i kommentarerne:\n  " + "\n  ".join(errors)); sys.exit(1)

def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode() if path and os.path.exists(path) else None

data = {
    "pages": pages, "comments": out,
    "pdf": {"name": os.path.basename(pdf_path), "data": b64(pdf_path)},
    "docx": {"name": os.path.basename(rel(cfg["docx"])), "data": b64(rel(cfg["docx"]))} if cfg.get("docx") else None,
    # "sektion": fanen på fagsiden, som brødkrummen går tilbage til. "seOgsaa": links nederst på siden.
    "sektion": cfg.get("sektion"), "seOgsaa": cfg.get("seOgsaa", []),
    # "tjekliste": {titel, href}, fælles tjekliste for dokumenttypen, linket fra værktøjslinjen.
    "tjekliste": cfg.get("tjekliste"),
    # Versioner af dokumentet (fx Word / LaTeX). Uden "href" vises versionen som "kommer snart".
    "varianter": [dict(v, aktiv=v.get("href") == os.path.basename(cfg.get("ud", ""))) for v in cfg.get("varianter", [])],
}
tpl = open(os.path.join(ROOT, "build", "showroom-template.html"), encoding="utf-8").read()
# Sidens overskrift: "titel" er dokumenttypen og niveauet (fx "En god journal i 1g"), ikke fysikken.
for k in ("titel", "overlinje", "intro"):
    tpl = tpl.replace("__" + k.upper() + "__", H.escape(cfg[k], quote=False))
html = tpl.replace("__JOURNAL_DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
dst = rel(cfg.get("ud", "showroom.html"))
open(dst, "w", encoding="utf-8").write(html)
print(f"Skrevet: {dst}  ({len(pages)} sider, {len(out)} kommentarer, {len(html)/1e6:.1f} MB)")
