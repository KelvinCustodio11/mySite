# Mumbrass — setup moderno

Template **Mumbrass** (Alian4x) com o build original (Gulp 3 + node-sass) **substituído** por
ferramentas atuais. O `gulpfile.js` e o `node-sass` não rodam em Node moderno — o `npm install`
falhava com erro de compilação.

O visual e o HTML gerados são **idênticos** ao original (verificado por diff: 0 linhas de diferença).

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | instala as dependências (uma vez) |
| `npm run dev` | **modo desenvolvimento**: build + watch + servidor com live-reload |
| `npm run build` | gera `app/css/*` e `app/index.html` uma vez |
| `npm run css` | compila só o Sass → `main.css` + `main.min.css` |
| `npm run html` | compila só o Pug → `index.html` |
| `npm run serve` | servidor em `http://localhost:3000` (sem watch) |

No modo `dev`, **salvar qualquer arquivo já atualiza o navegador**:

- editou `sass/**/*.sass` → recompila o CSS (cadeia inteira: sass → autoprefixer → minify)
- editou `pug/**/*.pug` → recompila o HTML

---

## O que editar

### Cores, fontes, espaçamentos → `sass/_vars.sass`

```sass
$accent: #B0CA1E     // cor da marca — usada em 47 lugares do CSS
$default-font: 'Dosis', sans-serif
$second-font: 'Poppins', sans-serif
```

Trocar `$accent` muda o site inteiro. **Não** procure/replace no CSS gerado.

### Estrutura do CSS → `sass/`

```
sass/main.sass          entrada, importa tudo
sass/_vars.sass         variáveis (cor, fontes, grid)
sass/_libs.sass         importa Bootstrap 4 + Font Awesome + slick + magnific
sass/_mixins.sass       mixins próprios
sass/_media.sass        media queries
sass/elements/*.sass    header, sidebar, skills, portfolio, testimonials...
sass/components/*.sass  animações
```

### Conteúdo do site → `pug/`

```
pug/index.pug           entrada — só monta os includes
pug/html/_head.pug      meta, fontes, CSS
pug/html/_header.pug    preloader + cabeçalho
pug/html/_menu.pug      menu (editou aqui, mudou em todos os lugares)
pug/html/_footer.pug
pug/html/_scripts.pug   bibliotecas JS
pug/sections/_N-*.pug   as 9 seções da página
pug/includes/*.pug      sidebar, logo, social, elementos fixos
```

> **Regra:** edite `.sass` e `.pug`. Nunca edite `app/index.html` nem `app/css/*.css` —
> são gerados e serão sobrescritos no próximo build.

---

## Estrutura do projeto

```
app/          ← o site pronto (o que vai pro servidor)
  index.html      gerado por pug
  css/            gerado por sass  (main.css + main.min.css)
  js/             common.js (fonte) + main.min.js (o que carrega)
  libs/           bibliotecas JS/CSS usadas pelo site
  images/, img/, fonts/
  mail.php        handler do formulário (requer PHP)
  ht.access       ← renomear para .htaccess ao publicar

sass/         ← fonte do CSS
pug/          ← fonte do HTML
package.json  ← scripts do build
```

`app/` é autossuficiente — pode copiar pra hospedagem inteiro.

---

## Antes de publicar

1. `npm run build`
2. Renomear `app/ht.access` → `app/.htaccess`
3. Trocar o email em `app/mail.php` (`$admin_email = "example@yourdomain.com"`)
4. Subir a pasta `app/` (o servidor precisa de PHP pro formulário funcionar)

---

## Notas técnicas

- **`sass/main.sass`** — 7 linhas do cabeçalho de comentário foram normalizadas (mistura de
  tab/espaço que o dart-sass rejeita). Nenhuma mudança de estilo.
- **`@import "bourbon"` removido** — a lib não estava instalada e não é usada em nenhum
  mixin do projeto.
- **Warnings do Bootstrap** silenciados via `--silence-deprecation` no script `css` —
  são deprecations do Bootstrap 4 com Dart Sass, não afetam o output.
- **`app/js/common.js`** é a fonte legível; **`app/js/main.min.js`** é a versão ofuscada que
  o HTML carrega. Se for mexer no JS, troque a referência em `pug/html/_scripts.pug`
  (linha com `//- script(src='js/common.js')` está comentada).
- **6,8 MB de libs mortas removidas** (icofont, jquery-ui, superfish, googlemaps,
  style-customizer, textillate, directional-hover, animnum) — nenhuma era referenciada.
