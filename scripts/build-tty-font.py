#!/usr/bin/env python3
"""Package the pinned, full Unifont OpenType font as unmodified-outline WOFF2 subsets.

The base font is split by Unicode block into files served with CSS unicode-range,
so a page downloads only the blocks it renders; together they keep every mapping.

Optional release-time tool, not an npm/build dependency. See README for invocation.
"""
from pathlib import Path
import hashlib
import json
import sys

import fontTools
from fontTools import subset
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://unifoundry.com/pub/unifont/unifont-18.0.01/font-builds/unifont-18.0.01.otf'
SOURCE_SHA256 = '88d0a14d4aa9a96419720b39ba5da921a59560d76d4ec7d523acc06ed85cd3c2'
SAMPLE = 'AZaz09中文汉字繁體嚷霾龘，。→─│'
SYMBOLS_URL = 'https://unifoundry.com/pub/unifont/unifont-18.0.01/font-builds/unifont_upper-18.0.01.otf'
SYMBOLS_SHA256 = '472201e45a050bff4c7658208b8c73e34ebce3764b287a5a46c7774038ef9391'
# Level-1 list (3,500 most common characters) of the Table of General Standard Chinese
# Characters (通用规范汉字表, PRC Ministry of Education, 2013), one per line, copied
# verbatim into scripts/tgscc-level-1.txt from this pinned commit. The site's zh
# and zh-CN content is Simplified; this list covers more of it than GB 2312 level 1.
COMMON_URL = ('https://raw.githubusercontent.com/shengdoushi/common-standard-chinese-characters-table/'
              'd9b599a9c9cc0dd2d58cad829e285bc780cd4451/level-1.txt')
COMMON_SHA256 = '79a6c710013cc86617d5db65871f59b2d67dee72415d380a2cc7145a51450fe4'
# Ordered (name, ranges); a code point goes to the first subset whose ranges contain it,
# except that the common ideographs go to cjk-common together with CJK punctuation.
# The remaining CJK Unified Ideographs U+4E00-9FFF are split into 16 chunks of 0x520.
SUBSETS = [
    ('latin', [(0x0000, 0x036F), (0x2000, 0x206F), (0x20A0, 0x20CF), (0x2100, 0x214F),
               (0x2190, 0x21FF), (0x2500, 0x25FF), (0xFFFD, 0xFFFD)]),
    ('cjk-common', [(0x3000, 0x30FF), (0x3100, 0x312F), (0x31F0, 0x31FF), (0xFE10, 0xFE1F),
                   (0xFE30, 0xFE4F), (0xFF00, 0xFFEF)]),
    *[(f'cjk-{i + 1:02d}', [(0x4E00 + i * 0x520, 0x4E00 + (i + 1) * 0x520 - 1)]) for i in range(16)],
    ('greek-cyrillic', [(0x0370, 0x052F), (0x1E00, 0x1FFF)]),
    ('scripts', [(0x0530, 0x1DFF)]),
    ('symbols', [(0x2070, 0x2E7F)]),
    ('cjk-ext', [(0x2E80, 0x4DFF)]),
    ('hangul', [(0xAC00, 0xD7FF)]),
    ('other', [(0x0000, 0x10FFFF)]),
]


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def outlines(font, text):
    cmap, glyphs = font.getBestCmap(), font.getGlyphSet()
    result = {}
    for ch in text:
        pen = RecordingPen()
        glyphs[cmap[ord(ch)]].draw(pen)
        result[ch] = pen.value
        for operation, points in pen.value:
            assert operation in ('moveTo', 'lineTo', 'closePath'), (ch, operation)
            assert all(x % 4 == 0 and y % 4 == 0 for x, y in points), ch
    return result


def load_common():
    data = (ROOT / 'scripts/tgscc-level-1.txt').read_bytes()
    assert sha256(data) == COMMON_SHA256, 'Unexpected common character list'
    common = {ord(line) for line in data.decode('utf-8').split()}
    assert len(common) == 3500 and all(0x4E00 <= cp <= 0x9FFF for cp in common)
    return common


def assign(cmap, common):
    groups = {name: [] for name, _ in SUBSETS}
    for cp in sorted(cmap):
        name = 'cjk-common' if cp in common else next(
            n for n, ranges in SUBSETS if any(a <= cp <= b for a, b in ranges))
        groups[name].append(cp)
    return groups


