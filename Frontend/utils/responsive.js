import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

/**
 * Proportional sizing helpers.
 *
 * Every screen in this app was laid out against one device, so its hardcoded
 * point values only look right on that device. These helpers re-express those
 * values as a ratio of the current screen, so the same composition survives
 * from a 320pt iPhone SE to a 1024pt iPad.
 *
 * The app is locked to portrait (`orientation` in app.json), so the window
 * size cannot change under a mounted component and it is safe to read
 * Dimensions once at module scope — which is what lets these be called inside
 * `StyleSheet.create`. If portrait lock is ever lifted, or iPad multitasking
 * (Split View) needs to resize the layout live, use the `useResponsive` hook
 * at the bottom of this file instead; it returns the same helpers recomputed
 * from `useWindowDimensions`.
 */

const window = Dimensions.get('window');

// Portrait lock means the short edge is always the width, but read it
// defensively so a landscape launch frame cannot invert the whole scale.
export const SCREEN_WIDTH = Math.min(window.width, window.height);
export const SCREEN_HEIGHT = Math.max(window.width, window.height);

// The design baseline: an iPhone 15/16 Pro class screen, which is the device
// the existing point values were tuned against.
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

export const isTablet = SCREEN_WIDTH >= 768;
export const isSmallDevice = SCREEN_WIDTH < 360;

/**
 * Raw ratios, clamped.
 *
 * A tablet is ~2x the baseline width; scaling linearly there would turn a 16pt
 * label into a 31pt one and a comfortable layout into a magnified phone.
 * Clamping the ratio keeps type and spacing sane, and `CONTENT_MAX_WIDTH`
 * below handles the leftover width by centering the content instead of
 * stretching it.
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const widthRatio = clamp(SCREEN_WIDTH / BASE_WIDTH, 0.8, 1.2);
const heightRatio = clamp(SCREEN_HEIGHT / BASE_HEIGHT, 0.8, 1.2);

/** Round to a whole device pixel so borders and hairlines stay crisp. */
const round = (value) => PixelRatio.roundToNearestPixel(value);

/** Scale a horizontal measurement (widths, horizontal padding, radii). */
export const scale = (size) => round(size * widthRatio);

/** Scale a vertical measurement (heights, vertical padding, offsets). */
export const verticalScale = (size) => round(size * heightRatio);

/**
 * Scale, but dampened by `factor`. Use for anything that should grow with the
 * screen without tracking it one-for-one — icons, avatars, card padding.
 * factor 0 leaves the size untouched, 1 is identical to `scale`.
 */
export const moderateScale = (size, factor = 0.5) =>
    round(size + (size * widthRatio - size) * factor);

/**
 * Font sizing. Deliberately more conservative than `scale`: text that tracks
 * screen width exactly reads as oversized on large phones and cramped on small
 * ones, and long strings ("Non-typing individuals") start wrapping. The OS
 * accessibility text-size setting is intentionally left alone — RN applies it
 * on top of whatever we return here.
 */
export const fontSize = (size) => round(size + (size * widthRatio - size) * 0.4);

/** Percentage of screen width / height, for measurements that are genuinely relative. */
export const wp = (percent) => round((SCREEN_WIDTH * percent) / 100);
export const hp = (percent) => round((SCREEN_HEIGHT * percent) / 100);

/**
 * Max content width for centered column layouts. On a phone this is simply the
 * full width; on a tablet it stops a form or a button stack from stretching
 * into an unreadable full-bleed row.
 */
export const CONTENT_MAX_WIDTH = isTablet ? 560 : SCREEN_WIDTH;

/** Spread onto a centered content container to apply the tablet cap. */
export const contentContainer = {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
};

/**
 * Live-updating variant of the helpers above, for the cases module scope
 * cannot serve: orientation unlock, iPad Split View, or a foldable.
 */
export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const w = Math.min(width, height);
    const h = Math.max(width, height);
    const wr = clamp(w / BASE_WIDTH, 0.8, 1.2);
    const hr = clamp(h / BASE_HEIGHT, 0.8, 1.2);

    return {
        width: w,
        height: h,
        isTablet: w >= 768,
        isSmallDevice: w < 360,
        scale: (size) => round(size * wr),
        verticalScale: (size) => round(size * hr),
        moderateScale: (size, factor = 0.5) => round(size + (size * wr - size) * factor),
        fontSize: (size) => round(size + (size * wr - size) * 0.4),
        wp: (percent) => round((w * percent) / 100),
        hp: (percent) => round((h * percent) / 100),
    };
};
