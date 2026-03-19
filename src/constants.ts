import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import { SITE } from "@/config";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    name: "Mail",
    href: "mailto:hello@geldengedrag.be",
    linkTitle: `Stuur een e-mail naar ${SITE.title}`,
    icon: IconMail,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/",
    linkTitle: `${SITE.title} op LinkedIn`,
    icon: IconLinkedin,
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Deel dit artikel via WhatsApp`,
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Deel dit artikel op Facebook`,
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Deel dit artikel op X`,
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Deel dit artikel via Telegram`,
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Deel dit artikel op Pinterest`,
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=Lees%20dit%20artikel&body=",
    linkTitle: `Deel dit artikel via e-mail`,
    icon: IconMail,
  },
] as const;
