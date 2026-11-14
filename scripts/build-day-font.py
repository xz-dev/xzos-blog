#!/usr/bin/env python3
"""Subset the variable Fira Code 5.2 for the Solarized day theme.

The source is the Google Fonts build of the tonsky/FiraCode 5.2 tag (google/fonts
ofl/firacode, 2000 units per em): the same outlines, advances and vertical metrics
the day theme previously fetched from a Google Fonts mirror, so rendering is
unchanged. The tonsky release binaries use 1950 units per em and would widen text.
The Unicode ranges match the mirror's subsets; the wght axis is kept.
Optional release-time tool, not an npm/build dependency:

  uv run --with fonttools==4.67.0 --with brotli==1.2.1 python scripts/build-day-font.py \\
    '/path/to/FiraCode[wght].ttf' /path/to/OFL.txt
"""
from pathlib import Path
import hashlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = ('https://raw.githubusercontent.com/google/fonts/'
              '5020a98352f1909554697e1da4132da253727138/ofl/firacode/FiraCode%5Bwght%5D.ttf')
SOURCE_SHA256 = '9335b082b3c7850d98a64b584f3417f65355f3471278bb5eeb8c6c0e8657aeeb'
# Google Fonts' "latin" subset, then the union of its other Fira Code subsets
# (latin-ext, greek, greek-ext, cyrillic, cyrillic-ext, symbols2).
LATIN = [(0x0000, 0x00FF), (0x0131, 0x0131), (0x0152, 0x0153), (0x02BB, 0x02BC), (0x02C6, 0x02C6),
         (0x02DA, 0x02DA), (0x02DC, 0x02DC), (0x0304, 0x0304), (0x0308, 0x0308), (0x0329, 0x0329),
         (0x2000, 0x206F), (0x20AC, 0x20AC), (0x2122, 0x2122), (0x2191, 0x2191), (0x2193, 0x2193),
         (0x2212, 0x2212), (0x2215, 0x2215), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD)]
EXT = [(0x0100, 0x02BA), (0x02BD, 0x02C5), (0x02C7, 0x02CC), (0x02CE, 0x02D7), (0x02DD, 0x02FF),
       (0x0301, 0x0301), (0x0370, 0x0377), (0x037A, 0x037F), (0x0384, 0x038A), (0x038C, 0x038C),
       (0x038E, 0x03A1), (0x03A3, 0x03FF), (0x0400, 0x045F), (0x0460, 0x052F), (0x0490, 0x0491),
       (0x04B0, 0x04B1), (0x1C80, 0x1C8A), (0x1D00, 0x1DBF), (0x1E00, 0x1E9F), (0x1EF2, 0x1EFF),
       (0x1F00, 0x1FFF), (0x2000, 0x2001), (0x2004, 0x2008), (0x200A, 0x200A), (0x2020, 0x2020), (0x20A0, 0x20AB), (0x20AD, 0x20C4), (0x20B4, 0x20B4),
       (0x2113, 0x2113), (0x2116, 0x2116), (0x23B8, 0x23BD), (0x2500, 0x259F), (0x2C60, 0x2C7F),
       (0x2DE0, 0x2DFF), (0xA640, 0xA69F), (0xA720, 0xA7FF), (0xFE2E, 0xFE2F)]
# In the mirror's latin range but absent from its latin file: they rendered from
# the extended file (U+2007-2008, U+2020) or the fallback font (the rest).
LATIN_DROP = {0x2007, 0x2008, 0x2012, 0x2015, 0x2016, 0x2017, 0x2020, 0x2021, 0x2030, 0x204A}


def css_range(cps):
    runs, start, prev = [], None, None
    for cp in sorted(cps):
        if start is not None and cp == prev + 1:
            prev = cp
            continue
        if start is not None:
            runs.append((start, prev))
        start = prev = cp
    runs.append((start, prev))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in runs)


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: build-day-font.py FiraCode[wght].ttf OFL.txt')
    source, license_path = map(Path, sys.argv[1:])
    assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Unexpected upstream bytes'
    font = TTFont(source, recalcTimestamp=False)
    assert font['name'].getDebugName(5).startswith('Version 5.002'), 'Expected Fira Code 5.2'
    assert font['head'].unitsPerEm == 2000
    assert [a.axisTag for a in font['fvar'].axes] == ['wght']
    cmap = font.getBestCmap()
    latin = {cp for cp in cmap if any(a <= cp <= b for a, b in LATIN)} - LATIN_DROP
    ext = {cp for cp in cmap if any(a <= cp <= b for a, b in EXT)} - latin
    outdir = ROOT / 'public/fonts'
    for name, cps in (('latin', latin), ('ext', ext)):
        part = TTFont(source, recalcTimestamp=False)
        options = subset.Options()
        options.name_IDs = ['*']
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=cps)
        subsetter.subset(part)
        target = outdir / f'fira-code-5.2-{name}.woff2'
        part.flavor = 'woff2'
        part.save(target)
        check = TTFont(target)
        assert set(check.getBestCmap()) == cps and 'fvar' in check
        data = target.read_bytes()
        print(f"{target.name} {len(data)} bytes sha256={hashlib.sha256(data).hexdigest()}\n"
              f"  unicode-range: {css_range(cps)};")
    license_text = license_path.read_text()
    assert 'SIL Open Font License, Version 1.1' in license_text, 'Expected the OFL 1.1'
    (outdir / 'fira-code-OFL.txt').write_text(
        f'Fira Code 5.2 (https://github.com/tonsky/FiraCode), Google Fonts build, subset to\n'
        f'the Unicode ranges the site uses; retained outlines and the wght axis are unchanged.\n'
        f'Upstream: {SOURCE_URL}\n\n'
        + license_text)


if __name__ == '__main__':
    main()
