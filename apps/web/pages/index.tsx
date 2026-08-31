import dynamic from 'next/dynamic';
import Head from 'next/head';

const InfluencerKorea = dynamic(() => import('../src/main').then(module => module.App), {
  ssr: false
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>인플러언서 코리아</title>
        <meta name="description" content="인플러언서와 팬이 포인트, DM, 디지털 콘텐츠로 소통하는 플랫폼" />
      </Head>
      <InfluencerKorea />
    </>
  );
}
