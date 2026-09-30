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
| `npm run build` | gera `app/index.html` (pt-BR) + `app/en.html` (en) + `app/css/*` |
| `npm run css` | compila só o Sass → `main.css` + `main.min.css` |
| `npm run html` | compila os dois HTMLs (pt-BR e en) |
| `npm run html:pt` | compila só o `app/index.html` |
| `npm run html:en` | compila só o `app/en.html` |
| `npm run serve` | servidor em `http://localhost:3000` (sem watch) |

No modo `dev`, **salvar qualquer arquivo já atualiza o navegador**:

- editou `sass/**/*.sass` → recompila o CSS (cadeia inteira: sass → autoprefixer → minify)
- editou `pug/**/*.pug` → recompila os dois HTMLs
- editou `pug/locales/*.json` → recompila os dois HTMLs

---

## Idiomas

O site é **bilingue**, com **pt-BR como padrão**:

| | Arquivo | `lang` | Gerado por |
|---|---|---|---|
| **Padrão** | `app/index.html` | `pt-BR` | `pug/locales/pt-BR.json` |
| Secundário | `app/en.html` | `en` | `pug/locales/en.json` |

### Como funciona

Todo texto visível do site mora num **dicionário JSON**. Os templates `.pug` não têm
texto fixo — só referências:

```pug
h2.alx-heading__title= t.about.title        //- em vez de "About Me"
a(href="#page1")= t.menu.home               //- em vez de "Home"
```

O `pug-cli` recebe o JSON via `-O` e o injeta como a variável `t`:

```bash
pug -O pug/locales/pt-BR.json pug/index.pug -o app/   # → app/index.html
pug -O pug/locales/en.json     pug/en.pug     -o app/  # → app/en.html
```

Os dois entry points (`index.pug` e `en.pug`) têm 2 linhas cada e incluem o mesmo
`_page.pug` — **zero duplicação de layout**.

### Para editar um texto

Abra `pug/locales/pt-BR.json` (e o `en.json` correspondente):

```json
{
  "t": {
    "about": {
      "title": "Sobre Mim",
      "description": "Tenho muita experiência..."
    }
  }
}
```

Salvou → o watch recompila os dois HTMLs e o navegador recarrega.

> **Importante:** o objeto está sob a chave `t`. Isso dá namespace e evita conflito
> com as opções internas do Pug. Não remova esse wrapper.

### Para adicionar um novo texto

1. Adicione a chave nos **dois** JSONs (`pt-BR.json` e `en.json`)
2. Use no `.pug`: `= t.caminho.da.chave`
3. Salve

### O seletor de idioma

Fica no canto inferior esquerdo (e no sidebar). `PT` é o idioma atual, `EN` leva
para o outro documento.

`app/js/lang.js` preserva a seção ativa: o pagePiling guarda a posição na hash da URL
(`#page3`), e ao trocar de idioma o link navega para `en.html#page3` — então você
**não perde a posição de scroll**.

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
                        + scenes (fundo animado de cada seção)
