import Image from "next/image";

import { productShowcase, productShots } from "@/data/site-content";
import { SectionHeading } from "@/components/ui/section-heading";

export function ProductShowcase() {
  const [featuredShot, ...gridShots] = productShots;

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow={productShowcase.eyebrow}
          title={productShowcase.title}
          description={productShowcase.description}
        />

        <div className="mt-12 space-y-6">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-950/10">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-sm font-semibold">{featuredShot.title}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {featuredShot.description}
                </p>
              </div>
              <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">
                Tela real
              </span>
            </div>
            <div className="relative aspect-[16/9] w-full bg-slate-900">
              <Image
                src={featuredShot.src}
                alt={featuredShot.title}
                fill
                priority
                quality={100}
                className="object-contain object-top"
                sizes="(max-width: 1024px) 100vw, 1200px"
              />
            </div>
          </article>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {gridShots.map((shot) => (
              <article
                key={shot.src}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm"
              >
                <div className="relative aspect-[16/10] w-full bg-slate-200">
                  <Image
                    src={shot.src}
                    alt={shot.title}
                    fill
                    priority
                    quality={100}
                    className="object-contain object-top"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {shot.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {shot.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
