/**
 * `fetchpriority`, spelled the way React 18 will actually forward it.
 *
 * React 19 accepts the camelCase `fetchPriority` prop and lowercases it on the
 * way to the DOM. React 18 — which is what this app runs — does not. It warns
 * ("React does not recognize the fetchPriority prop on a DOM element") and
 * then drops the attribute, so the hint never reaches the browser and the
 * hero image it was written for is fetched at ordinary priority like
 * everything else on the page. That is the whole cost of the mistake: the
 * three call sites that thought they were promoting an LCP image were not.
 *
 * It type-checks regardless, which is why it survived: @types/react 18.3
 * declares the camelCase prop that the 18.3 runtime refuses to honour.
 *
 * React passes unknown LOWERCASE attributes straight through to the DOM, so
 * spreading this puts the real attribute on the element. Delete the helper and
 * go back to the prop when this app moves to React 19.
 */
export function fetchPriority(value: 'high' | 'low' | 'auto') {
  return { fetchpriority: value } as Record<string, string>;
}
