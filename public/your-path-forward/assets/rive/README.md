# Scholé character animations

`schole.riv` is copied unchanged from
`schole_landing_site/public/animations/characters/schole.riv`. It contains the
product's Ole, Zeteo, Atlas and Pharos artboards and their SM-V3 view models.

`rive.js` and `rive.wasm` are the matching `@rive-app/webgl2` 2.39.2 runtime
from the landing repo's installed package. The runtime is MIT licensed:
https://github.com/rive-app/rive-wasm/blob/master/LICENSE

The page loads these assets locally when the character section approaches the
viewport. Poster images remain visible until each animation loads. Playback
pauses offscreen, when the tab is hidden, when animations are paused from the
menu, or when reduced motion is enabled.
