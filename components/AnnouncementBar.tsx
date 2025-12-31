import { getDeliveryTime } from '@/lib/actions/config';

export default async function AnnouncementBar() {
    const message = await getDeliveryTime();

    return (
        <div className="bg-industrial-warning text-industrial-black py-2 px-4 text-center">
            <p className="font-heading font-bold text-xs md:text-sm tracking-widest uppercase">
                ⚠ {message}
            </p>
        </div>
    );
}
