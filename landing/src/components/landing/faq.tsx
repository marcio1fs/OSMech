import { faqItems } from "@/data/site-content";
import { SectionHeading } from "@/components/ui/section-heading";

export function Faq() {
  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Suas dúvidas, respondidas."
          description="As principais objeções de quem quer organizar a oficina sem complicação."
          center
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {faqItems.map((item: { question: string; answer: string }) => (
            <article
              key={item.question}
              className="rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-200"
            >
              <h3 className="text-xl font-semibold text-slate-950">
                {item.question}
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
