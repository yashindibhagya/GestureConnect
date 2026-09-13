/**
 * Bottom tab bar metrics.
 *
 * These are deliberately fixed rather than screen-scaled. Navigation chrome is
 * a control surface, not content: platform conventions put a tab bar at a
 * standard height and its targets at a standard size on every device, so a bar
 * that grew on a large phone and shrank on a small one would read as unstable
 * and would drift away from the ~44pt minimum touch target on the small end.
 *
 * The only per-device measurement is the safe-area bottom inset, which the bar
 * absorbs as padding so its icons clear the home indicator while the bar itself
 * stays flush with the bottom edge.
 */

/** Height of the row the icons sit in, above any safe-area padding. */
export const TAB_BAR_HEIGHT = 60;

/**
 * Cap on how much of the safe-area bottom inset the bar absorbs as padding.
 *
 * Devices with a home indicator report ~34pt. Absorbing all of it makes a
 * 94pt-tall bar whose bottom third is empty — which reads as a white slab under
 * the icons rather than as navigation. The indicator only needs the icons kept
 * out of its way, not the full inset reserved, so this caps the padding and
 * lets the indicator draw over the remainder.
 */
export const TAB_BAR_MAX_INSET = 16;

/** The bottom padding the bar actually applies on this device. */
export const tabBarInset = (insetBottom = 0) =>
    Math.min(insetBottom, TAB_BAR_MAX_INSET);

/** Corner rounding on the bar's top edge (the bottom edge is flush). */
export const TAB_BAR_RADIUS = 20;

/** Standard icon size for the four side tabs. */
export const TAB_ICON_SIZE = 24;

/** The raised centre action button. */
export const TAB_CENTER_BUTTON_SIZE = 52;
export const TAB_CENTER_ICON_SIZE = 30;

/** Breathing room between the last row of content and the bar above it. */
const TAB_BAR_GAP = 12;

/**
 * Space a tab screen must leave at the bottom of its scrollable content so the
 * bar never covers the last row. Mirrors the bar's own height, so the two
 * cannot drift apart:
 *
 *   const insets = useSafeAreaInsets();
 *   contentContainerStyle={{ paddingBottom: tabBarClearance(insets.bottom) }}
 */
export const tabBarClearance = (insetBottom = 0) =>
    TAB_BAR_HEIGHT + tabBarInset(insetBottom) + TAB_BAR_GAP;
