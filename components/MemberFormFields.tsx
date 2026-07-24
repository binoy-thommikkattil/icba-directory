'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { COUNTRY_CODE_OPTIONS, DEFAULT_COUNTRY_CODE, normalizeCountryCode } from '@/lib/phoneUtils';

export const MEMBER_TAG_OPTIONS = ['Bachelor Meeting', 'Youth Meeting', 'Brothers Meeting', 'Sisters Meeting', 'Sunday School', 'Choir'];

export type MemberFormValue = {
  name: string;
  callCountryCode: string;
  callPhone: string;
  whatsappCountryCode: string;
  whatsappPhone: string;
  bloodGroup: string;
  willingToDonate: boolean;
  tags: string[];
  relationship?: string;
};

export const createBlankMember = (): MemberFormValue => ({
  name: '',
  callCountryCode: DEFAULT_COUNTRY_CODE,
  callPhone: '',
  whatsappCountryCode: DEFAULT_COUNTRY_CODE,
  whatsappPhone: '',
  bloodGroup: '',
  willingToDonate: false,
  tags: [],
});

type MemberPhoneFieldsProps = {
  member: MemberFormValue;
  index: number;
  onChange: (field: keyof MemberFormValue, value: string) => void;
};

export function MemberPhoneFields({ member, index, onChange }: MemberPhoneFieldsProps) {
  const memberLabel = index === 0 ? 'Primary member' : `Member ${index + 1}`;

  const copyCallToWhatsApp = () => {
    onChange('whatsappCountryCode', normalizeCountryCode(member.callCountryCode));
    onChange('whatsappPhone', member.callPhone);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <label className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${index === 0 ? 'text-teal-700' : 'text-slate-500'}`}>
          <Phone size={13} /> {index === 0 ? 'Primary Call Phone *' : 'Call Phone'}
        </label>
        <div className="grid grid-cols-[5.75rem_1fr] gap-2">
          <select
            aria-label={`${memberLabel} call country code`}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-semibold outline-none focus:border-teal-600"
            value={member.callCountryCode || DEFAULT_COUNTRY_CODE}
            onChange={(event) => onChange('callCountryCode', normalizeCountryCode(event.target.value))}
          >
            {COUNTRY_CODE_OPTIONS.map((countryCode) => (
              <option key={countryCode} value={countryCode}>{countryCode}</option>
            ))}
          </select>
          <input
            required={index === 0}
            type="tel"
            aria-label={`${memberLabel} call phone number`}
            placeholder="98765 43210"
            className={`w-full rounded-lg border bg-white p-2 text-sm outline-none focus:border-teal-600 ${index === 0 ? 'border-teal-200 font-bold' : 'border-slate-200'}`}
            value={member.callPhone || ''}
            onChange={(event) => onChange('callPhone', event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-green-700">
            <MessageCircle size={13} /> WhatsApp
          </label>
          <button
            type="button"
            onClick={copyCallToWhatsApp}
            disabled={!member.callPhone}
            className="rounded-full border border-green-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Same as call
          </button>
        </div>
        <div className="grid grid-cols-[5.75rem_1fr] gap-2">
          <select
            aria-label={`${memberLabel} WhatsApp country code`}
            className="w-full rounded-lg border border-green-200 bg-white px-2 py-2 text-sm font-semibold outline-none focus:border-green-600"
            value={member.whatsappCountryCode || DEFAULT_COUNTRY_CODE}
            onChange={(event) => onChange('whatsappCountryCode', normalizeCountryCode(event.target.value))}
          >
            {COUNTRY_CODE_OPTIONS.map((countryCode) => (
              <option key={countryCode} value={countryCode}>{countryCode}</option>
            ))}
          </select>
          <input
            type="tel"
            aria-label={`${memberLabel} WhatsApp phone number`}
            placeholder="98765 43210"
            className="w-full rounded-lg border border-green-200 bg-white p-2 text-sm outline-none focus:border-green-600"
            value={member.whatsappPhone || ''}
            onChange={(event) => onChange('whatsappPhone', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

type TagsMultiSelectProps = {
  selectedTags: string[];
  disabled: boolean;
  onChange: (tags: string[]) => void;
};

export function TagsMultiSelect({ selectedTags, disabled, onChange }: TagsMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((selectedTag) => selectedTag !== tag));
      return;
    }

    onChange([...selectedTags, tag]);
  };

  const summary = selectedTags.length > 0 ? selectedTags.join(', ') : 'Select tags / roles';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={`flex min-h-[2.75rem] w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm outline-none transition ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 focus:border-teal-600'}`}
      >
        <span className="line-clamp-2 font-medium">{summary}</span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {MEMBER_TAG_OPTIONS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggleTag(tag)}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 transition last:border-0 hover:bg-teal-50"
              >
                <span>{tag}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                  <Check size={13} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
