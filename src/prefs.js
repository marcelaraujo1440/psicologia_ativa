// Botões do topo: modo escuro e inglês. Usado em todas as páginas (a política carrega só este arquivo).
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

// Idioma: o Google Tradutor lê o cookie googtrans e traduz a página; o script dele só carrega depois que a pessoa pede inglês.
// shortcut: tradução automática (pode errar termos clínicos); para texto revisado, criar páginas /en/ escritas à mão.
const langBtn = document.querySelector('[data-lang]')
const emIngles = /(^|;\s*)googtrans=\/pt\/en/.test(document.cookie)
if (emIngles) {
  langBtn.textContent = 'PT'
  langBtn.setAttribute('aria-label', 'Ler em português')
  langBtn.lang = 'pt'
  window.googleTradutor = () =>
    new google.translate.TranslateElement({ pageLanguage: 'pt', autoDisplay: false }, 'google_tradutor')
  document.body.append(
    Object.assign(document.createElement('div'), { id: 'google_tradutor', hidden: true }),
    Object.assign(document.createElement('script'), { src: 'https://translate.google.com/translate_a/element.js?cb=googleTradutor' }),
  )
}
langBtn.addEventListener('click', () => {
  const valor = emIngles ? '; max-age=0' : '/pt/en' // voltar ao português = apagar o cookie
  // O Google grava o mesmo cookie também com domínio; é preciso escrever/apagar nas três formas
  for (const dominio of ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) {
    document.cookie = `googtrans=${valor}; path=/${dominio}`
  }
  location.reload()
})
