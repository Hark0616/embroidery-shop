import { createClient } from '@/lib/supabase/server';

export default async function AnnouncementBar() {
    const supabase = await createClient();

    // Default message if Supabase is unreachable or data is missing
    let message = 'FABRICACIÓN BAJO PEDIDO';

    if (supabase) {
        const { data } = await supabase
            .from('config_global')
            .select('value')
            .eq('key', 'lead_time_message')
            .single();

        if (data?.value) {
            message = data.value;
        }
    }

    return (
        <div className="bg-industrial-warning text-industrial-black py-2 px-4 text-center">
            <p className="font-heading font-bold text-xs md:text-sm tracking-widest uppercase">
                ⚠ {message}
            </p>
        </div>
    );
}
