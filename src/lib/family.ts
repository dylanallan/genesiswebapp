// Maps between family_members rows and the shape the family tree screens use.
import { supabase } from './supabase';

export interface TreeMember {
  id: string;
  name: string;
  relationship: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  notes?: string;
  confidence: number; // 0-1
  source: 'user' | 'ai' | 'validated';
  parentIds?: string[];
  spouseIds?: string[];
  childrenIds?: string[];
}


interface FamilyRow {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  relationship: string | null;
  birth_date: string | null;
  birth_location: string | null;
  death_date: string | null;
  death_location: string | null;
  notes: string | null;
  confidence: number | null;
  source: TreeMember['source'] | null;
  parent_ids: string[] | null;
  spouse_ids: string[] | null;
  children_ids: string[] | null;
}

export const fromRow = (r: FamilyRow): TreeMember => ({
  id: r.id,
  name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
  relationship: r.relationship ?? '',
  birthDate: r.birth_date ?? undefined,
  birthPlace: r.birth_location ?? undefined,
  deathDate: r.death_date ?? undefined,
  deathPlace: r.death_location ?? undefined,
  notes: r.notes ?? undefined,
  confidence: (r.confidence ?? 100) / 100, // stored 0-100, shown 0-1
  source: r.source ?? 'user',
  parentIds: r.parent_ids ?? [],
  spouseIds: r.spouse_ids ?? [],
  childrenIds: r.children_ids ?? [],
});

export const toRow = (m: TreeMember) => {
  const parts = m.name.trim().split(/\s+/);
  const first = parts.shift() ?? m.name;
  return {
    first_name: first,
    last_name: parts.length ? parts.pop() : null,
    middle_name: parts.length ? parts.join(' ') : null,
    relationship: m.relationship || null,
    birth_date: m.birthDate || null,
    birth_location: m.birthPlace || null,
    death_date: m.deathDate || null,
    death_location: m.deathPlace || null,
    is_living: !m.deathDate,
    notes: m.notes || null,
    source: m.source ?? 'user',
    confidence: Math.round((m.confidence ?? 1) * 100),
    parent_ids: m.parentIds ?? [],
    spouse_ids: m.spouseIds ?? [],
    children_ids: m.childrenIds ?? [],
  };
};


export async function loadFamilyMembers(): Promise<TreeMember[]> {
  const { data, error } = await supabase.from('family_members').select('*').order('birth_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function saveFamilyMember(m: TreeMember): Promise<TreeMember> {
  const { data, error } = await supabase.from('family_members').insert(toRow(m)).select('*').single();
  if (error) throw error;
  return fromRow(data);
}
