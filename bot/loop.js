

export function createLoop(props) {
    let stopped = false
    let timeout = null

    const run = async () => {
        if (stopped || !props.enabled) return

        //   console.log('🟢 [LOOP] Iniciando ejecución del ciclo')

        try {
            //   console.log('👉 [AQUÍ VA TU CÓDIGO]')
            // ==================================================
            // ⬇️⬇️⬇️ COLOCA AQUÍ EL CÓDIGO QUE QUIERES EJECUTAR ⬇️⬇️⬇️
            // ==================================================

            if (props.task) {
                await props.task()
            }

            // ==================================================
            // ⬆️⬆️⬆️ FIN DE TU CÓDIGO ⬆️⬆️⬆️
            // ==================================================
        } catch (err) {
            console.error('🔴 [LOOP] Error ejecutando la tarea:', err)
        }

        //  console.log(`⏱️ [LOOP] Próxima ejecución en ${props.intervalMs} ms`)

        timeout = setTimeout(run, props.intervalMs)
    }

    return {
        start() {
            console.log('▶️ [LOOP] Loop iniciado')
            stopped = false
            run()
        },

        stop() {
            console.log('⏹️ [LOOP] Loop detenido')
            stopped = true
            if (timeout) clearTimeout(timeout)
        },

        update(newProps) {
            console.log('🔁 [LOOP] Props actualizadas:', newProps)
            Object.assign(props, newProps)
        }
    }
}
