import React, { useEffect, useState } from 'react';
import { Copy, FileText, ImagePlus, Loader2, Save, ScanText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadOwnFile } from '../lib/storage';
import { getLang, t, useLang } from '../lib/i18n';
import { appendNotes, cleanReading, notesEntry, suggestFacts, type DocKind, type DocReading, type PersonFields, type Suggestion } from '../lib/document-reader';

interface Person extends PersonFields { id: string; first_name: string | null; last_name: string | null }

const KIND_LABEL: Record<DocKind, string> = {
  baptism: 'Baptism record', birth: 'Birth record', marriage: 'Marriage record', burial: 'Burial record',
  death: 'Death record', census: 'Census record', letter: 'Letter', other: 'Document',
};
const FIELD_LABEL: Record<Suggestion['field'], string> = {
  birth_date: 'Birth date', birth_location: 'Birthplace', death_date: 'Death date', death_location: 'Place of death', notes: 'Notes',
};
const fullName = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || t('Unnamed person');

// Photograph an old record or letter; get the text written out, a plain translation and the key facts,
// then add them to someone in the tree. The person checks everything before it is saved.
export const DocumentReader: React.FC = () => {
  useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reading, setReading] = useState<DocReading | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState('');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [addNotes, setAddNotes] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('family_members')
      .select('id,first_name,last_name,birth_date,birth_location,death_date,death_location,notes')
      .order('last_name', { ascending: true }).limit(2000)
      .then(({ data }: { data: Person[] | null }) => setPeople(data ?? []));
  }, []);

  const person = people.find((p) => p.id === personId);
  const suggestions = reading && person ? suggestFacts(reading, person) : [];
  // A baptism date isn't the birth date, so that one starts unticked.
  const ticked = (s: Suggestion) => chosen[s.field] ?? !(s.field === 'birth_date' && reading?.kind === 'baptism');

  const choose = (f: File | undefined) => {
    setReading(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error(t('Please choose a photo (JPG or PNG).')); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error(t('Please choose a photo smaller than 8 MB.')); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const read = async () => {
    if (!file) return;
    try {
      setBusy(t('Uploading your photo…'));
      const path = await uploadOwnFile('family-photos', file.name, file);
      setBusy(t('Reading the document… this can take up to a minute'));
      const { data, error } = await supabase.functions.invoke('read-document', { body: { path, lang: getLang() } });
      if (error || data?.error) {
        let message = data?.error as string | undefined;
        try { message = message ?? (await (error as { context?: Response }).context?.json())?.error; } catch { /* default below */ }
        throw new Error(message ? t(message) : t('The document could not be read. Please try again.'));
      }
      const r = cleanReading(data?.reading);
      if (!r) throw new Error(t('The document could not be read. Please try a clearer photo.'));
      setReading(r);
      // Start with the person the document is mostly about, when their name is in the tree.
      const main = r.people[0]?.name.toLowerCase() ?? '';
      const match = people.find((p) => p.first_name && p.last_name && main.includes(p.first_name.toLowerCase()) && main.includes(p.last_name.toLowerCase()));
      setPersonId(match?.id ?? '');
      setChosen({});
      setAddNotes(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(t('Copied')); } catch { toast.error(t('Could not copy. Select the text and copy it instead.')); }
  };

  const save = async () => {
    if (!reading || !person) return;
    const update: Partial<PersonFields> = {};
    for (const s of suggestions) if (ticked(s)) update[s.field] = s.value;
    if (addNotes) {
      update.notes = appendNotes(person.notes, notesEntry(reading, {
        title: t('From a {kind}', { kind: t(KIND_LABEL[reading.kind]).toLowerCase() }),
        translation: t('Translation'), original: t('Original text'),
      }));
    }
    if (!Object.keys(update).length) { toast.message(t('Nothing selected to save.')); return; }
    setSaving(true);
    const { error } = await supabase.from('family_members').update(update).eq('id', person.id);
    setSaving(false);
    if (error) { toast.error(t('Could not save. Please try again.')); return; }
    setPeople((list) => list.map((p) => (p.id === person.id ? { ...p, ...update } : p)));
    setChosen({});
    setAddNotes(false);
    toast.success(t('Saved to {name}.', { name: fullName(person) }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><ScanText className="w-6 h-6 text-genesis-600" /> {t('Read an old document')}</h2>
        <p className="text-gray-600 mt-1">{t('Photograph a baptism, marriage or burial record, a certificate or an old letter. Genesis writes out the text, translates it into plain language and finds the key facts, in French or Latin too.')}</p>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-genesis-400">
        {preview ? <img src={preview} alt={t('Your chosen document')} className="max-h-64 rounded" /> : <ImagePlus className="w-10 h-10 text-gray-400" />}
        <span className="mt-2 font-medium">{file ? t('Choose a different photo') : t('Choose a photo of the document')}</span>
        <span className="text-sm text-gray-500">{t('Take the photo straight on, in good light, with the whole page showing.')}</span>
        <input type="file" accept="image/*" className="sr-only" aria-label={t('Photo of the document')} onChange={(e) => choose(e.target.files?.[0])} />
      </label>

      <button onClick={read} disabled={!file || busy !== null} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />} {busy ? t('Working…') : t('Read the document')}
      </button>
      {busy && <p className="text-sm text-genesis-700" role="status">{busy}</p>}

      {reading && (
        <div className="space-y-5" data-testid="document-reading">
          {reading.unclear && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden /> {t('Parts of this photo were hard to read. A sharper, closer photo will give a better result.')}
            </p>
          )}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-genesis-600" aria-hidden /> {t(KIND_LABEL[reading.kind])}</h3>
            {reading.summary && <p className="text-gray-800">{reading.summary}</p>}
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
              {reading.date && <><dt className="text-gray-500">{t('Date')}</dt><dd>{reading.date}</dd></>}
              {reading.place && <><dt className="text-gray-500">{t('Place')}</dt><dd>{reading.place}</dd></>}
              {reading.language && <><dt className="text-gray-500">{t('Written in')}</dt><dd>{reading.language}</dd></>}
            </dl>
            {reading.people.length > 0 && (
              <div>
                <h4 className="font-medium mt-2">{t('People named')}</h4>
                <ul className="list-disc pl-5 text-gray-800">
                  {reading.people.map((p, i) => <li key={`${p.name}-${i}`}>{p.name}{p.role ? ` · ${p.role}` : ''}</li>)}
                </ul>
              </div>
            )}
          </section>

          {[[t('Translation'), reading.translation], [t('Original text'), reading.transcription]].filter(([, text]) => text).map(([label, text]) => (
            <section key={label} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{label}</h3>
                <button onClick={() => copy(text)} className="flex items-center gap-1 text-sm px-3 py-2 min-h-[44px] border rounded-lg"><Copy className="w-4 h-4" aria-hidden /> {t('Copy')}</button>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 border p-3 text-gray-800">{text}</p>
            </section>
          ))}
          <p className="text-xs text-gray-500">{t('Old handwriting can be misread. Check names and dates against the original before you rely on them. Words that could not be read are shown as [?].')}</p>

          <section className="space-y-3 rounded-lg border border-genesis-200 bg-genesis-50 p-4">
            <h3 className="font-semibold">{t('Add this to someone in your tree')}</h3>
            {people.length === 0 ? (
              <p className="text-gray-700">{t('Add people to your family tree first, then come back to save what this document says.')}</p>
            ) : (
              <>
                <label className="block text-sm font-medium">
                  {t('Person')}
                  <select value={personId} onChange={(e) => { setPersonId(e.target.value); setChosen({}); setAddNotes(true); }} className="mt-1 block w-full border rounded-lg px-3 py-2 min-h-[44px] bg-white">
                    <option value="">{t('Choose a person…')}</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
                  </select>
                </label>
                {person && (
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <label key={s.field} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1 w-5 h-5" checked={ticked(s)} onChange={(e) => setChosen((c) => ({ ...c, [s.field]: e.target.checked }))} />
                        <span>
                          {t('Set {field} to {value}', { field: t(FIELD_LABEL[s.field]).toLowerCase(), value: s.value })}
                          {s.field === 'birth_date' && reading.kind === 'baptism' && <span className="block text-xs text-gray-600">{t('This is the baptism date. Births were usually a day or two earlier.')}</span>}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1 w-5 h-5" checked={addNotes} onChange={(e) => setAddNotes(e.target.checked)} />
                      <span>{t('Add the summary, translation and original text to their notes')}</span>
                    </label>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('Save to {name}', { name: fullName(person) })}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DocumentReader;
