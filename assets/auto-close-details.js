(function autoCloseDetails() {
  document.addEventListener('click', function (event) {
    const detailsToClose = [...document.querySelectorAll('details[data-auto-close-details][open]')].filter(
      (element) => {
        const closingOn = window.innerWidth < 750 ? 'mobile' : 'desktop';
        return (
          element.getAttribute('data-auto-close-details')?.includes(closingOn) &&
          !(event.target instanceof Node && element.contains(event.target))
        );
      }
    );

    for (const detailsElement of detailsToClose) {
      // Animate the panel out before removing [open], matching VaporaClean accordion motion
      const panel = detailsElement.querySelector('.accordion__panel');

      if (panel && typeof panel.animate === 'function') {
        const currentHeight = panel.offsetHeight;

        const animation = panel.animate(
          [{ height: `${currentHeight}px` }, { height: '0px' }],
          { duration: 280, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
        );

        animation.onfinish = () => {
          detailsElement.removeAttribute('open');
          panel.style.height   = '0px';
          panel.style.overflow = 'hidden';
        };
      } else {
        // No panel found — close instantly as before
        detailsElement.removeAttribute('open');
      }

      // Rotate chevron back to closed position
      const chevron = detailsElement.querySelector('.accordion__chevron');
      if (chevron instanceof HTMLElement) {
        chevron.style.transform  = 'rotate(0deg)';
        chevron.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 1, 1)';
      }

      // Dispatch VaporaClean event so other components can react
      detailsElement.dispatchEvent(
        new CustomEvent('vaporaclean:details:autoclosed', {
          bubbles: true,
          detail: { element: detailsElement },
        })
      );
    }
  });
})();
