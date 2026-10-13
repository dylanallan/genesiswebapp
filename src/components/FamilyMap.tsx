import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { buildFamilyMap, Coords, MapPersonInput, placeKey, uniquePlaces } from '../lib/family-map';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null;
  birth_date: string | null; death_date: string | null; birth_location: string | null; death_location: string | null; parent_ids: string[] | null;
}
const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const FamilyMap: React.FC = () => {
  const [people, setPeople] = useState<MapPersonInput[] | null>(null);
  const [coords, setCoords] = useState<Record<string, Coords | null>>({});
  const [status, setStatus] = useState<string | null>('Loading your family…');
  const [upTo, setUpTo] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const mapDiv = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);

  // Load people, then look up every place (the server remembers places, so this is quick after the first time).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_date,death_date,birth_location,death_location,parent_ids');
        const list: MapPersonInput[] = rows.map((r) => ({
          id: r.id, name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || 'Unknown',
          birthYear: year(r.birth_date), deathYear: year(r.death_date), birthPlace: r.birth_location, deathPlace: r.death_location, parentIds: r.parent_ids ?? [],
        }));
        if (cancelled) return;
        setPeople(list);
        const places = uniquePlaces(list);
        if (!places.length) { setStatus(null); return; }
        const found: Record<string, Coords | null> = {};
        for (let round = 0; round < 20 && !cancelled; round++) {
          const todo = places.filter((p) => !(placeKey(p) in found));
          if (!todo.length) break;
          setStatus(`Finding ${places.length} places on the map… ${places.length - todo.length} done`);
          const { data, error } = await supabase.functions.invoke('geocode-places', { body: { places: todo } });
          if (error) throw error;
          for (const [k, v] of Object.entries((data?.results ?? {}) as Record<string, { lat: number | null; lon: number | null }>)) {
            found[k] = v.lat !== null && v.lon !== null ? { lat: v.lat, lon: v.lon } : null;
          }
          setCoords({ ...found });
          if (!data?.pending) break;
        }
        setStatus(null);
      } catch {
        if (!cancelled) { setStatus(null); toast.error('Could not load the map right now. Please try again later.'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const view = useMemo(() => (people ? buildFamilyMap(people, coords, upTo) : null), [people, coords, upTo]);
  const full = useMemo(() => (people ? buildFamilyMap(people, coords) : null), [people, coords]);
  const notFound = useMemo(() => (people ? uniquePlaces(people).filter((p) => coords[placeKey(p)] === null) : []), [people, coords]);

  useEffect(() => {
    if (!mapDiv.current || map.current) return;
    map.current = L.map(mapDiv.current, { worldCopyJump: true }).setView([30, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current || !view) return;
    layer.current.clearLayers();
    for (const m of view.moves) {
      L.polyline([[m.from.lat, m.from.lon], [m.to.lat, m.to.lon]], { color: '#B5843A', weight: 2.5, opacity: 0.8, dashArray: '6 6' })
        .bindTooltip(esc(m.label)).addTo(layer.current);
    }
    for (const pin of view.pins) {
      const names = pin.people.slice(0, 12).map((p) => `${esc(p.name)} (${p.event}${p.year ? ` ${p.year}` : ''})`).join('<br>');
      const more = pin.people.length > 12 ? `<br>…and ${pin.people.length - 12} more` : '';
      L.circleMarker([pin.coords.lat, pin.coords.lon], {
        radius: Math.min(22, 6 + Math.sqrt(pin.people.length) * 3), color: '#2E5A44', weight: 2, fillColor: '#2E5A44', fillOpacity: 0.55,
      }).bindPopup(`<strong>${esc(pin.place)}</strong><br>${names}${more}`).addTo(layer.current);
    }
    if (!fitted.current && full && full.pins.length) {
      fitted.current = true;
      map.current.fitBounds(L.latLngBounds(full.pins.map((p) => [p.coords.lat, p.coords.lon] as [number, number])).pad(0.3), { maxZoom: 6 });
    }
  }, [view, full]);

  // "Play the journey": step through the family's years a decade at a time.
  useEffect(() => {
    if (!playing || !full?.span) return;
    const timer = setInterval(() => {
      setUpTo((y) => {
        const next = (y ?? full.span!.from) + 10;
        if (next >= full.span!.to) { setPlaying(false); return null; }
        return next;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [playing, full]);

  const countries = useMemo(() => new Set((full?.pins ?? []).map((p) => p.place.split(',').pop()!.trim().toLowerCase())).size, [full]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><MapIcon className="w-6 h-6 text-genesis-600" /> Family map</h2>
          <p className="text-gray-600 mt-1">Where your family was born and lived, and how they moved from one generation to the next.</p>
        </div>
        {full?.span && (
          <button onClick={() => { if (!playing) setUpTo(full.span!.from); setPlaying(!playing); }} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg">
            {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play our family's journey</>}
          </button>
        )}
      </div>

      {status && <p className="flex items-center gap-2 text-genesis-700" role="status"><Loader2 className="w-4 h-4 animate-spin" /> {status}</p>}
      {full && (
        <p className="text-sm text-gray-700">
          <strong>{full.pins.length}</strong> {full.pins.length === 1 ? 'place' : 'places'}{countries > 1 ? <> in about <strong>{countries}</strong> countries</> : null},{' '}
          <strong>{full.moves.length}</strong> {full.moves.length === 1 ? 'move' : 'moves'} between generations
          {upTo !== null && <> · showing up to <strong>{upTo}</strong></>}
        </p>
      )}

      <div ref={mapDiv} className="w-full rounded-lg border" style={{ height: 460 }} aria-label="Map of where your family lived" />

      {full?.span && (
        <label className="block text-sm">
          Show the family up to the year <strong>{upTo ?? 'today'}</strong>
          <input type="range" min={full.span.from} max={full.span.to} value={upTo ?? full.span.to}
            onChange={(e) => { setPlaying(false); const v = Number(e.target.value); setUpTo(v >= full.span!.to ? null : v); }} className="w-full mt-1" />
        </label>
      )}

      {people && people.length > 0 && uniquePlaces(people).length === 0 && (
        <p className="text-gray-600">Add birth and death places to people in your tree and they will appear here.</p>
      )}
      {notFound.length > 0 && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer">{notFound.length} place{notFound.length > 1 ? 's' : ''} could not be found on the map</summary>
          <p className="mt-1">Try writing them as "Town, Region, Country": {notFound.slice(0, 20).join(' · ')}</p>
        </details>
      )}
    </div>
  );
};

export default FamilyMap;
