# UI Theme Designer Notes

## Assumptions

- The existing liquid-glass direction should remain, especially in dark theme.
- Light theme should keep an ivory/cream character but improve contrast.
- Source methodology copy should not dominate the hero.
- Animations should be smooth and restrained.

## Implementation Choices

- Use accessible color tokens for text, surfaces, borders, accent states, and translucent glass layers.
- Strengthen light hero contrast by separating cream/ivory backgrounds from body and heading text colors.
- Move source/scraping methodology explanations to footer, legal note, or source methodology pages.
- Keep cards translucent and layered, but avoid muddy low-contrast surfaces.
- Use understated interaction states instead of oversaturated gaming or crypto visual language.

## Risks

- Glass effects can reduce readability if opacity and backdrop contrast are not controlled.
- Light theme hero gradients can drift too close to text colors.
- Overuse of translucent cards can make dense marketplace pages feel visually noisy.

## Validation Results

- Pending. Verify light theme contrast before shipping hero or card changes.
- Pending. Confirm methodology/source copy is present outside the hero after copy migration.
