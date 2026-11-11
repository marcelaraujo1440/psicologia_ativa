import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { t } from './prefs.js'
import { injectSpeedInsights } from '@vercel/speed-insights'

gsap.registerPlugin(ScrollTrigger)

// Initialize Vercel Speed Insights
injectSpeedInsights()

// Tudo aqui é decorativo: sem JS ou com "reduzir movimento", o conteúdo aparece normalmente.
const scrub = (trigger, start = 'top bottom', end = 'bottom top') =>
  ({ trigger, start, end, scrub: true })
const mm = gsap.matchMedia()

// Navbar: fundo sólido ao rolar, seção atual marcada e menu do celular
const topo = document.querySelector('.topo')
const menuBtn = topo.querySelector('.menu-btn')
const links = [...topo.querySelectorAll('.nav a')]

ScrollTrigger.create({ start: 10, end: 'max', toggleClass: { targets: topo, className: 'topo--rolado' } })

links.forEach((link) => {
  // Só links de âncora da própria página (na home); fora dela, "/#sobre" etc. não marcam nada
  if (!link.hash || link.pathname !== location.pathname) return
  const secao = document.querySelector(link.hash)
  if (!secao) return
  ScrollTrigger.create({
    trigger: secao, start: 'top center', end: 'bottom center',
    onToggle: ({ isActive }) => {
      if (!isActive) return
      links.forEach((l) => (l === link ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')))
    },
  })
})

const menu = (aberto) => {
  topo.classList.toggle('topo--aberto', aberto)
  menuBtn.setAttribute('aria-expanded', aberto)
  menuBtn.setAttribute('aria-label', t(aberto ? 'Fechar menu' : 'Abrir menu'))
}
menuBtn.addEventListener('click', () => menu(!topo.classList.contains('topo--aberto')))
links.forEach((l) => l.addEventListener('click', () => menu(false)))
document.addEventListener('keydown', (e) => e.key === 'Escape' && menu(false))

// Parallax só no desktop: no celular as colunas empilham e os elementos se sobreporiam
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 860px)', () => {
  if (!document.querySelector('.hero')) return
  // Hero: foto, copa azul e texto em velocidades diferentes
  gsap.to('.hero__foto img', { yPercent: -10, ease: 'none', scrollTrigger: scrub('.hero', 'top top') })
  gsap.to('.hero__foto', { '--py': '90px', ease: 'none', scrollTrigger: scrub('.hero', 'top top') })
  gsap.to('.hero__txt', { y: 70, ease: 'none', scrollTrigger: scrub('.hero', 'top top') })

  // Sobre: a foto desliza dentro da seção
  gsap.fromTo('.sobre__foto img', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: scrub('#sobre') })
})

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Contato: forma azul ao fundo (não sobrepõe conteúdo)
  if (document.querySelector('.contato')) gsap.fromTo('.contato', { '--py': '-60px' }, { '--py': '80px', ease: 'none', scrollTrigger: scrub('.contato') })

  // Entradas: títulos e cartões sobem em sequência ao aparecer
  const alvos = '.secao h2, .revela, .cred, .infos > div, .preparo li, .faq__lista details, .post-card, .autor'
  // Blur fade: além de subir, o elemento sai do desfoque
  gsap.set(alvos, { autoAlpha: 0, y: 18, filter: 'blur(3px)' })
  ScrollTrigger.batch(alvos, {
    start: 'top 96%',
    interval: 0.05,
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out', stagger: 0.05, overwrite: true, clearProps: 'filter' }),
  })

  // Spotlight: guarda a posição do cursor no cartão para o gradiente do CSS
  document.querySelectorAll('.card, .modalidade, .cred, .post-card a').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    })
  })
})

// FAQ: abrir e fechar com animação de altura (sem animação se "reduzir movimento")
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)')
document.querySelectorAll('.faq__lista details').forEach((item) => {
  const resposta = item.querySelector('p')
  item.querySelector('summary').addEventListener('click', (e) => {
    if (semMovimento.matches) return
    e.preventDefault()
    gsap.killTweensOf(resposta)
    if (item.open && !item.classList.contains('fechando')) {
      item.classList.add('fechando')
      gsap.to(resposta, {
        height: 0, paddingBottom: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut',
        onComplete: () => { item.open = false; item.classList.remove('fechando'); gsap.set(resposta, { clearProps: 'all' }) },
      })
    } else {
      item.classList.remove('fechando')
      item.open = true
      gsap.fromTo(resposta,
        { height: 0, paddingBottom: 0, autoAlpha: 0 },
        { height: 'auto', paddingBottom: 20, autoAlpha: 1, duration: 0.45, ease: 'power2.out', clearProps: 'all' })
    }
  })
})

// Blog: busca e filtro por categoria na listagem
const posts = [...document.querySelectorAll('.posts .post-card')]
const busca = document.querySelector('#busca')
if (busca) {
  const filtros = [...document.querySelectorAll('.filtro')]
  const vazio = document.querySelector('.sem-resultado')
  let categoria = ''
  const aplicar = () => {
    const termo = busca.value.trim().toLowerCase()
    let visiveis = 0
    posts.forEach((p) => {
      const ok = (!categoria || p.dataset.categoria === categoria) && p.dataset.busca.includes(termo)
      p.hidden = !ok
      if (ok) visiveis++
    })
    vazio.hidden = visiveis > 0
  }
  busca.addEventListener('input', aplicar)
  filtros.forEach((f) => f.addEventListener('click', () => {
    categoria = f.dataset.cat
    filtros.forEach((x) => x.setAttribute('aria-pressed', x === f))
    aplicar()
  }))
}

// Artigo: copiar link
document.querySelector('.copiar')?.addEventListener('click', async (e) => {
  const botao = e.currentTarget
  try {
    await navigator.clipboard.writeText(botao.dataset.url)
    botao.textContent = t('Link copiado!')
  } catch {
    botao.textContent = t('Não foi possível copiar')
  }
  setTimeout(() => { botao.textContent = t('Copiar link') }, 2000)
})
