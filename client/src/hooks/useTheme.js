import { useState, useEffect } from 'react';

// 'light' | 'dark' | 'system'. index.html applies the initial class before paint.
function resolve(pref) {
  return pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
}

function readPref() {
  try { return localStorage.getItem('theme') || 'system'; } catch { return 'system'; }
}

export function useTheme() {
  const [pref, setPref] = useState(readPref);

  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle('dark', resolve(pref));
    apply();
    try { localStorage.setItem('theme', pref); } catch { /* storage unavailable */ }
    if (pref !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);

  return { pref, setPref };
}
