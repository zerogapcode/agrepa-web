(function () {
  var panal = document.getElementById('panal');
  var lectura = document.getElementById('lectura');
  var dlg = document.getElementById('ficha');
  if (!panal) return;

  var celdas = Array.prototype.slice.call(panal.querySelectorAll('.celda')).map(function (el) {
    return { el: el, q: +el.getAttribute('data-q'), r: +el.getAttribute('data-r') };
  });

  var nomBase = lectura ? lectura.querySelector('[data-nom]').textContent : '';
  var subBase = lectura ? lectura.querySelector('[data-sub]').textContent : '';

  // Distancia en una rejilla hexagonal con coordenadas axiales.
  function distancia(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  function resaltar(centro) {
    for (var i = 0; i < celdas.length; i++) {
      var c = celdas[i];
      if (!centro) { c.el.removeAttribute('data-cerca'); continue; }
      var d = distancia(c, centro);
      if (d === 0) c.el.setAttribute('data-cerca', '0');
      else if (d === 1) c.el.setAttribute('data-cerca', '1');
      else c.el.removeAttribute('data-cerca');
    }
  }

  function leer(el) {
    if (!lectura) return;
    var nom = lectura.querySelector('[data-nom]');
    var sub = lectura.querySelector('[data-sub]');
    if (el && el.getAttribute('data-nombre')) {
      nom.textContent = el.getAttribute('data-nombre');
      var cargo = el.getAttribute('data-cargo');
      sub.textContent = (cargo ? cargo + ' · ' : '') + el.getAttribute('data-tel');
    } else {
      nom.textContent = nomBase;
      sub.textContent = subBase;
    }
  }

  function entrar(el) {
    var c = null;
    for (var i = 0; i < celdas.length; i++) if (celdas[i].el === el) c = celdas[i];
    resaltar(c);
    leer(el);
  }

  function salir() { resaltar(null); leer(null); }

  panal.addEventListener('pointerover', function (e) {
    var el = e.target.closest('.celda');
    if (el) entrar(el);
  });
  panal.addEventListener('pointerleave', salir);
  panal.addEventListener('focusin', function (e) {
    var el = e.target.closest('.celda');
    if (el) entrar(el);
  });
  panal.addEventListener('focusout', function (e) {
    if (!panal.contains(e.relatedTarget)) salir();
  });

  /* ---------- ficha de contacto ---------- */

  // Si el navegador no soporta el elemento dialog, los hexagonos siguen siendo
  // enlaces al directorio de abajo, que tiene los contactos reales.
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
    var el = e.target.closest('a.celda');
    if (!el) return;
    e.preventDefault();
    abrir(el);
  });

  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-cerrar]')) dlg.close();
  });

  dlg.addEventListener('close', function () {
    dlg.innerHTML = '';
    salir();
    if (previo && previo.focus) previo.focus();
    previo = null;
  });
})();
