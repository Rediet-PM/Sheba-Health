import { useState } from 'react'
import type { LandingNotes } from '../../state/AppStateProvider'

interface LandingScreenProps {
  notes: LandingNotes
  onNoteChange: (field: keyof LandingNotes, value: string) => void
  onGenerate: () => void
  onViewTasks: () => void
}

const TABS: Array<{ id: keyof LandingNotes; label: string; placeholder: string }> = [
  {
    id: 'doctorNote',
    label: "Doctor's Note",
    placeholder: 'Paste or type the physician note that needs utilization review...',
  },
  {
    id: 'referralNote',
    label: 'Referral Note',
    placeholder: 'Paste or type the referral request, supporting clinicals, or faxed documents...',
  },
]

export const LandingScreen = ({ notes, onNoteChange, onGenerate, onViewTasks }: LandingScreenProps) => {
  const [activeTab, setActiveTab] = useState<keyof LandingNotes>('doctorNote')
  const activeValue = notes[activeTab]
  const disableGenerate = !activeValue.trim()

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl font-semibold text-brand">
            eC
          </div>
          <h1 className="text-3xl font-semibold text-slate-800">eviCore Intake Assistant</h1>
          <p className="mt-2 text-sm text-slate-500">
            One clean workspace to launch authorization, eligibility, and denial workflows instantly.
          </p>
        </div>

        <div className="w-full rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-sm font-medium text-slate-500">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-4 rounded-2xl border border-slate-200 bg-white/80 shadow-inner shadow-slate-100 transition focus-within:border-brand">
            <textarea
              value={activeValue}
              onChange={(event) => onNoteChange(activeTab, event.target.value)}
              placeholder={TABS.find((tab) => tab.id === activeTab)?.placeholder}
              className="h-52 w-full resize-none rounded-2xl bg-transparent px-6 py-5 text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="mb-8 flex items-center justify-between text-xs text-slate-400">
            <span>Secure, HIPAA-compliant workspace.</span>
            <button className="font-medium text-brand hover:text-brand-dark transition">Attach documents</button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onGenerate}
              disabled={disableGenerate}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                disableGenerate
                  ? 'cursor-not-allowed bg-brand/30 text-white/80'
                  : 'bg-brand text-white shadow-sm hover:bg-brand-dark'
              }`}
            >
              Generate eviCore Form
            </button>
            <button
              onClick={onViewTasks}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              View Tasks
            </button>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">Need a live demo? Contact us at revcycle@provider.org</p>
      </div>
    </div>
  )
}
