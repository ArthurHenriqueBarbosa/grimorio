// Guarda uma cópia do Grimório no aparelho, para ele abrir mesmo sem internet.
// Com internet, o aplicativo vem sempre do GitHub Pages (a versão mais nova) e a cópia é atualizada.
// As notas não passam por aqui: elas ficam no navegador e vão para o GitHub pela API.
const CACHE = 'grimorio-app-v1';
const ARQUIVOS = ['./', 'manifest.webmanifest', 'icones/icone-192.png', 'icones/icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

// apaga as cópias de versões antigas deste arquivo
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// guarda uma cópia da resposta, se ela deu certo
function guardar(pedido, resposta) {
  if (resposta.ok) {
    const copia = resposta.clone();
    caches.open(CACHE).then(c => c.put(pedido, copia));
  }
  return resposta;
}

self.addEventListener('fetch', e => {
  const pedido = e.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  // o próprio grimório: primeiro a internet; sem internet, a cópia guardada
  if (url.origin === location.origin) {
    e.respondWith(fetch(pedido)
      .then(resposta => guardar(pedido, resposta))
      .catch(() => caches.match(pedido, { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  // as letras (Google Fonts): a cópia guardada primeiro, para o visual continuar igual sem internet
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(pedido).then(r => r || fetch(pedido).then(resposta => guardar(pedido, resposta))));
  }
  // o resto (como a API do GitHub) segue direto, sem cópia
});
