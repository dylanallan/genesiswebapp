import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, Download, ImagePlus, Images, Loader2, Mic, Music, Share2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { currentUserId, signedUrl } from '../lib/storage';
import { t, useLang } from '../lib/i18n';
import { fade, fitInside, pickVideoType, secondsPerSlide, slideAt, totalSeconds, wrapLines, zoom } from '../lib/slideshow';
import { VoiceRecorder } from './VoiceRecorder';

interface Slide { id: string; src: string; caption: string; img?: HTMLImageElement }
interface Narration { url: string; seconds: number; name: string }

const W = 1280, H = 720, FPS = 30, MAX_SLIDES = 40;
const BG = '#14231b';

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // saved photos come from storage; this keeps the canvas recordable
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('image'));
  img.src = src;
});

const audioLength = (url: string) => new Promise<number>((resolve) => {
  const a = new Audio();
  a.preload = 'metadata';
  a.onloadedmetadata = () => {
    if (Number.isFinite(a.duration)) { resolve(a.duration); return; }
    // Recordings from some browsers report their length only after seeking to the end.
    a.currentTime = 1e9;
    a.ontimeupdate = () => { a.ontimeupdate = null; resolve(Number.isFinite(a.duration) ? a.duration : 0); };
  };
  a.onerror = () => resolve(0);
  a.src = url;
});

function drawFrame(ctx: CanvasRenderingContext2D, title: string, slides: Slide[], per: number, time: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const { index, progress } = slideAt(time, slides.length, per);
  ctx.textAlign = 'center';
  if (index < 0) {
    ctx.globalAlpha = fade(progress, 4);
    ctx.fillStyle = '#f5efe0';
    ctx.font = '600 64px Georgia, serif';
    wrapLines(title || t('Our family story'), W - 200, (s) => ctx.measureText(s).width, 2)
      .forEach((line, i, all) => ctx.fillText(line, W / 2, H / 2 - (all.length - 1) * 40 + i * 80));
    ctx.globalAlpha = 1;
    return;
  }
  const slide = slides[index];
  if (!slide?.img) return;
  ctx.globalAlpha = index === slides.length - 1 && progress >= 1 ? 1 : fade(progress, per);
  const box = fitInside(slide.img.naturalWidth, slide.img.naturalHeight, W, H - (slide.caption ? 120 : 0));
  const z = zoom(index, progress);
  const w = box.w * z, h = box.h * z;
  ctx.drawImage(slide.img, box.x - (w - box.w) / 2, box.y - (h - box.h) / 2, w, h);
  if (slide.caption) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 36px system-ui, sans-serif';
    wrapLines(slide.caption, W - 120, (s) => ctx.measureText(s).width, 2)
      .forEach((line, i, all) => ctx.fillText(line, W / 2, H - 60 - (all.length - 1) * 21 + i * 42 + 12));
  }
  ctx.globalAlpha = 1;
}

