import dynamic from 'next/dynamic';
import Head from 'next/head';

const InfluencerKorea = dynamic(() => import('../src/main').then(module => module.App), {
  ssr: false
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>EON Korea | 팬과 크리에이터를 안전하게 연결하는 플랫폼</title>
        <meta name="description" content="팬과 크리에이터가 안전하게 소통하고 디지털 콘텐츠를 이용하는 EON Korea" />
      </Head>
      <InfluencerKorea />
    </>
  );
}
