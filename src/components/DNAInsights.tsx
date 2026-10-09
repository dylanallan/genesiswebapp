import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Dna, Upload, ShieldCheck, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

import { analyzeRawDNA, CHROM_ORDER, type DNASummary } from '../lib/dna';

// Everything shown here is measured from the user's own raw DNA file. The file is read in the
// browser and never uploaded; only the summary numbers below are saved to their account.

const MAX_BYTES = 150 * 1024 * 1024;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const DNAInsights: React.FC = () => {
  const [summary, setSummary] = useState<DNASummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('dna_insights')
        .select('insights')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching DNA data:', error);
        return;
      }
      if (data?.insights?.totalMarkers) setSummary(data.insights as DNASummary);
    })();
  }, []);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) return toast.error('That file is larger than any raw DNA export we know of. Please check you picked the right file.');
    setIsLoading(true);
    try {
      const text = await file.text();
      const result = analyzeRawDNA(text, file.name);
      setSummary(result);
      const { error } = await supabase.from('dna_insights').insert({ insights: result });
      if (error) toast.error('Your results are shown, but could not be saved to your account.');
      else toast.success('DNA file analysed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setIsLoading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const maxCount = summary ? Math.max(...Object.values(summary.perChromosome)) : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Dna className="w-6 h-6 text-purple-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">DNA Insights</h2>
            <p className="text-sm text-gray-600">Upload the raw data file from 23andMe, AncestryDNA, MyHeritage or FamilyTreeDNA.</p>
          </div>
        </div>
        <label className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white cursor-pointer ${isLoading ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isLoading ? 'Analysing…' : summary ? 'Analyse another file' : 'Choose raw DNA file'}
          <input ref={fileInput} type="file" accept=".txt,.csv,.zip,text/plain,text/csv" className="hidden" disabled={isLoading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
        Your file is read on this device and is never uploaded. Only the summary numbers below are saved to your account.
      </p>

      {!summary && !isLoading && (
        <p className="text-gray-600 text-sm">
          Not sure where to find your file? Each testing company has a "Download raw data" option in your account settings. If it arrives as a .zip, unzip it first.
        </p>
      )}

      {summary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Format', summary.format],
              ['Markers in file', summary.totalMarkers.toLocaleString()],
              ['Call rate', pct(summary.callRate)],
              ['Genome build', summary.build ?? 'Not stated'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="font-semibold text-gray-900 break-words">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Autosomal heterozygosity</div>
              <div className="font-semibold">{summary.autosomalHeterozygosity !== null ? pct(summary.autosomalHeterozygosity) : '—'}</div>
              <p className="text-xs text-gray-500 mt-1">Share of your markers where you inherited two different letters. Typical consumer files fall around 25–35%.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Y-chromosome markers</div>
              <div className="font-semibold">{summary.yMarkersCalled > 0 ? `${summary.yMarkersCalled.toLocaleString()} read` : 'None read'}</div>
              <p className="text-xs text-gray-500 mt-1">Y markers are passed father to son and are used for paternal-line (haplogroup) research.</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Mitochondrial markers</div>
              <div className="font-semibold">{summary.mtMarkersCalled.toLocaleString()} read</div>
              <p className="text-xs text-gray-500 mt-1">Mitochondrial DNA is passed down from your mother and is used for maternal-line research.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Markers per chromosome</h3>
            <div className="space-y-1">
              {CHROM_ORDER.filter((c) => summary.perChromosome[c]).map((c) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-right text-gray-600">{c}</span>
                  <div className="flex-1 bg-gray-100 rounded h-3">
                    <div className="bg-purple-500 h-3 rounded" style={{ width: `${(summary.perChromosome[c] / maxCount) * 100}%` }} />
                  </div>
                  <span className="w-16 text-gray-600">{summary.perChromosome[c].toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            Coming soon: ethnicity estimates built on open scientific reference data (1000 Genomes and HGDP), and paternal and maternal haplogroups. We show only results we can measure from your own data. This tool does not give medical or health information.
          </p>
          <p className="text-xs text-gray-400">Analysed {new Date(summary.analyzedAt).toLocaleString()} · {summary.fileName}</p>
        </motion.div>
      )}
    </div>
  );
};

export default DNAInsights;
