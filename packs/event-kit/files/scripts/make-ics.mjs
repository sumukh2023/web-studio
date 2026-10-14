#!/usr/bin/env node
/**
 * public/<calendarFile> from src/event/event.json, so the calendar file can
 * never disagree with the page (runs before every build).
 *
 * RFC 5545 details that calendars are strict about: CRLF line endings (and
 * `*.ics -text` in .gitattributes so git never normalises them), lines folded
 * at 75 octets, commas/semicolons/backslashes escaped, times in UTC (`Z`).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const event = JSON.parse(await readFile(join(ROOT, 'src/event/event.json'), 'utf8'));

const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const text = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold to 75 OCTETS (not characters), continuation lines start with a space. */
function fold(line) {
  const out = [];
  let current = '';
  for (const ch of line) {
    if (Buffer.byteLength(current + ch) > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join('\r\n ');
}

const lines = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  `PRODID:-//${text(event.name)}//EN`,
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'BEGIN:VEVENT',
  `UID:${event.uid}`,
  // Stable across builds (derived from the event, not the clock), so an
  // unchanged event produces a byte-identical file.
  `DTSTAMP:${utc(event.start)}`,
  `DTSTART:${utc(event.start)}`,
  `DTEND:${utc(event.end)}`,
  `SUMMARY:${text(event.name)}`,
  `LOCATION:${text(event.location)}`,
  `DESCRIPTION:${text(event.description)}`,
  `URL:${event.url}`,
  'END:VEVENT',
  'END:VCALENDAR',
];
const target = join(ROOT, 'public', event.calendarFile.replace(/^\//, ''));
await writeFile(target, lines.map(fold).join('\r\n') + '\r\n');
console.log(`[event] ${event.calendarFile} written from src/event/event.json`);
