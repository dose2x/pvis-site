if (window.lucide) lucide.createIcons();

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

document.getElementById('year').textContent = new Date().getFullYear();

const filters = document.querySelector('.faq-filters');
if (filters) {
  filters.hidden = false;
  const chips = [...filters.querySelectorAll('.chip')];
  const groups = [...document.querySelectorAll('.faq-group')];
  chips.forEach(chip => chip.addEventListener('click', () => {
    const topic = chip.dataset.filter;
    chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    groups.forEach(g => { g.hidden = topic !== 'all' && g.dataset.topic !== topic; });
    document.querySelector('.faq-groups').classList.toggle('single', topic !== 'all');
  }));
}

const wheel = document.querySelector('.journey-wheel');
if (wheel) {
  document.documentElement.classList.add('js');
  const tabs = [...wheel.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('active', on);
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      select(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });
  select(tabs[0]);
}
