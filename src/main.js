import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
  menuBtn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu')
}
menuBtn.addEventListener('click', () => menu(!topo.classList.contains('topo--aberto')))
links.forEach((l) => l.addEventListener('click', () => menu(false)))
document.addEventListener('keydown', (e) => e.key === 'Escape' && menu(false))

// Parallax só no desktop: no celular as colunas empilham e os elementos se sobreporiam
mm.add('(prefers-reduced-motion: no-preference) and (min-width: 860px)', () => {
  // Hero: foto, copa azul e texto em velocidades diferentes
  gsap.to('.hero__foto img', { yPercent: -10, ease: 'none', scrollTrigger: scrub('.hero', 'top top') })
  gsap.to('.hero__foto', { '--py': '90px', ease: 'none', scrollTrigger: scrub('.hero', 'top top') })
  gsap.to('.hero__txt', { y: 70, ease: 'none', scrollTrigger: scrub('.hero', 'top top') })

  // Sobre: a foto desliza dentro da seção
  gsap.fromTo('.sobre__foto img', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: scrub('#sobre') })
})

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Contato: forma azul ao fundo (não sobrepõe conteúdo)
  gsap.fromTo('.contato', { '--py': '-60px' }, { '--py': '80px', ease: 'none', scrollTrigger: scrub('.contato') })

  // Entradas: títulos e cartões sobem em sequência ao aparecer
  const alvos = '.secao h2, .revela, .cred, .infos > div, .preparo li, .faq__lista details'
  gsap.set(alvos, { autoAlpha: 0, y: 32 })
  ScrollTrigger.batch(alvos, {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
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
