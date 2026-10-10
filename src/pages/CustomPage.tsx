import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCms } from '../lib/cms';
import { Visual } from '../components/Visual';
import { F } from '../components/Editable';
import { Reveal } from '../components/Chrome';
import { WorldFX } from '../components/WorldFX';
import { isVideo } from '../lib/util';
import NotFound from './NotFound';

export const BLOCK_TYPES: Record<string, { label: string; icon: string; defaults: any; fields: [string, string, string?][] }> = {
  hero: { label: 'Hero', icon: '🎬', defaults: { kicker: 'Kicker', title: 'Big title', subtitle: '', image: '', video: '', height: 80, effect: 'none' }, fields: [['kicker', 'text'], ['title', 'text'], ['subtitle', 'textarea'], ['image', 'image'], ['video', 'video'], ['height', 'number', 'Height (vh)'], ['effect', 'select:none,heat,snow,rain,vhs,ice,embers', 'Ambient effect']] },
  heading: { label: 'Heading', icon: '🔠', defaults: { kicker: '', text: 'Heading', size: 'md' }, fields: [['kicker', 'text'], ['text', 'text'], ['size', 'select:sm,md,lg,xl']] },
  text: { label: 'Text', icon: '¶', defaults: { text: 'Write something…', align: 'left', style: 'body' }, fields: [['text', 'textarea'], ['align', 'select:left,center'], ['style', 'select:body,lead,serif']] },
  image: { label: 'Image', icon: '🖼️', defaults: { url: '', caption: '', width: 'wide' }, fields: [['url', 'image'], ['caption', 'text'], ['width', 'select:narrow,wide,full']] },
  video: { label: 'Video', icon: '🎞️', defaults: { url: '', poster: '', caption: '' }, fields: [['url', 'video'], ['poster', 'image'], ['caption', 'text']] },
  audio: { label: 'Audio', icon: '🎵', defaults: { url: '', title: '' }, fields: [['url', 'audio'], ['title', 'text']] },
  gallery: { label: 'Gallery', icon: '🗂️', defaults: { images: [] }, fields: [['images', 'images']] },
  quote: { label: 'Quote', icon: '❝', defaults: { text: 'Tonight’s the night.', by: 'Dexter Morgan' }, fields: [['text', 'textarea'], ['by', 'text']] },
  cards: { label: 'Cards', icon: '🃏', defaults: { items: [{ title: 'Card', text: '', image: '', link: '' }] }, fields: [['items', 'cards']] },
  columns: { label: 'Two columns', icon: '⫼', defaults: { left: 'Left column', right: 'Right column' }, fields: [['left', 'textarea'], ['right', 'textarea']] },
  button: { label: 'Button', icon: '🔘', defaults: { label: 'Click', link: '/', style: 'primary' }, fields: [['label', 'text'], ['link', 'text'], ['style', 'select:primary,ghost,white']] },
  embed: { label: 'Embed (iframe)', icon: '⧉', defaults: { url: '', height: 480 }, fields: [['url', 'text'], ['height', 'number']] },
  html: { label: 'Custom HTML', icon: '</>', defaults: { html: '<p>Custom HTML</p>' }, fields: [['html', 'code']] },
  spacer: { label: 'Spacer', icon: '↕', defaults: { height: 80 }, fields: [['height', 'number']] },
  divider: { label: 'Divider', icon: '—', defaults: {}, fields: [] },
};