// A narrated slideshow: photos with captions, a voice telling the story, saved as a video to send to family.
export const SlideshowMaker: React.FC = () => {
  useLang();
  const [title, setTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [pace, setPace] = useState(5);
  const [narration, setNarration] = useState<Narration | null>(null);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState<Array<{ name: string; url: string }> | null>(null);
  const [making, setMaking] = useState<number | null>(null); // percent done
  const [video, setVideo] = useState<{ url: string; blob: Blob; ext: string } | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const cancel = useRef(false);

  const per = secondsPerSlide(slides.length, narration?.seconds ?? null, pace);
  const total = totalSeconds(slides.length, per, narration?.seconds ?? null);
  const canRecord = typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;

  // Preview the first photo (or the title) whenever something changes.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx && making === null) drawFrame(ctx, title, slides, per || 5, slides.length ? 4 + Math.min(0.5, per / 2) : 1);
  }, [title, slides, per, making]);
  useEffect(() => () => { cancel.current = true; }, []);

  const addSlides = async (items: Array<{ src: string; caption?: string }>) => {
    const room = MAX_SLIDES - slides.length;
    if (room <= 0) { toast.error(t('A slideshow can have up to {n} photos.', { n: MAX_SLIDES })); return; }
    const loaded = await Promise.all(items.slice(0, room).map(async (it) => {
      try { return { id: crypto.randomUUID(), src: it.src, caption: it.caption ?? '', img: await loadImage(it.src) }; } catch { return null; }
    }));
    const ok = loaded.filter((s): s is NonNullable<typeof s> => s !== null) as Slide[];
    if (ok.length < Math.min(items.length, room)) toast.error(t('Some photos could not be opened and were left out.'));
    setSlides((list) => [...list, ...ok]);
    setVideo(null);
  };

  const fromDevice = (files: FileList | null) => {
    if (!files?.length) return;
    addSlides([...files].filter((f) => f.type.startsWith('image/')).map((f) => ({ src: URL.createObjectURL(f) })));
  };

  const openSaved = async () => {
    try {
      const uid = await currentUserId();
      const { data } = await supabase.storage.from('family-photos').list(uid, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      const images = ((data ?? []) as Array<{ name: string }>).filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
      setSaved(await Promise.all(images.map(async (f) => ({ name: f.name, url: await signedUrl('family-photos', `${uid}/${f.name}`) }))));
    } catch {
      toast.error(t('Your saved photos could not be loaded. Please try again.'));
    }
  };

  const chooseNarration = async (url: string, name: string) => {
    const seconds = await audioLength(url);
    if (!seconds) { toast.error(t('That recording could not be played. Please try another.')); return; }
    setNarration({ url, seconds, name });
    setRecording(false);
    setVideo(null);
  };

  const move = (i: number, by: number) => setSlides((list) => {
    const next = [...list];
    const [s] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, s);
    return next;
  });

  const make = async () => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    const type = pickVideoType((m) => MediaRecorder.isTypeSupported(m));
    if (!c || !ctx || !slides.length) return;
    if (!type) { toast.error(t('This browser can’t make videos. Please try Chrome, Edge, Firefox or Safari.')); return; }
    cancel.current = false;
    setVideo(null);
    setMaking(0);
    const stream = c.captureStream(FPS);
    let audio: HTMLAudioElement | null = null;
    let audioCtx: AudioContext | null = null;
    if (narration) {
      audio = new Audio(narration.url);
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination); // so you hear it while it's made
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
    recorder.start(1000);
    if (audio) await audio.play().catch(() => undefined);
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const time = (performance.now() - start) / 1000;
        drawFrame(ctx, title, slides, per, time);
        setMaking(Math.min(99, Math.round((time / total) * 100)));
        if (time >= total || cancel.current) { resolve(); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    recorder.stop();
    audio?.pause();
    await done;
    stream.getTracks().forEach((track) => track.stop());
    await audioCtx?.close();
    setMaking(null);
    if (cancel.current) return;
    const blob = new Blob(chunks, { type: type.split(';')[0] });
    setVideo({ url: URL.createObjectURL(blob), blob, ext: type.includes('mp4') ? 'mp4' : 'webm' });
    toast.success(t('Your slideshow video is ready.'));
  };

  const fileName = `${(title || t('Our family story')).replace(/[^\p{L}\p{N} -]+/gu, '').trim().slice(0, 60) || 'slideshow'}.${video?.ext ?? 'webm'}`;
  const share = async () => {
    if (!video) return;
    const file = new File([video.blob], fileName, { type: video.blob.type });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: title || t('Our family story') });
      else toast.message(t('Download the video, then send it by email, text or WhatsApp.'));
    } catch { /* closed the share sheet */ }
  };

  const mins = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Clapperboard className="w-6 h-6 text-genesis-600" /> {t('Make a slideshow video')}</h2>
        <p className="text-gray-600 mt-1">{t('Choose photos, add a caption to each, and tell the story in your own voice. Genesis turns it into a video you can send to the whole family.')}</p>
      </div>

      <label className="block text-sm font-medium">{t('Title')}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('e.g. The life of Grandma Rosa')} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg" />
      </label>

      <section className="space-y-3">
        <h3 className="font-semibold">{t('1. Photos')}</h3>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg cursor-pointer hover:bg-gray-50">
            <ImagePlus className="w-4 h-4" aria-hidden /> {t('Add photos from this device')}
            <input type="file" accept="image/*" multiple className="sr-only" aria-label={t('Photos for the slideshow')} onChange={(e) => { fromDevice(e.target.files); e.target.value = ''; }} />
          </label>
          <button onClick={openSaved} className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg hover:bg-gray-50"><Images className="w-4 h-4" aria-hidden /> {t('Add my saved photos')}</button>
        </div>
        {saved && (
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{saved.length ? t('Tap a photo to add it') : t('You have no saved photos yet.')}</p>
              <button onClick={() => setSaved(null)} aria-label={t('Close')} className="w-11 h-11 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {saved.map((p) => (
                <li key={p.name}><button onClick={() => addSlides([{ src: p.url }])} className="block w-full"><img src={p.url} alt={t('Add {name}', { name: p.name })} className="w-full h-20 object-cover rounded" /></button></li>
              ))}
            </ul>
          </div>
        )}
        {slides.length > 0 && (
          <ol className="space-y-2">
            {slides.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 border rounded-lg p-2">
                <img src={s.src} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                <input value={s.caption} onChange={(e) => setSlides((list) => list.map((x) => (x.id === s.id ? { ...x, caption: e.target.value } : x)))}
                  placeholder={t('Caption (optional)')} aria-label={t('Caption for photo {n}', { n: i + 1 })} className="flex-1 min-w-0 px-3 py-2 min-h-[44px] border rounded-lg" />
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('Move photo {n} up', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} aria-label={t('Move photo {n} down', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => setSlides((list) => list.filter((x) => x.id !== s.id))} aria-label={t('Remove photo {n}', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">{t('2. Narration (optional)')}</h3>
        {narration ? (
          <div className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
            <Music className="w-5 h-5 text-genesis-600" aria-hidden />
            <span className="flex-1">{narration.name} · {mins(narration.seconds)}</span>
            <audio src={narration.url} controls className="max-w-full" />
            <button onClick={() => setNarration(null)} className="px-3 py-2 min-h-[44px] border rounded-lg">{t('Remove')}</button>
          </div>
        ) : recording ? (
          <VoiceRecorder maxDuration={600} onRecordingComplete={(_blob, url) => chooseNarration(url, t('Your recording'))} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRecording(true)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg hover:bg-gray-50"><Mic className="w-4 h-4" aria-hidden /> {t('Record the story now')}</button>
            <label className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg cursor-pointer hover:bg-gray-50">
              <Music className="w-4 h-4" aria-hidden /> {t('Use a recording I have')}
              <input type="file" accept="audio/*" className="sr-only" aria-label={t('Narration recording')} onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseNarration(URL.createObjectURL(f), f.name); }} />
            </label>
          </div>
        )}
        {!narration && (
          <label className="flex items-center gap-2 text-sm">{t('Seconds per photo')}
            <select value={pace} onChange={(e) => setPace(Number(e.target.value))} className="px-3 py-2 min-h-[44px] border rounded-lg">
              {[3, 5, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">{t('3. Make the video')}</h3>
        <canvas ref={canvas} width={W} height={H} className="w-full rounded-lg border bg-black" aria-label={t('Slideshow preview')} role="img" />
        {slides.length > 0 && <p className="text-sm text-gray-600">{t('{n} photos · about {time} long', { n: slides.length, time: mins(total) })}</p>}
        {!canRecord ? (
          <p className="text-gray-700">{t('This browser can’t make videos. Please try Chrome, Edge, Firefox or Safari.')}</p>
        ) : making !== null ? (
          <div className="space-y-2" role="status">
            <p className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {t('Making your video… {n}%', { n: making })}</p>
            <p className="text-sm text-gray-600">{t('It plays through once while it’s made. Keep this screen open.')}</p>
            <button onClick={() => { cancel.current = true; }} className="px-4 py-2 min-h-[44px] border rounded-lg">{t('Cancel')}</button>
          </div>
        ) : (
          <button onClick={make} disabled={!slides.length} className="flex items-center gap-2 px-5 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg text-lg disabled:opacity-50">
            <Clapperboard className="w-5 h-5" aria-hidden /> {t('Make the video')}
          </button>
        )}
        {video && (
          <div className="space-y-3 rounded-lg border border-genesis-200 bg-genesis-50 p-4" data-testid="slideshow-video" data-size={video.blob.size}>
            <video src={video.url} controls className="w-full rounded" aria-label={t('Your slideshow video')} />
            <div className="flex flex-wrap gap-2">
              <a href={video.url} download={fileName} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-genesis-600 text-white rounded-lg"><Download className="w-4 h-4" aria-hidden /> {t('Download the video')}</a>
              <button onClick={share} className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg"><Share2 className="w-4 h-4" aria-hidden /> {t('Send to family')}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SlideshowMaker;
