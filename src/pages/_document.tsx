import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" style={{ colorScheme: 'only light' }}>
      <Head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="only light" />
        <link rel="icon" type="image/png" href="/favicon.svg" />
      </Head>
      <body className="antialiased font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
