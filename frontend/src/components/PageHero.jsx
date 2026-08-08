import { KineticLines, Reveal } from "@/components/motion";
import Scene3D from "@/components/Scene3D";
import { IMAGES } from "@/lib/content";

const PageHero = ({ eyebrow, lines, intro, testId, scene = false, image = IMAGES.collaboration }) => (
  <section className="relative overflow-hidden border-b border-forest/15 bg-bone/30" data-testid={testId}>
    {scene && <Scene3D className="absolute inset-0 z-0 opacity-60" />}
    <div className="relative z-10 mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-5 pb-16 pt-28 md:px-10 md:pb-24 md:pt-40 lg:grid-cols-[1.5fr_1fr] lg:items-center">
      <div className="max-w-3xl">
        {eyebrow && (
          <Reveal y={16}>
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple" data-testid={`${testId}-eyebrow`}>
              <span className="inline-block h-px w-10 bg-maple" />
              {eyebrow}
            </p>
          </Reveal>
        )}
        <KineticLines
          lines={lines}
          testId={`${testId}-heading`}
          className="font-heading text-5xl font-black leading-[0.9] tracking-tighter text-forest md:text-7xl lg:text-8xl"
        />
        {intro && (
          <Reveal delay={0.5} className="mt-8 max-w-2xl">
            <p className="text-base leading-relaxed text-sage md:text-lg" data-testid={`${testId}-intro`}>
              {intro}
            </p>
          </Reveal>
        )}
      </div>
      
      <div className="relative hidden lg:block">
        <Reveal delay={0.3} direction="left">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-bl-[80px] rounded-br-xl rounded-tl-xl rounded-tr-[80px] border border-forest/10 shadow-lg">
            <img 
              src={image} 
              alt="Community" 
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

export default PageHero;
