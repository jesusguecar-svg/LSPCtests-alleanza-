'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type FieldType =
  | 'text'
  | 'date'
  | 'datetime'
  | 'tel'
  | 'email'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'info';

interface Choice {
  label: string;
  value: string;
}

interface Field {
  id: string;
  type: FieldType;
  question: string;
  description?: string;
  required?: boolean;
  choices?: Choice[];
  allowOther?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   Form definition
───────────────────────────────────────────────────────────── */
const FIELDS: Field[] = [
  // ── Section 1 ──────────────────────────────────────────────
  {
    id: 'intro',
    type: 'info',
    question: 'PROGRAMA PILOTO DE SALUD PREVENTIVA',
    description:
      'Autoevaluación · Marque las opciones que correspondan.\n\nEsta encuesta ayuda a orientar la evaluación; no sustituye una consulta médica.\n\nMantenga la información del paciente de forma confidencial.',
  },
  {
    id: 'nombre',
    type: 'text',
    question: '¿Cuál es su nombre completo?',
    description: 'Sección 1 — Información del paciente',
    required: true,
  },
  {
    id: 'fecha',
    type: 'date',
    question: '¿Cuál es la fecha de hoy?',
    required: true,
  },
  {
    id: 'fechaNacimiento',
    type: 'date',
    question: '¿Cuál es su fecha de nacimiento?',
    required: true,
  },
  {
    id: 'telefono',
    type: 'tel',
    question: '¿Cuál es su número de teléfono?',
    required: true,
  },
  {
    id: 'email',
    type: 'email',
    question: '¿Cuál es su correo electrónico?',
  },
  {
    id: 'idioma',
    type: 'text',
    question: '¿Cuál es su idioma preferido?',
  },
  {
    id: 'direccion',
    type: 'textarea',
    question: '¿Cuál es su dirección?',
    description: 'Calle, ciudad, estado, código postal',
  },
  {
    id: 'seguro',
    type: 'radio',
    question: '¿Qué tipo de seguro de salud tiene?',
    required: true,
    choices: [
      { label: 'Del trabajo / empleador', value: 'trabajo' },
      { label: 'Medicare', value: 'medicare' },
      { label: 'Medicaid', value: 'medicaid' },
      { label: 'Obamacare / Mercado de Salud', value: 'obamacare' },
      { label: 'Privado', value: 'privado' },
      { label: 'Sin seguro', value: 'sin_seguro' },
    ],
    allowOther: true,
  },

  // ── Section 2 ──────────────────────────────────────────────
  {
    id: 'sintomas',
    type: 'checkbox',
    question: '¿Qué área resume mejor sus síntomas o necesidad de evaluación?',
    description: 'Sección 2 — Autoevaluación · Puede seleccionar varias opciones',
    choices: [
      {
        label: 'Panel Respiratorio (Tos persistente, fiebre, congestión nasal)',
        value: 'respiratorio',
      },
      {
        label: 'Infección Urinaria (Ardor al orinar, urgencia, dolor pélvico)',
        value: 'urinaria',
      },
      {
        label: 'ITS (Secreción inusual, llagas, picazón genital)',
        value: 'its',
      },
      {
        label: 'Vaginitis (Picazón, flujo anormal, olor inusual)',
        value: 'vaginitis',
      },
      {
        label: 'Infección de Heridas (Pus, enrojecimiento, no cicatriza)',
        value: 'heridas',
      },
      {
        label: 'Toxicología de Orina (Monitoreo de medicamentos y sustancias)',
        value: 'toxicologia',
      },
      {
        label: 'Hongos en Uñas (Uñas amarillas, quebradizas, mal olor)',
        value: 'hongos',
      },
    ],
  },

  // ── Section 3 ──────────────────────────────────────────────
  {
    id: 'emergencia',
    type: 'info',
    question: '⚠️ Importante — Señales de emergencia',
    description:
      'Busque atención de emergencia o llame al 911 si presenta:\n\n• Dificultad severa para respirar\n• Dolor fuerte en el pecho\n• Labios o cara azulada\n• Confusión o desmayo\n• Sangrado abundante\n• Fiebre muy alta persistente\n• Dolor intenso\n\nEsta encuesta es informativa. El médico de la video llamada decidirá si corresponde realizar una prueba y qué muestra se debe tomar.',
  },

  // ── Section 4 ──────────────────────────────────────────────
  {
    id: 'confirmacion',
    type: 'checkbox',
    question: 'Por favor, confirme lo siguiente:',
    description: 'Sección 4 — Confirmación sobre muestra y prueba',
    required: true,
    choices: [
      {
        label: 'Entiendo que se tomará la(s) muestra(s) que indique el médico.',
        value: 'muestra',
      },
      {
        label:
          'Entiendo que las pruebas buscan detectar virus, bacterias, infecciones o sustancias según el tipo de prueba solicitada.',
        value: 'pruebas',
      },
    ],
  },

  // ── Section 5 ──────────────────────────────────────────────
  {
    id: 'tipoMuestra',
    type: 'checkbox',
    question: 'Marque la muestra solicitada por el médico de la video llamada:',
    description: 'Sección 5 — Tipo de muestra solicitada',
    choices: [
      { label: 'Hisopo respiratorio', value: 'respiratorio' },
      { label: 'Orina', value: 'orina' },
      { label: 'Hisopo / muestra genital', value: 'genital' },
      { label: 'Muestra de herida', value: 'herida' },
      { label: 'Toxicología en orina', value: 'toxicologia' },
      { label: 'Hongos en uñas', value: 'hongos' },
    ],
    allowOther: true,
  },
  {
    id: 'pruebaSolicitada',
    type: 'text',
    question: '¿Cuál es la prueba solicitada?',
  },
  {
    id: 'fechaPrueba',
    type: 'datetime',
    question: '¿Cuál es la fecha y hora de la prueba solicitada?',
  },

  // ── Section 6 ──────────────────────────────────────────────
  {
    id: 'firma',
    type: 'text',
    question: 'Firma electrónica del paciente',
    description: 'Sección 6 — Confirmación final · Escriba su nombre completo como firma electrónica',
  },
  {
    id: 'fechaFirma',
    type: 'date',
    question: '¿Cuál es la fecha de su firma?',
  },
  {
    id: 'personalNombre',
    type: 'text',
    question: 'Nombre del personal que asistió:',
    description: 'Uso interno',
  },
  {
    id: 'ubicacion',
    type: 'text',
    question: 'Ubicación:',
    description: 'Uso interno',
  },
  {
    id: 'observaciones',
    type: 'textarea',
    question: 'Observaciones internas:',
    description: 'Uso interno',
  },
];

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
type Answers = Record<string, string | string[]>;

function isAnswered(field: Field, answers: Answers): boolean {
  if (!field.required) return true;
  const val = answers[field.id];
  if (Array.isArray(val)) return val.length > 0;
  return typeof val === 'string' && val.trim() !== '';
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="absolute right-4 top-3 text-xs text-white/70 font-medium">
        {current + 1} / {total}
      </div>
    </div>
  );
}

