'use client';

import { useState, useRef, useCallback } from 'react';
import { DonorInput } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Transcript parser — extracts field values from natural language
// ---------------------------------------------------------------------------

function parseTranscript(text: string): Partial<DonorInput> {
  const t = text.toLowerCase();
  const result: Partial<DonorInput> = {};

  // Age
  const ageMatch = t.match(/(?:age|aged?)\s*(?:is|of)?\s*(\d{1,2})/);
  if (ageMatch) result.donor_age = Number(ageMatch[1]);

  // Sex
  if (/\bmale\b/.test(t) && !/\bfemale\b/.test(t)) result.donor_sex = 'male';
  if (/\bfemale\b/.test(t)) result.donor_sex = 'female';

  // Height
  const heightCmMatch = t.match(/(?:height|tall)\s*(?:is|of)?\s*(\d{2,3})\s*(?:cm|centimeters?)/);
  if (heightCmMatch) result.donor_height_cm = Number(heightCmMatch[1]);
  const heightFtMatch = t.match(/(\d)'?\s*(?:foot|feet|ft)?\s*(\d{1,2})?\s*(?:inches?|in)?/);
  if (heightFtMatch && !heightCmMatch) {
    const ft = Number(heightFtMatch[1]);
    const inches = Number(heightFtMatch[2] || 0);
    result.donor_height_cm = Math.round((ft * 12 + inches) * 2.54);
  }

  // Weight
  const weightKgMatch = t.match(/(?:weight|weighs?)\s*(?:is|of)?\s*([\d.]+)\s*(?:kg|kilograms?)/);
  if (weightKgMatch) result.donor_weight_kg = Number(weightKgMatch[1]);
  const weightLbsMatch = t.match(/(?:weight|weighs?)\s*(?:is|of)?\s*([\d.]+)\s*(?:lbs?|pounds?)/);
  if (weightLbsMatch && !weightKgMatch) result.donor_weight_kg = Math.round(Number(weightLbsMatch[1]) / 2.205 * 10) / 10;

  // Ethnicity
  if (/\bwhite\b|caucasian/.test(t)) result.donor_ethnicity = 'White';
  if (/\bblack\b|african/.test(t)) result.donor_ethnicity = 'Black';
  if (/\bhispanic\b|latino/.test(t)) result.donor_ethnicity = 'Hispanic';
  if (/\basian\b/.test(t)) result.donor_ethnicity = 'Asian';

  // Cause of death
  if (/\bcva\b|cerebrovascular|stroke/.test(t)) result.donor_cause_of_death = 'CVA';
  if (/\btrauma\b/.test(t)) result.donor_cause_of_death = 'Trauma';
  if (/\banoxia\b|anoxic/.test(t)) result.donor_cause_of_death = 'Anoxia';

  // Creatinine
  const crMatch = t.match(/(?:creatinine|cr)\s*(?:is|of)?\s*([\d.]+)/);
  if (crMatch) result.donor_serum_creatinine = Number(crMatch[1]);

  // Boolean flags
  if (/\bhypertension\b|\bhtn\b/.test(t)) result.donor_hypertension = !/\bno\s+(?:hypertension|htn)\b/.test(t);
  if (/\bdiabetes\b|\bdiabetic\b/.test(t)) result.donor_diabetes = !/\bno\s+diabetes\b|\bnon.?diabetic\b/.test(t);
  if (/\bhcv\b|hepatitis c/.test(t)) result.donor_hcv = !/\bno\s+hcv\b|\bnegative\b/.test(t);
  if (/\bdcd\b/.test(t)) result.donor_dcd = !/\bnot?\s+dcd\b/.test(t);
  if (/\bdialysis\b/.test(t)) result.donor_on_dialysis = !/\bno\s+dialysis\b|\bnot\s+on\s+dialysis\b/.test(t);

  // Biopsy GS
  const biopsyMatch = t.match(/(?:biopsy|glomerulosclerosis|gs)\s*(?:is|of|at)?\s*(\d{1,2})%?/);
  if (biopsyMatch) result.donor_biopsy_glomerulosclerosis = Number(biopsyMatch[1]);

  // Pump
  const pumpFlowMatch = t.match(/(?:pump\s*flow|flow)\s*(?:is|of)?\s*(\d{2,3})/);
  if (pumpFlowMatch) result.donor_pump_flow = Number(pumpFlowMatch[1]);
  const pumpResMatch = t.match(/(?:pump\s*resist(?:ance)?|resist(?:ance)?)\s*(?:is|of)?\s*([\d.]+)/);
  if (pumpResMatch) result.donor_pump_resistance = Number(pumpResMatch[1]);

  // CIT
  const citMatch = t.match(/(?:cold\s*ischemia|cit|cold\s*time)\s*(?:is|of)?\s*(\d{1,3})\s*(?:hours?|hrs?|h)?/);
  if (citMatch) result.cold_ischemia_hours = Number(citMatch[1]);

  // HbA1c
  const hba1cMatch = t.match(/(?:hba1c|a1c|hemoglobin\s*a1c)\s*(?:is|of)?\s*([\d.]+)/);
  if (hba1cMatch) result.donor_hba1c = Number(hba1cMatch[1]);

  // WIT
  const witMatch = t.match(/(?:warm\s*ischemia|wit|warm\s*time)\s*(?:is|of)?\s*(\d{1,3})\s*(?:minutes?|min|m)?/);
  if (witMatch) result.warm_ischemic_time_min = Number(witMatch[1]);

  // Kidney size
  const sizeLeftMatch = t.match(/(?:left\s*kidney)\s*(?:is|size)?\s*([\d.]+)\s*(?:cm)?/);
  if (sizeLeftMatch) result.donor_kidney_size_left = Number(sizeLeftMatch[1]);
  const sizeRightMatch = t.match(/(?:right\s*kidney)\s*(?:is|size)?\s*([\d.]+)\s*(?:cm)?/);
  if (sizeRightMatch) result.donor_kidney_size_right = Number(sizeRightMatch[1]);

  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  onParsedFields: (fields: Partial<DonorInput>) => void;
}

export default function VoiceInput({ onParsedFields }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedFields, setParsedFields] = useState<Partial<DonorInput>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);

  // Check for Web Speech API support
  const hasSpeechAPI = typeof window !== 'undefined' && ('SpeechRecognition' in (window as any) || 'webkitSpeechRecognition' in (window as any));

  const startRecording = useCallback(() => {
    if (!hasSpeechAPI) {
      setUseTextFallback(true);
      setShowModal(true);
      return;
    }

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setUseTextFallback(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setShowModal(true);
    setTranscript('');
    setShowConfirm(false);
  }, [hasSpeechAPI]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    const parsed = parseTranscript(transcript);
    setParsedFields(parsed);
    setShowConfirm(true);
  }, [transcript]);

  const handleTextSubmit = useCallback(() => {
    const parsed = parseTranscript(textInput);
    setParsedFields(parsed);
    setTranscript(textInput);
    setShowConfirm(true);
  }, [textInput]);

  const handleConfirm = useCallback(() => {
    onParsedFields(parsedFields);
    setShowModal(false);
    setShowConfirm(false);
    setTranscript('');
    setTextInput('');
    setUseTextFallback(false);
  }, [onParsedFields, parsedFields]);

  const handleCancel = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setShowModal(false);
    setShowConfirm(false);
    setTranscript('');
    setTextInput('');
    setUseTextFallback(false);
  }, []);

  const fieldCount = Object.keys(parsedFields).length;

  return (
    <>
      {/* Mic button */}
      <button
        type="button"
        onClick={startRecording}
        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors w-full justify-center"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
        Voice Input — Describe the donor
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={handleCancel}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {showConfirm ? 'Confirm Extracted Fields' : useTextFallback ? 'Describe Donor' : 'Recording...'}
              </h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            {/* Recording state */}
            {!showConfirm && !useTextFallback && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-full bg-red-500 ${isRecording ? 'animate-pulse' : ''}`} />
                    </div>
                    {isRecording && (
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-red-300 animate-ping" />
                    )}
                  </div>
                </div>
                {transcript && (
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {transcript}
                  </div>
                )}
                <p className="text-xs text-gray-400 text-center">
                  Speak naturally: &quot;48-year-old male, anoxia, creatinine 3.5, hypertension...&quot;
                </p>
                <button
                  onClick={stopRecording}
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {/* Text fallback */}
            {!showConfirm && useTextFallback && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Voice input not available in this browser. Type a description instead.
                </p>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="48-year-old male, anoxia, creatinine 3.5, hypertension, DCD, biopsy GS 18%..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[100px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors ${
                    textInput.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Parse Fields
                </button>
              </div>
            )}

            {/* Confirmation screen */}
            {showConfirm && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-500 max-h-24 overflow-y-auto">
                  &quot;{transcript}&quot;
                </div>

                {fieldCount > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Extracted {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(parsedFields).map(([key, val]) => (
                        <div key={key} className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1.5 text-xs">
                          <span className="text-blue-600 font-medium">{key.replace(/^donor_/, '').replace(/_/g, ' ')}</span>
                          <span className="text-blue-800 ml-1 font-semibold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No fields could be extracted. Try being more specific.
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={fieldCount === 0}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors ${
                      fieldCount > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Confirm &amp; Fill Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={startRecording}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors sm:hidden"
        aria-label="Voice input"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      </button>
    </>
  );
}
