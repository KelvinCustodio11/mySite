/**
 * Troca de idioma (pt-BR <-> en) preservando a seção atual.
 *
 * O site usa pagePiling, que guarda a seção ativa na hash da URL (#page3).
 * Ao navegar para outro idioma, copiamos a hash para que o novo documento
 * abra na mesma seção em vez de voltar ao topo.
 */
(function () {
	'use strict';

	// Link para o outro idioma: navega mantendo a seção atual.
	var switchLinks = document.querySelectorAll('[data-alx-lang-link]');
	for (var i = 0; i < switchLinks.length; i++) {
		switchLinks[i].addEventListener('click', function (event) {
			var hash = window.location.hash;
			if (hash && hash !== '#') {
				event.preventDefault();
				window.location.href = this.getAttribute('href') + hash;
			}
		});
	}

	// Link do idioma atual: já estamos nele, não recarrega.
	var selfLinks = document.querySelectorAll('[data-alx-lang-self]');
	for (var j = 0; j < selfLinks.length; j++) {
		selfLinks[j].addEventListener('click', function (event) {
			event.preventDefault();
		});
	}
})();