function InfoSlide({ field, onNext }: { field: Field; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
        {field.question}
      </h1>
      {field.description && (
        <p className="text-white/80 text-lg whitespace-pre-line leading-relaxed">
          {field.description}
        </p>
      )}
      <button
        onClick={onNext}
        className="self-start mt-4 px-8 py-3 bg-white text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-colors text-lg shadow"
      >
        Comenzar →
      </button>
    </div>
  );
}

function TextInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const Tag = field.type === 'textarea' ? 'textarea' : 'input';
  const props =
    field.type === 'textarea'
      ? { rows: 4 }
      : { type: field.type === 'text' ? 'text' : field.type };

  return (
    <Tag
      {...(props as Record<string, unknown>)}
      value={value}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
      placeholder="Escriba aquí…"
      className="w-full bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-white text-xl placeholder-white/40 py-2 resize-none transition-colors"
      autoFocus
    />
  );
}

function RadioInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const [otherText, setOtherText] = useState('');
  const isOther = value === '__other__';

  return (
    <div className="flex flex-col gap-3 w-full">
      {field.choices?.map((c, i) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
            value === c.value
              ? 'border-white bg-white/20 text-white font-semibold'
              : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
          }`}
        >
          <span className="w-7 h-7 rounded-md border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
            {String.fromCharCode(65 + i)}
          </span>
          {c.label}
        </button>
      ))}
      {field.allowOther && (
        <>
          <button
            onClick={() => onChange('__other__')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
              isOther
                ? 'border-white bg-white/20 text-white font-semibold'
                : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
            }`}
          >
            <span className="w-7 h-7 rounded-md border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
              {String.fromCharCode(65 + (field.choices?.length ?? 0))}
            </span>
            Otro
          </button>
          {isOther && (
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e: { target: { value: string } }) => {
                setOtherText(e.target.value);
                onChange('__other__:' + e.target.value);
              }}
              placeholder="Especifique…"
              className="mt-1 bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-white text-lg placeholder-white/40 py-1 transition-colors"
            />
          )}
        </>
      )}
    </div>
  );
}

