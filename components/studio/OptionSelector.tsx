'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assuming this exists, common in shadcn/ui. If not, I'll use simple class concatenation.

interface OptionItem {
    id: string;
    name: string;
    value: string;
    image_url?: string | null;
    colorHex?: string; // For color swatches
}

interface OptionSelectorProps {
    label: string;
    items: OptionItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    type?: 'grid' | 'list' | 'swatch';
}

export default function OptionSelector({
    label,
    items,
    selectedId,
    onSelect,
    type = 'grid'
}: OptionSelectorProps) {

    return (
        <div className="mb-8">
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                {label}
                {selectedId && <span className="text-industrial-warning text-[10px] ml-auto font-normal normal-case opacity-50">Selected</span>}
            </h3>

            <div className={`
        ${type === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : ''}
        ${type === 'list' ? 'flex flex-wrap gap-2' : ''}
        ${type === 'swatch' ? 'flex flex-wrap gap-3' : ''}
      `}>
                {items.map((item) => {
                    const isSelected = selectedId === item.value;

                    if (type === 'swatch') {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item.value)}
                                className={`
                        w-8 h-8 rounded-full border-2 transition-all hover:scale-110 relative
                        ${isSelected ? 'border-industrial-black ring-2 ring-industrial-warning ring-offset-2' : 'border-gray-200'}
                    `}
                                style={{ backgroundColor: item.colorHex || item.value }} // Fallback to value if no hex
                                title={item.name}
                            />
                        )
                    }

                    // Default Grid Layout for Products/Designs
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.value)}
                            className={`
                    group relative text-left border transition-all duration-200 overflow-hidden
                    ${isSelected
                                    ? 'border-industrial-black bg-industrial-black text-white'
                                    : 'border-industrial-gray/20 bg-white hover:border-industrial-gray text-industrial-black'}
                    ${type === 'list' ? 'px-4 py-2 min-w-[3rem] text-sm font-mono' : 'p-3 aspect-[3/4] flex flex-col'}
                `}
                        >
                            {type === 'grid' && item.image_url && (
                                <div className="relative w-full flex-grow mb-3 bg-gray-50 rounded-sm overflow-hidden mix-blend-multiply">
                                    <Image
                                        src={item.image_url}
                                        fill
                                        alt={item.name}
                                        className="object-cover group-hover:scale-105 transition-transform"
                                    />
                                </div>
                            )}

                            <div className="mt-auto">
                                <div className="font-bold text-xs uppercase tracking-tight leading-tight">
                                    {item.name}
                                </div>
                                {type === 'grid' && (
                                    <div className={`text-[10px] mt-1 font-mono uppercase tracking-widest ${isSelected ? 'text-industrial-warning' : 'text-gray-400'}`}>
                                        Select
                                    </div>
                                )}
                            </div>

                            {isSelected && type === 'grid' && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-industrial-warning rounded-full" />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
