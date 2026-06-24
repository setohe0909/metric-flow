import React, { useState } from 'react';
import {
  useSchedules,
  useScheduleHistory,
} from '../hooks/use-schedules';
import type { Schedule } from '../hooks/use-schedules';
import {
  X,
  Plus,
  Trash2,
  Clock,
  Mail,
  CheckCircle,
  AlertTriangle,
  History,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Calendar,
} from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryId: string;
  queryName: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  queryId,
  queryName,
}: ScheduleModalProps) {
  const {
    schedules,
    isLoadingSchedules,
    createSchedule,
    isCreating,
    updateSchedule,
    deleteSchedule,
  } = useSchedules(queryId);

  // Estados de Formulario
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [recipients, setRecipients] = useState('');
  const [preset, setPreset] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [subject, setSubject] = useState('');
  const [format, setFormat] = useState<'csv' | 'html' | 'json'>('csv');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de Historial
  const [activeHistoryScheduleId, setActiveHistoryScheduleId] = useState<string | null>(null);
  const { history, isLoadingHistory } = useScheduleHistory(activeHistoryScheduleId);

  if (!isOpen) return null;

  const handlePresetChange = (p: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setPreset(p);
    if (p === 'daily') setCronExpression('0 9 * * *');
    else if (p === 'weekly') setCronExpression('0 9 * * 1');
    else if (p === 'monthly') setCronExpression('0 9 1 * *');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailList = recipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      setErrorMsg('Debe ingresar al menos un correo electrónico.');
      return;
    }

    try {
      await createSchedule({
        queryId,
        name,
        cronExpression,
        recipients: emailList,
        subject: subject || undefined,
        format,
      });
      setIsAdding(false);
      setName('');
      setRecipients('');
      setSubject('');
      setPreset('daily');
      setCronExpression('0 9 * * *');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al guardar la programación.'
      );
    }
  };

  const handleToggle = async (schedule: Schedule) => {
    try {
      await updateSchedule({
        id: schedule.id,
        enabled: !schedule.enabled,
      });
    } catch (err) {
      alert('Error al cambiar el estado de la programación.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la programación "${name}"?`)) {
      try {
        await deleteSchedule(id);
        if (activeHistoryScheduleId === id) {
          setActiveHistoryScheduleId(null);
        }
      } catch (err) {
        alert('Error al eliminar la programación.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#23251d]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="bg-[#eeefe9] border-2 border-[#23251d] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[8px_8px_0px_0px_#23251d] overflow-hidden">
        {/* OS Header Bar */}
        <div className="bg-[#e4e5de] border-b-2 border-[#23251d] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full window-circle-red" />
            <div className="w-3.5 h-3.5 rounded-full window-circle-yellow" />
            <div className="w-3.5 h-3.5 rounded-full window-circle-green" />
          </div>
          <span className="text-xs font-bold text-[#23251d] font-mono">
            scheduler_config.sh --query="{queryName}"
          </span>
          <button onClick={onClose} className="text-[#4d4f46] hover:text-[#23251d]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Split view (Schedules list vs Form/History) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Col 1: Schedules List */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b-2 border-[#23251d]/10 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#23251d] font-mono flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#f7a501]" /> Programaciones Activas
              </h3>
              {!isAdding && !activeHistoryScheduleId && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="btn-retro-primary font-mono text-[10px] py-1 px-2.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Nueva
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isLoadingSchedules ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-6 w-6 text-[#f7a501]" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-[#23251d] rounded-xl bg-white/50 font-mono text-xs text-[#4d4f46]">
                  No hay envíos programados para esta consulta.
                </div>
              ) : (
                schedules.map((sch) => {
                  const isActiveHistory = activeHistoryScheduleId === sch.id;
                  return (
                    <div
                      key={sch.id}
                      className={`border-2 border-[#23251d] rounded-xl p-4 bg-white shadow-[3px_3px_0px_0px_#23251d] transition-all font-mono text-xs flex flex-col justify-between gap-3 ${
                        isActiveHistory ? 'ring-2 ring-[#f7a501] bg-[#f7a501]/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-[#23251d]">{sch.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Cron: <code>{sch.cronExpression}</code>
                          </p>
                          <div className="text-[10px] text-[#4d4f46] mt-2 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-[#f7a501]" /> {sch.recipients.join(', ')}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileSpreadsheet className="h-3 w-3 text-[#f7a501]" /> Formato:{' '}
                              <span className="font-bold uppercase text-[9px] px-1 bg-[#eeefe9] border border-[#23251d] rounded">
                                {sch.format}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle Active/Inactive */}
                          <button
                            onClick={() => handleToggle(sch)}
                            className="text-[#23251d] hover:text-[#f7a501]"
                            title={sch.enabled ? 'Desactivar' : 'Activar'}
                          >
                            {sch.enabled ? (
                              <ToggleRight className="h-6 w-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                            )}
                          </button>
                          
                          {/* Historial */}
                          <button
                            onClick={() => {
                              setIsAdding(false);
                              setActiveHistoryScheduleId(
                                activeHistoryScheduleId === sch.id ? null : sch.id
                              );
                            }}
                            className={`p-1.5 rounded border-2 transition-all hover:bg-slate-100 ${
                              isActiveHistory
                                ? 'bg-[#f7a501]/20 border-[#f7a501] text-[#23251d]'
                                : 'bg-white border-transparent text-[#4d4f46]'
                            }`}
                            title="Ver historial de envíos"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(sch.id, sch.name)}
                            className="p-1.5 rounded border-2 border-transparent text-[#4d4f46] hover:text-red-500 hover:bg-red-50 hover:border-[#23251d] transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {sch.nextRunAt && sch.enabled && (
                        <div className="pt-2 border-t border-[#23251d]/10 text-[9px] text-[#4d4f46] flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#f7a501]" /> Próximo envío:{' '}
                          <strong>{new Date(sch.nextRunAt).toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Col 2: Action Panel (Add Form / History details) */}
          <div className="w-full lg:w-96 border-t-2 lg:border-t-0 lg:border-l-2 border-[#23251d]/10 pt-6 lg:pt-0 lg:pl-6 flex flex-col">
            
            {/* Action: Add Schedule */}
            {isAdding && (
              <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between font-mono text-xs space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#23251d]/10 pb-2">
                    <h3 className="font-extrabold text-[#23251d] uppercase text-[11px]">Nueva Programación</h3>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-[#4d4f46] hover:text-[#23251d]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Nombre Descriptivo</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] focus:outline-none"
                      placeholder="ej. Reporte semanal de ventas"
                    />
                  </div>

                  {/* Destinatarios */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Destinatarios (correos separados por coma)</label>
                    <textarea
                      required
                      rows={2}
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] focus:outline-none"
                      placeholder="admin@empresa.com, ceo@empresa.com"
                    />
                  </div>

                  {/* Asunto (Opcional) */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Asunto del correo (opcional)</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] focus:outline-none"
                      placeholder="ej. Ventas del canal - MetricFlow"
                    />
                  </div>

                  {/* Presets & Cron */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Frecuencia</label>
                      <select
                        value={preset}
                        onChange={(e) => handlePresetChange(e.target.value as any)}
                        className="w-full px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white text-[#23251d] focus:outline-none cursor-pointer"
                      >
                        <option value="daily">Diario (9:00 AM)</option>
                        <option value="weekly">Semanal (Lunes 9:00 AM)</option>
                        <option value="monthly">Mensual (1º de mes 9:00 AM)</option>
                        <option value="custom">Cron personalizado</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Expresión Cron</label>
                      <input
                        type="text"
                        required
                        disabled={preset !== 'custom'}
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-[#23251d] rounded-xl bg-white disabled:bg-[#eeefe9] text-[#23251d] focus:outline-none font-bold"
                        placeholder="0 9 * * *"
                      />
                    </div>
                  </div>

                  {/* Formato */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-[#4d4f46] uppercase">Formato de Reporte</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['csv', 'html', 'json'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setFormat(fmt)}
                          className={`py-2 px-3 rounded-lg border-2 text-center font-bold capitalize transition-all shadow-[1px_1px_0px_0px_#23251d] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none ${
                            format === fmt
                              ? 'border-[#23251d] bg-[#f7a501] text-[#23251d]'
                              : 'border-[#23251d] bg-white text-[#4d4f46] hover:bg-[#f4f4f0]'
                          }`}
                        >
                          {fmt === 'csv' ? 'CSV Adjunto' : fmt === 'html' ? 'Tabla HTML' : 'JSON Adjunto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="rounded-lg p-3 bg-red-50 border border-[#23251d] text-red-800 flex items-center gap-2 text-[10px] font-bold">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#23251d]/10 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="btn-retro-secondary py-1.5 px-3"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-retro-primary py-1.5 px-3 flex items-center gap-1"
                  >
                    {isCreating ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      'Guardar'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Action: View History Logs */}
            {activeHistoryScheduleId && (
              <div className="flex-1 flex flex-col font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#23251d]/10 pb-2 mb-4 flex-shrink-0">
                  <h3 className="font-extrabold text-[#23251d] uppercase text-[11px] flex items-center gap-1">
                    <History className="h-4 w-4" /> Historial de Envíos
                  </h3>
                  <button
                    onClick={() => setActiveHistoryScheduleId(null)}
                    className="text-[#4d4f46] hover:text-[#23251d]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin h-6 w-6 text-[#f7a501]" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 text-[#4d4f46] text-[10px] italic">
                      No hay registros de envíos anteriores.
                    </div>
                  ) : (
                    history.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 border-2 border-[#23251d] rounded-xl flex flex-col gap-1.5 bg-white shadow-[2px_2px_0px_0px_#23251d]`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.executedAt).toLocaleString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 border border-[#23251d] rounded text-[9px] font-bold uppercase ${
                              log.status === 'success'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {log.status === 'success' ? 'Éxito' : 'Fallo'}
                          </span>
                        </div>

                        {log.status === 'success' ? (
                          <div className="text-[10px] text-[#4d4f46] flex items-start gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>Enviado a: {log.recipientsSent.join(', ')}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-red-800 flex items-start gap-1 bg-red-50/50 p-2 border border-red-200 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="break-all">{log.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Default display: Instructions */}
            {!isAdding && !activeHistoryScheduleId && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/30 border-2 border-dashed border-[#23251d]/20 rounded-2xl font-mono text-xs text-[#4d4f46] leading-relaxed">
                <Clock className="h-10 w-10 text-[#f7a501]/40 mb-3" />
                <p className="font-extrabold text-[#23251d]">Configuración de Reportes</p>
                <p className="text-[10px] mt-2">
                  Puedes automatizar la ejecución de esta consulta SQL y programar su envío de resultados por correo electrónico en formato CSV, JSON o tabla HTML.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="btn-retro-primary mt-6 text-[10px]"
                >
                  <Plus className="h-3.5 w-3.5" /> Crear Programación
                </button>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </div>
  );
}
