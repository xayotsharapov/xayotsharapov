import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Men haqimda",
  description: `${site.name} — ${site.role}.`,
  alternates: { canonical: "/about" },
};

// TODO: replace the placeholder text with your story.
export default function AboutPage() {
  return (
    <div className="pt-10 sm:pt-16">
      <h1 className="mx-auto max-w-[68ch] font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
        Men haqimda
      </h1>
      <div className="article prose mx-auto mt-10">
        <p>
          Salom, men {site.name}. {site.role}man. Bizneslar uchun sotuvchi matnlar yozaman va Meta
          (Facebook, Instagram) reklamalarini yurgizaman.
        </p>
        <p>
          Bu blogda amaliyotda sinab ko‘rilgan narsalar haqida yozaman: sarlavhalar, reklama
          matnlari, kreativlar, auditoriya va byudjet. Nazariya kam, misollar ko‘p.
        </p>
        <h2>Nima bilan shug‘ullanaman</h2>
        <ul>
          <li>Landing sahifa va reklama uchun kopirayting</li>
          <li>Meta Ads kampaniyalarini sozlash va optimallashtirish</li>
          <li>Reklama hisoblari auditi</li>
        </ul>
        <h2>Bog‘lanish</h2>
        <p>
          Email: <a href="mailto:hello@example.com">hello@example.com</a>
        </p>
        <p>
          <Link href="/blog">Maqolalarni o‘qish →</Link>
        </p>
      </div>
    </div>
  );
}
