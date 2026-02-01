import Image from "next/image";
import type { Profile } from "@/lib/content/types";
import type { Locale } from "@/lib/content/types";

type Props = {
  profile: Profile;
  locale: Locale;
};

/**
 * Left sidebar card: photo, name, headline, location, contact, links.
 * All data from content/site.json (no hardcoded CV text).
 */
export function ProfileCard({ profile, locale }: Props) {
  const headline = profile.headline[locale] ?? profile.headline.en;
  const location = profile.location[locale] ?? profile.location.en;

  return (
    <aside className="w-full z-0">
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-surface-2">
          <Image
            src={profile.photoSrc}
            alt=""
            width={96}
            height={96}
            className="object-cover"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">
            {profile.fullName}
          </h1>
          <p className="text-sm text-muted">{headline}</p>
          <p className="text-sm text-subtle mt-1">{location}</p>
        </div>
        <div className="text-sm space-y-1 border-t border-divider pt-3">
          <a
            href={`mailto:${profile.email}`}
            className="block text-primary hover:underline truncate"
          >
            {profile.email}
          </a>
          {profile.phone && (
            <a
              href={`tel:${profile.phone.replace(/\s/g, "")}`}
              className="block text-muted hover:text-foreground"
            >
              {profile.phone}
            </a>
          )}
        </div>
        {profile.links?.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center border-t border-divider pt-3">
            {profile.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
