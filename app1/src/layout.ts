const sidebar = document.querySelector('#sidebar') as HTMLDivElement;
const slider = sidebar.querySelector('.slider') as HTMLDivElement;

let dragging = false;
let hovering = false;

slider.addEventListener('mouseenter', () => {});

slider.addEventListener('mousedown', () => {
  dragging = true;
  slider.classList.add('bg-sky-600');
});
slider.addEventListener('mouseup', () => (dragging = false));
