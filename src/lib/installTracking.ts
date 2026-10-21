type InstallPrompt = Event & {
  prompt: () => Promise<unknown>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
type InstallState = {
  available: boolean
  busy: boolean
  standalone: boolean
  message: string
}
let pending: InstallPrompt | null = null
let started = false
let confirmed = false
let state: InstallState = { available: false, busy: false, standalone: false, message: '' }
const subscribers = new Set<() => void>()
function publish(change: Partial<InstallState>) {
  state = { ...state, ...change }
  subscribers.forEach((listener) => listener())
}
export function getInstallState() {
  return state
}
export function subscribeInstall(listener: () => void) {
  subscribers.add(listener)
  return () => {
    subscribers.delete(listener)
  }
}
export function startInstallTracking() {
  if (started) return
  started = true
  const mode = window.matchMedia('(display-mode: standalone)')
  const sync = () => {
    const standalone =
      mode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    publish({ standalone, available: !standalone && !confirmed && Boolean(pending) })
  }
  sync()
  mode.addEventListener('change', sync)
  window.addEventListener('beforeinstallprompt', (raw) => {
    const event = raw as InstallPrompt
    if (typeof event.prompt !== 'function' || !event.userChoice) return
    if (state.standalone || confirmed || state.busy) return
    event.preventDefault()
    pending = event
    publish({ available: true, message: '' })
  })
  window.addEventListener('appinstalled', () => {
    confirmed = true
    pending = null
    publish({
      available: false,
      busy: false,
      message: 'O navegador confirmou a instalação. Você pode abrir o guia pelo novo ícone.',
    })
  })
}
export async function requestInstall() {
  if (!pending || state.busy || state.standalone || confirmed) return
  const event = pending
  pending = null
  publish({ available: false, busy: true, message: 'Confirme sua escolha na janela do navegador.' })
  try {
    // Must run synchronously from the user's click, before awaiting anything.
    await event.prompt()
    const choice = await event.userChoice
    if (!confirmed)
      publish({
        message:
          choice.outcome === 'accepted'
            ? 'Solicitação aceita. Aguarde a conclusão pelo navegador; a instalação ainda não foi confirmada.'
            : 'Você fechou o convite. Pode continuar usando o guia ou seguir as instruções manuais abaixo.',
      })
  } catch {
    if (!confirmed)
      publish({
        message:
          'Não foi possível abrir o convite. Continue pelo navegador ou siga as instruções manuais abaixo.',
      })
  } finally {
    publish({ busy: false })
  }
}
