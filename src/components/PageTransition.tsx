import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/** Fades between routes. The outlet is captured per key so the outgoing page keeps its content. */
export function PageTransition({ scrollTop = true }: { scrollTop?: boolean }) {
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reduce = useReducedMotion()

  useEffect(() => {
    if (scrollTop) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, scrollTop])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
