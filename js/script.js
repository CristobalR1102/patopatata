/**
 * =========================================================
 * PATOPATATA - JAVASCRIPT
 * Menú, carrito con varios productos, checkout por WhatsApp,
 * horario en vivo.
 * =========================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ===================== CONFIGURACIÓN DE NEGOCIO =====================
  // IMPORTANTE: Reemplazar por el número oficial de WhatsApp de PatoPatata (sin '+', ej: 56912345678)
  const WHATSAPP_NUMBER = '56900000000';
  const ADDRESS = 'Chacabuco 100, Maipú';

  // Horario por día (0 = domingo). null = cerrado.
  const HOURS = {
    0: null,
    1: [12, 20], 2: [12, 20], 3: [12, 20], 4: [12, 20], 5: [12, 20],
    6: [12, 17],
  };
  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // ===================== MENÚ =====================
  const SIZES = [
    { id: 'L',    name: 'Tamaño L',  desc: 'Ideal para 1 persona',      price: 2500, sauce: 500, topping: 1000 },
    { id: 'XL',   name: 'Tamaño XL', desc: 'Para compartir',            price: 3500, sauce: 800, topping: 1500, popular: true },
    { id: 'Cono', name: 'Cono',      desc: 'Formato gigante al paso',   price: 4000, sauce: 800, topping: 1500 },
  ];
  const SAUCES = ['Mayo Ajo', 'Cheddar', 'Salsa Dorito', 'Mayo Ciboulette', 'Mayo Albahaca', 'Mostaza Miel', 'Salsa Olivo', 'Tocineta', 'Salsa Ajo'];
  const TOPPINGS = ['Mechada', 'Lomo Saltado', 'Cerdo BBQ', 'Pollo Teriyaki', 'Tocino Crunch', 'Cebolla Caramelizada', 'Champiñones Salteados', 'Choclo a la Crema'];
  const FREEBIES = ['Merkén', 'Orégano', 'Ketchup', 'Mostaza', 'Comino', 'Pimienta'];

  const FAVORITES = [
    {
      name: 'La Pato Mechada Suprema', tag: 'Más vendido',
      desc: 'Mechada jugosa, cheddar fundido, mayo ajo y tocino crunch.',
      size: 'XL', sauces: ['Cheddar', 'Mayo Ajo'], toppings: ['Mechada', 'Tocino Crunch'],
    },
    {
      name: 'La Pato BBQ Crunch', tag: 'Recomendado',
      desc: 'Cerdo BBQ, cebolla caramelizada y salsa Dorito.',
      size: 'L', sauces: ['Salsa Dorito'], toppings: ['Cerdo BBQ', 'Cebolla Caramelizada'],
    },
    {
      name: 'La Pato Lomo Criollo', tag: 'Especialidad',
      desc: 'Cono con lomo saltado, champiñones salteados y mayo ciboulette.',
      size: 'Cono', sauces: ['Mayo Ciboulette'], toppings: ['Lomo Saltado', 'Champiñones Salteados'],
    },
  ];

  // ===================== UTILIDADES =====================
  const $ = (id) => document.getElementById(id);
  const formatCLP = (n) => '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sizeById = (id) => SIZES.find((s) => s.id === id) || SIZES[0];
  const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento: el carrito vive solo en memoria */ }
    },
  };

  // Ilustraciones de tamaño (mismo estilo del cono del hero)
  const FRIES = (x, h) => `<rect x="${x}" y="${34 - h}" width="7" height="${h + 8}" rx="2" fill="#F9D948"/>`;
  const sizeArt = (id) => {
    const stroke = 'stroke="#2A1A0E" stroke-width="3" stroke-linejoin="round"';
    if (id === 'Cono') {
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><g ${stroke}>${FRIES(20, 20)}${FRIES(28, 26)}${FRIES(36, 22)}<path d="M12 30h40L36 60a4 4 0 0 1-8 0Z" fill="#FA663B"/></g></svg>`;
    }
    const big = id === 'XL';
    const w = big ? 44 : 34;
    const x0 = 32 - w / 2;
    const fries = big ? FRIES(16, 16) + FRIES(24, 22) + FRIES(32, 26) + FRIES(40, 18) : FRIES(21, 18) + FRIES(29, 24) + FRIES(37, 16);
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><g ${stroke}>${fries}<path d="M${x0} 32h${w}l-4 26H${x0 + 4}Z" fill="#FA663B"/></g></svg>`;
  };

  const itemUnitPrice = (item) => {
    const s = sizeById(item.size);
    return s.price + item.sauces.length * s.sauce + item.toppings.length * s.topping;
  };
  const itemTitle = (item) => item.name || `Papas ${sizeById(item.size).name.replace('Tamaño ', '')}`;
  const itemDetail = (item) => {
    const parts = [];
    if (item.name) parts.push(sizeById(item.size).name);
    if (item.sauces.length) parts.push(item.sauces.join(', '));
    if (item.toppings.length) parts.push(item.toppings.join(', '));
    if (item.freebies.length) parts.push(`Gratis: ${item.freebies.join(', ')}`);
    if (item.note) parts.push(`Nota: ${item.note}`);
    return parts.join(' · ') || 'Sin salsas ni toppings';
  };

  // ===================== HORARIO EN VIVO =====================
  const chileNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));

  const getStoreStatus = () => {
    const now = chileNow();
    const day = now.getDay();
    const t = now.getHours() + now.getMinutes() / 60;
    const today = HOURS[day];

    if (today && t >= today[0] && t < today[1]) {
      return { open: true, text: `Abierto ahora · hasta las ${today[1]}:00`, hours: today };
    }
    if (today && t < today[0]) {
      return { open: false, text: `Cerrado · hoy abrimos a las ${today[0]}:00`, hours: today, nextLabel: `hoy a las ${today[0]}:00` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) {
        const when = i === 1 ? 'mañana' : `el ${DAY_NAMES[d]}`;
        return { open: false, text: `Cerrado · abrimos ${when} a las ${HOURS[d][0]}:00`, hours: HOURS[d], nextLabel: `${when} a las ${HOURS[d][0]}:00` };
      }
    }
    return { open: false, text: 'Cerrado', hours: [12, 20], nextLabel: '' };
  };

  const status = getStoreStatus();
  $('storeStatusText').textContent = status.text;
  $('storeStatus').dataset.open = String(status.open);

  const todayIdx = chileNow().getDay();
  document.querySelectorAll('.schedule li').forEach((li) => {
    if (li.dataset.days.split(',').map(Number).includes(todayIdx)) li.classList.add('is-today');
  });

  // ===================== CINTA DE HORARIO Y UBICACIÓN =====================
  const renderTicker = () => {
    const track = $('tickerTrack');
    if (!track) return;
    const items = [
      `<span class="ticker__dot" data-open="${status.open}"></span>${status.text}`,
      `<svg class="icon"><use href="#i-pin"/></svg>Chacabuco 100, Maipú`,
      `<svg class="icon"><use href="#i-store"/></svg>Retiro en el local`,
      `<svg class="icon"><use href="#i-bike"/></svg>Delivery por Uber Eats`,
    ];
    const group = items.map((it) => `<span class="ticker__item">${it}</span><span class="ticker__sep"></span>`).join('');
    // Dos copias idénticas: la animación avanza -50% y vuelve sin salto
    track.innerHTML = `<div class="ticker__group">${group}</div><div class="ticker__group">${group}</div>`;
    $('ticker').addEventListener('click', () => $('ticker').classList.toggle('is-paused'));
  };
  renderTicker();

  // ===================== MENÚ MÓVIL =====================
  const menuBtn = $('menuBtn');
  const nav = $('nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuBtn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  // Tocar fuera del menú lo cierra
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  // ===================== RENDER DEL CONTENIDO ESTÁTICO =====================
  const renderFavorites = () => {
    $('favList').innerHTML = FAVORITES.map((f, i) => {
      const price = itemUnitPrice({ ...f, freebies: [] });
      return `
        <article class="fav-card">
          <div class="fav-card__top">
            <div class="fav-card__art">${sizeArt(f.size)}</div>
            <div>
              <span class="fav-card__tag">${f.tag}</span>
              <h3 class="fav-card__title">${f.name}</h3>
              <p class="fav-card__meta">${sizeById(f.size).name}</p>
            </div>
          </div>
          <p class="fav-card__desc">${f.desc}</p>
          <div class="fav-card__foot">
            <span class="fav-card__price">${formatCLP(price)}</span>
            <button type="button" class="btn btn--ghost" data-fav-edit="${i}" aria-label="Personalizar ${f.name}">Personalizar</button>
            <button type="button" class="btn btn--primary" data-fav-add="${i}" aria-label="Agregar ${f.name} al pedido">
              <svg class="icon"><use href="#i-plus"/></svg>Agregar
            </button>
          </div>
        </article>`;
    }).join('');
  };

  const renderSizePick = () => {
    $('sizePick').innerHTML = SIZES.map((s) => `
      <button type="button" class="size-pick__btn" data-open-builder="${s.id}">
        <span class="size-pick__art">${sizeArt(s.id)}</span>
        <span class="size-pick__info">
          ${s.popular ? '<span class="badge-popular">Más pedido</span>' : ''}
          <span class="size-pick__name">${s.name}</span>
          <span class="size-pick__desc">${s.desc}</span>
        </span>
        <span class="size-pick__price">${formatCLP(s.price)}</span>
        <span class="size-pick__go" aria-hidden="true"><svg class="icon"><use href="#i-plus"/></svg></span>
      </button>`).join('');

    $('priceCards').innerHTML = SIZES.map((s) => `
      <div class="price-card">
        <span class="price-card__art">${sizeArt(s.id)}</span>
        <div class="price-card__head">
          <span class="price-card__name">${s.name}</span>
          <span class="price-card__base">${formatCLP(s.price)}</span>
        </div>
        <div class="price-card__extras">
          <span>Salsa <b>+${formatCLP(s.sauce)}</b></span>
          <span>Topping <b>+${formatCLP(s.topping)}</b></span>
        </div>
      </div>`).join('');

    const tags = (list) => list.map((x) => `<li>${x}</li>`).join('');
    $('sauceTags').innerHTML = tags(SAUCES);
    $('toppingTags').innerHTML = tags(TOPPINGS);
    $('freebieTags').innerHTML = tags(FREEBIES);
  };

  renderFavorites();
  renderSizePick();

  // ===================== SHEETS (dialog) =====================
  const openSheet = (dlg) => {
    if (dlg.open) return;
    document.documentElement.style.overflow = 'hidden';
    dlg.showModal();
  };
  const closeSheet = (dlg) => new Promise((resolve) => {
    if (!dlg.open) return resolve();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      dlg.classList.remove('is-closing');
      dlg.close();
      if (!document.querySelector('dialog[open]')) document.documentElement.style.overflow = '';
      resolve();
    };
    if (reduce) return finish();
    dlg.classList.add('is-closing');
    setTimeout(finish, 170);
  });

  document.querySelectorAll('dialog.sheet').forEach((dlg) => {
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(dlg); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeSheet(dlg); });
    dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheet(dlg)));
  });

  // ===================== CARRITO =====================
  let cart = storage.get('pp_cart', []).filter((it) => it && SIZES.some((s) => s.id === it.size));
  const saveCart = () => storage.set('pp_cart', cart);
  const cartCount = () => cart.reduce((n, it) => n + it.qty, 0);
  const cartTotal = () => cart.reduce((n, it) => n + itemUnitPrice(it) * it.qty, 0);

  const updateCartUI = ({ bump = false } = {}) => {
    const count = cartCount();
    const total = cartTotal();

    const badge = $('headerCartBadge');
    badge.hidden = count === 0;
    badge.textContent = count;
    $('headerCartBtn').setAttribute('aria-label', `Ver tu pedido, ${count} ${count === 1 ? 'producto' : 'productos'}`);

    $('bottomBarEmpty').hidden = count > 0;
    $('bottomBarCart').hidden = count === 0;
    $('bottomBarCount').textContent = count;
    $('bottomBarTotal').textContent = formatCLP(total);

    if (bump) {
      [badge, $('bottomBarCart')].forEach((el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
    }

    // Contenido del sheet
    const empty = cart.length === 0;
    $('cartEmpty').hidden = !empty;
    $('addMoreBtn').hidden = empty;
    $('checkoutFields').hidden = empty;
    $('checkoutFoot').hidden = empty;
    $('cartTotal').textContent = formatCLP(total);

    $('cartList').innerHTML = cart.map((it) => `
      <li class="cart-item">
        <span class="cart-item__name">${escapeHTML(itemTitle(it))}</span>
        <span class="cart-item__price">${formatCLP(itemUnitPrice(it) * it.qty)}</span>
        <span class="cart-item__detail">${escapeHTML(itemDetail(it))}</span>
        <div class="cart-item__actions">
          <div class="stepper stepper--sm" role="group" aria-label="Cantidad de ${escapeHTML(itemTitle(it))}">
            <button type="button" class="stepper__btn" data-cart-dec="${it.uid}" aria-label="${it.qty === 1 ? 'Eliminar' : 'Quitar uno'}">
              <svg class="icon"><use href="#${it.qty === 1 ? 'i-trash' : 'i-minus'}"/></svg>
            </button>
            <span class="stepper__val">${it.qty}</span>
            <button type="button" class="stepper__btn" data-cart-inc="${it.uid}" aria-label="Agregar uno"><svg class="icon"><use href="#i-plus"/></svg></button>
          </div>
          <span class="spacer"></span>
          <button type="button" class="text-btn" data-cart-edit="${it.uid}"><svg class="icon"><use href="#i-edit"/></svg>Editar</button>
        </div>
      </li>`).join('');
  };

  let lastRemoved = null;
  $('cartList').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-cart-inc]');
    const dec = e.target.closest('[data-cart-dec]');
    const edit = e.target.closest('[data-cart-edit]');
    if (inc) {
      const it = cart.find((x) => x.uid === inc.dataset.cartInc);
      if (it) it.qty = Math.min(it.qty + 1, 20);
    } else if (dec) {
      const idx = cart.findIndex((x) => x.uid === dec.dataset.cartDec);
      if (idx < 0) return;
      if (cart[idx].qty > 1) {
        cart[idx].qty -= 1;
      } else {
        lastRemoved = { item: cart[idx], idx };
        cart.splice(idx, 1);
        showToast(`${itemTitle(lastRemoved.item)} eliminado`, 'Deshacer', () => {
          cart.splice(Math.min(lastRemoved.idx, cart.length), 0, lastRemoved.item);
          saveCart(); updateCartUI();
        });
      }
    } else if (edit) {
      const it = cart.find((x) => x.uid === edit.dataset.cartEdit);
      if (it) { closeSheet(cartSheet).then(() => openBuilder({ item: it, returnToCart: true })); }
      return;
    } else {
      return;
    }
    saveCart();
    updateCartUI();
  });

  // ===================== CONSTRUCTOR (sheet) =====================
  const builderSheet = $('builderSheet');
  const cartSheet = $('cartSheet');
  const builderForm = $('builderForm');
  let builderState = { editingUid: null, favName: null, favConfig: null, returnToCart: false, qty: 1 };

  const chipHTML = (name, value) => `
    <label class="chip">
      <input type="checkbox" name="${name}" value="${value}">
      <span class="chip__box"><span class="chip__check"><svg class="icon"><use href="#i-check"/></svg></span>${value}</span>
    </label>`;

  $('builderSizes').innerHTML = SIZES.map((s) => `
    <label class="size-opt">
      <input type="radio" name="size" value="${s.id}">
      <span class="size-opt__box">${sizeArt(s.id)}<span class="size-opt__name">${s.name.replace('Tamaño ', '')}</span><span class="size-opt__price">${formatCLP(s.price)}</span></span>
    </label>`).join('');
  $('builderSauces').innerHTML = SAUCES.map((v) => chipHTML('sauces', v)).join('');
  $('builderToppings').innerHTML = TOPPINGS.map((v) => chipHTML('toppings', v)).join('');
  $('builderFreebies').innerHTML = FREEBIES.map((v) => chipHTML('freebies', v)).join('');

  const readBuilder = () => {
    const checked = (name) => Array.from(builderForm.querySelectorAll(`input[name="${name}"]:checked`)).map((i) => i.value);
    return {
      size: (builderForm.querySelector('input[name="size"]:checked') || {}).value || 'L',
      sauces: checked('sauces'),
      toppings: checked('toppings'),
      freebies: checked('freebies'),
      note: $('builderNote').value.trim(),
    };
  };

  const refreshBuilder = () => {
    const cfg = readBuilder();
    const s = sizeById(cfg.size);
    $('saucePriceLabel').textContent = `+${formatCLP(s.sauce)} c/u`;
    $('toppingPriceLabel').textContent = `+${formatCLP(s.topping)} c/u`;
    $('qtyVal').textContent = builderState.qty;
    $('qtyMinus').disabled = builderState.qty <= 1;
    $('builderSubmitPrice').textContent = formatCLP(itemUnitPrice(cfg) * builderState.qty);
  };

  const openBuilder = ({ size = 'L', item = null, fav = null, returnToCart = false } = {}) => {
    const src = item || fav || { size, sauces: [], toppings: [], freebies: [], note: '' };
    builderForm.querySelectorAll('input[name="size"]').forEach((i) => { i.checked = i.value === src.size; });
    ['sauces', 'toppings', 'freebies'].forEach((name) => {
      const values = src[name] || [];
      builderForm.querySelectorAll(`input[name="${name}"]`).forEach((i) => { i.checked = values.includes(i.value); });
    });
    $('builderNote').value = src.note || '';

    builderState = {
      editingUid: item ? item.uid : null,
      favName: (item && item.name) || (fav && fav.name) || null,
      favConfig: fav ? { size: fav.size, sauces: fav.sauces, toppings: fav.toppings } : (item && item.name ? item.favConfig : null),
      returnToCart,
      qty: item ? item.qty : 1,
    };

    $('builderTitle').textContent = builderState.favName || (item ? 'Editar producto' : 'Arma tu cono');
    $('builderKicker').textContent = item ? 'Editando' : (fav ? 'Personaliza tu favorito' : 'Paso a paso');
    $('builderSubmitText').textContent = item ? 'Guardar' : 'Agregar';
    builderForm.querySelector('.sheet__body').scrollTop = 0;
    refreshBuilder();
    openSheet(builderSheet);
  };

  builderForm.addEventListener('change', refreshBuilder);
  $('qtyMinus').addEventListener('click', () => { builderState.qty = Math.max(1, builderState.qty - 1); refreshBuilder(); });
  $('qtyPlus').addEventListener('click', () => { builderState.qty = Math.min(20, builderState.qty + 1); refreshBuilder(); });

  builderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cfg = readBuilder();
    // Si el favorito se modificó, deja de llamarse igual para que la cocina no se confunda.
    const fc = builderState.favConfig;
    const keepsFav = fc && fc.size === cfg.size && sameSet(fc.sauces, cfg.sauces) && sameSet(fc.toppings, cfg.toppings);
    const name = keepsFav ? builderState.favName : null;

    if (builderState.editingUid) {
      const it = cart.find((x) => x.uid === builderState.editingUid);
      if (it) Object.assign(it, cfg, { name, favConfig: keepsFav ? fc : null, qty: builderState.qty });
    } else {
      cart.push({ uid: uid(), ...cfg, name, favConfig: keepsFav ? fc : null, qty: builderState.qty });
    }
    saveCart();
    const wasEditing = !!builderState.editingUid;
    const back = builderState.returnToCart;
    await closeSheet(builderSheet);
    updateCartUI({ bump: !wasEditing });

    if (back) {
      openSheet(cartSheet);
    } else {
      showToast(`Agregado a tu pedido · ${formatCLP(cartTotal())}`, 'Ver pedido', () => openSheet(cartSheet));
    }
  });

  // Aperturas del constructor (delegación: hay botones renderizados dinámicamente)
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-builder]');
    if (opener) {
      const fromCart = cartSheet.open;
      const size = opener.dataset.openBuilder || 'L';
      if (fromCart) closeSheet(cartSheet).then(() => openBuilder({ size, returnToCart: true }));
      else openBuilder({ size });
      return;
    }
    const favAdd = e.target.closest('[data-fav-add]');
    if (favAdd) {
      const f = FAVORITES[Number(favAdd.dataset.favAdd)];
      const existing = cart.find((x) => x.name === f.name && x.freebies.length === 0 && !x.note);
      if (existing) existing.qty += 1;
      else cart.push({ uid: uid(), name: f.name, favConfig: { size: f.size, sauces: f.sauces, toppings: f.toppings }, size: f.size, sauces: [...f.sauces], toppings: [...f.toppings], freebies: [], note: '', qty: 1 });
      saveCart();
      updateCartUI({ bump: true });
      showToast(`${f.name} agregada`, 'Ver pedido', () => openSheet(cartSheet));
      return;
    }
    const favEdit = e.target.closest('[data-fav-edit]');
    if (favEdit) openBuilder({ fav: FAVORITES[Number(favEdit.dataset.favEdit)] });
  });

  // ===================== CHECKOUT =====================
  const checkoutForm = $('checkoutForm');
  const prefs = storage.get('pp_prefs', {});
  if (prefs.name) $('customerName').value = prefs.name;
  if (prefs.payment) { const p = checkoutForm.querySelector(`input[name="payment"][value="${prefs.payment}"]`); if (p) p.checked = true; }

  const pad = (n) => String(n).padStart(2, '0');
  $('pickupTime').min = `${pad(status.hours[0])}:00`;
  $('pickupTime').max = `${pad(status.hours[1] - 1)}:45`;

  if (!status.open) {
    $('closedNote').hidden = false;
    // Fuera de horario no se reciben pedidos: el carrito queda guardado para enviarlo al abrir
    $('closedNoteText').textContent = `Ahora estamos cerrados y no recibimos pedidos. Abrimos ${status.nextLabel}. Tu pedido queda guardado para que lo envíes cuando abramos.`;
    $('checkoutSubmit').disabled = true;
    $('checkoutSubmitText').textContent = `Cerrado · abrimos ${status.nextLabel}`;
    $('checkoutHint').textContent = '¿Quieres pedir ahora? Revisa si estamos disponibles en Uber Eats.';
  }

  const syncCheckout = () => {
    const scheduled = checkoutForm.querySelector('input[name="when"]:checked').value === 'scheduled';
    $('timeField').hidden = !scheduled;
    const transfer = checkoutForm.querySelector('input[name="payment"]:checked').value.startsWith('Transferencia');
    $('payHint').textContent = transfer
      ? 'Te enviamos los datos para transferir por WhatsApp.'
      : 'Pagas en el local cuando retiras.';
  };
  checkoutForm.addEventListener('change', syncCheckout);
  syncCheckout();

  const setError = (inputId, errorId, show) => {
    $(inputId).setAttribute('aria-invalid', String(show));
    $(errorId).hidden = !show;
  };
  // Validación al salir del campo, no mientras se escribe
  ['customerName', 'pickupTime'].forEach((id) => {
    $(id).addEventListener('input', () => { if ($(id).getAttribute('aria-invalid') === 'true' && $(id).value.trim()) $(id).setAttribute('aria-invalid', 'false'); });
  });

  const validTime = (v) => {
    if (!v) return false;
    const [h, m] = v.split(':').map(Number);
    const t = h + m / 60;
    return t >= status.hours[0] && t < status.hours[1];
  };

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cart.length === 0 || !status.open) return;

    const name = $('customerName').value.trim();
    const scheduled = checkoutForm.querySelector('input[name="when"]:checked').value === 'scheduled';
    const time = $('pickupTime').value;
    const payment = checkoutForm.querySelector('input[name="payment"]:checked').value;

    const errors = [];
    const nameBad = !name;
    const timeBad = scheduled && !validTime(time);
    setError('customerName', 'nameError', nameBad);
    setError('pickupTime', 'timeError', timeBad);
    if (timeBad) errors.push('pickupTime');
    if (nameBad) errors.push('customerName');
    if (errors.length) {
      const first = ['pickupTime', 'customerName'].find((id) => errors.includes(id));
      $(first).focus();
      $(first).scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    storage.set('pp_prefs', { name, payment });

    const lines = [];
    lines.push('*Hola PatoPatata! Quiero hacer este pedido:*', '');
    cart.forEach((it) => {
      lines.push(`*${it.qty}x ${itemTitle(it)}* — ${formatCLP(itemUnitPrice(it) * it.qty)}`);
      if (it.name) lines.push(`   ${sizeById(it.size).name}`);
      lines.push(`   Salsas: ${it.sauces.length ? it.sauces.join(', ') : 'sin salsas'}`);
      lines.push(`   Toppings: ${it.toppings.length ? it.toppings.join(', ') : 'sin toppings'}`);
      if (it.freebies.length) lines.push(`   Aderezos: ${it.freebies.join(', ')}`);
      if (it.note) lines.push(`   Nota: ${it.note}`);
    });
    lines.push('', `*Total: ${formatCLP(cartTotal())}*`, '');
    lines.push(`Nombre: ${name}`);
    lines.push(`Retiro en: ${ADDRESS}`);
    const whenText = scheduled ? `a las ${time}` : 'lo antes posible';
    lines.push(`Hora de retiro: ${whenText}`);
    lines.push(`Pago: ${payment}`);

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    // El carrito se conserva por si el cliente vuelve sin enviar; el toast ofrece vaciarlo.
    closeSheet(cartSheet).then(() => {
      showToast('Pedido listo en WhatsApp', 'Vaciar pedido', () => { cart = []; saveCart(); updateCartUI(); }, 8000);
    });
  });

  // Botones que abren el carrito
  [$('headerCartBtn'), $('bottomBarCart')].forEach((b) => b.addEventListener('click', () => openSheet(cartSheet)));

  // ===================== TOAST =====================
  let toastTimer = null;
  let toastHandler = null;
  const toast = $('toast');
  const toastAction = $('toastAction');
  toastAction.addEventListener('click', () => {
    const fn = toastHandler;
    hideToast();
    if (fn) fn();
  });
  const hideToast = () => { toast.classList.remove('is-visible'); toastHandler = null; };
  function showToast(text, actionLabel, onAction, ms = 4000) {
    clearTimeout(toastTimer);
    $('toastText').textContent = text;
    toastAction.hidden = !actionLabel;
    toastAction.textContent = actionLabel || '';
    toastHandler = onAction || null;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(hideToast, ms);
  }

  // ===================== RESEÑAS: VER MÁS =====================
  const moreReviewsBtn = $('moreReviewsBtn');
  if (moreReviewsBtn) {
    const extra = document.querySelectorAll('.review--more');
    const label = moreReviewsBtn.textContent;
    moreReviewsBtn.addEventListener('click', () => {
      const show = moreReviewsBtn.getAttribute('aria-expanded') !== 'true';
      extra.forEach((r) => { r.hidden = !show; });
      moreReviewsBtn.setAttribute('aria-expanded', String(show));
      moreReviewsBtn.textContent = show ? 'Ver menos' : label;
    });
  }

  // ===================== WHATSAPP GENERAL Y AÑO =====================
  document.querySelectorAll('[data-wa-link]').forEach((a) => { a.href = `https://wa.me/${WHATSAPP_NUMBER}`; });
  $('year').textContent = new Date().getFullYear();

  updateCartUI();
});
