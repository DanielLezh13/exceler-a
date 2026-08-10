# Design QA — Course Contents Completion Hierarchy

final result: passed

## Evidence

- Source visual truth: `/Users/daniel/dev/Education/design-qa-reference-crop.png`
- Original user screenshot: `/var/folders/2z/8_r3hhl95md6n7gkx53mfc8r0000gn/T/codex-clipboard-7a18a502-e08a-4709-accb-de9e94903afe.png`
- Final desktop implementation: `/Users/daniel/dev/Education/design-qa-implementation-final.png`
- Responsive implementation: `/Users/daniel/dev/Education/design-qa-implementation-mobile.png`
- Desktop comparison: 1952 × 1008 source pixels against 1952 × 1008 implementation pixels at a 1952 × 1008 CSS viewport. Browser chrome was removed from the source crop; density required no additional normalization.
- Responsive check: 382 × 827 implementation pixels at a 390 × 844 requested viewport. The page reported a 382 px client width and 382 px scroll width, so there was no horizontal overflow.
- State: Variables & Data Types open, chapter complete, first lesson subsection selected, dark theme.

## Full-View Comparison

The established Daymark layout, palette, typography, borders, radii, and overall density remain intact. The requested hierarchy change is intentional: the permanent `01` chapter identity now remains visible, while completion appears as a separate lime circular badge beside the existing chevron. The contents rail is slightly wider so its label and title have room to read as two deliberate lines.

## Focused Region Comparison

The course-contents region was inspected at desktop and narrow responsive sizes. Chapter numbers stay aligned across all rows; the completed state no longer replaces the number; the section label and title have distinct size, line-height, and spacing; and the completed badge remains visually separate from the expand/collapse control. The progress card now reads `Course Completion` and uses the whole-course percentage and chapters-cleared count.

## Required Fidelity Surfaces

- Fonts and typography: existing font family and weights preserved. Chapter metadata increased to 8.5 px with 1.35 line-height; chapter titles increased to 11.5 px with 1.35 line-height. No collision or truncation was observed.
- Spacing and layout rhythm: contents rail increased from 310 px to 340 px; chapter rows now use a 38 px number column, flexible title column, and separate action column. Desktop and responsive layouts remain aligned.
- Colors and visual tokens: existing dark surfaces, line colors, and lime completion token are preserved. The lime badge is now semantic completion feedback rather than a replacement for navigation identity.
- Image quality and asset fidelity: no raster imagery was introduced or changed. Existing Lucide check and chevron icons remain sharp at their native vector size.
- Copy and content: `Chapter Completion` was replaced with `Course Completion`; the supporting values now describe the whole course rather than the selected chapter.

## Comparison History

1. Initial implementation fixed the number/check collision and text hierarchy.
2. A P2 navigation-alignment issue was found during interaction testing: clicking a subsection could place its heading above the reader viewport because the scroll target used an offset from the wrong coordinate space.
3. The scroll calculation was changed to use the section position relative to the reader container. Post-fix evidence places `What Is a Variable?` fully in view at 266.8 px from the viewport top.

## Interaction and Console Checks

- Opened the Java course and navigated among lesson subsections.
- Completed the reading checkpoint and all six practice exercises to expose the completed chapter state.
- Verified the permanent chapter number, separate completion badge, chevron, and Course Completion card.
- Checked the narrow responsive layout for horizontal overflow.
- Browser console errors: none.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-Up Polish

No blocking polish remains for this targeted change.
