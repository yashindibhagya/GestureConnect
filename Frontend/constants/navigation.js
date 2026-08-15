/**
 * Bottom tab bar metrics.
 *
 * These are deliberately fixed rather than screen-scaled. Navigation chrome is
 * a control surface, not content: platform conventions put a tab bar at a
 * standard height and its targets at a standard size on every device, so a bar
 * that grew on a large phone and shrank on a small one would read as unstable
 * and would drift away from the ~44pt minimum touch target on the small end.
 *
 * The only things that vary per device are what genuinely differs: the width
 * (the bar spans the screen minus a fixed inset) and the bottom offset (the
 * real safe-area inset).
 */

/** Height of the floating bar itself. */
export const TAB_BAR_HEIGHT = 60;

/** Gap between the bar and the screen edges, left and right. */
export const TAB_BAR_MARGIN = 20;

/** Minimum gap below the bar on devices that report no bottom inset. */
export const TAB_BAR_MIN_BOTTOM = 12;

/** Standard icon size for the four side tabs. */
export const TAB_ICON_SIZE = 24;

/** The raised centre action button. */
export const TAB_CENTER_BUTTON_SIZE = 52;
export const TAB_CENTER_ICON_SIZE = 30;

/** Breathing room between the last row of content and the bar above it. */
const TAB_BAR_GAP = 12;

/**
 * Space a tab screen must leave at the bottom of its scrollable content so the
 * floating bar never covers the last row. Mirrors the bar's own placement, so
 * the two cannot drift apart:
 *
 *   const insets = useSafeAreaInsets();
 *   contentContainerStyle={{ paddingBottom: tabBarClearance(insets.bottom) }}
 */
export const tabBarClearance = (insetBottom = 0) =>
    Math.max(insetBottom, TAB_BAR_MIN_BOTTOM) + TAB_BAR_HEIGHT + TAB_BAR_GAP;
