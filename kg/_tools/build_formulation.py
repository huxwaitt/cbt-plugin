#!/usr/bin/env python3
"""Build the case formulation page from the fixed CBT vocabulary.

Contract: _schema.md section 10. The script reads every scheme file named in the
vocab-schemes block of _schema.md, checks its minimal shape, embeds the data as JSON
into _tools/formulation_template.html at the placeholder, and writes
formulation/index.html. Standard library only. Safe to re-run.

Usage (from anywhere):
    python _tools/build_formulation.py            build the page
    python _tools/build_formulation.py --check    check the vocabulary only, write nothing
    python _tools/build_formulation.py --root C:/path/to/cbt-knowledge-graph

Exit codes: 0 built (warnings allowed), 1 shape errors or missing files, 2 bad arguments.
"""

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

PLACEHOLDER = "__FORMULATION_DATA__"
ID_RE = re.compile(r"^[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*$")
SLOT_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_STYLES = {"solid", "dashed"}


def read_scheme_list(schema_path):
    """Return [(prefix, filename)] from the vocab-schemes fenced block."""
    text = schema_path.read_text(encoding="utf-8")
    match = re.search(r"```vocab-schemes[ \t]*\r?\n(.*?)```", text, re.S)
    if not match:
        raise ValueError("no vocab-schemes block found in " + str(schema_path))
    pairs = []
    for line in match.group(1).splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) != 2:
            raise ValueError("vocab-schemes line is not '<prefix> <file>': " + line)
        pairs.append((parts[0], parts[1]))
    return pairs


def is_text(value):
    return isinstance(value, str) and value.strip() != ""


def check_concept_scheme(prefix, fname, data, errors, warnings, all_ids):
    where = fname
    if not isinstance(data, dict):
        errors.append(where + ": top level is not an object")
        return 0
    if data.get("prefix") != prefix:
        errors.append("%s: prefix is %r, expected %r" % (where, data.get("prefix"), prefix))
    if data.get("scheme") != Path(fname).stem:
        errors.append("%s: scheme is %r, expected %r" % (where, data.get("scheme"), Path(fname).stem))
    for key in ("title", "version"):
        if not is_text(data.get(key)):
            errors.append("%s: missing %s" % (where, key))
    concepts = data.get("concepts")
    if not isinstance(concepts, list) or not concepts:
        errors.append(where + ": concepts must be a non-empty list")
        return 0
    for i, c in enumerate(concepts):
        if not isinstance(c, dict):
            errors.append("%s: concept %d is not an object" % (where, i))
            continue
        cid = c.get("id")
        if not isinstance(cid, str) or not ID_RE.match(cid) or not cid.startswith(prefix + "."):
            errors.append("%s: concept %d has bad id %r" % (where, i, cid))
            continue
        if cid in all_ids:
            errors.append("%s: duplicate id %s" % (where, cid))
        all_ids.add(cid)
        for key in ("label", "definition"):
            if not is_text(c.get(key)):
                errors.append("%s: %s has no %s" % (where, cid, key))
        if not is_text(c.get("client_wording")):
            warnings.append("%s: %s has no client_wording (label is shown instead)" % (where, cid))
        for key in ("alt_labels", "related", "see"):
            if key in c and not isinstance(c[key], list):
                errors.append("%s: %s field %s is not a list" % (where, cid, key))
        broader = c.get("broader")
        if broader is not None and not (isinstance(broader, str) and broader.startswith(prefix + ".")):
            errors.append("%s: %s broader %r is not null or an id in this scheme" % (where, cid, broader))
    return len(concepts)


