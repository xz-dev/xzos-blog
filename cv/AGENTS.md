# Résumé sources

`xiangzhe_cv.tex` (English) and `曾祥哲的简历.tex` (Chinese) are the résumé someone edits by hand. The site does not commit the PDFs. `npm run build` (and `npm run cv`) compiles them with XeTeX into `public/cv/`, which is what https://xzos.net/cv/ serves. Build artifacts (`.aux`, `.log`, `.out`, the Tectonic cache) stay out of git.

```bash
npm run cv
```

The build downloads a static Tectonic binary and the fonts the sources name: Noto Sans, plus LXGW WenKai Regular and Medium (Medium is the bold face fontconfig returns for this family). XeTeX only. There is no test suite for the `.tex`; compile and read the PDF.

## LaTeX style

- Indent `itemize` with tabs.
- Sections are unnumbered: `\section*{\textcolor{red}{...}}`, then `\vspace*{-4ex}`, then `\noindent\textcolor{red}{\rule{\linewidth}{0.4pt}}`.
- A role is `\textbf{Company｜Role} \hfill dates` on one line. Dates use `--`.
- Links are inline `\href{URL}{text}`. A GitHub PR reads `\href{URL}{PR\#NNN}` when that is the link text.
- `\textbf{}` marks the terms that carry the point. Star counts are `\textcolor{red}{...}`.
- No custom macros (`\sect`, `\entry`, `\sub`). Keep the source something a person can edit without expanding commands.
- The two files are structural mirrors. A change to one belongs in the other.
- `itemsep` is 3pt in both files. The usual hand-edited template uses 4pt; at 4pt the Chinese résumé drops the education block onto a third page.
- The English subtitle's `·` is U+00B7. `\xeCJKDeclareCharClass{Default}{"00B7}` keeps xeCJK from redrawing it.