function CheckboxInput({
  field,
  values,
  onChange,
}: {
  field: Field;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [otherText, setOtherText] = useState('');

  function toggle(val: string) {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  }

  const hasOther = values.some((v) => v.startsWith('__other__'));

  return (
    <div className="flex flex-col gap-3 w-full">
      {field.choices?.map((c, i) => {
        const checked = values.includes(c.value);
        return (
          <button
            key={c.value}
            onClick={() => toggle(c.value)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
              checked
                ? 'border-white bg-white/20 text-white font-semibold'
                : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
            }`}
          >
            <span
              className={`w-6 h-6 rounded border-2 border-current flex items-center justify-center shrink-0 transition-colors ${
                checked ? 'bg-white' : ''
              }`}
            >
              {checked && <span className="text-brand-600 text-sm font-bold">✓</span>}
            </span>
            <span className="text-sm md:text-base">{c.label}</span>
          </button>
        );
      })}
      {field.allowOther && (
        <>
          <button
            onClick={() => {
              if (hasOther) {
                onChange(values.filter((v) => !v.startsWith('__other__')));
              } else {
                onChange([...values, '__other__:']);
              }
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
              hasOther
                ? 'border-white bg-white/20 text-white font-semibold'
                : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
            }`}
          >
            <span
              className={`w-6 h-6 rounded border-2 border-current flex items-center justify-center shrink-0 ${
                hasOther ? 'bg-white' : ''
              }`}
            >
              {hasOther && <span className="text-brand-600 text-sm font-bold">✓</span>}
            </span>
            Otro
          </button>
          {hasOther && (
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e: { target: { value: string } }) => {
                setOtherText(e.target.value);
                const without = values.filter((v) => !v.startsWith('__other__'));
                onChange([...without, '__other__:' + e.target.value]);
              }}
              placeholder="Especifique…"
              className="mt-1 bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-white text-lg placeholder-white/40 py-1 transition-colors"
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Thank-you screen
───────────────────────────────────────────────────────────── */
function ThankYou() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center max-w-lg mx-auto">
      <div className="text-6xl">✅</div>
      <h1 className="text-3xl font-bold text-white">¡Gracias!</h1>
      <p className="text-white/80 text-lg">
        Su autoevaluación ha sido registrada. El personal médico revisará sus respuestas antes
        de su video llamada.
      </p>
      <p className="text-white/60 text-sm">
        Recuerde: si presenta síntomas de emergencia, llame al <strong className="text-white">911</strong>.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function CuestionarioPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [animating, setAnimating] = useState(false);

  const field = FIELDS[step];
  const isLast = step === FIELDS.length - 1;
  const canContinue = isAnswered(field, answers);

  const getValue = (id: string): string =>
    (answers[id] as string | undefined) ?? '';

  const getValues = (id: string): string[] =>
    (answers[id] as string[] | undefined) ?? [];

  const setAnswer = (id: string, val: string | string[]) =>
    setAnswers((prev: Answers) => ({ ...prev, [id]: val }));

  const transition = useCallback(
    (to: number, dir: 'forward' | 'back') => {
      if (animating) return;
      setAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setStep(to);
        setAnimating(false);
      }, 280);
    },
    [animating],
  );

  const goNext = useCallback(() => {
    if (!canContinue && field.type !== 'info') return;
    if (isLast) {
      setSubmitted(true);
      return;
    }
    transition(step + 1, 'forward');
  }, [canContinue, field.type, isLast, step, transition]);

  const goBack = useCallback(() => {
    if (step === 0) return;
    transition(step - 1, 'back');
  }, [step, transition]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        if (e.key === 'Enter' && tag !== 'TEXTAREA') {
          e.preventDefault();
          goNext();
        }
        return;
      }
      if (e.key === 'Enter') goNext();
      if (e.key === 'Backspace') goBack();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goBack]);

  // Slide animation classes
  const slideIn =
    direction === 'forward'
      ? 'animate-slide-in-up'
      : 'animate-slide-in-down';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-700 flex flex-col">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-48px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up  { animation: slideInUp  0.28s ease-out both; }
        .animate-slide-in-down { animation: slideInDown 0.28s ease-out both; }
      `}</style>

      {!submitted && <ProgressBar current={step} total={FIELDS.length} />}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        {submitted ? (
          <ThankYou />
        ) : (
          <div key={step} className={`w-full max-w-2xl ${slideIn}`}>
            {/* Question label */}
            {field.type !== 'info' && field.description && (
              <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">
                {field.description}
              </p>
            )}

            {/* Question */}
            {field.type !== 'info' && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
                {field.question}
                {field.required && <span className="text-white/50 ml-1">*</span>}
              </h2>
            )}

            {/* Input */}
            {field.type === 'info' && (
              <InfoSlide field={field} onNext={goNext} />
            )}

            {(field.type === 'text' ||
              field.type === 'email' ||
              field.type === 'tel' ||
              field.type === 'date' ||
              field.type === 'datetime' ||
              field.type === 'textarea') && (
              <TextInput
                field={field}
                value={getValue(field.id)}
                onChange={(v) => setAnswer(field.id, v)}
              />
            )}

            {field.type === 'radio' && (
              <RadioInput
                field={field}
                value={getValue(field.id)}
                onChange={(v) => setAnswer(field.id, v)}
              />
            )}

            {field.type === 'checkbox' && (
              <CheckboxInput
                field={field}
                values={getValues(field.id)}
                onChange={(v) => setAnswer(field.id, v)}
              />
            )}

            {/* Controls */}
            {field.type !== 'info' && (
              <div className="flex items-center gap-4 mt-10">
                <button
                  onClick={goNext}
                  disabled={!canContinue}
                  className="px-8 py-3 bg-white text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg shadow"
                >
                  {isLast ? 'Enviar' : 'Continuar →'}
                </button>

                {!field.required && !isLast && (
                  <button
                    onClick={goNext}
                    className="text-white/60 hover:text-white text-sm underline underline-offset-2 transition-colors"
                  >
                    Omitir
                  </button>
                )}
              </div>
            )}

            {/* Keyboard hint */}
            {field.type !== 'info' && (
              <p className="mt-4 text-white/40 text-xs">
                Presione <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">Enter ↵</kbd> para continuar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Back button */}
      {!submitted && step > 0 && field.type !== 'info' && (
        <div className="fixed bottom-6 right-6 flex gap-2">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-lg"
            title="Anterior"
          >
            ↑
          </button>
          <button
            onClick={goNext}
            disabled={!canContinue}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors disabled:opacity-30 text-lg"
            title="Siguiente"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}
