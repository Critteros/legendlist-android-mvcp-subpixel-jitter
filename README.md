# LegendList: 1 to 2 px jitter on every prepend with `maintainVisibleContentPosition` on Android

This app reproduces a small vertical movement of a LegendList on each prepend. The problem occurs on Android with the New Architecture.

One item is added at the top every 300 ms. `maintainVisibleContentPosition` is on. On each prepend the visible rows move by 1 or 2 px. The next prepend moves them back. In a chat app, each new message causes this movement.

Recording: The movement is 1 to 2 px. Watch the recording at full resolution

<video src="https://github.com/user-attachments/assets/YOUR-VIDEO-ID](https://github.com/user-attachments/assets/b3808195-2604-454a-878f-efc947de8849" width="600" controls muted loop>
</video>


### Root cause

LegendList renders a 0x0 anchor view (`ScrollAdjust`) as child 0 of the `ScrollView`. Its position is `top = bias + scrollAdjust`, with `bias = 1e7`. The native MVCP helper (`minIndexForVisible: 0`) anchors on that view. On each prepend, LegendList adds the item size to `scrollAdjust`. The anchor moves by that amount. The native helper scrolls by the same amount. The items move by the item size too. When both moves are equal, nothing visible changes.

Yoga stores layout values in float32. At 1e7 dp the float32 step is 1 dp. The anchor can only move by whole dp values. The items move by the real item size. `roundSize` keeps that size on a 1/8 dp grid (`Math.floor(size * 8) / 8`). With 100.875 dp rows on a 3x screen:

| | anchor delta | item delta | mismatch |
|---|---|---|---|
| `bias = 1e7`, `roundSize` 1/8 dp | 100 or 101 dp = 300 or 303 px | 302 or 303 px | up to 2 px |
| `bias = 1e6`, `roundSize` on the pixel grid | 302 px | 302 px | 0 |

### Fix

The patch makes two changes in `react-native.js` and `react-native.mjs`. See [`.yarn/patches/@legendapp-list-npm-3.3.9-cafe214be1.patch`](./.yarn/patches/@legendapp-list-npm-3.3.9-cafe214be1.patch):

1. `ScrollAdjust`: `bias = 1e6`. The float32 step at 1e6 dp is 0.0625 dp. This step holds every `roundSize` output. The anchor stays after all content until the content is taller than 1e6 dp.
2. `roundSize`: `Math.floor(size * PixelRatio.get()) / PixelRatio.get()`. Each adjust is then a whole number of pixels. The anchor and the items move by the same number of pixels.

Recording (patched):

<video src="https://github.com/user-attachments/assets/YOUR-VIDEO-ID](https://github.com/user-attachments/assets/b3808195-2604-454a-878f-efc947de8849](https://github.com/user-attachments/assets/f9c76c9d-21b4-47e1-bf90-fdaf1db65499" width="600" controls muted loop>
</video>

### Separate React Native issue

Unpacthed React Native also shows a one-frame jump by a whole row on some prepends into an MVCP list. The cause is explained in [facebook/react-native#58186](https://github.com/facebook/react-native/issues/58186). 
The reproduction is in [rn-android-mvcp-one-frame-jump](https://github.com/Critteros/rn-android-mvcp-one-frame-jump). Without its fix, the two effects overlap


## The app

`App.tsx` renders one `LegendList` from the stock package or from the patched package

| Control | What it does |
|---|---|
| `n` | Current list length |
| `scroll` | Scroll offset in px |
| `run` | Starts and stops the prepends. Default on |
| `stock` / `patched` | Switches between the stock `@legendapp/list` and the patched copy. The list remounts. Default stock |

### Run

```sh
yarn
yarn android
```
