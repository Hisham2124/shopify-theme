import { Component } from '@theme/component';
import { debounce, requestIdleCallback } from '@theme/utilities';

/**
 * VaporaClean™ — AnchoredPopoverComponent
 * Manages the popover + popover trigger relationship for anchoring.
 * Calculates the trigger position and inlines custom properties on the popover element
 * that can be consumed by CSS for positioning.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} popover – The popover element.
 * @property {HTMLElement} trigger – The popover trigger element.
 *
 * @extends Component<Refs>
 *
 * @example
 * ```html
 * <anchored-popover-component data-close-on-resize>
 *   <button data-ref="trigger" popovertarget="menu">Open Menu</button>
 *   <div data-ref="popover" id="menu" popover>Menu content</div>
 * </anchored-popover-component>
 * ```
 *
 * @property {string[]} requiredRefs - Required refs: 'popover' and 'trigger'
 * @property {number} [interaction_delay] - The delay in milliseconds for the hover interaction
 * @property {string} [data-close-on-resize] - When present, closes popover on window resize
 * @property {string} [data-hover-triggered] - When present, makes the popover function via pointerenter/leave
 * @property {string} [data-variant] - VaporaClean popover type: 'cart' | 'tooltip' | 'dropdown' | 'spec'
 * @property {number | null} [popoverTrigger] - The timeout for the popover trigger
 */
export class AnchoredPopoverComponent extends Component {
  requiredRefs = ['popover', 'trigger'];
  interaction_delay = 200;
  #popoverTrigger = /** @type {number | null} */ (null);

  /**
   * VaporaClean variant — controls animation + styling.
   * Values: 'cart' | 'tooltip' | 'dropdown' | 'spec'
   */
  get #variant() {
    return this.dataset.variant ?? 'dropdown';
  }

  #onTriggerEnter = () => {
    const { trigger, popover } = this.refs;
    trigger.dataset.hoverActive = 'true';
    if (!popover.matches(':popover-open')) {
      this.#popoverTrigger = setTimeout(() => {
        if (trigger.matches('[data-hover-active]')) popover.showPopover();
      }, this.interaction_delay);
    }
  };

  #onTriggerLeave = () => {
    const { trigger, popover } = this.refs;
    delete trigger.dataset.hoverActive;
    if (this.#popoverTrigger) clearTimeout(this.#popoverTrigger);
    if (popover.matches(':popover-open')) {
      this.#popoverTrigger = setTimeout(() => {
        popover.hidePopover();
      }, this.interaction_delay);
    }
  };

  #onPopoverEnter = () => {
    if (this.#popoverTrigger) clearTimeout(this.#popoverTrigger);
  };

  #onPopoverLeave = () => {
    const { popover } = this.refs;
    this.#popoverTrigger = setTimeout(() => {
      popover.hidePopover();
    }, this.interaction_delay);
  };

  /**
   * Animates the popover open using a fade + slide based on variant.
   * Matches VaporaClean brand motion (fast, minimal).
   * @param {'open' | 'close'} direction
   */
  #animatePopover(direction) {
    const { popover } = this.refs;
    if (!popover) return;

    const isOpen    = direction === 'open';
    const distance  = this.#variant === 'tooltip' ? '6px' : '10px';
    const duration  = isOpen ? 220 : 160;
    const easing    = isOpen
      ? 'cubic-bezier(0.16, 1, 0.3, 1)'
      : 'cubic-bezier(0.4, 0, 1, 1)';

    popover.animate(
      [
        { opacity: isOpen ? 0 : 1, transform: `translateY(${isOpen ? distance : '0px'})` },
        { opacity: isOpen ? 1 : 0, transform: `translateY(${isOpen ? '0px' : distance})` },
      ],
      { duration, easing, fill: 'forwards' }
    );
  }

  /**
   * Updates the popover position by calculating trigger element bounds
   * and setting CSS custom properties on the popover element.
   */
  #updatePosition = async () => {
    const { popover, trigger } = this.refs;
    if (!popover || !trigger) return;
    const positions = trigger.getBoundingClientRect();
    popover.style.setProperty('--anchor-top',    `${positions.top}`);
    popover.style.setProperty('--anchor-right',  `${window.innerWidth - positions.right}`);
    popover.style.setProperty('--anchor-bottom', `${window.innerHeight - positions.bottom}`);
    popover.style.setProperty('--anchor-left',   `${positions.left}`);
    popover.style.setProperty('--anchor-height', `${positions.height}`);
    popover.style.setProperty('--anchor-width',  `${positions.width}`);
  };

  /**
   * Debounced resize handler that optionally closes the popover
   * when the window is resized, based on the data-close-on-resize attribute.
   */
  #resizeListener = debounce(() => {
    const popover = /** @type {HTMLElement} */ (this.refs.popover);
    if (popover && popover.matches(':popover-open')) {
      popover.hidePopover();
    }
  }, 100);

  /**
   * Component initialization - sets up event listeners for resize and popover toggle events.
   */
  connectedCallback() {
    super.connectedCallback();
    const { popover, trigger } = this.refs;

    // Apply variant class for CSS targeting
    popover.classList.add(`popover--${this.#variant}`);

    if (this.dataset.closeOnResize) {
      popover.addEventListener('beforetoggle', (event) => {
        const evt = /** @type {ToggleEvent} */ (event);
        window[evt.newState === 'open' ? 'addEventListener' : 'removeEventListener']('resize', this.#resizeListener);
      });
    }

    if (this.dataset.hoverTriggered) {
      trigger.addEventListener('pointerenter', this.#onTriggerEnter);
      trigger.addEventListener('pointerleave', this.#onTriggerLeave);
      popover.addEventListener('pointerenter', this.#onPopoverEnter);
      popover.addEventListener('pointerleave', this.#onPopoverLeave);
    }

    // Animate on open / close
    popover.addEventListener('toggle', (event) => {
      const evt = /** @type {ToggleEvent} */ (event);
      this.#animatePopover(evt.newState === 'open' ? 'open' : 'close');

      // Dispatch VaporaClean events for other components to react
      this.dispatchEvent(new CustomEvent(
        evt.newState === 'open' ? 'vaporaclean:popover:open' : 'vaporaclean:popover:close',
        { bubbles: true, detail: { variant: this.#variant } }
      ));
    });

    if (!CSS.supports('position-anchor: --trigger')) {
      popover.addEventListener('beforetoggle', () => {
        this.#updatePosition();
      });
      requestIdleCallback(() => {
        this.#updatePosition();
      });
    }
  }

  /**
   * Component cleanup - removes resize event listener.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.#resizeListener);
  }
}

if (!customElements.get('anchored-popover-component')) {
  customElements.define('anchored-popover-component', AnchoredPopoverComponent);
}
