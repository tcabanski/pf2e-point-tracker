const MODULE_ID = "pf2e-point-tracker";
const MODULE_PATH = `modules/${MODULE_ID}`;
const ICON_PATH = `${MODULE_PATH}/assets/points.png`;
const COUNTER_ICON_RULE = `${MODULE_PATH}/assets/plain/counter-{item|system.badge.value}.svg`;
const ICON_STYLES = [
  { id: "style-01", label: "A - Amber" },
  { id: "style-02", label: "B - Indigo" },
  { id: "style-03", label: "C - Green" },
  { id: "style-04", label: "D - Red" },
  { id: "style-05", label: "E - Magenta" },
  { id: "style-06", label: "F - Yellow" },
  { id: "style-07", label: "G - Cyan" },
  { id: "style-08", label: "H - Violet" },
  { id: "style-09", label: "I - Lime" },
  { id: "style-10", label: "J - Rose" },
  { id: "style-11", label: "K - Sky" },
  { id: "style-12", label: "L - Purple" },
  { id: "style-13", label: "M - Orange" },
  { id: "style-14", label: "N - Teal" },
  { id: "style-15", label: "O - Slate" },
  { id: "style-16", label: "P - Crimson" },
];
const ICON_STYLE_IDS = new Set(ICON_STYLES.map((style) => style.id));

function notify(type, message) {
  const notifications = globalThis.ui?.notifications;
  if (notifications?.[type]) notifications[type](message);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "point-tracker";
}

function randomId(length = 8) {
  return globalThis.foundry?.utils?.randomID?.(length) ?? Math.random().toString(36).slice(2, 2 + length);
}

function trackerIdFor(name) {
  return `${slugify(name)}-${randomId(8)}`;
}

function counterIconRule(iconStyle) {
  if (iconStyle) return `${MODULE_PATH}/assets/styles/${iconStyle}/counter-{item|system.badge.value}.svg`;
  return COUNTER_ICON_RULE;
}

function usedIconStyles(actor) {
  const used = new Set();

  for (const item of actor.items ?? []) {
    const flagStyle = item.flags?.[MODULE_ID]?.iconStyle;
    if (flagStyle) used.add(flagStyle);

    for (const rule of item.system?.rules ?? []) {
      const value = String(rule.value ?? "");
      const match = value.match(/assets\/styles\/([^/]+)\/counter-/);
      if (match) used.add(match[1]);
    }
  }

  return used;
}

function selectIconStyle(actor, requestedStyle) {
  const used = usedIconStyles(actor);
  const requested = String(requestedStyle ?? "auto");

  if (requested !== "auto") {
    if (!ICON_STYLE_IDS.has(requested)) throw new Error(`Unknown icon style: ${requested}`);
    if (used.has(requested)) throw new Error(`${requested} is already used on ${actor.name}.`);
    return requested;
  }

  return ICON_STYLES.find((style) => !used.has(style.id))?.id ?? null;
}

function getHtmlElement(html) {
  if (html instanceof HTMLElement) return html;
  return html?.[0] ?? html;
}

