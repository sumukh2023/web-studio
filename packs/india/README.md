# india: formats that Indian sites get subtly wrong

`src/lib/india.ts` is pure TypeScript, safe in both the browser and `api/`,
so there is exactly one copy of each rule.

| Function | Notes |
| --- | --- |
| `indianMobile(value)` | Normalises `+91 98765 43210` / `919876543210` / `98765-43210` to `9876543210`, or null. Drops `91` only from 12-digit input; never strips a leading `0` (trunk prefix vs landline are indistinguishable). |
| `displayMobile('9876543210')` | `+91 98765 43210` |
| `formatRupees(100000)` | `₹1,00,000` (fixed `en-IN`, never the reader's locale) |
| `formatRupeesWords(12500000)` | `₹1.3 crore` |
| `isPan`, `isIfsc`, `isPinCode`, `isUpiId` | Format checks. |
| `isGstin` | Format plus the mod-36 check character. |

Pair `formatRupees` with `<AnimatedNumber locale="en-IN">` so a counting
figure and its static text group digits the same way.

## Normalise on the server, always

```ts
// api/register.ts
import { indianMobile } from '../src/lib/india';
const mobile = indianMobile(body.mobile);
if (!mobile) return send(res, 400, { fields: { mobile: 'Enter a 10-digit Indian mobile number.' } });
// store `mobile`, the normalised form
```

## And in the database (supabase pack)

Make the rule the table's, not only the API's:

```sql
create or replace function public.normalise_mobile(p text) returns text
language sql immutable as $$
  select case
    when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) = 12
     and regexp_replace(p, '\D', '', 'g') like '91%'
    then substr(regexp_replace(p, '\D', '', 'g'), 3)
    else regexp_replace(coalesce(p, ''), '\D', '', 'g')
  end;
$$;

alter table public.bookings
  add constraint bookings_mobile_shape check (mobile ~ '^[6-9][0-9]{9}$');
```

Three copies (SQL, server, browser) must agree; when they cannot be one file,
test them against the same list of inputs.

## Do not collect Aadhaar

There is deliberately no Aadhaar validator. Collecting and storing Aadhaar
numbers is restricted by law (the Aadhaar Act and UIDAI rules); a website
form almost never has a lawful reason to ask for it. Use PAN where a tax ID
is genuinely required (80G donation receipts, invoices).
