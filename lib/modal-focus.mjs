export function manageModalFocus(dialog, onClose) {
  const previous = document.activeElement;
  const focusable = () => [...dialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex="0"]',
  )].filter((element) => element.getClientRects().length);
  const focusFirst = () => (focusable()[0] ?? dialog).focus();
  const keydown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    } else if (event.key === "Tab") {
      const items = focusable();
      const first = items[0] ?? dialog;
      const last = items.at(-1) ?? dialog;
      if (!items.length || !dialog.contains(document.activeElement)
        || (event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  };
  const focusin = (event) => { if (!dialog.contains(event.target)) focusFirst(); };
  document.addEventListener("keydown", keydown, true);
  document.addEventListener("focusin", focusin);
  focusFirst();
  return () => {
    document.removeEventListener("keydown", keydown, true);
    document.removeEventListener("focusin", focusin);
    if (previous?.isConnected && typeof previous.focus === "function") previous.focus();
  };
}
