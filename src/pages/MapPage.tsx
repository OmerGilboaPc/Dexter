import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCms } from '../lib/cms';
import { useSpoilers } from '../lib/spoilers';
import { Visual } from '../components/Visual';
import { F, ItemMediaEdit, T } from '../components/Editable';
import { Spoiler } from '../components/Spoiler';
import { cx } from '../lib/util';
import { sfx } from '../lib/sound';

const pin = (color: string, active: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [28, 38],
    iconAnchor: [14, 36],
    html: `<svg width="28" height="38" viewBox="0 0 24 32" style="filter: drop-shadow(0 0 ${active ? 14 : 6}px ${color}); transform: scale(${active ? 1.25 : 1}); transform-origin: bottom center; transition: transform .3s"><path d="M12 1C12 1 2 15 2 21.5a10 10 0 0 0 20 0C22 15 12 1 12 1z" fill="${color}" stroke="#fff" stroke-width="1.2"/></svg>`,
  });

function FlyTo({ target }: { target: any }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), target.zoom || 9), { duration: 1.6 });
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const { col, patchItem, editMode } = useCms();
  const { isSpoiler } = useSpoilers();
  const [params] = useSearchParams();
  const series = col('series');
  const locs = col('locations');
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState<any>(() => locs.find((l) => l.id === params.get('l')) || null);
  const list = useMemo(() => locs.filter((l) => filter === 'all' || l.series === filter), [locs, filter]);
  const color = (sid: string) => { const t = series.find((s) => s.id === sid)?.theme; return t?.accent2 || t?.accent || '#c1121f'; };

  return (
    <div style={{ height: '100vh', paddingTop: 'var(--nav-h)', display: 'grid', gridTemplateColumns: '420px 1fr' }}>
      <aside style={{ overflow: 'auto', borderRight: '1px solid var(--line)', background: 'var(--bg2)' }}>
        <div style={{ padding: '28px 26px 10px' }}>
          <T k="map.kicker" d="Crime scenes & landmarks" as="div" className="kicker red" />
          <T k="map.title" d="The Map" as="h1" className="display" style={{ fontSize: 64, margin: '8px 0 14px' }} />
          <div className="row" style={{ gap: 8 }}>
            <button className={cx('chip', filter === 'all' && 'on')} onClick={() => setFilter('all')}>
              All
            </button>
            {series.map((s) => (
              <button key={s.id} className={cx('chip', filter === s.id && 'on')} onClick={() => setFilter(s.id)}>
                {s.short}
              </button>
            ))}
          </div>
          {editMode && <p className="muted" style={{ fontSize: 12 }}>Edit Mode: drag a pin to move it.</p>}
        </div>
        <div style={{ padding: '10px 16px 40px' }}>
          {list.map((l) => {
            const active = sel?.id === l.id;
            const spoil = isSpoiler(l.spoiler);
            return (
              <div
                key={l.id}
                onClick={() => {
                  sfx.click();
                  setSel(l);
                }}
                className="card hover"
                style={{ marginBottom: 12, cursor: 'pointer', borderColor: active ? color(l.series) : undefined, background: active ? 'rgba(193,18,31,.08)' : undefined }}
              >
                {active && l.image && (
                  <div style={{ height: 150, position: 'relative' }}>
                    <Visual src={l.image} seed={l.id} style={{ position: 'absolute', inset: 0 }} />
                  </div>
                )}
                {active && <ItemMediaEdit col="locations" item={l} path="image" />}
                <div style={{ padding: 16 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color(l.series), boxShadow: `0 0 10px ${color(l.series)}` }} />
                    <span className="mono muted" style={{ fontSize: 10, letterSpacing: '.2em' }}>
                      {series.find((s) => s.id === l.series)?.short}
                      {l.approx ? ' · APPROX.' : ''}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 17, marginTop: 8, filter: spoil && !active ? 'blur(5px)' : 'none' }}>{l.name}</div>
                  {active && (
                    <Spoiler marker={l.spoiler}>
                      <F col="locations" item={l} path="text" as="p" style={{ margin: '6px 0 0', color: '#cfcac2', fontSize: 14 }} multiline />
                    </Spoiler>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
      <div style={{ position: 'relative' }}>
        <MapContainer center={[30, -60]} zoom={3} style={{ height: '100%', width: '100%', background: '#0b0b0e' }} zoomControl={false} worldCopyJump>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
          {list.map((l) => (
            <Marker
              key={l.id + (editMode ? '-e' : '')}
              position={[l.lat, l.lng]}
              icon={pin(color(l.series), sel?.id === l.id)}
              draggable={editMode}
              eventHandlers={{
                click: () => {
                  sfx.drip();
                  setSel(l);
                },
                dragend: (e: any) => {
                  const p = e.target.getLatLng();
                  patchItem('locations', l.id, 'lat', Number(p.lat.toFixed(5))).then(() => patchItem('locations', l.id, 'lng', Number(p.lng.toFixed(5))));
                },
              }}
            />
          ))}
          <FlyTo target={sel} />
        </MapContainer>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 160px 40px rgba(0,0,0,.75)', zIndex: 400 }} />
      </div>
    </div>
  );
}
