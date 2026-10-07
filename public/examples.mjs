// Request fixtures + the approved baseline, embedded so the browser UI,
// CLI, and tests share the same data. Tests assert these strings match
// the files on disk in examples/.

const SETTINGS_PAGE = `{
  "id": "settings-page",
  "title": "Account settings",
  "brief": "Settings page with a page header, a profile card with a save button, a preferences field, and a danger zone with a delete button.",
  "elements": [
    { "id": "title", "type": "heading", "slot": "header", "label": "Account settings" },
    { "id": "profile-card", "type": "card", "slot": "main", "label": "Profile" },
    { "id": "save", "type": "button", "slot": "main", "label": "Save changes", "intent": "primary" },
    { "id": "digest", "type": "field", "slot": "aside", "label": "Email digest" },
    { "id": "danger-note", "type": "text", "slot": "footer", "label": "Deleting your account is permanent." },
    { "id": "delete", "type": "button", "slot": "footer", "label": "Delete account", "intent": "danger" }
  ],
  "wireframe": { "slotOrder": ["header", "main", "aside", "footer"] }
}`;

const CHECKOUT_MODAL = `{
  "id": "checkout-modal",
  "title": "Checkout modal",
  "brief": "Checkout modal with a title, an order summary card, a promo-code field, a pay button, and a cancel link.",
  "elements": [
    { "id": "modal-title", "type": "heading", "slot": "header", "label": "Checkout" },
    { "id": "summary", "type": "card", "slot": "main", "label": "Order summary" },
    { "id": "promo", "type": "field", "slot": "main", "label": "Promo code" },
    { "id": "pay", "type": "button", "slot": "footer", "label": "Pay now", "intent": "primary" },
    { "id": "cancel", "type": "text", "slot": "footer", "label": "Cancel" }
  ],
  "wireframe": { "slotOrder": ["header", "main", "footer"] }
}`;

const BASELINE_UI = `{
  "request": "settings-page",
  "mode": "components",
  "elements": [
    {
      "id": "title",
      "type": "heading",
      "slot": "header",
      "label": "Account settings",
      "intent": null,
      "fontPx": 24,
      "fg": "#1E2A32",
      "bg": "#FAFBFC",
      "padPx": 16,
      "radiusPx": 0
    },
    {
      "id": "profile-card",
      "type": "card",
      "slot": "main",
      "label": "Profile",
      "intent": null,
      "fontPx": 14,
      "fg": "#1E2A32",
      "bg": "#FFFFFF",
      "padPx": 24,
      "radiusPx": 8
    },
    {
      "id": "save",
      "type": "button",
      "slot": "main",
      "label": "Save changes",
      "intent": "primary",
      "fontPx": 14,
      "fg": "#FFFFFF",
      "bg": "#245B78",
      "padPx": 12,
      "radiusPx": 8
    },
    {
      "id": "digest",
      "type": "field",
      "slot": "aside",
      "label": "Email digest",
      "intent": null,
      "fontPx": 14,
      "fg": "#1E2A32",
      "bg": "#FFFFFF",
      "padPx": 12,
      "radiusPx": 4
    },
    {
      "id": "danger-note",
      "type": "text",
      "slot": "footer",
      "label": "Deleting your account is permanent.",
      "intent": null,
      "fontPx": 14,
      "fg": "#1E2A32",
      "bg": "#FAFBFC",
      "padPx": 8,
      "radiusPx": 0
    },
    {
      "id": "delete",
      "type": "button",
      "slot": "footer",
      "label": "Delete account",
      "intent": "danger",
      "fontPx": 14,
      "fg": "#FFFFFF",
      "bg": "#8C2B36",
      "padPx": 12,
      "radiusPx": 8
    }
  ]
}`;

export const RAW = {
  'settings-page.json': SETTINGS_PAGE,
  'checkout-modal.json': CHECKOUT_MODAL,
  'baseline-ui.json': BASELINE_UI,
};

export const REQUESTS = [JSON.parse(SETTINGS_PAGE), JSON.parse(CHECKOUT_MODAL)];
export const APPROVED_BASELINE = JSON.parse(BASELINE_UI);
