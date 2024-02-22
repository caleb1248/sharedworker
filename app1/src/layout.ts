const sidebar = document.querySelector('#sidebar') as HTMLDivElement;
const slider = sidebar.querySelector('.slider') as HTMLDivElement;

let dragging = false;
let hovering = false;

let timeout = 0;

function handleMouseLeave() {
  if (timeout) clearTimeout(timeout);
  slider.removeEventListener('mouseleave', handleMouseLeave);
  slider.removeEventListener('mousedown', handleMouseLeave);
}

slider.addEventListener('mouseenter', () => {
  function timeoutFinished() {
    timeout = 0;
    slider.removeEventListener('mouseleave', handleMouseLeave);
    slider.removeEventListener('mousedown', handleMouseLeave);
    slider.classList.add('bg-sky-600');
  }

  timeout = setTimeout(timeoutFinished, 250);

  function handleMouseDown() {
    clearTimeout(timeout);
    timeoutFinished();
  }

  slider.addEventListener('mouseleave', handleMouseLeave);
  slider.addEventListener('mousedown', handleMouseDown);
});

slider.addEventListener('mousedown', () => {
  dragging = true;
  slider.classList.add('bg-sky-600');
});

document.body.addEventListener('mouseup', () => {
  dragging = false;
});

slider.addEventListener('mousemove', (e) => {});
