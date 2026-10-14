/*
 * Describes the settings panel: which controls exist, which tab/section they
 * sit in, and WHEN they are shown. It mirrors the admin app's layout-settings
 * page (Customization + Preferences tabs); the field names, ranges and choices
 * come from WidgetSettingSerializer / WidgetSetting in the Django API.
 *
 * A control's `when(settings)` decides if it is visible. `default` is only used
 * for display when the saved value is null/undefined, like the admin's `??`.
 */

export const TABS = [
  { id: "customization", label: "Customization" },
  { id: "preferences", label: "Preferences" },
];

export const FONT_FAMILY_OPTIONS = [
  { label: "Default", value: "inherit" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "mono" },
  { label: "Rounded", value: "rounded" },
];

export const FONT_WEIGHT_OPTIONS = [
  { label: "Thin", value: 200 },
  { label: "Normal", value: 400 },
  { label: "Semi-bold", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNMENT_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const SHADOW_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

const AVATAR_SHAPE_OPTIONS = [
  { label: "Circle", value: "circle" },
  { label: "Rounded", value: "rounded" },
  { label: "Square", value: "square" },
];

const REVIEW_TEXT_OPTIONS = [
  { label: "Scroll", value: "scroll" },
  { label: "Read More", value: "read-more" },
  { label: "Truncate", value: "truncate" },
];

export const DISPLAY_TYPE_LABELS = {
  list: "List",
  grid: "Grid",
  carousel: "Carousel",
  floating: "Floating",
  card: "Card",
  rating_badge: "Rating badge",
};

/* Selectors offered as shortcuts in the Custom CSS box (same as the admin). */
export const CSS_COMPONENTS = [
  { label: "Widget Root", selector: "ghl-rw-root" },
  { label: "Header", selector: "ghl-rw-header" },
  { label: "Content", selector: "ghl-rw-content" },
  { label: "Place", selector: "ghl-rw-place" },
  { label: "Card", selector: "ghl-rw-card" },
  { label: "Text", selector: "ghl-rw-text" },
  { label: "Stars", selector: "ghl-rw-stars" },
  { label: "Avatar", selector: "ghl-rw-avatar" },
  { label: "Card Widget", selector: "ghl-rw-card-widget" },
];

const type = (s) => s.display_type;
const isListOrGrid = (s) => ["list", "grid"].includes(type(s));
const hasHeader = (s) => ["list", "grid", "carousel", "card"].includes(type(s));
const hasReviewCards = (s) =>
  ["list", "grid", "carousel", "floating"].includes(type(s));
const reviewTextMode = (s) => s.review_text_display || "scroll";

export const SECTIONS = [
  /* ------------------------- Customization tab ------------------------- */
  {
    id: "colors",
    tab: "customization",
    title: "Colors",
    description: "Match the widget to your brand",
    controls: [
      { type: "color", key: "background_color", label: "Background" },
      { type: "color", key: "text_color", label: "Text" },
      { type: "color", key: "border_color", label: "Border" },
    ],
  },
  {
    id: "item-height",
    tab: "customization",
    title: "Item height",
    description: "Choose how card height is determined",
    controls: [
      {
        type: "toggle",
        key: "fixed_item_height",
        label: "Fixed Item Height",
        description: "Use the same height for every item.",
      },
    ],
  },
  {
    id: "review-card",
    tab: "customization",
    title: "Review card",
    description: "Control how review text is displayed",
    controls: [
      {
        type: "segmented",
        key: "review_text_display",
        label: "Text Display",
        options: REVIEW_TEXT_OPTIONS,
        default: "scroll",
      },
      {
        type: "range",
        key: "review_text_limit",
        label: "Character Limit",
        min: 1,
        max: 2000,
        suffix: "characters",
        default: 150,
        when: (s) => reviewTextMode(s) !== "scroll",
      },
    ],
  },
  {
    id: "stars",
    tab: "customization",
    title: "Stars",
    description: "Size, spacing and empty-star colour",
    controls: [
      { type: "range", key: "star_size", label: "Star size", min: 8, max: 32, suffix: "px", default: 14 },
      { type: "range", key: "star_spacing", label: "Star spacing", min: 0, max: 8, suffix: "px", default: 2 },
      { type: "color", key: "star_color", label: "Star rating" },
      { type: "color", key: "star_empty_color", label: "Empty star", default: "#D1D5DB" },
    ],
  },
  {
    id: "typography",
    tab: "customization",
    title: "Typography",
    description: "Font style and text colours",
    controls: [
      { type: "subhead", title: "Font" },
      { type: "select", key: "font_family", label: "Font style", options: FONT_FAMILY_OPTIONS, default: "inherit" },
      { type: "range", key: "font_size", label: "Text size", min: 10, max: 24, suffix: "px", default: 14 },
      { type: "subhead", title: "Text weight" },
      { type: "select", key: "font_weight", label: "Review text weight", options: FONT_WEIGHT_OPTIONS, default: 400 },
      { type: "select", key: "reviewer_name_weight", label: "Reviewer name weight", options: FONT_WEIGHT_OPTIONS, default: 400 },
      {
        type: "color",
        key: "link_color",
        label: "Read more link",
        default: "#7B8270",
        when: (s) => s.review_text_display === "read-more",
      },
    ],
  },
  {
    id: "header",
    tab: "customization",
    title: "Header",
    description: "Place name and rating",
    when: hasHeader,
    controls: [
      { type: "range", key: "heading_font_size", label: "Place name size", min: 12, max: 48, suffix: "px", default: 24 },
      { type: "select", key: "heading_font_weight", label: "Place name weight", options: FONT_WEIGHT_OPTIONS, default: 600 },
      {
        type: "select",
        key: "heading_alignment",
        label: "Alignment",
        options: ALIGNMENT_OPTIONS,
        default: "center",
        when: (s) => type(s) !== "card",
      },
      {
        type: "color",
        key: "heading_color",
        label: "Place name color",
        fallbackKey: "text_color", // blank = use the text colour
        resetLabel: "Use text color",
        allowBlank: true,
      },
    ],
  },
  {
    id: "card-style",
    tab: "customization",
    title: "Card style",
    description: "Spacing, borders, shadows and avatar",
    when: hasReviewCards,
    controls: [
      { type: "subhead", title: "Spacing & borders" },
      { type: "range", key: "card_padding", label: "Card padding", min: 0, max: 24, suffix: "px", default: 12 },
      { type: "range", key: "card_border_radius", label: "Corner radius", min: 0, max: 50, suffix: "px", default: 12 },
      { type: "range", key: "card_border_width", label: "Border width", min: 0, max: 6, suffix: "px", default: 1 },
      { type: "subhead", title: "Appearance" },
      { type: "select", key: "card_shadow", label: "Shadow", options: SHADOW_OPTIONS, default: "none" },
      { type: "subhead", title: "Reviewer avatar" },
      { type: "range", key: "avatar_size", label: "Avatar size", min: 24, max: 56, suffix: "px", default: 32 },
      { type: "select", key: "avatar_shape", label: "Avatar shape", options: AVATAR_SHAPE_OPTIONS, default: "circle" },
    ],
  },

  /* ------------------------- Preferences tab ------------------------- */
  {
    id: "preferences",
    tab: "preferences",
    title: "Preferences",
    description: "Choose what reviews are displayed and how they behave",
    controls: [
      // Limits depend on how many reviews the connected place has.
      { type: "maxReviews", key: "max_reviews", label: "Number of reviews shown" },
      {
        type: "customHeight",
        label: "Enable custom height",
        description: "Use a fixed height instead of automatic 300px height.",
        when: isListOrGrid,
      },
      {
        type: "segmented",
        key: "items_per_row",
        label: "Items per view",
        options: [2, 3, 4].map((n) => ({ label: String(n), value: n })),
        when: (s) => type(s) === "carousel",
      },
      {
        type: "segmented",
        key: "animation_type",
        label: "Animation type",
        options: [
          { label: "Slide", value: "slide" },
          { label: "Scroll", value: "scroll" },
        ],
        when: (s) => type(s) === "carousel",
      },
      {
        type: "segmented",
        key: "animation_speed",
        label: "Animation speed",
        options: [
          { label: "Slow", value: "slow" },
          { label: "Normal", value: "normal" },
          { label: "Fast", value: "fast" },
        ],
        when: (s) => type(s) === "carousel",
      },
      {
        type: "segmented",
        key: "loading_choice",
        label: "Load more behavior",
        options: [
          { label: "Scroll", value: "scroll" },
          { label: "View more", value: "view-more" },
        ],
        default: "scroll",
        when: isListOrGrid,
      },
      {
        type: "segmented",
        key: "min_rating",
        label: "Minimum rating",
        options: [1, 2, 3, 4, 5].map((n) => ({ label: `${n}★`, value: n })),
      },
      {
        type: "toggle",
        key: "show_reviews_with_text",
        label: "Reviews with text",
        description: "Only show reviews that contain written content.",
      },
      {
        type: "segmented",
        key: "floating_position",
        label: "Position",
        options: [
          { label: "Top left", value: "top-left" },
          { label: "Top right", value: "top-right" },
          { label: "Bottom left", value: "bottom-left" },
          { label: "Bottom right", value: "bottom-right" },
        ],
        when: (s) => ["floating", "card", "rating_badge"].includes(type(s)),
      },
      { type: "customCss", key: "custom_css", label: "Custom CSS" },
    ],
  },
];
