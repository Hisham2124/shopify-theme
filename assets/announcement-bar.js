import { Component } from '@theme/component';

/**
 * VaporaClean™ — AnnouncementBar
 * Announcement banner custom element that allows fading between content.
 * Based on the Slideshow component.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} slideshowContainer
 * @property {HTMLElement[]} [slides]
 * @property {HTMLButtonElement} [previous]
 * @property {HTMLButtonElement} [next]
 *
 * @extends {Component<Refs>}
 */
export class AnnouncementBar extends Component {
  #current = 0;

  /**
   * The interval ID for automatic playback.
   * @type {number|undefined}
   */
  #interval = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mouseenter', this.suspend);
    this.addEventListener('mouseleave', this.resume);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#initSlides();
    this.play();
  }

  /**
   * Cleans up the visibilitychange listener when the element is removed.
   */
  disconnectedCallback() {
    super.disconnectedCallback?.();
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
    this.suspend();
  }

  /**
   * Sets the first slide as visible and hides the rest on init.
   * Adds the fade class to all slides so CSS transitions apply.
   */
  #initSlides() {
    const slides = this.refs.slides ?? [];
    slides.forEach((slide, index) => {
      slide.classList.add('announcement-bar__slide');
      slide.setAttribute('aria-hidden', `${index !== 0}`);
    });
  }

  next() {
    this.current += 1;
  }

  previous() {
    this.current -= 1;
  }

  /**
   * Starts automatic slide playback.
   * @param {number} [interval] - The time interval in seconds between slides.
   */
  play(interval = this.autoplayInterval) {
    if (!this.autoplay) return;
    this.paused = false;
    this.#interval = setInterval(() => {
      if (this.matches(':hover') || document.hidden) return;
      this.next();
    }, interval);
  }

  /**
   * Pauses automatic slide playback.
   */
  pause() {
    this.paused = true;
    this.suspend();
  }

  get paused() {
    return this.hasAttribute('paused');
  }

  set paused(paused) {
    this.toggleAttribute('paused', paused);
  }

  /**
   * Suspends automatic slide playback.
   */
  suspend() {
    clearInterval(this.#interval);
    this.#interval = undefined;
  }

  /**
   * Resumes automatic slide playback if autoplay is enabled.
   */
  resume() {
    if (!this.autoplay || this.paused) return;
    this.pause();
    this.play();
  }

  get autoplay() {
    return Boolean(this.autoplayInterval);
  }

  get autoplayInterval() {
    const interval = this.getAttribute('autoplay');
    const value = parseInt(`${interval}`, 10);
    if (Number.isNaN(value)) return undefined;
    return value * 1000;
  }

  get current() {
    return this.#current;
  }

  set current(current) {
    const slides = this.refs.slides ?? [];
    if (!slides.length) return;

    const prevIndex = this.#current % slides.length < 0
      ? (this.#current % slides.length) + slides.length
      : this.#current % slides.length;

    this.#current = current;

    let relativeIndex = current % slides.length;
    if (relativeIndex < 0) {
      relativeIndex += slides.length;
    }

    // Fade out previous, fade in next
    slides.forEach((slide, index) => {
      const isActive = index === relativeIndex;
      slide.setAttribute('aria-hidden', `${!isActive}`);
      slide.classList.toggle('announcement-bar__slide--active', isActive);
      slide.classList.toggle('announcement-bar__slide--hidden', !isActive);
    });

    // Dispatch VaporaClean slide change event
    this.dispatchEvent(new CustomEvent('vaporaclean:announcement:change', {
      bubbles: true,
      detail: {
        current:  relativeIndex,
        previous: prevIndex,
        total:    slides.length,
      },
    }));
  }

  /**
   * Pause the slideshow when the page is hidden.
   */
  #handleVisibilityChange = () => (document.hidden ? this.pause() : this.resume());
}

if (!customElements.get('announcement-bar-component')) {
  customElements.define('announcement-bar-component', AnnouncementBar);
}
