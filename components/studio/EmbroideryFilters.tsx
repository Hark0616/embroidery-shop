'use client';

export default function EmbroideryFilters() {
    return (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                {/* 
                  This filter simulates embroidery threads:
                  1. feTurbulence creates a fine noise pattern.
                  2. feDisplacementMap uses the noise to slightly roughen the edges of the design, like real stitches.
                  3. feSpecularLighting adds a subtle sheen/reflection to the "threads".
                  4. feDropShadow adds depth so it pops off the fabric.
                */}
                <filter id="embroidery-stitch" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence 
                        type="fractalNoise" 
                        baseFrequency="0.4" 
                        numOctaves="2" 
                        result="noise" 
                    />
                    <feColorMatrix 
                        type="matrix" 
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0" 
                        in="noise" 
                        result="coloredNoise" 
                    />
                    <feDisplacementMap 
                        in="SourceGraphic" 
                        in2="coloredNoise" 
                        scale="2.5" 
                        xChannelSelector="R" 
                        yChannelSelector="G" 
                        result="displaced" 
                    />
                    
                    <feSpecularLighting
                        in="noise"
                        surfaceScale="2"
                        specularConstant="0.6"
                        specularExponent="30"
                        lightingColor="#ffffff"
                        result="specular"
                    >
                        <feDistantLight azimuth="90" elevation="60" />
                    </feSpecularLighting>
                    
                    <feComposite in="specular" in2="displaced" operator="in" result="specularComp" />
                    <feBlend mode="screen" in="specularComp" in2="displaced" result="blended" />
                    
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.4" in="blended" />
                </filter>
            </defs>
        </svg>
    );
}
