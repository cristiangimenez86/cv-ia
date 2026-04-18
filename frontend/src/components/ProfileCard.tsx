import Image from "next/image";
import { MapPin, Mail, Phone } from "lucide-react";
import { CvPdfDownloadButton } from "@/components/CvPdfDownloadButton";
import { GitHubIcon, LinkedInIcon, WhatsAppIcon } from "@/components/icons/SocialIcons";
import type { Profile, Locale } from "@/lib/content/types";
import { getLocalized } from "@/lib/content/types";
import { getTelHref, getWhatsAppUrl } from "@/lib/profile";

type ProfileCardProps = {
  profile: Profile;
  locale: Locale;
  cvPdfFetchUrl: string;
  cvPdfAccessToken?: string;
};

/**
 * Sidebar card: photo, name, headline, location, contact, social links, PDF download.
 * All data from content/site.json (no hardcoded CV text).
 * Stays fixed when scrolling (sticky sidebar).
 */
export function ProfileCard({
  profile,
  locale,
  cvPdfFetchUrl,
  cvPdfAccessToken,
}: ProfileCardProps) {
  const headline = getLocalized(profile.headline, locale);
  const location = getLocalized(profile.location, locale);
  const whatsappUrl = profile.phone ? getWhatsAppUrl(profile.phone) : null;

  const downloadPdfLabel = locale === "es" ? "Descargar PDF" : "Download PDF";

  return (
    <aside className="w-full">
      <div className="card p-5 space-y-4">
        {/* Photo — full circle (140px); sizes=280px for 2x retina; CSS forces object-position bottom */}
        <div className="profile-photo-circle relative w-[140px] h-[140px] mx-auto rounded-full overflow-hidden bg-surface-2 shrink-0">
          <Image
            src={profile.photoSrc}
            alt=""
            fill
            sizes="280px"
            quality={90}
            className="object-cover"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">
            {profile.fullName}
          </h1>
          <p className="text-sm text-muted">{headline}</p>
        </div>

        {/* Contact info with icons */}
        <div className="text-sm space-y-2 border-t border-divider pt-3">
          <div className="flex items-center gap-2 text-subtle">
            <MapPin size={14} className="shrink-0" aria-hidden />
            <span>{location}</span>
          </div>
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 text-subtle hover:text-foreground truncate"
          >
            <Mail size={14} className="shrink-0" aria-hidden />
            <span className="truncate">{profile.email}</span>
          </a>
          {profile.phone && (
            <a
              href={getTelHref(profile.phone)}
              className="flex items-center gap-2 text-subtle hover:text-foreground"
            >
              <Phone size={14} className="shrink-0" aria-hidden />
              <span>{profile.phone}</span>
            </a>
          )}
        </div>

        {/* Social buttons: LinkedIn, GitHub, WhatsApp — equal-weight primary squares */}
        <div className="flex gap-2 justify-center border-t border-divider pt-3">
          {profile.links
            ?.filter((l) => l.label === "LinkedIn" || l.label === "GitHub")
            .map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-card-btn profile-card-btn-primary inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                aria-label={link.label}
              >
                {link.label === "LinkedIn" ? (
                  <LinkedInIcon className="h-4 w-4" />
                ) : (
                  <GitHubIcon className="h-4 w-4" />
                )}
              </a>
            ))}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-card-btn profile-card-btn-primary inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* PDF download — JSON export can be re-added here + downloadJson prop + page.tsx payload */}
        <div className="space-y-2 border-t border-divider pt-3">
          <CvPdfDownloadButton
            fetchUrl={cvPdfFetchUrl}
            locale={locale}
            accessToken={cvPdfAccessToken}
            variant="profile"
            downloadLabel={downloadPdfLabel}
          />
        </div>
      </div>
    </aside>
  );
}