sass/components/*.sass  animações
```

### Conteúdo do site → `pug/` + `pug/locales/`

```
pug/index.pug           entrada pt-BR (2 linhas → inclui _page.pug)
pug/en.pug              entrada en    (2 linhas → inclui _page.pug)
pug/_page.pug           layout completo, compartilhado pelos dois
pug/locales/pt-BR.json  TODOS os textos em português
pug/locales/en.json     TODOS os textos em inglês
pug/html/_head.pug      meta, fontes, CSS
pug/html/_header.pug    preloader + cabeçalho
pug/html/_menu.pug      menu (editou aqui, mudou em todos os lugares)
pug/html/_footer.pug
pug/html/_scripts.pug   bibliotecas JS
pug/sections/_N-*.pug   as 9 seções da página
pug/includes/*.pug      sidebar, logo, social, elementos fixos
pug/portfolio/*.pug     filtros e itens do portfólio
```

> **Regra:** edite `.sass` para estilo, `.pug` para estrutura, `.json` para textos.
> Nunca edite `app/index.html`, `app/en.html` nem `app/css/*.css` — são gerados e
> serão sobrescritos no próximo build.

---

## Animações de fundo

Cada uma das 9 seções tem uma animação de fundo **100% em código** — sem imagem,
vídeo ou GIF. O desenho acontece num `<canvas>` que fica atrás do conteúdo.

| Arquivo | Papel |
| --- | --- |
| `app/js/scenes.js` | motor + as 9 cenas (arquivo novo, editar direto) |
| `sass/elements/_scenes.sass` | posiciona o canvas e pinta o gradiente de cada seção |
| `pug/sections/_N-section.pug` | `data-scene='…'` + `canvas.alx-scene(aria-hidden='true')` |
| `pug/html/_scripts.pug` | inclui `js/scenes.js` |

### As 9 cenas

| Seção | `data-scene` | O que faz |
| --- | --- | --- |
| 01 Hero | `ide` | editor de código com máquina de escrever, realce de sintaxe e barra de build |
| 02 Sobre mim | `path` | linha do tempo que se desenha de 2018 até "hoje", com nós pulsando |
| 03 Especializações | `layers` | camadas deslizam e se empilham em profundidade |
| 04 Habilidades | `rain` | chuva de símbolos de código descendo em várias velocidades |
| 05 Stack | `stack` | blocos isométricos empilhados girando devagar |
| 06 Portfólio | `wire` | wireframes de navegador montando e desmontando |
| 07 Depoimentos | `chat` | balões de conversa subindo com "digitando…" |
| 08 Clientes | `radar` | varredura de radar com contatos acendendo no caminho |
| 09 Contato | `signal` | ondas de rádio saindo do ponto central, como um ping |

### Detalhes que valem saber

- **Só código, sem mídia** — nada de `bg*.jpg`, vídeo do YouTube ou GIF.
- **Sem texto no canvas** — os únicos textos são os snippets do editor, que têm
  dicionário `pt`/`en` lido de `document.documentElement.lang`. Assim nada quebra
  a troca de idioma.
- **Só anima o que está visível** — a cena só roda quando a seção aparece no
  `getBoundingClientRect`, então o custo é de uma cena por vez.
- **Respeita `prefers-reduced-motion`** — desenha um quadro estático e para.
- **DPR-aware** — o canvas acompanha a densidade de pixels da tela.
- **Throttle em ~40 fps** e cache do realce de sintaxe/`measureText` — o laço
  caiu de ~9,9 ms para ~2 ms de mediana.

Para mexer num fundo: altere a função da cena em `app/js/scenes.js` (é JS puro,
sem dependência) e rode `npm run build`. A paleta fica no topo do arquivo e
espelha `sass/_vars.sass`: `ACC` (acento `#B0CA1E`), `LITE` (quase branco),
`COOL` (cinza azulado), `DIM` (apagado) e `CYAN`.

---

## Estrutura do projeto

```
app/          ← o site pronto (o que vai pro servidor)
  index.html      gerado por pug (pt-BR, padrão)
  en.html         gerado por pug (inglês)
  css/            gerado por sass  (main.css + main.min.css)
  js/             common.js (fonte), main.min.js (o que carrega), lang.js (idioma),
                  scenes.js (animações de fundo)
  libs/           bibliotecas JS/CSS usadas pelo site
  images/, img/, fonts/
  mail.php        handler do formulário (requer PHP)
  ht.access       ← renomear para .htaccess ao publicar

sass/           ← fonte do CSS
pug/            ← fonte do HTML
  locales/       ← dicionários de idioma (pt-BR.json, en.json)
package.json    ← scripts do build
README.md
```

`app/` é autossuficiente — pode copiar pra hospedagem inteiro.

---

## Antes de publicar

1. `npm run build`
2. Renomear `app/ht.access` → `app/.htaccess`
3. Trocar o email em `app/mail.php` (`$admin_email = "example@yourdomain.com"`)
4. Subir a pasta `app/` (o servidor precisa de PHP pro formulário funcionar)

O idioma padrão é o `index.html` (pt-BR) — é ele que o servidor entrega na raiz e
que os buscadores indexam primeiro.

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
