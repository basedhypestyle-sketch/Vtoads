// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta
            name="fc:miniapp"
            content={`{
              "version":"next",
              "imageUrl":"https://your‑domain.com/images/based‑vice‑toads‑embed.png",
              "button":{
                "title":"Launch Based Vice Toads",
                "action":{
                  "type":"launch_miniapp",
                  "name":"Based Vice Toads",
                  "url":"https://your‑domain.com",
                  "splashImageUrl":"https://your‑domain.com/images/splash‑image.png",
                  "splashBackgroundColor":"#000000"
                }
              }
            }`}
          />
          <title>Based Vice Toads</title>
          <meta name="description" content="Mint the coolest Based Vice Toads NFT collection on Base." />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
