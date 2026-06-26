'use client';

import MoodCard from './MoodCard';
import { buildMoodHref } from '@/lib/moods';

interface MoodDef {
    mood: string;
    title: string;
    subtitle: string;
    icon: string;
    gradient: string;
    categories: string[];
}

interface MoodSelectorProps {
    moods: MoodDef[];
    designs: any[];
}

export default function MoodSelector({ moods, designs }: MoodSelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {moods.map((m, index) => {
                // Find preview images from designs that match this mood's categories
                const matchingDesigns = designs.filter(d =>
                    m.categories.some(cat =>
                        d.category?.toLowerCase().includes(cat.toLowerCase())
                    )
                );
                const previewImages = matchingDesigns
                    .slice(0, 3)
                    .map(d => d.image_url)
                    .filter(Boolean);

                return (
                    <MoodCard
                        key={m.mood}
                        mood={m.mood}
                        title={m.title}
                        subtitle={m.subtitle}
                        icon={m.icon}
                        gradient={m.gradient}
                        href={buildMoodHref(m.mood)}
                        previewImages={previewImages}
                        index={index}
                    />
                );
            })}
        </div>
    );
}
