"use strict";

/**
 * scenes.js — animações de fundo das seções, 100% em código (canvas 2D).
 * Nenhuma imagem, vídeo ou GIF: tudo é desenhado em tempo real.
 *
 * Como usar — no .pug da seção:
 *
 *   section(data-scene='ide')
 *     ...
 *     canvas.alx-scene(data-scene='ide' aria-hidden='true')
 *
 * Cenas (uma para cada tela da primeira página):
 *
 *   ide    → editor de código que se digita sozinho        (hero)
 *   path   → linha do tempo que se desenha                (sobre mim)
 *   layers → camadas de sistema com pacotes fluindo       (o que eu desenvolvo)
 *   rain   → chuva de glifos de código                    (habilidades)
 *   stack  → camadas isométricas empilhando               (stack tecnológica)
 *   wire   → wireframes se desenhando + cursor            (portfólio)
 *   chat   → balões de conversa subindo                   (depoimentos)
 *   radar  → radar com varredura e sinais                 (clientes)
 *   signal → partículas convergindo + ondas               (contato)
 *
 * Só desenha quando a seção está na tela, respeita prefers-reduced-motion
 * e nunca captura eventos do mouse (é puro cenário de fundo).
 */
(function () {

	/* ------------------------------------------------------------------ *
	 * Preferências e paleta (espelha sass/_vars.sass)
	 * ------------------------------------------------------------------ */
	var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	var LANG = String(document.documentElement.lang || 'pt-BR').toLowerCase();
	var PT = LANG.indexOf('pt') === 0;

	var ACC = '176,202,30';   // $accent  #B0CA1E
	var LITE = '233,238,246'; // quase branco
	var COOL = '150,166,190'; // cinza azulado
	var DIM = '98,110,128';   // apagado
	var CYAN = '126,196,214';

	function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }

	/* ------------------------------------------------------------------ *
	 * Utilidades
	 * ------------------------------------------------------------------ */
	function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
	function lerp(a, b, t) { return a + (b - a) * t; }
	function cyc(t, p) { return ((t % p) + p) % p / p; }         // 0..1 dentro do período
	function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
	function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
	function easeBack(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

	// PRNG determinístico: a cena nasce igual em toda carga e só muda no resize
	function seeded(seed) {
		return function () {
			seed = seed + 0x6D2B79F5 | 0;
			var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}

	function rr(ctx, x, y, w, h, r) {                       // retângulo arredondado
		r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	}

	function mono(ctx, px) { ctx.font = px + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'; }
	function sans(ctx, px, weight) { ctx.font = (weight || 400) + ' ' + px + 'px Poppins, Dosis, sans-serif'; }

	// névoa radial simples (brilho de fundo)
	function glow(ctx, x, y, r, color, a) {
		var g = ctx.createRadialGradient(x, y, 0, x, y, r);
		g.addColorStop(0, rgba(color, a));
		g.addColorStop(1, rgba(color, 0));
		ctx.fillStyle = g;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	}

	// pontos de névoa que atravessam a tela
	function makeDust(rnd, w, h, n) {
		var d = [];
		for (var i = 0; i < n; i++) {
			d.push({
				x: rnd() * w, y: rnd() * h,
				r: rnd() * 1.7 + 0.5,
				vx: (rnd() - 0.5) * 7,
				vy: -(rnd() * 9 + 3),
				a: rnd() * 0.14 + 0.04,
				hot: rnd() < 0.2
			});
		}
		return d;
	}
	function drawDust(ctx, dust, w, h, dt, scale) {
		scale = scale || 1;
		for (var i = 0; i < dust.length; i++) {
			var p = dust[i];
			p.x += p.vx * dt * scale;
			p.y += p.vy * dt * scale;
			if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
			if (p.x < -8) p.x = w + 8;
			if (p.x > w + 8) p.x = -8;
			ctx.fillStyle = rgba(p.hot ? ACC : LITE, p.a);
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, 6.2832);
			ctx.fill();
		}
	}

	/* ================================================================== *
	 * 1 · ide — o editor que se digita sozinho (hero)
	 * ================================================================== */
	function sceneIde() {
		var SNIPPETS = {
			pt: [
				[
					'// da ideia ao deploy, sem atalho',
					'const projeto = {',
					"  stack: ['PHP', 'Laravel', 'Vue', 'TS'],",
					"  status: 'em produção',",
					'};',
					'',
					'export async function entregar(ideia) {',
					'  const mvp = await prototipar(ideia);',
					'  return testar(mvp).then(publicar);',
					'}'
				].join('\n'),
				[
					'// cada camada no lugar certo',
					"router.post('/projetos', async (req, res) => {",
					'  const dados = await Validar(req.body);',
					'  const novo = await Projeto.criar(dados);',
					'  return res.json(novo);',
					'});'
				].join('\n'),
				[
					'// entregar rápido, dormir tranquilo',
					'docker compose up -d --build',
					'php artisan test --parallel',
					'git push origin main',
					'# deploy automático no ar'
				].join('\n')
			],
			en: [
				[
					'// from idea to deploy, no shortcuts',
					'const project = {',
					"  stack: ['PHP', 'Laravel', 'Vue', 'TS'],",
					"  status: 'in production',",
					'};',
					'',
					'export async function ship(idea) {',
					'  const mvp = await prototype(idea);',
					'  return test(mvp).then(deploy);',
					'}'
				].join('\n'),
				[
					'// every layer in the right place',
					"router.post('/projects', async (req, res) => {",
					'  const data = await Validate(req.body);',
					'  const fresh = await Project.create(data);',
					'  return res.json(fresh);',
					'});'
				].join('\n'),
				[
					'// ship fast, sleep well',
					'docker compose up -d --build',
					'php artisan test --parallel',
					'git push origin main',
					'# automatic deploy live'
				].join('\n')
			]
		};

		var TOKEN = /(\/\/[^\n]*)|('[^']*'|"[^"]*"|`[^`]*`)|\b(const|let|var|function|return|export|import|from|async|await|class|new|type|interface|if|else|for|of|in|true|false|null|undefined|void)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;

		var list = SNIPPETS[PT ? 'pt' : 'en'];
		var rnd = seeded(19);
		var cur = 0, typed = 0, phase = 'type', clock = 0, alpha = 1;
		var dust = null;

		function advance(dt) {
			var code = list[cur];
			if (phase === 'type') {
				alpha = Math.min(1, alpha + dt * 3);
				typed = Math.min(code.length, typed + dt * 48);
				if (typed >= code.length) { phase = 'hold'; clock = 0; }
			} else if (phase === 'hold') {
				clock += dt;
				if (clock > 3.2) { phase = 'fade'; clock = 0; }
			} else if (phase === 'fade') {
				clock += dt;
				alpha = Math.max(0, 1 - clock / 0.6);
				if (clock >= 0.6) { cur = (cur + 1) % list.length; typed = 0; phase = 'type'; clock = 0; alpha = 0; }
			}
		}

		// Realce de sintaxe: tokeniza e mede UMA VEZ por linha (cache), senão o
		// measureText a cada quadro segura o event-loop e o pace.js trava.
		var cache = { fs: -1, map: {} };

		function tokenize(line) {
			var out = [], last = 0, m;
			TOKEN.lastIndex = 0;
			while ((m = TOKEN.exec(line))) {
				if (m.index > last) out.push({ t: line.slice(last, m.index), c: COOL, b: false });
				var col = COOL, b = false;
				if (m[1]) col = DIM;
				else if (m[2]) col = '170,200,120';
				else if (m[3]) col = ACC;
				else if (m[4]) col = CYAN;
				else if (m[5]) { col = LITE; b = true; }
				out.push({ t: m[0], c: col, b: b });
				last = m.index + m[0].length;
			}
			if (last < line.length) out.push({ t: line.slice(last), c: COOL, b: false });
			return out;
		}

		function paint(ctx, line, fs, x, y, a) {
			var base = ctx.font;          // fonte monoespaçada do tamanho corrente
			var bold = '600 ' + base;
			if (cache.fs !== fs) cache = { fs: fs, map: {} };
			var toks = cache.map[line];
			if (!toks) {
				toks = tokenize(line);
				var w = 0;
				for (var i = 0; i < toks.length; i++) {
					ctx.font = toks[i].b ? bold : base;
					toks[i].x = w;
					w += ctx.measureText(toks[i].t).width;
				}
				toks.w = w;
				cache.map[line] = toks;
			}
			for (var k = 0; k < toks.length; k++) {
				ctx.font = toks[k].b ? bold : base;
				ctx.fillStyle = rgba(toks[k].c, a);
				ctx.fillText(toks[k].t, x + toks[k].x, y);
			}
			ctx.font = base;
			return toks.w;
		}

		return {
			resize: function (w, h) { dust = makeDust(seeded(4), w, h, 26); },
			draw: function (ctx, w, h, t, dt) {
				advance(dt);
				drawDust(ctx, dust, w, h, dt, 0.5);

				// glifos flutuando (fundo)
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				var GLYP = ['{', '}', '<', '/', '>', ';', '=>', '$', '[]', '()'];
				for (var g = 0; g < 18; g++) {
					var seed = g * 3.7;
					var gx = (Math.sin(seed * 12.9898) * 43758.5453 % 1 + 1) % 1;
					var gy = (Math.sin(seed * 78.233) * 43758.5453 % 1 + 1) % 1;
					var yy = ((gy + t * 0.012 * (0.5 + (g % 4) / 4)) % 1) * h;
					mono(ctx, 14 + (g % 3) * 7);
					ctx.fillStyle = rgba(g % 5 === 0 ? ACC : COOL, 0.10 + (g % 3) * 0.03);
					ctx.fillText(GLYP[g % GLYP.length], gx * w, yy);
				}

				// painel
				var pw = clamp(w * 0.66, 300, 840);
				var ph = clamp(h * 0.62, 250, 470);
				if (w < 760) { pw = w * 0.9; ph = h * 0.52; }
				var px = (w - pw) / 2 + Math.sin(t * 0.33) * 9;
				var py = (h - ph) / 2 + Math.sin(t * 0.5) * 7;

				rr(ctx, px - 10, py - 10, pw + 20, ph + 20, 18);
				ctx.fillStyle = rgba(ACC, 0.05 * alpha);
				ctx.fill();

				rr(ctx, px, py, pw, ph, 10);
				ctx.fillStyle = 'rgba(8,10,13,' + (0.8 * alpha) + ')';
				ctx.fill();
				ctx.lineWidth = 1;
				ctx.strokeStyle = rgba(ACC, 0.22 * alpha);
				ctx.stroke();

				// barra de título
				var bar = 34;
				ctx.beginPath();
				ctx.moveTo(px, py + bar);
				ctx.lineTo(px + pw, py + bar);
				ctx.strokeStyle = 'rgba(255,255,255,0.07)';
				ctx.stroke();

				var dots = ['255,95,87', '254,188,46', '40,200,64'];
				for (var d = 0; d < 3; d++) {
					ctx.beginPath();
					ctx.arc(px + 18 + d * 14, py + bar / 2, 4, 0, 6.2832);
					ctx.fillStyle = rgba(dots[d], 0.65 * alpha);
					ctx.fill();
				}
				sans(ctx, 12, 500);
				ctx.textAlign = 'right';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = rgba(COOL, 0.55 * alpha);
				ctx.fillText('kelvin.ts', px + pw - 16, py + bar / 2 + 1);

				// código
				var fs = clamp(pw / 54, 11, 15);
				var lh = fs * 1.85;
				var x0 = px + 56, y0 = py + bar + 26 + fs;
				mono(ctx, fs);
				ctx.textBaseline = 'alphabetic';

				var code = list[cur];
				var shown = code.slice(0, Math.floor(typed));
				var lines = shown.split('\n');
				var full = code.split('\n');

				ctx.textAlign = 'right';
				for (var i = 0; i < full.length; i++) {
					ctx.fillStyle = rgba(DIM, (i < lines.length ? 0.45 : 0.18) * alpha);
					ctx.fillText(String(i + 1), x0 - 16, y0 + i * lh);
				}

				ctx.textAlign = 'left';
				var wLine = 0;
				for (var j = 0; j < lines.length; j++) {
					wLine = paint(ctx, lines[j], fs, x0, y0 + j * lh, 0.62 * alpha);
				}

				// cursor
				var blink = Math.sin(t * 6) > -0.3 ? 1 : 0.25;
				if (blink) {
					ctx.fillStyle = rgba(ACC, 0.9 * alpha);
					ctx.fillRect(x0 + wLine + 2, y0 + (lines.length - 1) * lh - fs, 2.5, fs * 1.25);
				}

				// pontuação no rodapé do painel
				ctx.textAlign = 'left';
				mono(ctx, fs - 1);
				ctx.fillStyle = rgba(DIM, 0.6 * alpha);
				var done = Math.round(typed / code.length * 100);
				ctx.fillText((phase === 'hold' ? '✓ build ok' : '› ' + done + '%') + (PT ? '  ·  pronto para publicar' : '  ·  ready to publish'), px + 16, py + ph - 14);
			}
		};
	}

	/* ================================================================== *
	 * 2 · path — linha do tempo que se desenha (sobre mim)
	 * ================================================================== */
	function scenePath() {
		var rnd = seeded(21);
		var nodes = [], dust = null, w0 = 0, h0 = 0;

		function build(w, h) {
			w0 = w; h0 = h;
			nodes = [];
			var n = 8;
			for (var i = 0; i < n; i++) {
				nodes.push({
					x: w * (0.07 + i * (0.86 / (n - 1))),
					y: h * (0.9 - i * 0.095) + (rnd() - 0.5) * h * 0.07,
					ph: rnd() * 6.28
				});
			}
			dust = makeDust(rnd, w, h, 44);
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				var P = 13;
				var p = cyc(t, P);
				var grow = clamp(p / 0.5, 0, 1);
				var out = p > 0.9 ? (p - 0.9) / 0.1 : 0;
				var A = 1 - out;

				drawDust(ctx, dust, w, h, dt, 0.7);

				// brilho no marco final
				var last = nodes[nodes.length - 1];
				glow(ctx, last.x, last.y, Math.min(w, h) * 0.3, ACC, 0.10 * A);

				ctx.lineCap = 'round';
				var segs = nodes.length - 1;
				var reach = grow * segs;

				// segmentos (curvas que se desenham)
				for (var i = 0; i < segs; i++) {
					var q = clamp(reach - i, 0, 1);
					if (q <= 0) break;
					var a = nodes[i], b = nodes[i + 1];
					var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 46;
					var steps = 26;
					ctx.beginPath();
					for (var s = 0; s <= steps * q; s++) {
						var u = s / steps;
						var ix = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x;
						var iy = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
						if (s === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
					}
					ctx.strokeStyle = rgba(ACC, 0.30 * A * (0.5 + 0.5 * q));
					ctx.lineWidth = 1.6;
					ctx.stroke();
				}

				// nós + pulsos
				for (var k = 0; k < nodes.length; k++) {
					var vis = clamp(reach - (k === 0 ? 0 : k - 0.15), 0, 1);
					if (vis <= 0) continue;
					var nd = nodes[k];
					var ny = nd.y + Math.sin(t * 0.7 + nd.ph) * 5;
					var pulse = cyc(t * 0.7 + k * 0.13, 1);
					ctx.beginPath();
					ctx.arc(nd.x, ny, 5 + pulse * 22, 0, 6.2832);
					ctx.strokeStyle = rgba(k === nodes.length - 1 ? ACC : COOL, (1 - pulse) * 0.3 * vis * A);
					ctx.lineWidth = 1.2;
					ctx.stroke();

					ctx.beginPath();
					ctx.arc(nd.x, ny, 4.5 * vis, 0, 6.2832);
					ctx.fillStyle = rgba(k === nodes.length - 1 ? ACC : LITE, 0.85 * vis * A);
					ctx.fill();
					ctx.beginPath();
					ctx.arc(nd.x, ny, 9 * vis, 0, 6.2832);
					ctx.strokeStyle = rgba(ACC, 0.45 * vis * A);
					ctx.stroke();
				}

				// rótulos dos marcos
				sans(ctx, 13, 600);
				ctx.textBaseline = 'middle';
				ctx.fillStyle = rgba(LITE, 0.5 * A);
				if (reach > 0.02) {
					ctx.textAlign = 'left';
					ctx.fillText('2018', nodes[0].x + 14, nodes[0].y + 4);
				}
				if (reach >= segs) {
					ctx.textAlign = 'right';
					ctx.fillStyle = rgba(ACC, 0.75 * A);
					ctx.fillText(PT ? 'hoje' : 'now', last.x - 14, last.y - 6);
				}
				ctx.textAlign = 'left';
			}
		};
	}

	/* ================================================================== *
	 * 3 · layers — camadas de sistema, pacotes fluindo (o que eu desenvolvo)
	 * ================================================================== */
	function sceneLayers() {
		var rnd = seeded(33);
		var pts = [], packets = [], edges = [], dust = null;

		function build(w, h) {
			pts = []; edges = []; packets = [];
			var cols = [0.13, 0.37, 0.63, 0.87];
			for (var c = 0; c < cols.length; c++) {
				for (var k = 0; k < 5; k++) {
					pts.push({
						ci: c,
						x: w * cols[c] + (rnd() - 0.5) * w * 0.06,
						y: h * (0.14 + k * 0.18) + (rnd() - 0.5) * 34,
						ph: rnd() * 6.28,
						sz: 4 + rnd() * 3
					});
				}
			}
			for (var e = 0; e < 22; e++) edges.push(pick(rnd));
			for (var p = 0; p < 15; p++) packets.push({ e: Math.floor(rnd() * edges.length), t: rnd(), sp: 0.16 + rnd() * 0.22, bend: (rnd() - 0.5) * 90 });
			dust = makeDust(rnd, w, h, 30);
		}

		function pick(r) {
			var a = Math.floor(r() * pts.length);
			var col = pts[a].ci;
			var target = clamp(col + (r() < 0.72 ? 1 : -1), 0, 3);
			var cand = [];
			for (var i = 0; i < pts.length; i++) if (pts[i].ci === target && i !== a) cand.push(i);
			if (!cand.length) return { a: a, b: (a + 1) % pts.length };
			return { a: a, b: cand[Math.floor(r() * cand.length)] };
		}

		function bez(p0, p1, bend, u) {
			var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + bend;
			return {
				x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * mx + u * u * p1.x,
				y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * my + u * u * p1.y
			};
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				drawDust(ctx, dust, w, h, dt, 0.6);

				var drift = [];
				for (var i = 0; i < pts.length; i++) drift.push({ x: pts[i].x, y: pts[i].y + Math.sin(t * 0.55 + pts[i].ph) * 8 });

				// arestas fixas
				ctx.lineWidth = 1;
				for (var e = 0; e < edges.length; e++) {
					var A = drift[edges[e].a], B = drift[edges[e].b];
					ctx.beginPath();
					ctx.moveTo(A.x, A.y);
					ctx.lineTo(B.x, B.y);
					ctx.strokeStyle = rgba(COOL, 0.055);
					ctx.stroke();
				}

				// nós
				for (var n = 0; n < pts.length; n++) {
					var p = pts[n], d = drift[n];
					rr(ctx, d.x - p.sz, d.y - p.sz, p.sz * 2, p.sz * 2, 3);
					ctx.fillStyle = rgba('18,22,26', 0.9);
					ctx.fill();
					ctx.strokeStyle = rgba(p.ci === 1 ? ACC : COOL, 0.5);
					ctx.stroke();
				}

				// pacotes em trânsito
				for (var k = 0; k < packets.length; k++) {
					var pk = packets[k];
					if (!REDUCE) {
						pk.t += pk.sp * dt;
						if (pk.t > 1) { pk.e = Math.floor(rnd() * edges.length); pk.t = 0; pk.bend = (rnd() - 0.5) * 90; }
					}
					var ed = edges[pk.e];
					var from = drift[ed.a], to = drift[ed.b];
					// rastro
					ctx.lineWidth = 2;
					for (var s = 0; s < 7; s++) {
						var u1 = clamp(pk.t - s * 0.022, 0, 1);
						var u0 = clamp(pk.t - (s + 1) * 0.022, 0, 1);
						if (u1 <= 0) break;
						var q1 = bez(from, to, pk.bend, u1), q0 = bez(from, to, pk.bend, u0);
						ctx.beginPath();
						ctx.moveTo(q0.x, q0.y);
						ctx.lineTo(q1.x, q1.y);
						ctx.strokeStyle = rgba(ACC, 0.45 * (1 - s / 7));
						ctx.stroke();
					}
					var head = bez(from, to, pk.bend, pk.t);
					ctx.beginPath();
					ctx.arc(head.x, head.y, 2.6, 0, 6.2832);
					ctx.fillStyle = rgba(ACC, 0.95);
					ctx.fill();
				}
			}
		};
	}

	/* ================================================================== *
	 * 4 · rain — chuva de glifos de código (habilidades)
	 * ================================================================== */
	function sceneRain() {
		var rnd = seeded(11);
		var CH = '01</>{}[]=+-$#;*:.ABCDEFxfooint';
		var cols = [];

		function build(w, h) {
			cols = [];
			var step = w < 700 ? 20 : 23;
			for (var x = -step; x < w + step; x += step) {
				cols.push({
					x: x,
					y: rnd() * h,
					sp: rnd() * 130 + 55,
					len: Math.floor(rnd() * 9) + 7,
					hot: rnd() < 0.24,
					seed: Math.floor(rnd() * 997)
				});
			}
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				var fs = w < 700 ? 12 : 14;
				var lh = fs * 1.16;
				mono(ctx, fs);
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';

				for (var i = 0; i < cols.length; i++) {
					var c = cols[i];
					if (!REDUCE) {
						c.y += c.sp * dt;
						if (c.y - c.len * lh > h) {
							c.y = -rnd() * h * 0.35;
							c.sp = rnd() * 130 + 55;
						}
					}
					for (var k = 0; k < c.len; k++) {
						var y = c.y - k * lh;
						if (y < -lh || y > h + lh) continue;
						var f = 1 - k / c.len;
						var idx = (c.seed + k + Math.floor(t * 5)) % CH.length;
						var ch = CH.charAt(idx);
						var base = (k === 0 ? 0.5 : 0.3 * f * f) * (c.hot ? 1 : 0.62);
						ctx.fillStyle = rgba(c.hot ? (k === 0 ? '240,255,210' : ACC) : LITE, base);
						ctx.fillText(ch, c.x, y);
					}
				}
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
			}
		};
	}

	/* ================================================================== *
	 * 5 · stack — camadas isométricas empilhando (stack tecnológica)
	 * ================================================================== */
	function sceneStack() {
		var LAYERS = [
			{ hx: 1.00, hy: 1.00, hz: 0.30 },
			{ hx: 0.84, hy: 0.84, hz: 0.30 },
			{ hx: 0.68, hy: 0.68, hz: 0.30 },
			{ hx: 0.52, hy: 0.52, hz: 0.30 }
		];

		function project(x, y, z, yaw, cx, cy, s) {
			var X = x * Math.cos(yaw) - y * Math.sin(yaw);
			var Y = x * Math.sin(yaw) + y * Math.cos(yaw);
			return { x: cx + X * s, y: cy + (Y * 0.5 - z) * s, d: Y };
		}

		function face(ctx, pts, fill, stroke) {
			ctx.beginPath();
			ctx.moveTo(pts[0].x, pts[0].y);
			for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
			ctx.closePath();
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.strokeStyle = stroke;
			ctx.lineWidth = 1.2;
			ctx.stroke();
		}

		return {
			draw: function (ctx, w, h, t) {
				var s = Math.min(w, h) * 0.30;
				var cx = w * 0.5, cy = h * 0.60;
				var yaw = t * 0.24;
				var dustGlow = 0.5 + Math.sin(t * 0.8) * 0.12;

				// chão
				ctx.beginPath();
				ctx.ellipse(cx, cy + 10, s * 1.55, s * 0.66, 0, 0, 6.2832);
				ctx.fillStyle = rgba(ACC, 0.05 * dustGlow);
				ctx.fill();

				for (var i = 0; i < LAYERS.length; i++) {
					var L = LAYERS[i];
					var p = clamp((t - i * 0.5) / 1.15, 0, 1);
					if (p <= 0) continue;
					var drop = (1 - easeOut(p)) * 3.4;
					var z0 = i * 0.36 + Math.sin(t * 0.9 + i * 0.7) * 0.018 + drop;
					var z1 = z0 + L.hz;
					var A = p;

					var c = [
						{ x: -L.hx, y: -L.hy }, { x: L.hx, y: -L.hy },
						{ x: L.hx, y: L.hy }, { x: -L.hx, y: L.hy }
					];
					var sides = [];
					for (var k = 0; k < 4; k++) {
						var a = c[k], b = c[(k + 1) % 4];
						var p1 = project(a.x, a.y, z1, yaw, cx, cy, s);
						var p2 = project(b.x, b.y, z1, yaw, cx, cy, s);
						var p3 = project(b.x, b.y, z0, yaw, cx, cy, s);
						var p4 = project(a.x, a.y, z0, yaw, cx, cy, s);
						sides.push({ d: (p1.d + p2.d) / 2, pts: [p1, p2, p3, p4], mid: (p1.x + p2.x) / 2 });
					}
					sides.sort(function (a, b) { return a.d - b.d; });

					var darkest = Math.round(14 + i * 4);
					for (var m = 0; m < 4; m++) {
						var shade = clamp((sides[m].d + 1.4) / 2.8, 0, 1);
						var g = Math.round(darkest + shade * 14);
						face(ctx, sides[m].pts,
							'rgba(' + g + ',' + (g + 4) + ',' + (g + 8) + ',' + (0.92 * A) + ')',
							rgba(ACC, 0.32 * A));
					}

					// topo
					var top = [];
					for (var q = 0; q < 4; q++) top.push(project(c[q].x, c[q].y, z1, yaw, cx, cy, s));
					face(ctx, top, 'rgba(26,31,36,' + (0.95 * A) + ')', rgba(ACC, 0.55 * A));

					// "linha de código" no topo
					ctx.beginPath();
					ctx.moveTo(top[0].x, top[0].y);
					ctx.lineTo(top[1].x, top[1].y);
					ctx.strokeStyle = rgba(LITE, 0.28 * A);
					ctx.lineWidth = 2;
					ctx.stroke();
				}

				// partículas ao redor
				ctx.fillStyle = rgba(ACC, 0.5);
				for (var n = 0; n < 14; n++) {
					var ang = t * 0.35 + n * 0.447;
					var rad = s * (1.25 + (n % 5) * 0.16);
					var px = cx + Math.cos(ang) * rad;
					var py = cy + Math.sin(ang) * rad * 0.5 - 40 - (n % 4) * 26;
					ctx.beginPath();
					ctx.arc(px, py, 1.6, 0, 6.2832);
					ctx.fillStyle = rgba(n % 3 === 0 ? ACC : LITE, 0.35);
					ctx.fill();
				}
			}
		};
	}

	/* ================================================================== *
	 * 6 · wire — wireframes se desenhando + cursor (portfólio)
	 * ================================================================== */
	function sceneWire() {
		var rnd = seeded(9);
		var wins = [
			{ x: 0.05, y: 0.14, w: 0.30, h: 0.34, off: 0 },
			{ x: 0.40, y: 0.54, w: 0.34, h: 0.36, off: 2.6 },
			{ x: 0.68, y: 0.12, w: 0.27, h: 0.30, off: 5.2 }
		];
		var dust = null;

		function build(w, h) { dust = makeDust(rnd, w, h, 24); }

		function cursor(ctx, x, y, s, click) {
			ctx.save();
			ctx.translate(x, y);
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, 17 * s);
			ctx.lineTo(4.4 * s, 13.2 * s);
			ctx.lineTo(7.6 * s, 19.4 * s);
			ctx.lineTo(10.4 * s, 18 * s);
			ctx.lineTo(7.2 * s, 12 * s);
			ctx.lineTo(12.4 * s, 11.6 * s);
			ctx.closePath();
			ctx.fillStyle = 'rgba(10,12,15,0.9)';
			ctx.fill();
			ctx.strokeStyle = rgba(ACC, 0.85);
			ctx.lineWidth = 1.4;
			ctx.stroke();
			if (click > 0) {
				ctx.beginPath();
				ctx.arc(2, 3, 10 + (1 - click) * 26, 0, 6.2832);
				ctx.strokeStyle = rgba(ACC, click * 0.7);
				ctx.lineWidth = 1.6;
				ctx.stroke();
			}
			ctx.restore();
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				drawDust(ctx, dust, w, h, dt, 0.5);
				var P = 9;
				var anchors = [];

				for (var i = 0; i < wins.length; i++) {
					var W = wins[i];
					var p = cyc(t + W.off, P);
					var alpha = p < 0.86 ? clamp(p / 0.1, 0, 1) : clamp((1 - p) / 0.14, 0, 1);
					if (alpha <= 0.01) continue;

					var x = W.x * w, y = W.y * h, ww = W.w * w, hh = W.h * h;

					// contorno desenhado progressivamente
					var q = clamp(p / 0.22, 0, 1);
					var per = 2 * (ww + hh);
					ctx.setLineDash([per * easeOut(q), per]);
					rr(ctx, x, y, ww, hh, 8);
					ctx.fillStyle = 'rgba(12,15,18,' + (0.55 * alpha) + ')';
					if (q >= 1) ctx.fill();
					ctx.strokeStyle = rgba(COOL, 0.42 * alpha);
					ctx.lineWidth = 1.3;
					ctx.stroke();
					ctx.setLineDash([]);

					// barra do navegador
					var b = clamp((p - 0.2) / 0.08, 0, 1);
					if (b > 0) {
						ctx.beginPath();
						ctx.moveTo(x, y + 26);
						ctx.lineTo(x + ww * b, y + 26);
						ctx.strokeStyle = rgba(COOL, 0.35 * alpha);
						ctx.stroke();
						for (var d = 0; d < 3; d++) {
							ctx.beginPath();
							ctx.arc(x + 14 + d * 11, y + 13, 3, 0, 6.2832);
							ctx.fillStyle = rgba(d === 0 ? ACC : COOL, 0.5 * alpha * b);
							ctx.fill();
						}
						rr(ctx, x + 56, y + 7, ww - 74, 12, 6);
						ctx.strokeStyle = rgba(COOL, 0.28 * alpha * b);
						ctx.stroke();
					}

					// blocos internos
					var blocks = 6, cols = 3;
					var pad = 12, gap = 10;
					var bw = (ww - pad * 2 - gap * (cols - 1)) / cols;
					var bh = (hh - 26 - pad - gap * 2) / 3;
					for (var k = 0; k < blocks; k++) {
						var ap = clamp((p - 0.26 - k * 0.045) / 0.14, 0, 1);
						if (ap <= 0) continue;
						var col = k % cols, row = Math.floor(k / cols);
						var bx = x + pad + col * (bw + gap);
						var by = y + 26 + pad + row * (bh + gap);
						var sc = 0.92 + easeBack(ap) * 0.08;
						var cx = bx + bw / 2, cyy = by + bh / 2;
						rr(ctx, cx - bw * sc / 2, cyy - bh * sc / 2, bw * sc, bh * sc, 4);
						ctx.fillStyle = (k === 1 || k === 5)
							? rgba(ACC, 0.14 * alpha * ap)
							: 'rgba(255,255,255,0.055)';
						ctx.fill();
						ctx.strokeStyle = rgba(k === 1 || k === 5 ? ACC : COOL, 0.3 * alpha * ap);
						ctx.lineWidth = 1;
						ctx.stroke();

						// "linhas de texto" dentro do bloco
						ctx.beginPath();
						ctx.moveTo(bx + 8, by + bh - 12);
						ctx.lineTo(bx + 8 + (bw - 16) * ap, by + bh - 12);
						ctx.strokeStyle = rgba(LITE, 0.16 * alpha * ap);
						ctx.stroke();

						if (k === 4) anchors.push({ x: cx, y: cyy });
					}
				}

				// cursor passeando entre as janelas
				if (anchors.length > 1) {
					var seg = 3.2;
					var idx = Math.floor(t / seg) % anchors.length;
					var nxt = (idx + 1) % anchors.length;
					var u = easeInOut(cyc(t, seg));
					var ax = lerp(anchors[idx].x, anchors[nxt].x, u);
					var ay = lerp(anchors[idx].y, anchors[nxt].y, u);
					var click = cyc(t, seg) > 0.94 ? (1 - cyc(t, seg)) / 0.06 : 0;
					cursor(ctx, ax, ay, 1, click);
				}
			}
		};
	}

	/* ================================================================== *
	 * 7 · chat — balões de conversa subindo (depoimentos)
	 * ================================================================== */
	function sceneChat() {
		var rnd = seeded(47);
		var bubbles = [];

		function build(w, h) {
			bubbles = [];
			for (var i = 0; i < 11; i++) {
				bubbles.push({
					x: rnd() * w,
					y: rnd() * (h * 1.6),
					w: (0.07 + rnd() * 0.09) * w,
					h: (0.06 + rnd() * 0.06) * h,
					sp: 12 + rnd() * 20,
					sway: rnd() * 6.28,
					lines: 2 + Math.floor(rnd() * 2),
					typing: i === 3,
					side: rnd() < 0.5
				});
			}
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				for (var i = 0; i < bubbles.length; i++) {
					var b = bubbles[i];
					if (!REDUCE) b.y -= b.sp * dt;
					if (b.y + b.h < -40) { b.y = h + 60; b.x = rnd() * w; }

					var fade = clamp((h - b.y) / (h * 0.25), 0, 1) * clamp((b.y + b.h + 60) / (h * 0.3), 0, 1);
					if (fade <= 0.01) continue;
					var x = b.x + Math.sin(t * 0.6 + b.sway) * 14;
					var y = b.y;
					var A = 0.85 * fade;

					rr(ctx, x, y, b.w, b.h, 12);
					ctx.fillStyle = 'rgba(255,255,255,' + 0.045 * A + ')';
					ctx.fill();
					ctx.strokeStyle = rgba(b.side ? ACC : COOL, 0.22 * A);
					ctx.lineWidth = 1.2;
					ctx.stroke();

					// rabo
					ctx.beginPath();
					if (b.side) {
						ctx.moveTo(x + 16, y + b.h - 1);
						ctx.lineTo(x + 24, y + b.h + 11);
						ctx.lineTo(x + 30, y + b.h - 1);
					} else {
						ctx.moveTo(x + b.w - 30, y + b.h - 1);
						ctx.lineTo(x + b.w - 24, y + b.h + 11);
						ctx.lineTo(x + b.w - 16, y + b.h - 1);
					}
					ctx.closePath();
					ctx.fillStyle = 'rgba(255,255,255,' + 0.045 * A + ')';
					ctx.fill();

					if (b.typing) {
						for (var d = 0; d < 3; d++) {
							var bounce = Math.max(0, Math.sin(t * 4 - d * 0.5));
							ctx.beginPath();
							ctx.arc(x + b.w / 2 - 14 + d * 14, y + b.h / 2 - bounce * 4, 3.4, 0, 6.2832);
							ctx.fillStyle = rgba(ACC, (0.35 + bounce * 0.5) * A);
							ctx.fill();
						}
					} else {
						for (var l = 0; l < b.lines; l++) {
							var lw = (b.w - 26) * (l === b.lines - 1 ? 0.55 : 1);
							rr(ctx, x + 13, y + 16 + l * 13, lw, 6, 3);
							ctx.fillStyle = rgba(LITE, 0.10 * A);
							ctx.fill();
						}
					}
				}
			}
		};
	}

	/* ================================================================== *
	 * 8 · radar — varredura e sinais (clientes)
	 * ================================================================== */
	function sceneRadar() {
		var rnd = seeded(63);
		var blips = [], orbit = [];

		function build(w, h) {
			blips = []; orbit = [];
			for (var i = 0; i < 14; i++) {
				blips.push({ r: 0.18 + rnd() * 0.78, a: rnd() * 6.2832, last: -10 });
			}
			for (var k = 0; k < 7; k++) orbit.push({ r: 0.3 + (k % 4) * 0.2, a: rnd() * 6.2832, sp: (k % 2 ? 1 : -1) * (0.12 + rnd() * 0.2), sz: 2 + rnd() * 1.6 });
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t) {
				var cx = w * 0.5, cy = h * 0.52;
				var R = Math.min(w, h) * 0.44;
				var sweep = t * 0.7;

				// rótulos
				ctx.strokeStyle = rgba(COOL, 0.14);
				ctx.lineWidth = 1;
				for (var k = 1; k <= 4; k++) {
					ctx.beginPath();
					ctx.arc(cx, cy, R * k / 4, 0, 6.2832);
					ctx.stroke();
				}
				ctx.setLineDash([2, 7]);
				ctx.beginPath();
				ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
				ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
				ctx.strokeStyle = rgba(COOL, 0.10);
				ctx.stroke();
				ctx.setLineDash([]);

				// marcações do anel externo
				for (var m = 0; m < 36; m++) {
					var ang = m * Math.PI / 18;
					var r1 = R * (m % 3 === 0 ? 0.94 : 0.97);
					ctx.beginPath();
					ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
					ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
					ctx.strokeStyle = rgba(m % 3 === 0 ? ACC : COOL, m % 3 === 0 ? 0.4 : 0.18);
					ctx.stroke();
				}

				// leque de varredura
				var LE = 44;
				for (var s = 0; s < LE; s++) {
					var a2 = sweep - s * 0.03;
					var f = 1 - s / LE;
					ctx.beginPath();
					ctx.moveTo(cx, cy);
					ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
					ctx.strokeStyle = rgba(ACC, 0.075 * f * f);
					ctx.lineWidth = 2;
					ctx.stroke();
				}
				glow(ctx, cx + Math.cos(sweep) * R * 0.5, cy + Math.sin(sweep) * R * 0.5, R * 0.5, ACC, 0.05);

				// sinais (acendem quando o leque passa)
				for (var b = 0; b < blips.length; b++) {
					var bl = blips[b];
					var diff = Math.abs(((sweep - bl.a) % 6.2832 + 6.2832) % 6.2832);
					if (diff < 0.1) bl.last = t;
					var age = t - bl.last;
					if (age > 3.4) continue;
					var A = clamp(1 - age / 3.4, 0, 1);
					var bx = cx + Math.cos(bl.a) * R * bl.r;
					var by = cy + Math.sin(bl.a) * R * bl.r;
					ctx.beginPath();
					ctx.arc(bx, by, 3.4, 0, 6.2832);
					ctx.fillStyle = rgba(b % 4 === 0 ? LITE : ACC, A * 0.95);
					ctx.fill();
					ctx.beginPath();
					ctx.arc(bx, by, 4 + (1 - A) * 24, 0, 6.2832);
					ctx.strokeStyle = rgba(ACC, A * 0.45);
					ctx.lineWidth = 1.2;
					ctx.stroke();
				}

				// órbitas
				for (var o = 0; o < orbit.length; o++) {
					var ob = orbit[o];
					if (!REDUCE) ob.a += ob.sp * 0.016;
					var ox = cx + Math.cos(ob.a) * R * ob.r;
					var oy = cy + Math.sin(ob.a) * R * ob.r * 0.98;
					ctx.beginPath();
					ctx.arc(ox, oy, ob.sz, 0, 6.2832);
					ctx.fillStyle = rgba(LITE, 0.5);
					ctx.fill();
				}

				// centro
				ctx.beginPath();
				ctx.arc(cx, cy, 5, 0, 6.2832);
				ctx.fillStyle = rgba(ACC, 0.9);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(cx, cy, 11 + Math.sin(t * 2) * 3, 0, 6.2832);
				ctx.strokeStyle = rgba(ACC, 0.5);
				ctx.stroke();
			}
		};
	}

	/* ================================================================== *
	 * 9 · signal — partículas convergindo + ondas (contato)
	 * ================================================================== */
	function sceneSignal() {
		var rnd = seeded(71);
		var parts = [], waves = [], tx = 0, ty = 0, w0 = 0, h0 = 0;

		function spawn(w, h) {
			var side = Math.floor(rnd() * 4);
			var sx, sy;
			if (side === 0) { sx = rnd() * w; sy = -30; }
			else if (side === 1) { sx = w + 30; sy = rnd() * h; }
			else if (side === 2) { sx = rnd() * w; sy = h + 30; }
			else { sx = -30; sy = rnd() * h; }
			return {
				sx: sx, sy: sy,
				cx: lerp(sx, tx, 0.5) + (rnd() - 0.5) * w * 0.35,
				cy: lerp(sy, ty, 0.5) + (rnd() - 0.5) * h * 0.35,
				t: 0,
				dur: 3.4 + rnd() * 3,
				delay: rnd() * 4,
				sz: 1.5 + rnd() * 1.8,
				hot: rnd() < 0.32
			};
		}

		function build(w, h) {
			w0 = w; h0 = h;
			tx = w * 0.5; ty = h * 0.46;
			parts = [];
			for (var i = 0; i < 30; i++) parts.push(spawn(w, h));
		}

		function at(p, u) {
			var iu = 1 - u;
			return {
				x: iu * iu * p.sx + 2 * iu * u * p.cx + u * u * tx,
				y: iu * iu * p.sy + 2 * iu * u * p.cy + u * u * ty
			};
		}

		return {
			resize: build,
			draw: function (ctx, w, h, t, dt) {
				// ondas partindo do centro
				ctx.lineCap = 'round';
				for (var v = 0; v < 4; v++) {
					var wp = cyc(t * 0.34 + v * 0.25, 1);
					var r = wp * Math.min(w, h) * 0.55;
					ctx.beginPath();
					ctx.arc(tx, ty, r, 0, 6.2832);
					ctx.strokeStyle = rgba(ACC, (1 - wp) * 0.22);
					ctx.lineWidth = 1.4;
					ctx.stroke();
				}

				// partículas
				for (var i = 0; i < parts.length; i++) {
					var p = parts[i];
					if (!REDUCE) {
						if (p.delay > 0) { p.delay -= dt; continue; }
						p.t += dt / p.dur;
						if (p.t >= 1) {
							waves.push({ r: 4, a: 0.55 });
							p = parts[i] = spawn(w, h);
						}
					}
					var u = p.t;
					if (u <= 0) continue;
					ctx.lineWidth = 1.6;
					for (var s = 0; s < 8; s++) {
						var u1 = clamp(u - s * 0.016, 0, 1);
						var u0 = clamp(u - (s + 1) * 0.016, 0, 1);
						if (u1 <= 0) break;
						var a1 = at(p, u1), a0 = at(p, u0);
						ctx.beginPath();
						ctx.moveTo(a0.x, a0.y);
						ctx.lineTo(a1.x, a1.y);
						ctx.strokeStyle = rgba(p.hot ? ACC : COOL, 0.5 * (1 - s / 8));
						ctx.stroke();
					}
					var head = at(p, u);
					ctx.beginPath();
					ctx.rect(head.x - p.sz, head.y - p.sz, p.sz * 2, p.sz * 2);
					ctx.fillStyle = rgba(p.hot ? '240,255,210' : LITE, 0.85);
					ctx.fill();
				}

				// pulsos gerados nas chegadas
				for (var k = waves.length - 1; k >= 0; k--) {
					var wp2 = waves[k];
					if (!REDUCE) { wp2.r += dt * 110; wp2.a -= dt * 0.55; }
					if (wp2.a <= 0) { waves.splice(k, 1); continue; }
					ctx.beginPath();
					ctx.arc(tx, ty, wp2.r, 0, 6.2832);
					ctx.strokeStyle = rgba(ACC, wp2.a);
					ctx.lineWidth = 1.5;
					ctx.stroke();
				}
				if (waves.length > 26) waves.splice(0, waves.length - 26);

				// alvo
				glow(ctx, tx, ty, 130, ACC, 0.16);
				ctx.beginPath();
				ctx.arc(tx, ty, 7, 0, 6.2832);
				ctx.fillStyle = rgba(ACC, 0.95);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(tx, ty, 15, 0, 6.2832);
				ctx.strokeStyle = rgba(LITE, 0.5);
				ctx.lineWidth = 1.4;
				ctx.stroke();
			}
		};
	}

	/* ================================================================== *
	 * Registro + laço principal
	 * ================================================================== */
	var FACTORY = {
		ide: sceneIde,
		path: scenePath,
		layers: sceneLayers,
		rain: sceneRain,
		stack: sceneStack,
		wire: sceneWire,
		chat: sceneChat,
		radar: sceneRadar,
		signal: sceneSignal
	};

	var nodes = document.querySelectorAll('canvas.alx-scene');
	if (!nodes.length) return;

	var items = [];
	for (var i = 0; i < nodes.length; i++) {
		var cv = nodes[i];
		var name = cv.getAttribute('data-scene');
		if (!FACTORY[name]) continue;
		items.push({
			cv: cv,
			ctx: cv.getContext('2d'),
			scene: FACTORY[name](),
			w: 0, h: 0, dpr: 0, t: 0,
			ready: false
		});
	}
	if (!items.length) return;

	function size(item, rect) {
		var w = Math.max(1, Math.round(rect.width));
		var h = Math.max(1, Math.round(rect.height));
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (w === item.w && h === item.h && dpr === item.dpr) return;
		item.w = w; item.h = h; item.dpr = dpr;
		item.cv.width = Math.round(w * dpr);
		item.cv.height = Math.round(h * dpr);
		if (item.scene.resize) item.scene.resize(w, h);
		item.ready = false;
	}

	function render(item, dt) {
		var ctx = item.ctx;
		ctx.setTransform(item.dpr, 0, 0, item.dpr, 0, 0);
		ctx.clearRect(0, 0, item.w, item.h);
		item.scene.draw(ctx, item.w, item.h, item.t, dt);
	}

	function visible(rect) {
		var vh = window.innerHeight || 0;
		return rect.width > 0 && rect.bottom > -60 && rect.top < vh + 60;
	}

	var last = 0, acc = 0;
	var STEP = 1 / 40;   // ~40fps: fundo suave e metade do processamento

	function frame(now) {
		var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
		last = now;

		// throttle: junta o tempo decorrido e só desenha ao atingir o passo
		acc += dt;
		if (acc < STEP) { requestAnimationFrame(frame); return; }
		var span = acc;
		acc = 0;

		// 1) medir tudo antes de desenhar (evita layout thrash)
		var queue = [];
		for (var i = 0; i < items.length; i++) {
			var rect = items[i].cv.getBoundingClientRect();
			if (!visible(rect)) continue;
			size(items[i], rect);
			queue.push(items[i]);
		}
		// 2) desenhar
		for (var k = 0; k < queue.length; k++) {
			var it = queue[k];
			it.t += span;
			it.ready = true;
			render(it, span);
		}
		requestAnimationFrame(frame);
	}

	function staticFrame() {
		// prefers-reduced-motion: um único quadro representativo, sem laço
		for (var i = 0; i < items.length; i++) {
			var it = items[i];
			var rect = it.cv.getBoundingClientRect();
			if (!visible(rect)) continue;
			size(it, rect);
			it.t = 7;
			render(it, 30);   // dt grande = estado final (código todo digitado)
			it.ready = true;
		}
	}

	var resizeTimer = 0;
	window.addEventListener('resize', function () {
		if (!REDUCE) return;
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(staticFrame, 180);
	});

	if (REDUCE) {
		staticFrame();
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(staticFrame);
	} else {
		requestAnimationFrame(frame);
	}

	/* ------------------------------------------------------------------ *
	 * pace.js — barra verde de carregamento
	 *
	 * O pace só marca 100% quando o event-loop fica "limpo" por uns frames
	 * (menos de 3ms de atraso). Com uma cena desenhando a cada quadro esse
	 * momento nunca chega e a barra fica presa no topo da página. Assim que a
	 * página termina de carregar, encerramos o pace na marra.
	 * ------------------------------------------------------------------ */
	function stopPace() {
		var P = window.Pace;
		if (!P) return;
		try { if (typeof P.stop === 'function') P.stop(); } catch (e) { /* pace ausente */ }
		var el = document.querySelector('.pace');
		if (el && !el.classList.contains('pace-done')) {
			el.classList.remove('pace-active');
			el.classList.add('pace-done', 'pace-inactive');
		}
	}
	if (document.readyState === 'complete') setTimeout(stopPace, 500);
	else window.addEventListener('load', function () { setTimeout(stopPace, 500); });
	if (window.Pace && typeof window.Pace.on === 'function') {
		// caso o pace reinicie depois (pushState), encerra de novo
		window.Pace.on('start', function () { setTimeout(stopPace, 500); });
	}

})(undefined);