def unicode_range(owner, cps, absorb=frozenset()):
    """Collapse code points into CSS ranges; gaps may absorb code points absent from the font
    and those in `absorb`, but never the Unifont Upper range, so emoji do not download a base
    subset first."""
    keys, ranges = sorted(set(owner) | set(range(0x1F000, 0x1FB00))), []
    mine = set(cps)
    start = prev = None
    for cp in keys:
        if cp in mine:
            if start is None:
                start = cp
            prev = cp
        elif cp not in absorb and start is not None:
            ranges.append((start, prev))
            start = None
    if start is not None:
        ranges.append((start, prev))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in ranges)


def subset_options():
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_languages = ['*']
    options.layout_features = ['*']
    options.notdef_outline = True
    options.recalc_bounds = False
    options.prune_unicode_ranges = False
    options.prune_codepage_ranges = False
    return options


def drawn(font):
    glyphs, result = font.getGlyphSet(), {}
    for cp, name in font.getBestCmap().items():
        pen = RecordingPen()
        glyphs[name].draw(pen)
        result[cp] = pen.value
    return result


def vertical_metrics(font):
    return (font['head'].unitsPerEm, font['hhea'].ascent, font['hhea'].descent, font['hhea'].lineGap,
            font['OS/2'].sTypoAscender, font['OS/2'].sTypoDescender, font['OS/2'].sTypoLineGap,
            font['OS/2'].usWinAscent, font['OS/2'].usWinDescent)


