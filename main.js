document.documentElement.classList.add('js');
if (window.lucide) lucide.createIcons();

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

function tabGroup(tabs, activate) {
  if (!tabs.length) return;
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      activate(t, on);
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
  return select;
}

const panelToggle = (t, on) => {
  t.classList.toggle('active', on);
  document.getElementById(t.getAttribute('aria-controls')).classList.toggle('active', on);
};
tabGroup([...document.querySelectorAll('.tab')], panelToggle);

const wheelTabs = [...document.querySelectorAll('.journey-wheel [role="tab"]')];
const selectStep = tabGroup(wheelTabs, panelToggle);
const wanted = new URLSearchParams(location.search).get('step');
const wantedTab = wheelTabs.find(t => t.getAttribute('aria-controls') === 'step-' + wanted);
if (selectStep && wantedTab) selectStep(wantedTab);

if ('IntersectionObserver' in window) {
  const live = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting)), { threshold: 0.35 });
  document.querySelectorAll('.cycle, .journey-wheel').forEach(el => live.observe(el));
}

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

const form = document.getElementById('contact-form');
if (form) {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');
  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };
  const checks = {
    name: v => v ? '' : 'Please enter your name.',
    company: v => v ? '' : 'Please enter your company name.',
    email: v => !v ? 'Please enter your email.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.',
    message: v => v ? '' : 'Please tell us how we can help.',
  };
  const validate = () => {
    let first = null;
    for (const [id, check] of Object.entries(checks)) {
      const input = form.elements[id];
      const msg = check(input.value.trim());
      document.getElementById(id + '-error').textContent = msg;
      input.setAttribute('aria-invalid', String(!!msg));
      if (msg) input.setAttribute('aria-describedby', id + '-error'); else input.removeAttribute('aria-describedby');
      if (msg && !first) first = input;
    }
    if (first) first.focus();
    return !first;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('');
    if (!validate()) return;
    if (form.elements.website.value) return;

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      setStatus('This form isn\'t connected yet. Please call 800-834-2310 or email TeamPVIS@playavistains.com and we\'ll get right back to you.', 'warn');
      return;
    }

    submit.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      setStatus('Thanks — your message is on its way. We\'ll be in touch soon.', 'ok');
    } catch {
      setStatus('Something went wrong sending your message. Please call 800-834-2310 or email TeamPVIS@playavistains.com.', 'warn');
    } finally {
      submit.disabled = false;
    }
  });
}
