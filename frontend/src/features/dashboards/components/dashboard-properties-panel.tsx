import { useEffect, useState } from 'react';
import { Image, Save, Settings2, Trash2, Type } from 'lucide-react';
import type { DashboardWidget } from '../types/dashboard-studio';

interface DashboardPropertiesPanelProps {
  widget?: DashboardWidget;
  isSaving?: boolean;
  onSave: (changes: {
    title: string;
    visualConfig: Record<string, any>;
  }) => void;
  onDelete?: (widget: DashboardWidget) => void;
}

const inputClass = 'w-full rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-chart-surface)] px-3 py-2 text-sm text-[var(--color-chart-ink)] outline-none transition-all focus:shadow-[3px_3px_0px_0px_var(--color-accent)]';

export function DashboardPropertiesPanel({
  widget,
  isSaving = false,
  onSave,
  onDelete,
}: DashboardPropertiesPanelProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    setTitle(widget?.title ?? '');
    setText(widget?.visualConfig?.markdown ?? widget?.visualConfig?.text ?? '');
    setImageUrl(widget?.visualConfig?.imageUrl ?? '');
  }, [widget]);

  if (!widget) {
    return (
      <aside className="rounded-2xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-widget)] p-5 text-center shadow-[var(--shadow-retro-strong)] lg:sticky lg:top-24 lg:self-start">
        <Settings2 className="mx-auto mb-3 h-6 w-6 text-[var(--color-accent)]" />
        <h3 className="text-sm font-extrabold text-[var(--color-ink)] font-mono">
          Propiedades
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-text)]">
          Selecciona un widget del canvas para editar su título, contenido o estilo básico.
        </p>
      </aside>
    );
  }

  const isTextWidget = widget.type === 'text' || widget.type === 'markdown';
  const isImageWidget = widget.type === 'image';

  return (
    <aside className="rounded-2xl border-2 border-[var(--color-border-strong)] bg-[var(--color-widget)] p-4 shadow-[var(--shadow-retro-strong)] lg:sticky lg:top-24 lg:self-start">
      <div className="mb-4 flex items-center gap-2 border-b-2 border-[var(--color-border-soft)] pb-3">
        <Settings2 className="h-4 w-4 text-[var(--color-accent)]" />
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink)] font-mono">
            Propiedades
          </h3>
          <p className="text-[10px] text-[var(--color-muted-text)]">{widget.type}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
            <Type className="h-3.5 w-3.5" />
            Título
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
            placeholder="Título del widget"
          />
        </div>

        {isTextWidget && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
              Texto / Markdown
            </label>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              className={`${inputClass} resize-y`}
              placeholder="Escribe el insight, contexto o recomendación..."
            />
          </div>
        )}

        {isImageWidget && (
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
              <Image className="h-3.5 w-3.5" />
              URL de imagen
            </label>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        )}

        {!isTextWidget && !isImageWidget && (
          <div className="rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-chart-surface)] p-3 text-xs leading-relaxed text-[var(--color-muted-text)]">
            Este widget conserva su configuración avanzada en el creador de widgets.
          </div>
        )}

        <button
          type="button"
          disabled={isSaving || !title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              visualConfig: {
                ...(widget.visualConfig ?? {}),
                text,
                markdown: text,
                imageUrl,
              },
            })
          }
          className="btn-retro-primary w-full justify-center"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar propiedades'}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(widget)}
            className="btn-retro-secondary w-full justify-center text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar widget
          </button>
        )}
      </div>
    </aside>
  );
}