def main():
    if len(sys.argv) != 4:
        raise SystemExit('usage: build-tty-font.py unifont-18.0.01.otf Unifont-OFL.txt unifont_upper-18.0.01.otf')
    source, license_path, symbols_path = map(Path, sys.argv[1:])
    source_data = source.read_bytes()
    assert sha256(source_data) == SOURCE_SHA256, 'Unexpected upstream bytes'
    license_text = '\n'.join(line.rstrip() for line in license_path.read_text().splitlines()) + '\n'
    assert 'SIL OPEN FONT LICENSE Version 1.1' in license_text
    font = TTFont(source, recalcTimestamp=False)
    assert font['name'].getDebugName(1) == 'Unifont'
    cmap, metrics = font.getBestCmap(), font['hmtx'].metrics.copy()
    before = outlines(font, SAMPLE)
    assert font['head'].unitsPerEm == 64
    assert metrics[cmap[ord('A')]][0] == 32
    assert metrics[cmap[ord('中')]][0] == 64
    outdir = ROOT / 'public/fonts'
    outdir.mkdir(parents=True, exist_ok=True)
    source_outlines, source_vertical = drawn(font), vertical_metrics(font)
    advances = {cp: metrics[name] for cp, name in cmap.items()}
    groups = assign(cmap, load_common())
    owner = {cp: name for name, cps in groups.items() for cp in cps}
    # cjk-common overlaps the chunks' ranges. CSS Fonts 4 (font matching, step 5): of
    # overlapping unicode-range faces the last defined is checked first, and a face is
    # downloaded only when a character in its range is checked. So cjk-common is declared
    # after the chunks: common ideographs resolve from it, rarer ones fall through to a chunk.
    common_ideographs = {cp for cp in groups['cjk-common'] if 0x4E00 <= cp <= 0x9FFF}
    chunk_ideographs = {cp for name, cps in groups.items() if name.startswith('cjk-') and name[4:].isdigit()
                        for cp in cps}
    union, assets = {}, []
    for name, cps in groups.items():
        part = TTFont(source, recalcTimestamp=False)
        subsetter = subset.Subsetter(subset_options())
        subsetter.populate(unicodes=cps)
        subsetter.subset(part)
        target = outdir / f'unifont-18.0.01-{name}.woff2'
        part.flavor = 'woff2'
        part.save(target)
        converted = TTFont(target, recalcTimestamp=False)
        part_cmap = converted.getBestCmap()
        assert sorted(part_cmap) == cps, name
        assert converted['name'].getDebugName(1) == 'Unifont'
        assert vertical_metrics(converted) == source_vertical, name
        assert all(converted['hmtx'].metrics[g] == advances[cp] for cp, g in part_cmap.items()), name
        assert all(outline == source_outlines[cp] for cp, outline in drawn(converted).items()), name
        assert not union.keys() & part_cmap.keys(), name
        union.update(part_cmap)
        data = target.read_bytes()
        assert data[:4] == b'wOF2'
        absorb = chunk_ideographs if name == 'cjk-common' else (
            common_ideographs if name.startswith('cjk-') and name[4:].isdigit() else frozenset())
        assets.append({'name': name, 'url': '/fonts/' + target.name, 'unicodeRange': unicode_range(owner, cps, absorb),
                       'codepoints': len(cps), 'bytes': len(data), 'sha256': sha256(data)})
    assert union.keys() == cmap.keys()
    outlines_after = {}
    for ch in SAMPLE:
        part = next(a for a in assets if ord(ch) in groups[a['name']])
        outlines_after.update(outlines(TTFont(outdir / part['url'].rsplit('/', 1)[1]), ch))
    assert outlines_after == before
    assert sha256(symbols_path.read_bytes()) == SYMBOLS_SHA256, 'Unexpected symbol source'
    symbols = TTFont(symbols_path, recalcTimestamp=False)
    assert symbols['name'].getDebugName(1) == 'Unifont Upper'
    symbol_sample = '🌐🎭💗😘🙁🙂🤖'
    symbol_before = outlines(symbols, symbol_sample)
    expected_cmap = {cp: name for cp, name in symbols.getBestCmap().items() if 0x1F000 <= cp <= 0x1FAFF}
    expected_metrics = {name: symbols['hmtx'].metrics[name] for name in expected_cmap.values()}
    subsetter = subset.Subsetter()
    subsetter.populate(unicodes=range(0x1F000, 0x1FB00))
    subsetter.subset(symbols)
    assert symbols.getBestCmap() == expected_cmap
    symbol_target = outdir / 'unifont-symbols-18.0.01.woff2'
    symbols.flavor = 'woff2'
    symbols.save(symbol_target)
    symbol_converted = TTFont(symbol_target, recalcTimestamp=False)
    assert symbol_converted.getBestCmap() == expected_cmap
    assert all(symbol_converted['hmtx'].metrics[name] == metrics for name, metrics in expected_metrics.items())
    assert outlines(symbol_converted, symbol_sample) == symbol_before
    symbol_data = symbol_target.read_bytes()
    assert len(symbol_data) < 100_000
    copyright_text = font['name'].getDebugName(0)
    notice = (copyright_text + '\n\nGNU Unifont 18.0.01. Distributed here under '
              'the SIL Open Font License 1.1 option of its upstream dual license.\n'
              'The base font is split into Unicode-block subsets that together retain all glyph\n'
              'outlines, Unicode mappings and advance widths.\n'
              'The Unifont Upper companion is subset to U+1F000-1FAFF; retained outlines are unchanged.\n'
              f'Upstream: {SOURCE_URL}\nSymbols upstream: {SYMBOLS_URL}\n\n' + license_text)
    (ROOT / 'public/fonts/unifont-OFL.txt').write_text(notice)
    manifest = {
        'family': 'Unifont', 'version': '18.0.01', 'license': 'OFL-1.1',
        'source': {'url': SOURCE_URL, 'sha256': SOURCE_SHA256},
        'assets': assets,
        'totalBytes': sum(a['bytes'] for a in assets),
        'grid': {'height': 16, 'widths': [8, 16], 'unitsPerEm': 64},
        'unicodeCodepoints': len(cmap),
        'commonCharacters': {'list': 'Table of General Standard Chinese Characters, level 1',
                             'url': COMMON_URL, 'sha256': COMMON_SHA256, 'count': len(common_ideographs)},
        'cjkUnifiedIdeographs': sum(cp in cmap for cp in range(0x4E00, 0xA000)),
        'conversion': {'fontTools': fontTools.__version__, 'preservesCmap': True,
                       'preservesMetrics': True, 'preservesSampleOutlines': True,
                       'preservesAllOutlines': True, 'gridCheckedSample': SAMPLE},
        'symbols': {'family': 'Unifont Upper', 'source': {'url': SYMBOLS_URL, 'sha256': SYMBOLS_SHA256},
                    'unicodeRange': 'U+1F000-1FAFF', 'codepoints': len(expected_cmap),
                    'asset': {'url': '/fonts/' + symbol_target.name, 'bytes': len(symbol_data), 'sha256': sha256(symbol_data)},
                    'preservesSampleOutlines': True, 'checkedSample': symbol_sample},
        'scope': 'Night-mode Latin, CJK, punctuation, code and controls. System glyph fallback only for missing code points.',
        'historicalBoundary': 'A CJK-capable pixel adaptation, not the Tektronix 4052 original 5x8 ASCII character generator.',
    }
    (ROOT / 'docs/theme/tty-font.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    for a in sorted(assets, key=lambda a: a['name'] == 'cjk-common'):
        print(f'@font-face {{\n  font-family: "Unifont";\n  font-style: normal;\n  font-weight: 400;\n'
              f"  font-display: swap;\n  src: url('{a['url']}') format('woff2');\n"
              f"  unicode-range: {a['unicodeRange']};\n}}\n")


if __name__ == '__main__':
    main()
