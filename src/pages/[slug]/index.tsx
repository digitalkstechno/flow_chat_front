
import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /[slug] → redirect to /[slug]/login
 * This is the entry point URL for each tenant.
 */
export default function TenantIndex() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };

    useEffect(() => {
        if (!slug) return;
        router.replace(`/${slug}/login`);
    }, [slug, router]);

    return null;
}
