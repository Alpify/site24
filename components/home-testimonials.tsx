import { getTranslations } from "next-intl/server";
import { HOME_TESTIMONIAL_SLOTS } from "@/lib/content/home-extras";

export async function HomeTestimonials() {
  const t = await getTranslations("home");

  return (
    <section className="border-b border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("testimonialsTitle")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {t("testimonialsDisclaimer")}
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {HOME_TESTIMONIAL_SLOTS.map((n) => (
            <li
              key={n}
              className="flex flex-col rounded-2xl border border-dashed border-border bg-background/80 p-6"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                „{t(`quote${n}Text`)}“
              </blockquote>
              <footer className="mt-4 text-xs font-medium text-muted">
                — {t(`quote${n}Author`)}
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
