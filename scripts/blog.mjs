// Gera /blog/index.html e /blog/<slug>.html a partir de content/blog/*.html.
// Novo artigo = novo arquivo em content/blog/ (metadados em JSON no comentário do topo).
// Cabeçalho, rodapé e botão do WhatsApp são copiados do index.html, então ficam sempre iguais.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'

const SITE = 'https://juniorpsicologo.vercel.app'
const WA = 'https://wa.me/5541995300225?text='
const CRP = 'CRP-08/49809'
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const home = readFileSync('index.html', 'utf8')
const trecho = (ini, fim) => home.slice(home.indexOf(ini), home.indexOf(fim, home.indexOf(ini)) + fim.length)
// Links "#secao" da home viram "/#secao" fora dela
const paraFora = (html) => html.replace(/href="#/g, 'href="/#')
const header = paraFora(trecho('<header class="topo">', '</header>'))
  .replace('<li><a href="/blog/">Blog</a></li>', '<li><a href="/blog/" aria-current="page">Blog</a></li>')
const footer = paraFora(trecho('<footer class="rodape">', '</footer>'))
const zap = trecho('<a class="zap"', '</a>')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const dataBR = (iso) => { const [a, m, d] = iso.split('-'); return `${+d} de ${MESES[m - 1]} de ${a}` }

const artigos = readdirSync('content/blog').filter((f) => f.endsWith('.html')).map((arquivo) => {
  const bruto = readFileSync(`content/blog/${arquivo}`, 'utf8')
  const meta = bruto.match(/^<!--([\s\S]*?)-->/)
  if (!meta) throw new Error(`${arquivo}: faltam os metadados no topo`)
  const dados = JSON.parse(meta[1])
  for (const campo of ['titulo', 'categoria', 'data', 'resumo']) if (!dados[campo]) throw new Error(`${arquivo}: falta "${campo}"`)
  const sumario = []
  const corpo = bruto.slice(meta[0].length).replace(/<h2>(.*?)<\/h2>/g, (_, t) => {
    const id = slugify(t.replace(/<[^>]+>/g, ''))
    sumario.push({ id, t })
    return `<h2 id="${id}">${t}</h2>`
  })
  const palavras = corpo.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return { ...dados, slug: arquivo.replace('.html', ''), corpo, sumario, minutos: Math.max(1, Math.round(palavras / 200)) }
}).sort((a, b) => b.data.localeCompare(a.data))

const head = ({ titulo, descricao, url, extra = '' }) => `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descricao)}" />
  <meta name="theme-color" content="#0E5A9E" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="canonical" href="${url}" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:title" content="${esc(titulo)}" />
  <meta property="og:description" content="${esc(descricao)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/img/og.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
${extra}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&display=swap" rel="stylesheet" />
  <script>/* aplica o tema antes de pintar (evita piscar claro) */try{document.documentElement.dataset.theme=localStorage.tema||'light'}catch(e){}</script>
  <link rel="stylesheet" href="/src/style.css" />
  <script type="module" src="/src/main.js"></script>
</head>
<body>
  <!-- Arquivo gerado por scripts/blog.mjs: edite content/blog/, não este arquivo. -->
  <a class="skip" href="#conteudo">Pular para o conteúdo</a>
  ${header}
`
const fim = `
  ${footer}

  ${zap}
</body>
</html>
`
const capa = (a, tag = 'div') => `<${tag} class="capa capa--${a.capa || 'azul'}" aria-hidden="true">
            <img src="/img/arvore.png" alt="" width="64" height="64" loading="lazy" />
            <span>${esc(a.categoria)}</span>
          </${tag}>`
const metaLinha = (a) => `<time datetime="${a.data}">${dataBR(a.data)}</time> · ${a.minutos} min de leitura`
const card = (a) => `
        <article class="post-card" data-categoria="${esc(a.categoria)}" data-busca="${esc((a.titulo + ' ' + a.resumo + ' ' + a.categoria).toLowerCase())}">
          <a href="/blog/${a.slug}.html">
            ${capa(a)}
            <div class="post-card__txt">
              <p class="post-card__cat">${esc(a.categoria)}</p>
              <h3>${a.titulo}</h3>
              <p>${a.resumo}</p>
              <p class="post-card__meta">${metaLinha(a)}</p>
            </div>
          </a>
        </article>`

const autor = (tituloArtigo = '') => `
      <aside class="autor" aria-label="Sobre o autor">
        <img src="/img/junior-480.jpg" alt="Junior, psicólogo" width="120" height="122" loading="lazy" />
        <div>
          <p class="eyebrow">Sobre o autor</p>
          <h2>Junior · Psicólogo</h2>
          <p class="autor__crp">Benedito Ferreira dos Santos Júnior · ${CRP}</p>
          <p>Psicólogo clínico e psicopedagogo, de abordagem psicanalítica. Atende adolescentes e adultos online e presencialmente, em Curitiba/PR.</p>
          <div class="autor__acoes">
            <a class="btn btn--sm" href="${WA + encodeURIComponent(tituloArtigo ? `Olá, Junior! Li o artigo "${tituloArtigo}" no seu site e gostaria de agendar uma sessão.` : 'Olá, Junior! Vim pelo seu blog e gostaria de agendar uma sessão.')}" target="_blank" rel="noopener">Agendar pelo WhatsApp</a>
            <a class="link" href="/#sobre">Conhecer o Junior →</a>
            <a class="link" href="https://cadastro.cfp.org.br/" target="_blank" rel="noopener">Verificar CRP no CFP ↗</a>
          </div>
        </div>
      </aside>`

// Listagem
const categorias = [...new Set(artigos.map((a) => a.categoria))]
rmSync('blog', { recursive: true, force: true })
mkdirSync('blog')
writeFileSync('blog/index.html', head({
  titulo: `Blog · Junior, psicólogo (${CRP})`,
  descricao: 'Textos sobre emoções, comportamento, desenvolvimento, aprendizagem e terapia online, por Junior, psicólogo clínico e psicopedagogo.',
  url: `${SITE}/blog/`,
}) + `
  <main id="conteudo">
    <section class="blog-topo">
      <div class="wrap">
        <p class="eyebrow">Blog</p>
        <h1>Conversas sobre <em>emoções, comportamento e aprendizagem.</em></h1>
        <p class="lead">Textos para entender melhor a terapia e a si mesmo. Conteúdo informativo, que não substitui o atendimento psicológico.</p>
        <div class="blog-busca">
          <label class="sr" for="busca">Buscar artigos no blog</label>
          <input id="busca" type="search" placeholder="Buscar artigos…" autocomplete="off" />
          <div class="filtros" role="group" aria-label="Filtrar por categoria">
            <button type="button" class="filtro" aria-pressed="true" data-cat="">Todos</button>
            ${categorias.map((c) => `<button type="button" class="filtro" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('\n            ')}
          </div>
        </div>
      </div>
    </section>

    <section class="secao blog-lista" aria-label="Artigos">
      <div class="wrap">
        <div class="posts">${artigos.map(card).join('')}
        </div>
        <p class="sem-resultado" hidden>Nenhum artigo encontrado. Tente outra palavra.</p>
      </div>
    </section>

    <section class="secao secao--papel2">
      <div class="wrap">${autor()}
      </div>
    </section>
  </main>
` + fim)

// Artigos
for (const a of artigos) {
  const url = `${SITE}/blog/${a.slug}.html`
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(a.titulo)
  const relacionados = artigos.filter((x) => x !== a).slice(0, 3)
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.titulo, description: a.resumo,
    datePublished: a.data, url, inLanguage: 'pt-BR',
    author: { '@type': 'Person', name: 'Benedito Ferreira dos Santos Júnior', jobTitle: 'Psicólogo' },
  })
  writeFileSync(`blog/${a.slug}.html`, head({
    titulo: `${a.titulo} · Junior, psicólogo`, descricao: a.resumo, url,
    extra: `  <meta property="og:type" content="article" />\n  <script type="application/ld+json">${jsonld}</script>`,
  }) + `
  <main id="conteudo">
    <article class="artigo">
      <header class="artigo__topo wrap">
        <nav class="trilha" aria-label="Você está em">
          <a href="/">Início</a> <span aria-hidden="true">›</span> <a href="/blog/">Blog</a> <span aria-hidden="true">›</span> <span aria-current="page">${a.titulo}</span>
        </nav>
        <p class="eyebrow">${esc(a.categoria)}</p>
        <h1>${a.titulo}</h1>
        <p class="artigo__meta">Por <strong>Junior</strong> · ${CRP} · ${metaLinha(a)}</p>
        <div class="compartilhar" aria-label="Compartilhar">
          <span>Compartilhar:</span>
          <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="https://x.com/intent/post?text=${t}&amp;url=${u}" target="_blank" rel="noopener">X</a>
          <button type="button" class="copiar" data-url="${url}">Copiar link</button>
        </div>
      </header>

      <div class="wrap">${capa(a)}</div>

      <div class="wrap artigo__grade">
        <nav class="indice" aria-label="Neste artigo">
          <p>Neste artigo</p>
          <ol>${a.sumario.map((s) => `<li><a href="#${s.id}">${s.t}</a></li>`).join('')}</ol>
        </nav>
        <div class="prosa">
${a.corpo.trim()}

          <p class="aviso-artigo">Este conteúdo é informativo e não substitui avaliação ou acompanhamento psicológico. Em crise, ligue <strong>188 (CVV)</strong>, 24h, ou <strong>192 (SAMU)</strong>.</p>
        </div>
      </div>
    </article>

    <section class="faixa" aria-label="Chamada para agendamento">
      <div class="wrap faixa__in">
        <p>Gostaria de conversar? <em>Uma mensagem é suficiente.</em></p>
        <a class="btn" href="${WA + encodeURIComponent(`Olá, Junior! Li o artigo "${a.titulo}" no seu site e gostaria de conversar.`)}" target="_blank" rel="noopener">Falar no WhatsApp</a>
      </div>
    </section>

    <section class="secao secao--papel2">
      <div class="wrap">${autor(a.titulo)}
      </div>
    </section>
${relacionados.length ? `
    <section class="secao" aria-labelledby="t-leia">
      <div class="wrap">
        <p class="eyebrow">Continue lendo</p>
        <h2 id="t-leia">Leia também</h2>
        <div class="posts">${relacionados.map(card).join('')}
        </div>
      </div>
    </section>` : ''}
  </main>
` + fim)
}

console.log(`blog: ${artigos.length} artigo(s) gerado(s)`)
