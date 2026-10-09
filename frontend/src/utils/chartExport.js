/**
 * Client-side chart export helpers.
 *
 * Recharts renders to inline SVG, so exporting a chart means serializing that
 * SVG and rasterizing it onto a canvas. Styling that comes from our stylesheets
 * (axis tick colour, font) is not carried by the serialized markup, so a small
 * stylesheet is injected into the clone before rasterizing.
 */

const FONT_STACK =
  "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Styles that normally come from components.css and must be inlined for export. */
const EXPORT_CSS = `
  text { font-family: ${FONT_STACK}; }
  .recharts-cartesian-axis-tick-value { font-size: 11px; fill: #64748b; }
  .recharts-cartesian-grid line { stroke: #eaeef5; }
  .recharts-text { fill: #64748b; }
`;

/** Turn a chart title into a safe file name stem. */
export function slugify(text, fallback = 'chart') {
  const slug = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/** Push a Blob to the user as a file download. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Prepare a standalone, self-styled copy of a rendered chart SVG.
 * Returns the serialized markup plus the pixel size to rasterize at.
 */
function serializeSvg(svg) {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width || svg.clientWidth || 600));
  const height = Math.max(1, Math.round(rect.height || svg.clientHeight || 300));

  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Recharts draws the tooltip cursor / active shapes inside the surface; drop
  // any hover-only artefacts so the export matches the resting chart.
  clone.querySelectorAll('.recharts-tooltip-cursor, .recharts-active-dot').forEach((n) => n.remove());

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = EXPORT_CSS;
  clone.insertBefore(style, clone.firstChild);

  const markup = new XMLSerializer().serializeToString(clone);
  return { markup, width, height };
}

/**
 * Export the first chart SVG found inside `container` as a PNG download.
 * Falls back to an .svg download when canvas rasterizing is unavailable.
 *
 * @param {HTMLElement} container element wrapping the rendered chart
 * @param {string} filenameStem file name without extension
 * @param {number} scale pixel density multiplier for the raster output
 * @returns {Promise<void>} resolves once the download has been triggered
 */
export function downloadChartImage(container, filenameStem = 'chart', scale = 2) {
  return new Promise((resolve, reject) => {
    const svg = container?.querySelector('svg.recharts-surface') || container?.querySelector('svg');
    if (!svg) {
      reject(new Error('No chart is available to download.'));
      return;
    }

    const { markup, width, height } = serializeSvg(svg);
    // Encode as a data URL rather than a blob URL: this keeps the canvas
    // untainted in every browser, so toBlob() stays allowed.
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

    const fallbackToSvg = () => {
      saveBlob(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), `${filenameStem}.svg`);
      resolve();
    };

    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fallbackToSvg();
          return;
        }
        // Charts are designed on a light surface; PNG has no page behind it.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            saveBlob(blob, `${filenameStem}.png`);
            resolve();
          } else {
            fallbackToSvg();
          }
        }, 'image/png');
      } catch {
        fallbackToSvg();
      }
    };
    img.onerror = () => fallbackToSvg();
    img.src = src;
  });
}

export default downloadChartImage;
