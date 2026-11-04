document.documentElement.classList.add('js');
if (window.lucide) lucide.createIcons();

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  const setOpen = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
    setOpen(false);
    toggle.focus();
  });
}

document.querySelectorAll('.motion-toggle').forEach(btn => {
  const target = document.getElementById(btn.getAttribute('aria-controls'));
  const label = btn.querySelector('.motion-label');
  if (!target) return;
  btn.addEventListener('click', () => {
    const paused = target.classList.toggle('motion-paused');
    btn.toggleAttribute('data-paused', paused);
    const text = paused ? btn.dataset.play : btn.dataset.pause;
    if (label) label.textContent = text; else btn.setAttribute('aria-label', text);
  });
});

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
  // Cloudflare's script calls this once it has loaded. Narrow phones get the compact box so it fits inside the card.
  window.onTurnstileLoad = () => {
    const box = form.querySelector('.cf-turnstile');
    if (box) window.turnstile.render(box, { sitekey: box.dataset.sitekey, action: 'contact', theme: 'light', size: window.innerWidth < 400 ? 'compact' : 'flexible' });
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

    // Cloudflare Turnstile puts its token in the form as soon as the visitor passes the check.
    const data = new FormData(form);
    if (!data.get('cf-turnstile-response')) {
      setStatus(window.turnstile
        ? 'Please complete the human check above, then send your message.'
        : 'The human check didn\'t load. Please call 800-834-2310 or email TeamPVIS@playavistains.com.', 'warn');
      return;
    }

    submit.disabled = true;
    setStatus('Sending…');
    let sent = false;
    let failure = 'Something went wrong sending your message. Please call 800-834-2310 or email TeamPVIS@playavistains.com.';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const reply = await res.json().catch(() => ({}));
      if (res.ok && reply.ok !== false) sent = true;
      else if (reply.error) failure = reply.error;
    } catch {}
    if (sent) {
      form.reset();
      setStatus('Thanks — your message is on its way. We\'ll be in touch soon.', 'ok');
    } else {
      setStatus(failure, 'warn');
    }
    submit.disabled = false;
    // A token works only once, so the visitor gets a fresh check for the next try.
    if (window.turnstile) window.turnstile.reset();
  });
}
