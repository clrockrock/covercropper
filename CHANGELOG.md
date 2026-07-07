# Changelog

## 0.1.0-beta.1

Bug fix beta release.

- Fixed continuous rotation scaling so the image can shrink back to the pre-rotation baseline when the target angle no longer requires the enlarged cover scale.
- Added core and Web Component regression tests for rotation-slider baseline behavior.

## 0.1.0-beta.0

Initial beta release.

- Added `@covercropper/core` pure TypeScript crop geometry and cover-safe constraints.
- Added `@covercropper/element` Web Component implementation.
- Added React, Vue, and Angular wrapper packages.
- Added cropper-only interactions: move image, drag selection, free corner resize, wheel zoom, rotation snap, flip, fit, reset, and export.
- Added real-time export preview in the playground.
- Added English and Chinese documentation.
