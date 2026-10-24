#!/usr/bin/env python3
"""Package the pinned, full Unifont OpenType font as an unmodified-outline WOFF2.

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
    target = ROOT / 'public/fonts/unifont-18.0.01.woff2'
    target.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(target)
    converted = TTFont(target, recalcTimestamp=False)
    assert converted.getBestCmap() == cmap
    assert converted['hmtx'].metrics == metrics
    assert outlines(converted, SAMPLE) == before
    data = target.read_bytes()
    assert data[:4] == b'wOF2' and len(data) < 1_000_000
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
    symbol_target = target.with_name('unifont-symbols-18.0.01.woff2')
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
              'The full base font retains all glyph outlines, Unicode mappings and advance widths.\n'
              'The Unifont Upper companion is subset to U+1F000-1FAFF; retained outlines are unchanged.\n'
              f'Upstream: {SOURCE_URL}\nSymbols upstream: {SYMBOLS_URL}\n\n' + license_text)
    (ROOT / 'public/fonts/unifont-OFL.txt').write_text(notice)
    manifest = {
        'family': 'Unifont', 'version': '18.0.01', 'license': 'OFL-1.1',
        'source': {'url': SOURCE_URL, 'sha256': SOURCE_SHA256},
        'asset': {'url': '/fonts/' + target.name, 'bytes': len(data), 'sha256': sha256(data)},
        'grid': {'height': 16, 'widths': [8, 16], 'unitsPerEm': 64},
        'unicodeCodepoints': len(cmap),
        'cjkUnifiedIdeographs': sum(cp in cmap for cp in range(0x4E00, 0xA000)),
        'conversion': {'fontTools': fontTools.__version__, 'preservesCmap': True,
                       'preservesMetrics': True, 'preservesSampleOutlines': True,
                       'gridCheckedSample': SAMPLE},
        'symbols': {'family': 'Unifont Upper', 'source': {'url': SYMBOLS_URL, 'sha256': SYMBOLS_SHA256},
                    'unicodeRange': 'U+1F000-1FAFF', 'codepoints': len(expected_cmap),
                    'asset': {'url': '/fonts/' + symbol_target.name, 'bytes': len(symbol_data), 'sha256': sha256(symbol_data)},
                    'preservesSampleOutlines': True, 'checkedSample': symbol_sample},
        'scope': 'Night-mode Latin, CJK, punctuation, code and controls. System glyph fallback only for missing code points.',
        'historicalBoundary': 'A CJK-capable pixel adaptation, not the Tektronix 4052 original 5x8 ASCII character generator.',
    }
    (ROOT / 'docs/theme/tty-font.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
