import { mediaQueryLarge, isMobileBreakpoint } from '@theme/utilities';

// Accordion — VaporaClean™
// Still extends HTMLElement over Component so that refs are still available to parent components (e.g. SortingFilterComponent)
class AccordionCustom extends HTMLElement {

  /** @type {HTMLDetailsElement} */
  get details() {
    const details = this.querySelector('details');
    if (!(details instanceof HTMLDetailsElement)) throw new Error('Details element not found');
    return details;
  }

  /** @type {HTMLElement} */
  get summary() {
    const summary = this.details.querySelector('summary');
    if (!(summary instanceof HTMLElement)) throw new Error('Summary element not found');
    return summary;
  }

  /** @type {HTMLElement | null} */
  get panel() {
    return this.details.querySelector('.accordion__panel');
  }

  /** @type {HTMLElement | null} */
  get chevron() {
    return this.summary.querySelector('.accordion__chevron');
  }

  get #disableOnMobile() {
    return this.dataset.disableOnMobile === 'true';
  }

  get #disableOnDesktop() {
    return this.dataset.disableOnDesktop === 'true';
  }

  get #closeWithEscape() {
    return this.dataset.closeWithEscape === 'true';
  }

  #controller  = new AbortController();
  #animation   = null;
  #isAnimating = false;

  connectedCallback() {
    const { signal } = this.#controller;
    this.#setDefaultOpenState();
    this.addEventListener('keydown', this.#handleKeyDown, { signal });
    this.summary.addEventListener('click', this.handleClick, { signal });
    mediaQueryLarge.addEventListener('change', this.#handleMediaQueryChange, { signal });
  }

  /**
   * Handles the disconnect event.
   */
  disconnectedCallback() {
    // Disconnect all the event listeners
    this.#controller.abort();
    this.#animation?.cancel();
  }

  /**
   * Handles the click event.
   * @param {Event} event - The event.
   */
  handleClick = (event) => {
    event.preventDefault();

    const isMobile  = isMobileBreakpoint();
    const isDesktop = !isMobile;

    // Stop default behaviour from the browser
    if ((isMobile && this.#disableOnMobile) || (isDesktop && this.#disableOnDesktop)) {
      return;
    }

    this.details.open ? this.#close() : this.#open();
  };

  /**
   * Handles the media query change event.
   */
  #handleMediaQueryChange = () => {
    this.#animation?.cancel();
    this.#isAnimating = false;
    if (this.panel) {
      this.panel.style.height   = '';
      this.panel.style.overflow = '';
    }
    this.#setDefaultOpenState();
  };

  /**
   * Sets the default open state of the accordion based on the `open-by-default-on-mobile` and `open-by-default-on-desktop` attributes.
   */
  #setDefaultOpenState() {
    const isMobile = isMobileBreakpoint();

    const shouldOpen =
      (isMobile  && this.hasAttribute('open-by-default-on-mobile'))  ||
      (!isMobile && this.hasAttribute('open-by-default-on-desktop'));

    this.details.open = shouldOpen;
    this.#rotateChevron(shouldOpen);

    const panel = this.panel;
    if (!panel) return;

    if (shouldOpen) {
      panel.style.height   = '';
      panel.style.overflow = '';
    } else {
      panel.style.height   = '0px';
      panel.style.overflow = 'hidden';
    }
  }

  /**
   * Handles keydown events for the accordion
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #handleKeyDown(event) {
    // Close the accordion when used as a menu
    if (event.key === 'Escape' && this.#closeWithEscape) {
      event.preventDefault();
      this.#close();
      this.summary.focus();
    }
  }

  /**
   * Opens the accordion with a smooth height animation.
   */
  #open() {
    if (this.#isAnimating) return;

    this.details.open = true;
    this.#rotateChevron(true);
    this.summary.setAttribute('aria-expanded', 'true');

    const panel = this.panel;
    if (!panel) return;

    panel.style.height   = 'auto';
    panel.style.overflow = 'hidden';
    const targetHeight   = panel.scrollHeight;
    panel.style.height   = '0px';

    this.#isAnimating = true;

    this.#animation = panel.animate(
      [{ height: '0px' }, { height: `${targetHeight}px` }],
      { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );

    this.#animation.onfinish = () => {
      panel.style.height   = '';
      panel.style.overflow = '';
      this.#isAnimating    = false;
    };

    this.#animation.oncancel = () => {
      this.#isAnimating = false;
    };
  }

  /**
   * Closes the accordion with a smooth height animation.
   */
  #close() {
    if (this.#isAnimating) return;

    this.#rotateChevron(false);
    this.summary.setAttribute('aria-expanded', 'false');

    const panel = this.panel;

    if (!panel) {
      this.details.open = false;
      return;
    }

    const currentHeight  = panel.offsetHeight;
    this.#isAnimating    = true;
    panel.style.overflow = 'hidden';

    this.#animation = panel.animate(
      [{ height: `${currentHeight}px` }, { height: '0px' }],
      { duration: 280, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
    );

    this.#animation.onfinish = () => {
      this.details.open    = false;
      panel.style.height   = '0px';
      panel.style.overflow = 'hidden';
      this.#isAnimating    = false;
    };

    this.#animation.oncancel = () => {
      this.#isAnimating = false;
    };
  }

  /**
   * Rotates the chevron icon to reflect open / closed state.
   * @param {boolean} isOpen
   */
  #rotateChevron(isOpen) {
    const chevron = this.chevron;
    if (!chevron) return;
    chevron.style.transform  = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    chevron.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
  }
}

if (!customElements.get('accordion-custom')) {
  customElements.define('accordion-custom', AccordionCustom);
}
