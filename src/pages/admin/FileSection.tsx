// Seção de arquivos do formulário: fotos (múltiplas), capa e modelo GLB.
// Fotos persistidas podem ser marcadas para remoção (modifier fotos- no save);
// novas fotos entram como File pendente. Nada é enviado sem salvar o form.

import { ImagePlus, RotateCcw, Trash2, Box } from 'lucide-react'
import { buildFileUrl, type Empreendimento, type PendingFiles } from '@/types/empreendimento'

interface Props {
  record: Empreendimento | null
  pending: PendingFiles
  setPending: (p: PendingFiles) => void
  removeFotos: string[]
  setRemoveFotos: (names: string[]) => void
}

export default function FileSection({
  record,
  pending,
  setPending,
  removeFotos,
  setRemoveFotos,
}: Props) {
  function onFotosPick(list: FileList | null) {
    if (!list) return
    setPending({ ...pending, fotos: [...pending.fotos, ...Array.from(list)] })
  }

  function toggleRemove(name: string) {
    setRemoveFotos(
      removeFotos.includes(name) ? removeFotos.filter((n) => n !== name) : [...removeFotos, name],
    )
  }

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-xs text-slate-400 tracking-wide">Fotos (múltiplas)</legend>
        {record && record.fotos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2" role="list">
            {record.fotos.map((name) => {
              const marked = removeFotos.includes(name)
              return (
                <li
                  key={name}
                  className={`relative border rounded overflow-hidden ${marked ? 'border-red-500/60 opacity-50' : 'border-slate-800'}`}
                >
                  <img
                    src={buildFileUrl(record, name)}
                    alt={`Foto ${name}`}
                    className="w-full h-16 object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => toggleRemove(name)}
                    aria-label={marked ? `Cancelar remoção de ${name}` : `Remover foto ${name}`}
                    className="absolute top-1 right-1 p-1 rounded bg-slate-950/80 text-slate-300 hover:text-red-400"
                  >
                    {marked ? (
                      <RotateCcw className="w-3 h-3" aria-hidden />
                    ) : (
                      <Trash2 className="w-3 h-3" aria-hidden />
                    )}
                  </button>
                  {marked && (
                    <span className="absolute bottom-0 inset-x-0 bg-red-500/80 text-[9px] text-white text-center py-0.5">
                      será removida ao salvar
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {pending.fotos.length > 0 && (
          <ul className="grid grid-cols-3 gap-2" role="list">
            {pending.fotos.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="relative border border-amber-400/40 rounded bg-slate-900/60 h-16 flex items-center justify-center px-1"
              >
                <span className="text-[10px] text-amber-200/90 truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPending({ ...pending, fotos: pending.fotos.filter((_, j) => j !== i) })
                  }
                  aria-label={`Descartar nova foto ${f.name}`}
                  className="absolute top-1 right-1 p-1 rounded bg-slate-950/80 text-slate-300 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="flex items-center justify-center gap-2 border border-dashed border-slate-700 rounded-md py-3 text-xs text-slate-400 hover:border-amber-400/50 hover:text-amber-300 cursor-pointer">
          <ImagePlus className="w-4 h-4" aria-hidden />
          Adicionar fotos (JPG/PNG/WebP)
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              onFotosPick(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <fieldset className="space-y-2">
          <legend className="text-xs text-slate-400 tracking-wide">Capa</legend>
          {record?.capa && !removeFotos.includes(record.capa) && (
            <p className="text-[11px] text-slate-500 truncate">atual: {record.capa}</p>
          )}
          <label className="flex items-center justify-center gap-2 border border-dashed border-slate-700 rounded-md py-3 text-xs text-slate-400 hover:border-amber-400/50 hover:text-amber-300 cursor-pointer">
            <ImagePlus className="w-4 h-4" aria-hidden />
            {pending.capa ? pending.capa.name : 'Escolher capa'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setPending({ ...pending, capa: f })
                e.target.value = ''
              }}
            />
          </label>
          {pending.capa && (
            <button
              type="button"
              onClick={() => setPending({ ...pending, capa: null })}
              className="text-[11px] text-slate-400 hover:text-red-400"
            >
              descartar capa escolhida
            </button>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs text-slate-400 tracking-wide">Modelo 3D (GLB)</legend>
          {record?.modelo_glb && (
            <p className="text-[11px] text-slate-500 truncate">atual: {record.modelo_glb}</p>
          )}
          <label className="flex items-center justify-center gap-2 border border-dashed border-slate-700 rounded-md py-3 text-xs text-slate-400 hover:border-amber-400/50 hover:text-amber-300 cursor-pointer">
            <Box className="w-4 h-4" aria-hidden />
            {pending.modelo_glb ? pending.modelo_glb.name : 'Escolher arquivo .glb'}
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setPending({ ...pending, modelo_glb: f })
                e.target.value = ''
              }}
            />
          </label>
          {pending.modelo_glb && (
            <button
              type="button"
              onClick={() => setPending({ ...pending, modelo_glb: null })}
              className="text-[11px] text-slate-400 hover:text-red-400"
            >
              descartar GLB escolhido
            </button>
          )}
        </fieldset>
      </div>
    </div>
  )
}
