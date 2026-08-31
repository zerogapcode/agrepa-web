(function () {
  var panal = document.getElementById('panal');
  var lectura = document.getElementById('lectura');
  var dlg = document.getElementById('ficha');
  if (!panal) return;

  var celdas = Array.prototype.slice.call(panal.querySelectorAll('.celda')).map(function (el) {
    return {
      el: el,
      q: +el.getAttribute('data-q'),
      r: +el.getAttribute('data-r'),
      x: +el.getAttribute('data-q') + (+el.getAttribute('data-r')) / 2,
      f: 0,   // valor pintado ahora
      obj: 0, // valor al que se dirige
      z: -1
    };
  });

  var nomBase = lectura ? lectura.querySelector('[data-nom]').textContent : '';
  var subBase = lectura ? lectura.querySelector('[data-sub]').textContent : '';

  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // El script solo toma el relieve si hay raton de verdad y el sistema no pide
  // menos movimiento. Si no, la clase no se pone y manda el :hover simple del CSS.
  var campoActivo = punteroFino && !menosMovimiento;
  if (campoActivo) panal.classList.add('js');

  /* ------------------------------------------------------------------
     Campo continuo.

     Cada hexagono crece segun su distancia al puntero, con una caida
     gaussiana: 1 en el centro exacto, ~0.44 a un hexagono de distancia y
     casi 0 a dos. Asi no hay escalones — el relieve se reparte entre los
     vecinos y se mueve con el raton.

     Los centros se calculan con la misma formula que los coloca en el CSS,
     no midiendo el DOM: las celdas estan escaladas y medirlas devolveria
     tamanos que cambian con el propio efecto.
  ------------------------------------------------------------------ */

  var ALCANCE  = 1.10;  // radio de la caida, en anchos de hexagono
  var SUAVIDAD = 0.16;  // cuanto se acerca al objetivo en cada cuadro
  // Cuanto crece el hexagono con --f = 1 se define en el CSS (.celda).

  var puntero = null;   // {x, y} relativo al panal
  var cuadro = null;
  var seleccion = null;

  function anchoCelda() { return panal.clientWidth * 0.2; }

  function centro(c) {
    return {
      x: panal.clientWidth * (0.5 + c.x * 0.2),
      y: panal.clientHeight * (0.5 + c.r * 0.1875)
    };
  }

  function calcularObjetivos() {
    var W = anchoCelda();
    var R2 = (W * ALCANCE) * (W * ALCANCE);
    for (var i = 0; i < celdas.length; i++) {
      var c = celdas[i];
      if (!puntero) { c.obj = 0; continue; }
      var p = centro(c);
      var dx = p.x - puntero.x, dy = p.y - puntero.y;
      var v = Math.exp(-(dx * dx + dy * dy) / R2);
      c.obj = v < 0.004 ? 0 : v;
    }
  }

  function pintar() {
    cuadro = null;
    var vivo = false;
    for (var i = 0; i < celdas.length; i++) {
      var c = celdas[i];
      var d = c.obj - c.f;
      if (Math.abs(d) < 0.002) c.f = c.obj;
      else { c.f += d * SUAVIDAD; vivo = true; }

      c.el.style.setProperty('--f', c.f.toFixed(4));
      // El mas crecido queda por encima de sus vecinos.
      var z = c.f > 0.004 ? Math.round(c.f * 100) + 1 : 0;
      if (z !== c.z) { c.z = z; c.el.style.zIndex = z || ''; }
    }
    if (vivo) cuadro = window.requestAnimationFrame(pintar);
  }

  function animar() {
    calcularObjetivos();
    if (!cuadro) cuadro = window.requestAnimationFrame(pintar);
  }

  /* ------------------------------------------------------------------
     Cual es el hexagono apuntado.

     Se toma el de centro mas cercano: en una rejilla hexagonal eso es
     exactamente el hexagono que se ve bajo el puntero, mientras que las
     cajas rectangulares de las celdas se solapan en las esquinas.
  ------------------------------------------------------------------ */

  function masCercano(x, y) {
    var W = anchoCelda();
    var limite = W * 0.62, mejor = null, mejorD = Infinity;
    for (var i = 0; i < celdas.length; i++) {
      var c = celdas[i];
      if (!c.el.getAttribute('data-nombre')) continue;
      var p = centro(c);
      var d = Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y));
      if (d < mejorD) { mejorD = d; mejor = c; }
    }
    return mejorD <= limite ? mejor : null;
  }

  function leer(c) {
    if (!lectura || c === seleccion) return;
    seleccion = c;
    var nom = lectura.querySelector('[data-nom]');
    var sub = lectura.querySelector('[data-sub]');
    if (c) {
      var cargo = c.el.getAttribute('data-cargo');
      nom.textContent = c.el.getAttribute('data-nombre');
      sub.textContent = (cargo ? cargo + ' · ' : '') + c.el.getAttribute('data-tel');
    } else {
      nom.textContent = nomBase;
      sub.textContent = subBase;
    }
  }

  if (campoActivo) {
    panal.addEventListener('pointermove', function (e) {
      var caja = panal.getBoundingClientRect();
      puntero = { x: e.clientX - caja.left, y: e.clientY - caja.top };
      leer(masCercano(puntero.x, puntero.y));
      animar();
    });
    panal.addEventListener('pointerleave', function () {
      puntero = null;
      leer(null);
      animar();
    });
  }

  // Teclado: el foco hace las veces de puntero, centrado en esa celda.
  panal.addEventListener('focusin', function (e) {
    var el = e.target.closest('.celda');
    if (!el) return;
    var c = null;
    for (var i = 0; i < celdas.length; i++) if (celdas[i].el === el) c = celdas[i];
    if (!c) return;
    if (menosMovimiento) { c.f = c.obj = 1; c.el.style.setProperty('--f', '1'); }
    else { puntero = centro(c); animar(); }
    leer(c);
  });

  panal.addEventListener('focusout', function (e) {
    if (panal.contains(e.relatedTarget)) return;
    if (menosMovimiento) {
      for (var i = 0; i < celdas.length; i++) { celdas[i].f = celdas[i].obj = 0; celdas[i].el.style.setProperty('--f', '0'); }
    } else { puntero = null; animar(); }
    leer(null);
  });

  window.addEventListener('resize', function () { if (puntero) { puntero = null; animar(); } }, { passive: true });

  /* ---------- ficha de contacto ---------- */

  // Si el navegador no soporta el elemento dialog, los hexagonos siguen
  // siendo enlaces al directorio de abajo, que tiene los contactos reales.
  if (!dlg || typeof dlg.showModal !== 'function') return;

  var previo = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ICONO = {
    tel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"></path></svg>',
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5 4.9 16A8.3 8.3 0 1 1 8 19.1l-4.5 1.4Z"></path><path d="M9 9.2c.3 1.3 1.1 2.6 2 3.4.9.9 2.1 1.6 3.4 1.9l1-1.3 1.9.9c-.2 1-.9 1.6-2 1.6-1.7 0-3.6-1-5-2.4-1.4-1.4-2.4-3.3-2.4-5 0-1.1.6-1.8 1.6-2l.9 1.9-1.4 1Z"></path></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15"></rect><path d="m3 6 9 7 9-7"></path></svg>'
  };

  function abrir(el) {
    var nombre = el.getAttribute('data-nombre');
    var cargo = el.getAttribute('data-cargo');
    var tel = el.getAttribute('data-tel');
    var num = el.getAttribute('data-e164');
    var mail = el.getAttribute('data-mail');
    var foto = el.getAttribute('data-foto');
    var pos = el.style.getPropertyValue('--pos') || '50% 30%';

    dlg.innerHTML =
      '<div class="ficha__caja" tabindex="-1">' +
        '<button class="ficha__cerrar" type="button" data-cerrar aria-label="Cerrar">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>' +
        '</button>' +
        '<span class="ficha__hex" style="--pos:' + esc(pos) + '"><img src="' + esc(foto) + '" alt="" width="600" height="693"></span>' +
        '<h2 class="ficha__nom" id="fichaNombre">' + esc(nombre) + '</h2>' +
        (cargo ? '<p class="ficha__cargo lbl">' + esc(cargo) + '</p>' : '') +
        '<div class="ficha__acc">' +
          '<a class="btn btn--primario" href="tel:' + esc(num) + '">' + ICONO.tel + 'Llamar ' + esc(tel) + '</a>' +
          '<a class="btn btn--linea" href="https://wa.me/' + esc(num.replace('+', '')) + '" rel="noopener">' + ICONO.wa + 'WhatsApp</a>' +
          '<a class="btn btn--linea" href="mailto:' + esc(mail) + '">' + ICONO.mail + 'Enviar correo</a>' +
        '</div>' +
        '<p class="ficha__mail">' + esc(mail) + '</p>' +
      '</div>';

    previo = document.activeElement;
    dlg.showModal();
    // El foco entra en el cuadro, no en el aspa: asi no aparece un anillo de
    // foco llamativo al abrirla con el raton, y con teclado el primer Tab
    // sigue cayendo en Cerrar.
    var caja = dlg.querySelector('.ficha__caja');
    if (caja) caja.focus();
  }

  panal.addEventListener('click', function (e) {
    var enlace = e.target.closest('a.celda');
    if (!enlace) return;
    e.preventDefault();

    // Con raton se abre el hexagono que se ve bajo el puntero, que no siempre
    // es el enlace que recibio el evento: las cajas se solapan en las esquinas.
    // Con teclado (detail 0) manda el enlace enfocado.
    var destino = enlace;
    if (e.detail > 0) {
      var caja = panal.getBoundingClientRect();
      var c = masCercano(e.clientX - caja.left, e.clientY - caja.top);
      if (c) destino = c.el;
    }
    abrir(destino);
  });

  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-cerrar]')) dlg.close();
  });

  dlg.addEventListener('close', function () {
    dlg.innerHTML = '';
    if (previo && previo.focus) previo.focus();
    previo = null;
  });
})();