function parseInteger(value, fieldName, { fallback, required = true } = {}) {
  if (value === "" || value === null || value === undefined) {
    if (required) throw new Error(`${fieldName} is required.`);
    return fallback;
  }

  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${fieldName} must be a whole number.`);
  return number;
}

function resolveActor(target) {
  if (!target) return null;
  if (target.documentName === "Actor" || target.constructor?.documentName === "Actor") return target;
  if (target.actor) return target.actor;
  if (target.document?.actor) return target.document.actor;
  return null;
}

function uniqueActors(actors) {
  const seen = new Set();
  const unique = [];

  for (const actor of actors.filter(Boolean)) {
    const key = actor.uuid ?? actor.id ?? actor.name;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(actor);
  }

  return unique;
}

function getTargetActors(target) {
  const targets = Array.isArray(target) ? target : target ? [target] : [];
  const actors = uniqueActors(targets.map(resolveActor));
  if (actors.length > 0) return actors;

  const controlled = globalThis.canvas?.tokens?.controlled ?? [];
  const tokenActors = uniqueActors(controlled.map(resolveActor));
  if (tokenActors.length > 0) return tokenActors;

  return uniqueActors([globalThis.game?.user?.character]);
}

function canCreateEffect(actor) {
  return Boolean(actor?.createEmbeddedDocuments && (actor.isOwner || globalThis.game?.user?.isGM));
}

function buildEffectData(options) {
  const name = String(options.name ?? "Point Tracker").trim() || "Point Tracker";
  const trackerId = String(options.trackerId ?? trackerIdFor(name));
  const iconStyle = options.iconStyle;
  const iconRule = counterIconRule(iconStyle);
  const badge = {
    type: "counter",
    value: options.value,
  };

  if (Number.isInteger(options.min)) badge.min = options.min;
  if (Number.isInteger(options.max)) badge.max = options.max;

  return {
    name,
    type: "effect",
    effects: [],
    system: {
      description: { gm: "", value: "" },
      rules: [{ key: "TokenEffectIcon", value: iconRule }],
      slug: slugify(name),
      traits: { otherTags: [], value: [] },
      publication: { title: "", authors: "", license: "OGL", remaster: false },
      level: { value: 1 },
      duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
      start: { value: 0, initiative: null },
      tokenIcon: { show: false },
      badge,
      context: null,
      unidentified: false,
    },
    img: ICON_PATH,
    flags: {
      [MODULE_ID]: {
        trackerId,
        trackerName: name,
        iconStyle,
      },
    },
  };
}

function readDialogForm(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") ?? "").trim() || "Point Tracker";
  const value = parseInteger(formData.get("value"), "Starting value");
  const min = parseInteger(formData.get("min"), "Minimum value", { required: false, fallback: undefined });
  const max = parseInteger(formData.get("max"), "Maximum value", { required: false, fallback: undefined });
  const iconStyle = String(formData.get("iconStyle") ?? "auto");

  validateTrackerOptions({ value, min, max });

  return { name, value, min, max, iconStyle };
}

function validateTrackerOptions({ value, min, max }) {
  if (Number.isInteger(min) && value < min) throw new Error("Starting value cannot be less than minimum value.");
  if (Number.isInteger(max) && value > max) throw new Error("Starting value cannot be greater than maximum value.");
  if (Number.isInteger(min) && Number.isInteger(max) && min > max) {
    throw new Error("Minimum value cannot be greater than maximum value.");
  }
}

function dialogContent(actors) {
  const actorNames = actors.map((actor) => actor.name).join(", ") || "No actor selected";
  const iconStyleOptions = ICON_STYLES.map(
    (style) => `<option value="${style.id}">${escapeHtml(style.label)}</option>`,
  ).join("");

  return `
    <form class="pf2e-point-tracker-form">
      <p>Create a counter effect on: <strong>${escapeHtml(actorNames)}</strong></p>
      <div class="form-group">
        <label for="pf2e-point-tracker-name">Tracker name</label>
        <input id="pf2e-point-tracker-name" name="name" type="text" value="Point Tracker" />
      </div>
      <div class="form-group">
        <label for="pf2e-point-tracker-value">Starting value</label>
        <input id="pf2e-point-tracker-value" name="value" type="number" step="1" value="0" />
      </div>
      <div class="form-group">
        <label for="pf2e-point-tracker-min">Minimum value</label>
        <input id="pf2e-point-tracker-min" name="min" type="number" step="1" value="0" />
      </div>
      <div class="form-group">
        <label for="pf2e-point-tracker-max">Maximum value</label>
        <input id="pf2e-point-tracker-max" name="max" type="number" step="1" placeholder="No maximum" />
      </div>
      <div class="form-group">
        <label for="pf2e-point-tracker-icon-style">Icon style</label>
        <select id="pf2e-point-tracker-icon-style" name="iconStyle">
          <option value="auto">Auto assign unused style</option>
          ${iconStyleOptions}
        </select>
      </div>
      <p class="notes">Counter icons are provided for values 0 through 99. Auto style keeps same-value trackers from collapsing in the PF2E effects halo.</p>
    </form>
  `;
}

function showTrackerDialog(actors) {
  return new Promise((resolve) => {
    let resolved = false;

    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    if (!globalThis.Dialog) {
      notify("error", "Foundry Dialog API is not available.");
      finish(null);
      return;
    }

    new Dialog({
      title: "Create Point Tracker",
      content: dialogContent(actors),
      buttons: {
        create: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Create",
          callback: (html) => {
            try {
              const element = getHtmlElement(html);
              const form = element.querySelector("form");
              finish(readDialogForm(form));
            } catch (error) {
              notify("error", error.message);
              return false;
            }
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => finish(null),
        },
      },
      default: "create",
      close: () => finish(null),
      render: (html) => {
        getHtmlElement(html)?.querySelector("input[name='name']")?.focus();
      },
    }).render(true);
  });
}

async function createTracker(target, options = {}) {
  const actors = getTargetActors(target);
  if (actors.length === 0) {
    notify("warn", "Select a token or assign a character before creating a point tracker.");
    return [];
  }

  const allowedActors = actors.filter(canCreateEffect);
  const deniedActors = actors.filter((actor) => !canCreateEffect(actor));
  if (deniedActors.length > 0) {
    notify("warn", `No permission to modify: ${deniedActors.map((actor) => actor.name).join(", ")}`);
  }
  if (allowedActors.length === 0) return [];

  const value = parseInteger(options.value ?? 0, "Starting value");
  const min = parseInteger(options.min ?? 0, "Minimum value", { required: false, fallback: undefined });
  const max = parseInteger(options.max, "Maximum value", { required: false, fallback: undefined });
  validateTrackerOptions({ value, min, max });
  const name = String(options.name ?? "Point Tracker").trim() || "Point Tracker";
  const created = [];
  const createdActors = [];
  const skipped = [];

  for (const actor of allowedActors) {
    let iconStyle;
    try {
      iconStyle = selectIconStyle(actor, options.iconStyle);
    } catch (error) {
      skipped.push(`${actor.name}: ${error.message}`);
      continue;
    }

    if (!iconStyle) {
      skipped.push(`${actor.name}: no unused point tracker icon styles remain.`);
      continue;
    }

    const effect = buildEffectData({ name, value, min, max, trackerId: options.trackerId, iconStyle });
    const documents = await actor.createEmbeddedDocuments("Item", [effect]);
    created.push(...documents);
    createdActors.push(actor.name);
  }

  if (skipped.length > 0) notify("warn", `Point tracker skipped: ${skipped.join("; ")}`);
  if (created.length > 0) notify("info", `Created ${name} on ${createdActors.join(", ")}.`);
  return created;
}

async function openDialog(target) {
  const actors = getTargetActors(target);
  if (actors.length === 0) {
    notify("warn", "Select a token or assign a character before creating a point tracker.");
    return [];
  }

  const options = await showTrackerDialog(actors);
  if (!options) return [];
  return createTracker(actors, options);
}

const api = {
  openDialog,
  createTracker,
  buildEffectData,
};

function registerApi() {
  if (globalThis.game) globalThis.game.pf2ePointTracker = api;
}

Hooks.once("init", registerApi);

Hooks.once("ready", registerApi);
