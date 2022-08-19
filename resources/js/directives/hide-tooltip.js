import _ from 'lodash';

// Hide tooltip on click
const hideTooltip = (element, vnode) => {
  vnode.context.$root.$emit('bv::hide::tooltip', element.getAttribute('id'));
};

// Directive to close tooltip on click
// usage: add to component with: v-tooltip-hide-click
export default {
  bind (element, binding, vnode) {
    // If element doesn't have an id, create a random id to close tooltip later
    if (element.getAttribute('id') == null) {
      element.setAttribute('id', _.uniqueId('randid-'));
    }

    element.addEventListener('click', () => {
      hideTooltip(element, vnode);
    });
  },
  unbind (element, binding, vnode) {
    element.removeEventListener('click', () => {
      hideTooltip(element, vnode);
    });
  }
};
