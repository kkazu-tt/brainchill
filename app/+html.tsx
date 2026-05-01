import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Overrides the static-export HTML shell so the iOS PWA gets the right
 * viewport from the very first paint:
 * - `viewport-fit=cover` lets the layout extend under the notch/home bar
 *   (combined with apple-mobile-web-app-capable in app/_layout.tsx).
 * - `interactive-widget=resizes-content` makes iOS shrink the layout
 *   viewport when the soft keyboard opens, so the chat input stays
 *   visible instead of hiding under the keyboard.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
