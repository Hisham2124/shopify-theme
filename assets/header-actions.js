import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';

/**
 * VaporaClean™ — HeaderActions
 * Header actions component that manages cart notifications.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} liveRegion  - The live region for cart announcements.
 * @property {HTMLElement} [cartCount] - The visible cart count badge.
 * @property {HTMLElement} [cartIcon]  - The cart icon element to animate.
 *
 * @extends {Component<Refs>}
 */
class HeaderActions extends Component {
  requiredRefs = ['liveRegion'];

  /** @type {number | undefined} */
  #badgeTimer = undefined;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(ThemeEvents.cartUpdate, this.#onCartUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(ThemeEvents.cartUpdate, this.#onCartUpdate);
    clearTimeout(this.#badgeTimer);
  }

  /**
   * Handles cart update events.
   * - Announces the new count to screen readers via liveRegion.
   * - Updates the visible cart count badge if the ref exists.
   * - Pulses the cart icon to confirm the add-to-cart action.
   *
   * @param {CustomEvent<{ resource?: { item_count?: number } }>} event
   */
  #onCartUpdate = (event) => {
    const cartCount = event.detail.resource?.item_count;
    if (cartCount === undefined) return;

    // Screen reader announcement (original behaviour)
    this.refs.liveRegion.textContent = `${Theme.translations.cart_count}: ${cartCount}`;

    // Update visible badge
    const badge = this.refs.cartCount;
    if (badge) {
      badge.textContent    = String(cartCount);
      badge.hidden         = cartCount === 0;
      badge.dataset.count  = String(cartCount);
    }

    // Pulse the cart icon
    this.#pulseCartIcon();
  };

  /**
   * Briefly adds the `is-updated` class to the cart icon so CSS
   * can animate a bounce/scale, then removes it.
   * Matches VaporaClean's fast, minimal motion style.
   */
  #pulseCartIcon() {
    const icon = this.refs.cartIcon;
    if (!icon) return;

    icon.classList.add('is-updated');
    clearTimeout(this.#badgeTimer);

    this.#badgeTimer = setTimeout(() => {
      icon.classList.remove('is-updated');
    }, 600);
  }
}

if (!customElements.get('header-actions')) {
  customElements.define('header-actions', HeaderActions);
}
