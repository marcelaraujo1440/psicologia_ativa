// Botões do topo: modo escuro e inglês. Usado em todas as páginas (a política carrega só este arquivo).
import en from './en.json'

const raiz = document.documentElement

// Tema: o <head> já aplicou a preferência salva (padrão: claro) antes de pintar; aqui só alterna
// Animação adaptada do Theme Toggle do EaseUI (MIT): o novo tema surge num círculo que cresce a partir do botão.
const temaBtn = document.querySelector('[data-tema]')
const icone = temaBtn.querySelector('svg')
const LUA = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
const SOL = '<circle cx="12" cy="12" r="5"/><g>' + [0, 45, 90, 135, 180, 225, 270, 315]
  .map((g) => `<rect x="11" y="1" width="2" height="3.5" rx="1" transform="rotate(${g} 12 12)"/>`).join('') + '</g>'
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)')
const marcarTema = () => {
  const escuro = raiz.dataset.theme === 'dark'
  temaBtn.setAttribute('aria-pressed', escuro)
  icone.innerHTML = escuro ? SOL : LUA // no escuro, o ícone mostra para onde o clique leva
}
marcarTema()
const trocarTema = () => {
  raiz.dataset.theme = raiz.dataset.theme === 'dark' ? 'light' : 'dark'
  try { localStorage.tema = raiz.dataset.theme } catch {}
  marcarTema()
}
temaBtn.addEventListener('click', () => {
  if (semMovimento.matches || !document.startViewTransition) return trocarTema()
  const r = temaBtn.getBoundingClientRect()
  const x = r.left + r.width / 2, y = r.top + r.height / 2
  raiz.style.setProperty('--reveal-x', `${x}px`)
  raiz.style.setProperty('--reveal-y', `${y}px`)
  raiz.style.setProperty('--reveal-r', `${Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)))}px`)
  raiz.dataset.themeReveal = ''
  document.startViewTransition(trocarTema).finished.finally(() => {
    delete raiz.dataset.themeReveal
    icone.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 150, easing: 'cubic-bezier(.23, 1, .32, 1)' })
  })
})

// Idioma: tradução própria (src/en.json, chave = texto em PT). Troca na hora, sem recarregar nem serviço externo.
// shortcut: texto novo (ex.: post novo no blog) fica em PT até ganhar entrada em src/en.json.
let ingles = false
export const t = (pt) => (ingles && en[pt]) || pt

const norm = (s) => s.replace(/\s+/g, ' ').trim()
// "Unidade" = elemento com texto direto; traduzimos o bloco inteiro para manter a frase com seus <strong>/<a>
const unidades = (el, out = []) => {
  for (const filho of el.children) {
    if (filho.translate === false || ['SCRIPT', 'STYLE', 'svg', 'NOSCRIPT'].includes(filho.tagName)) continue
    if ([...filho.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) out.push(filho)
    else unidades(filho, out)
  }
  return out
}
const ATRIBUTOS = ['aria-label', 'alt', 'placeholder', 'title']
const originais = [] // [restaurar, ...] para voltar ao PT
const tituloPT = document.title

const traduzir = () => {
  for (const el of unidades(document.body)) {
    const novo = en[norm(el.textContent)]
    if (!novo) continue
    const antes = el.innerHTML
    originais.push(() => { el.innerHTML = antes })
    if (novo.includes('<')) el.innerHTML = novo
    // sem tags: troca só o texto, preservando ícones (svg) e o CRP que ficam ao lado
    else [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()).textContent = novo
  }
  for (const el of document.querySelectorAll(ATRIBUTOS.map((a) => `[${a}]:not([data-lang])`).join())) {
    for (const a of ATRIBUTOS) {
      const antes = el.getAttribute(a)
      if (!antes || !en[antes]) continue
      originais.push(() => el.setAttribute(a, antes))
      el.setAttribute(a, en[antes])
    }
  }
  document.title = en[tituloPT] || tituloPT
}

const langBtn = document.querySelector('[data-lang]')
const aplicarIdioma = (paraIngles) => {
  ingles = paraIngles
  if (ingles) traduzir()
  else { originais.splice(0).forEach((restaurar) => restaurar()); document.title = tituloPT }
  raiz.lang = ingles ? 'en' : 'pt-BR'
  langBtn.textContent = ingles ? 'PT' : 'EN'
  langBtn.lang = ingles ? 'pt' : 'en'
  langBtn.setAttribute('aria-label', ingles ? 'Ler em português' : 'Read in English')
}

let salvo = null
try { salvo = localStorage.idioma } catch {}
if (salvo === 'en') aplicarIdioma(true)
langBtn.addEventListener('click', () => {
  aplicarIdioma(!ingles)
  try { localStorage.idioma = ingles ? 'en' : 'pt' } catch {}
})
