// Botões do topo: modo escuro e inglês. Usado em todas as páginas (a política carrega só este arquivo).
import en from './en.json'

const raiz = document.documentElement

// Tema: o <head> já aplicou a preferência salva (padrão: claro) antes de pintar; aqui só alterna
const temaBtn = document.querySelector('[data-tema]')
const marcarTema = () => temaBtn.setAttribute('aria-pressed', raiz.dataset.theme === 'dark')
marcarTema()
temaBtn.addEventListener('click', () => {
  raiz.dataset.theme = raiz.dataset.theme === 'dark' ? 'light' : 'dark'
  try { localStorage.tema = raiz.dataset.theme } catch {}
  marcarTema()
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
