# American Note Series 2026 — art direction

## Diagnosis of the first attempt

The first PNG renders read as fake for five reasons:

1. **Flat imagery.** Each vignette was ten or so flat cartoon shapes. Line-screening a flat fill only produces even stripes, so nothing had light, form or depth.
2. **Lines ignored form.** Every engraving line ran in one fixed direction. Real engravers give each surface its own line system (rings around a dome, verticals down a cliff, chevrons on a conifer, horizontals on water).
3. **Thin lathe work.** Rosettes had about 10 thick curves. Real guilloché uses hundreds of hairlines that interlock.
4. **Weak composition.** Elements floated on large empty washes, borders were a single rope band, and there were no layered frames.
5. **Flat type.** Inscriptions were solid fills, without the line-shaded lettering of intaglio printing.

## Direction

A 19th-century intaglio sensibility built with modern precision. Every note is one engraved plate (the dark ink) printed over a two-ink offset background (the tints and fine-line pattern).

### Plate structure (identical on every note, 1560 × 660 units = 2.61 : 1)

| Layer | Content |
|---|---|
| Paper | Cotton white, faint fibres |
| Offset tints | Two-colour iris wash in the denomination's light inks |
| Background security pattern | Fine-line geometric field, a different pattern per denomination |
| Border | Outer rule, 32-unit interlaced lathe band, double inner rule, microprinted line |
| Engraved vignette | Line-engraved scene in an arched, triple-framed window |
| Lettering | Line-shaded serif capitals, Playfair numerals, script signatures |
| Overprint | Red "SPECIMEN · CLASS PROJECT" |

### Front grid

* **Left third:** the large-numeral medallion (accessibility feature A1), then series, signatures and legal-tender line. The tactile strip (A2) runs down the left edge.
* **Centre:** an arched vignette under the headline "UNITED STATES OF AMERICA".
* **Right third:** the watermark window (S3), the front half of the see-through register, and the colour-shifting numeral (S1).
* The security thread (S2) runs in the gap beside the vignette. Its position changes with the denomination.
* Three corner numerals: top left, top right and bottom left.

### Back grid

* The back mirrors the front, so physical features line up through the paper. The watermark, register, thread and tactile strip all appear in mirrored positions.
* **Centre:** the complementary arched vignette.
* **Right:** a high-contrast numeral panel.
* The Federal Reserve seal sits lower left and the Treasury seal lower right, at the same height on every note.
* Serial numbers sit top left and bottom right.
* Four corner numerals.

### Type

* **Cinzel:** major inscriptions, line-shaded.
* **Old Standard TT:** small text.
* **Playfair Display Black:** numerals.
* **Pinyon Script:** signatures.
* **IBM Plex Mono:** serial numbers.

### Colour

Each denomination has a plate ink (darkest), a primary ink and a secondary ink, plus two light tints.

| Note | Theme | Primary / secondary |
|---|---|---|
| $1 | Liberty | Sage green / charcoal |
| $5 | The Land | Muted violet / slate |
| $10 | Discovery | Copper / burnt orange |
| $20 | Wild America | Deep teal / forest green |
| $50 | Democracy | Burgundy / muted gold |
| $100 | Unity | Navy / cool silver |

### Imagery

Vignettes are rendered procedurally as tonal scenes, then engraved in the shader.

* **Landscapes** are painted layer by layer. Each layer has its own lighting and line field.
* **Architecture** is ray-marched in 3D. Its lines follow object coordinates.

### Feature placeholders

Part 1 answers are pending, so the features below are design placeholders. The annotated renders label each one "Placeholder" until it is replaced.

| Code | Feature |
|---|---|
| S1 | Colour-shifting numeral |
| S2 | Denomination-positioned security thread |
| S3 | Watermark window |
| S4 (back) | See-through register |
| A1 | Large high-contrast numeral |
| A2 | Tactile raised-dot code |
