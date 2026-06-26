import { redirect } from 'next/navigation';

export function generateMetadata() {
    return {
        title: 'Personalizador | TEXERE.ART',
    };
}

export default function ProductPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams?: { design?: string };
}) {
    const studioParams = new URLSearchParams({ product: params.slug });

    if (typeof searchParams?.design === 'string') {
        studioParams.set('design', searchParams.design);
    }

    redirect(`/studio?${studioParams.toString()}`);
}