export function Block({ b, i, page }: { b: any; i: number; page: any }) {
  const p = b.props || {};
  const path = (k: string) => `blocks.${i}.props.${k}`;
  const Ed = ({ k, as, className, style, multiline }: any) => <F col="pages" item={page} path={path(k)} as={as} className={className} style={style} multiline={multiline} />;
  switch (b.type) {
    case 'hero':
      return (
        <section style={{ position: 'relative', height: `${p.height || 80}vh`, minHeight: 420, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Visual src={p.video || p.image} seed={page.id + i} mode="none" style={{ width: '100%', height: '100%' }} />
          </div>
          {p.effect && p.effect !== 'none' && <WorldFX effect={p.effect} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,10,.3), var(--bg)), linear-gradient(90deg, rgba(7,7,10,.8), transparent 70%)' }} />
          <div className="container" style={{ position: 'relative', paddingBottom: 70 }}>
            <Ed k="kicker" as="div" className="kicker red" />
            <Ed k="title" as="h1" className="display h-lg" style={{ margin: '10px 0' }} />
            <Ed k="subtitle" as="p" className="lead" multiline />
          </div>
        </section>
      );
    case 'heading':
      return (
        <div className="container" style={{ paddingTop: 40 }}>
          {p.kicker && <Ed k="kicker" as="div" className="kicker" />}
          <Ed k="text" as="h2" className={`display h-${p.size || 'md'}`} style={{ margin: '8px 0 0' }} />
        </div>
      );
    case 'text':
      return (
        <div className="container" style={{ maxWidth: 900, textAlign: p.align || 'left', paddingTop: 20, paddingBottom: 20 }}>
          <Ed k="text" as="div" className={p.style === 'lead' ? 'lead prose' : p.style === 'serif' ? 'serif prose' : 'prose'} style={p.style === 'serif' ? { fontSize: 28, fontStyle: 'italic', margin: '0 auto' } : { margin: p.align === 'center' ? '0 auto' : undefined }} multiline />
        </div>
      );
    case 'image':
      return (
        <figure className="container" style={{ maxWidth: p.width === 'narrow' ? 760 : p.width === 'full' ? 'none' : 1300, padding: p.width === 'full' ? 0 : undefined, margin: '30px auto' }}>
          {p.url && <img src={p.url} alt={p.caption || ''} style={{ width: '100%', borderRadius: p.width === 'full' ? 0 : 16 }} />}
          {p.caption && <figcaption className="muted mono" style={{ fontSize: 12, marginTop: 10, letterSpacing: '.1em' }}>{p.caption}</figcaption>}
        </figure>
      );
    case 'video':
      return (
        <figure className="container" style={{ maxWidth: 1300, margin: '30px auto' }}>
          {p.url &&
            (isVideo(p.url) ? (
              <video src={p.url} poster={p.poster} controls style={{ width: '100%', borderRadius: 16, background: '#000' }} />
            ) : (
              <iframe src={p.url} title="video" style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 16 }} allowFullScreen />
            ))}
          {p.caption && <figcaption className="muted mono" style={{ fontSize: 12, marginTop: 10 }}>{p.caption}</figcaption>}
        </figure>
      );
    case 'audio':
      return (
        <div className="container" style={{ maxWidth: 900, margin: '20px auto' }}>
          <div className="card card-pad">
            {p.title && <div style={{ fontWeight: 600, marginBottom: 10 }}>🎵 {p.title}</div>}
            {p.url && <audio src={p.url} controls style={{ width: '100%' }} />}
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div className="container" style={{ columns: '3 280px', gap: 16, margin: '30px auto' }}>
          {(p.images || []).map((u: string, j: number) => (
            <img key={j} src={u} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 16, breakInside: 'avoid' }} />
          ))}
        </div>
      );
    case 'quote':
      return (
        <div className="container" style={{ maxWidth: 1100, textAlign: 'center', padding: '60px 0' }}>
          <Ed k="text" as="div" className="quote-big" />
          <Ed k="by" as="div" className="mono muted" style={{ marginTop: 18, letterSpacing: '.2em', fontSize: 12 }} />
        </div>
      );
    case 'cards':
      return (
        <div className="container grid g3" style={{ margin: '30px auto' }}>
          {(p.items || []).map((c: any, j: number) => {
            const inner = (
              <div className="card hover" style={{ height: '100%' }}>
                {c.image && (
                  <div style={{ aspectRatio: '16/10', position: 'relative' }}>
                    <Visual src={c.image} seed={c.title} style={{ position: 'absolute', inset: 0 }} />
                  </div>
                )}
                <div className="card-pad">
                  <F col="pages" item={page} path={`blocks.${i}.props.items.${j}.title`} as="h3" className="display" style={{ fontSize: 30, margin: 0 }} />
                  <F col="pages" item={page} path={`blocks.${i}.props.items.${j}.text`} as="p" className="muted" multiline />
                </div>
              </div>
            );
            return c.link ? (
              <Link key={j} to={c.link}>
                {inner}
              </Link>
            ) : (
              <div key={j}>{inner}</div>
            );
          })}
        </div>
      );
    case 'columns':
      return (
        <div className="container grid g2" style={{ gap: 50, margin: '30px auto' }}>
          <Ed k="left" as="div" className="prose" multiline />
          <Ed k="right" as="div" className="prose" multiline />
        </div>
      );
    case 'button':
      return (
        <div className="container" style={{ margin: '20px auto' }}>
          <Link to={p.link || '/'} className={`btn ${p.style === 'primary' ? 'btn-primary' : p.style === 'white' ? 'btn-white' : ''}`}>
            {p.label}
          </Link>
        </div>
      );
    case 'embed':
      return (
        <div className="container" style={{ margin: '30px auto' }}>
          {p.url && <iframe src={p.url} title="embed" style={{ width: '100%', height: p.height || 480, border: 0, borderRadius: 16 }} allowFullScreen />}
        </div>
      );
    case 'html':
      return <div className="container" style={{ margin: '20px auto' }} dangerouslySetInnerHTML={{ __html: p.html || '' }} />;
    case 'spacer':
      return <div style={{ height: p.height || 80 }} />;
    case 'divider':
      return (
        <div className="container">
          <div className="reveal-line" style={{ margin: '40px 0' }} />
        </div>
      );
    default:
      return null;
  }
}

export default function CustomPage() {
  const { slug } = useParams();
  const { col, editMode } = useCms();
  const page = col('pages').find((p) => (p.slug || p.id) === slug);
  if (!page || (page.published === false && !editMode)) return <NotFound />;
  const blocks = page.blocks || [];
  const startsWithHero = blocks[0]?.type === 'hero';
  return (
    <div className={startsWithHero ? '' : 'page'} style={{ paddingBottom: 60 }}>
      {!startsWithHero && (
        <div className="container" style={{ paddingTop: 60 }}>
          <F col="pages" item={page} path="title" as="h1" className="display h-lg" style={{ margin: '0 0 20px' }} />
        </div>
      )}
      {blocks.map((b: any, i: number) => (
        <Reveal key={b.id || i} y={24}>
          <Block b={b} i={i} page={page} />
        </Reveal>
      ))}
      {blocks.length === 0 && (
        <div className="container">
          <div className="empty">This page is empty. Add blocks in the Admin Panel → Pages.</div>
        </div>
      )}
    </div>
  );
}