def check_models(fname, data, known_prefixes, errors, warnings, all_ids):
    where = fname
    counts = {"models": 0, "slots": 0, "links": 0}
    if not isinstance(data, dict):
        errors.append(where + ": top level is not an object")
        return counts
    if data.get("prefix") != "fm":
        errors.append("%s: prefix is %r, expected 'fm'" % (where, data.get("prefix")))
    if not is_text(data.get("version")):
        errors.append(where + ": missing version")
    rating_types = data.get("rating_types")
    if not isinstance(rating_types, dict):
        errors.append(where + ": rating_types must be an object")
        rating_types = {}
    models = data.get("models")
    if not isinstance(models, list) or not models:
        errors.append(where + ": models must be a non-empty list")
        return counts
    for i, m in enumerate(models):
        if not isinstance(m, dict):
            errors.append("%s: model %d is not an object" % (where, i))
            continue
        mid = m.get("id")
        if not isinstance(mid, str) or not ID_RE.match(mid) or not mid.startswith("fm."):
            errors.append("%s: model %d has bad id %r" % (where, i, mid))
            continue
        if mid in all_ids:
            errors.append("%s: duplicate id %s" % (where, mid))
        all_ids.add(mid)
        counts["models"] += 1
        for key in ("label", "summary", "use_when"):
            if not is_text(m.get(key)):
                errors.append("%s: %s has no %s" % (where, mid, key))
        if not is_text(m.get("group")):
            warnings.append("%s: %s has no group (listed as disorder-specific)" % (where, mid))
        grid = m.get("grid")
        cols = rows = 0
        if (isinstance(grid, dict) and isinstance(grid.get("cols"), int) and isinstance(grid.get("rows"), int)
                and grid["cols"] >= 1 and grid["rows"] >= 1):
            cols, rows = grid["cols"], grid["rows"]
        else:
            errors.append("%s: %s grid must have integer cols and rows of at least 1" % (where, mid))
        slots = m.get("slots")
        if not isinstance(slots, list) or not slots:
            errors.append("%s: %s slots must be a non-empty list" % (where, mid))
            slots = []
        slot_ids = set()
        cells = {}
        for j, s in enumerate(slots):
            if not isinstance(s, dict):
                errors.append("%s: %s slot %d is not an object" % (where, mid, j))
                continue
            sid = s.get("id")
            if not isinstance(sid, str) or not SLOT_ID_RE.match(sid):
                errors.append("%s: %s slot %d has bad id %r" % (where, mid, j, sid))
                continue
            if sid in slot_ids:
                errors.append("%s: %s duplicate slot id %s" % (where, mid, sid))
            slot_ids.add(sid)
            counts["slots"] += 1
            tag = "%s: %s slot %s" % (where, mid, sid)
            for key in ("label", "prompt"):
                if not is_text(s.get(key)):
                    errors.append("%s has no %s" % (tag, key))
            if "help" in s and not isinstance(s["help"], str):
                errors.append(tag + " help is not text")
            vocab = s.get("vocab")
            if not isinstance(vocab, list):
                errors.append(tag + " vocab is not a list")
            else:
                for p in vocab:
                    if p not in known_prefixes or p == "fm":
                        errors.append("%s vocab prefix %r is not a concept scheme" % (tag, p))
                if not vocab and not s.get("free_text"):
                    errors.append(tag + " has no vocab and no free_text, so nothing can fill it")
            if not isinstance(s.get("multi"), bool):
                errors.append(tag + " multi must be true or false")
            if not isinstance(s.get("free_text"), bool):
                errors.append(tag + " free_text must be true or false")
            rating = s.get("rating")
            if rating is not None and rating not in rating_types:
                errors.append("%s rating %r is not null or a key of rating_types" % (tag, rating))
            col, row = s.get("col"), s.get("row")
            if not (isinstance(col, int) and isinstance(row, int)):
                errors.append(tag + " col and row must be integers")
            elif cols and rows and not (1 <= col <= cols and 1 <= row <= rows):
                errors.append("%s col %d row %d is outside the %dx%d grid" % (tag, col, row, cols, rows))
            else:
                key = (col, row)
                if key in cells:
                    warnings.append("%s shares grid cell %s with slot %s" % (tag, key, cells[key]))
                cells[key] = sid
        links = m.get("links")
        if not isinstance(links, list):
            errors.append("%s: %s links must be a list" % (where, mid))
            links = []
        for k, ln in enumerate(links):
            if not isinstance(ln, dict):
                errors.append("%s: %s link %d is not an object" % (where, mid, k))
                continue
            counts["links"] += 1
            for end in ("from", "to"):
                if ln.get(end) not in slot_ids:
                    errors.append("%s: %s link %d %s %r is not a slot id" % (where, mid, k, end, ln.get(end)))
            if ln.get("style") not in LINK_STYLES:
                errors.append("%s: %s link %d style %r is not solid or dashed" % (where, mid, k, ln.get("style")))
    return counts


