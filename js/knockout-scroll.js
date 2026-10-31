/** Move within the tree without scrolling the page or replacing focused controls. */
export function scrollKnockoutRound(app, round, behavior = 'instant') {
  const scroll = app.querySelector('.knockout-scroll');
  const columns = [...app.querySelectorAll('[data-round]')].filter(node => node.dataset.round === round);
  const column = columns.find(node => node.querySelector('.user-tie')) || columns[0];
  if (!scroll || !column) return false;
  app.querySelectorAll('[data-action="champions-round"]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.value === round));
  });
  const frame = scroll.getBoundingClientRect(), target = column.getBoundingClientRect();
  scroll.scrollTo({
    left: scroll.scrollLeft + target.left - frame.left - (frame.width - target.width) / 2,
    behavior,
  });
  return true;
}
