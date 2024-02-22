const sidebar = document.querySelector('#sidebar') as HTMLDivElement;
const slider = sidebar.querySelector('.slider') as HTMLDivElement;

let dragging = false;
let hovering = false;

let timeout = 0;

function handleMouseLeave() {
  if (dragging) return;
  if (timeout) clearTimeout(timeout);
  slider.classList.remove('bg-sky-600');
}

function handleMouseDown() {
  if (timeout) clearTimeout(timeout);
  timeout = 0;
  slider.classList.add('bg-sky-600');
}

slider.addEventListener('mouseenter', () => {
  timeout = setTimeout(() => {
    timeout = 0;
    slider.classList.add('bg-sky-600');
  }, 250);
});

slider.addEventListener('mousedown', () => {
  if (timeout) clearTimeout(timeout);
  timeout = 0;
  dragging = true;
  slider.classList.add('bg-sky-600');
});

slider.addEventListener('mouseleave', handleMouseLeave);

document.body.addEventListener('mouseup', () => (dragging = false));

document.body.addEventListener('mousemove', (e) => {
  if (dragging) sidebar.style.width = `${Math.max(e.clientX, 250)}px`;
});