def embed_json(payload):
    """Serialize for a <script type="application/json"> block."""
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    # "<" only occurs inside JSON strings, so these escapes stay valid JSON.
    text = text.replace("</", "<\\/").replace("<!--", "\\u003c!--")
    text = text.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return text


def main(argv=None):
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Build formulation/index.html from _vocab.")
    parser.add_argument("--root", default=str(here.parent), help="knowledge graph root (default: parent of _tools)")
    parser.add_argument("--check", action="store_true", help="check the vocabulary only, write nothing")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    schema_path = root / "_schema.md"
    vocab_dir = root / "_vocab"
    template_path = root / "_tools" / "formulation_template.html"
    out_path = root / "formulation" / "index.html"

    errors, warnings = [], []
    try:
        pairs = read_scheme_list(schema_path)
    except (OSError, ValueError) as exc:
        print("ERROR: " + str(exc), file=sys.stderr)
        return 1

    known_prefixes = {p for p, _ in pairs}
    if "fm" not in known_prefixes:
        errors.append("_schema.md vocab-schemes has no fm (formulation models) entry")

    schemes, all_ids = [], set()
    concept_total, model_counts = 0, {"models": 0, "slots": 0, "links": 0}
    for prefix, fname in pairs:
        path = vocab_dir / fname
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            errors.append("%s: file not found in %s" % (fname, vocab_dir))
            continue
        except (OSError, ValueError) as exc:
            errors.append("%s: cannot parse JSON (%s)" % (fname, exc))
            continue
        if prefix == "fm":
            model_counts = check_models(fname, data, known_prefixes, errors, warnings, all_ids)
        else:
            concept_total += check_concept_scheme(prefix, fname, data, errors, warnings, all_ids)
        if isinstance(data, dict):
            entry = dict(data)
            entry["file"] = fname
            entry["prefix"] = prefix
            schemes.append(entry)

    # Cross-scheme references are warnings: the page tolerates them.
    for s in schemes:
        for c in s.get("concepts") or []:
            if not isinstance(c, dict):
                continue
            for rid in c.get("related") or []:
                if rid not in all_ids:
                    warnings.append("%s: %s related id %s does not exist" % (s["file"], c.get("id"), rid))
            rep = c.get("replaced_by")
            if rep and rep not in all_ids:
                warnings.append("%s: %s replaced_by %s does not exist" % (s["file"], c.get("id"), rep))

    for w in warnings:
        print("warning: " + w)
    if errors:
        for e in errors:
            print("ERROR: " + e, file=sys.stderr)
        print("%d error(s); formulation/index.html was not written." % len(errors), file=sys.stderr)
        return 1

    print("schemes: %d (%d concept schemes plus formulation models)" % (len(schemes), len(schemes) - 1))
    print("concepts: %d" % concept_total)
    print("models: %d, slots: %d, links: %d" % (model_counts["models"], model_counts["slots"], model_counts["links"]))
    print("warnings: %d" % len(warnings))
    if args.check:
        print("check only: nothing written")
        return 0

    try:
        template = template_path.read_text(encoding="utf-8")
    except OSError as exc:
        print("ERROR: cannot read template (%s)" % exc, file=sys.stderr)
        return 1
    found = template.count(PLACEHOLDER)
    if found != 1:
        print("ERROR: template must contain %s exactly once (found %d)" % (PLACEHOLDER, found), file=sys.stderr)
        return 1

    payload = {
        "generated": datetime.date.today().isoformat(),
        "schemes": schemes,
    }
    html = template.replace(PLACEHOLDER, embed_json(payload), 1)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)
    print("wrote %s (%.0f KB)" % (out_path, out_path.stat().st_size / 1024.0))
    return 0


if __name__ == "__main__":
    sys.exit(main())
