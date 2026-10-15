/**
 * Computed-style copying for cloned elements.
 *
 * Copies every computed CSS property of the source element onto the clone's
 * inline style so the clone renders identically without stylesheets (the
 * clone iframe only carries the <style> tags the cloner could read).
 */
export declare const copyCSSStyles: <T extends HTMLElement | SVGElement>(style: CSSStyleDeclaration, target: T) => T;
