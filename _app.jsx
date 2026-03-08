/** Next.js custom App wrapper — imports global styles and any providers. */
import '../styles/global.css'


export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
